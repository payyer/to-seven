begin;
create table if not exists public.course_progress (
  level_id text primary key check (level_id ~ '^[a-z][a-z0-9-]{0,79}$'),
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  revision integer not null default 0 check (revision >= 0),
  last_mutation_id uuid,
  updated_at timestamptz not null default now()
);
alter table public.course_progress enable row level security;
revoke all on public.course_progress from public, anon, authenticated;
grant select, insert, update on public.course_progress to service_role;

create or replace function public.save_course_progress(
  p_level_id text, p_revision integer, p_mutation_id uuid, p_snapshot jsonb
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare current_row public.course_progress%rowtype;
begin
  if p_snapshot is null or jsonb_typeof(p_snapshot) <> 'object' then
    raise exception 'Course snapshot must be an object';
  end if;
  insert into public.course_progress(level_id, snapshot)
  values (p_level_id, '{"version":1,"session":null,"questions":{},"history":[]}'::jsonb)
  on conflict (level_id) do nothing;
  select * into strict current_row from public.course_progress where level_id = p_level_id for update;
  if current_row.last_mutation_id = p_mutation_id then
    return jsonb_build_object('revision', current_row.revision);
  end if;
  if current_row.revision <> p_revision then
    return jsonb_build_object('conflict', true);
  end if;
  update public.course_progress set snapshot = p_snapshot, revision = revision + 1,
    last_mutation_id = p_mutation_id, updated_at = now() where level_id = p_level_id;
  return jsonb_build_object('revision', current_row.revision + 1);
end;
$$;
revoke all on function public.save_course_progress(text, integer, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.save_course_progress(text, integer, uuid, jsonb) to service_role;
commit;

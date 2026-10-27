begin;

create table if not exists public.study_progress (
  id smallint primary key check (id = 1),
  snapshot jsonb,
  revision integer not null default 0 check (revision >= 0),
  last_mutation_id uuid,
  updated_at timestamptz not null default now()
);
alter table public.study_progress enable row level security;
revoke all on public.study_progress from public, anon, authenticated;
grant select, update on public.study_progress to service_role;
insert into public.study_progress(id) values (1) on conflict (id) do nothing;

create or replace function public.save_study_progress(
  p_revision integer, p_mutation_id uuid, p_snapshot jsonb, p_initialize_only boolean default false
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare current_row public.study_progress%rowtype;
begin
  select * into strict current_row from public.study_progress where id = 1 for update;
  if current_row.last_mutation_id = p_mutation_id then
    return jsonb_build_object('revision', current_row.revision);
  end if;
  if current_row.revision <> p_revision or (p_initialize_only and current_row.snapshot is not null) then
    return jsonb_build_object('conflict', true);
  end if;
  if p_snapshot is null or jsonb_typeof(p_snapshot) <> 'object' then
    raise exception 'snapshot must be an object';
  end if;
  update public.study_progress set snapshot = p_snapshot, revision = revision + 1,
    last_mutation_id = p_mutation_id, updated_at = now() where id = 1;
  return jsonb_build_object('revision', current_row.revision + 1);
end;
$$;
revoke all on function public.save_study_progress(integer, uuid, jsonb, boolean) from public, anon, authenticated;
grant execute on function public.save_study_progress(integer, uuid, jsonb, boolean) to service_role;

-- Durable throttling across Vercel instances. Only a hash of the IP is stored.
create table if not exists public.unlock_attempts (
  bucket text primary key,
  started_at timestamptz not null,
  attempts integer not null
);
alter table public.unlock_attempts enable row level security;
revoke all on public.unlock_attempts from public, anon, authenticated;
grant select, insert, update, delete on public.unlock_attempts to service_role;
create or replace function public.allow_unlock_attempt(p_bucket text)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare attempt_count integer;
begin
  delete from public.unlock_attempts where started_at < now() - interval '1 day';
  insert into public.unlock_attempts(bucket, started_at, attempts) values (p_bucket, now(), 1)
  on conflict (bucket) do update set
    attempts = case when public.unlock_attempts.started_at < now() - interval '10 minutes' then 1 else public.unlock_attempts.attempts + 1 end,
    started_at = case when public.unlock_attempts.started_at < now() - interval '10 minutes' then now() else public.unlock_attempts.started_at end
  returning attempts into attempt_count;
  return attempt_count <= 10;
end;
$$;
revoke all on function public.allow_unlock_attempt(text) from public, anon, authenticated;
grant execute on function public.allow_unlock_attempt(text) to service_role;
commit;

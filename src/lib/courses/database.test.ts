import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { emptyCourseSnapshot } from "./practice";
const db = new PGlite();
const originalSql = readFileSync(
  "supabase/migrations/202610270001_progress.sql",
  "utf8",
);
const sql = readFileSync(
  "supabase/migrations/20261030093225_course_progress.sql",
  "utf8",
);
beforeAll(async () => {
  await db.exec(
    "create role anon; create role authenticated; create role service_role bypassrls;",
  );
  await db.exec(originalSql);
  await db.exec(
    'update public.study_progress set snapshot = \'{"sentinel":"keep"}\', revision=42;',
  );
  await db.exec(sql);
  await db.exec(sql);
}, 30000);
afterAll(async () => {
  await db.close();
});
const save = async (
  level: string,
  revision: number,
  id = crypto.randomUUID(),
  snapshot = emptyCourseSnapshot(),
) =>
  (
    await db.query<{ result: { revision?: number; conflict?: boolean } }>(
      "select public.save_course_progress($1,$2,$3,$4::jsonb) result",
      [level, revision, id, JSON.stringify(snapshot)],
    )
  ).rows[0].result;
describe("isolated course database", () => {
  it("serializes first saves, retries idempotently and conflicts stale writers per level", async () => {
    await db.exec("set role service_role");
    const id = crypto.randomUUID();
    expect(await save("pre-intermediate", 0, id)).toEqual({ revision: 1 });
    expect(await save("pre-intermediate", 0, id)).toEqual({ revision: 1 });
    expect(await save("pre-intermediate", 0)).toEqual({ conflict: true });
    expect(await save("intermediate", 0)).toEqual({ revision: 1 });
    expect(await save("pre-intermediate", 1)).toEqual({ revision: 2 });
    await db.exec("reset role");
  });
  it("reset/import and a repeat migration preserve the main snapshot and other levels", async () => {
    await save("pre-intermediate", 2);
    await db.exec(sql);
    expect(
      (
        await db.query(
          "select snapshot,revision from public.study_progress where id=1",
        )
      ).rows[0],
    ).toEqual({ snapshot: { sentinel: "keep" }, revision: 42 });
    expect(
      (
        await db.query(
          "select revision from public.course_progress where level_id='intermediate'",
        )
      ).rows[0],
    ).toEqual({ revision: 1 });
  });
  it("denies direct anonymous/authenticated access and privileged RPC execution", async () => {
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`set role ${role}`);
      try {
        await expect(
          db.query("select * from public.course_progress"),
        ).rejects.toThrow(/permission denied/);
        await expect(save("pre-intermediate", 3)).rejects.toThrow(
          /permission denied/,
        );
      } finally {
        await db.exec("reset role");
      }
    }
  });
});

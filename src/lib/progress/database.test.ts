import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { emptySnapshot } from "./snapshot";

const db = new PGlite();
const sql = readFileSync("supabase/migrations/202610270001_progress.sql", "utf8");
beforeAll(async () => {
  await db.exec("create role anon; create role authenticated; create role service_role bypassrls;");
  await db.exec(sql);
  await db.exec(sql); // Repeatable without deleting existing progress.
}, 30_000);
afterAll(async () => { await db.close(); });

const save = async (revision: number, id: string, snapshot = emptySnapshot(), initialize = false) => {
  const result = await db.query<{ result: { revision?: number; conflict?: boolean } }>(
    "select public.save_study_progress($1, $2, $3::jsonb, $4) as result", [revision, id, JSON.stringify(snapshot), initialize]);
  return result.rows[0].result;
};

describe("Supabase SQL migration", () => {
  it("atomically saves, deduplicates retries, detects stale writers, and preserves initialization after reset", async () => {
    await db.exec("set role service_role");
    const id = "00000000-0000-4000-8000-000000000001";
    expect(await save(0, id, emptySnapshot(), true)).toEqual({ revision: 1 });
    expect(await save(0, id)).toEqual({ revision: 1 });
    expect(await save(0, "00000000-0000-4000-8000-000000000002")).toEqual({ conflict: true });
    expect(await save(1, "00000000-0000-4000-8000-000000000003", emptySnapshot(), true)).toEqual({ conflict: true });
    expect(await save(1, "00000000-0000-4000-8000-000000000004")).toEqual({ revision: 2 });
    await db.exec("reset role");
    await db.exec(sql);
    const result = await db.query<{ revision: number; initialized: boolean }>("select revision, snapshot is not null as initialized from public.study_progress");
    expect(result.rows[0]).toEqual({ revision: 2, initialized: true });
  });

  it("blocks direct public reads, writes, and RPC execution", async () => {
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`set role ${role}`);
      try {
        await expect(db.query("select * from public.study_progress")).rejects.toThrow(/permission denied/);
        await expect(db.query("update public.study_progress set snapshot = '{}'::jsonb")).rejects.toThrow(/permission denied/);
        await expect(save(2, "00000000-0000-4000-8000-000000000005")).rejects.toThrow(/permission denied/);
        await expect(db.query("select public.allow_unlock_attempt('attacker')")).rejects.toThrow(/permission denied/);
      } finally { await db.exec("reset role"); }
    }
  });

  it("throttles across callers and resets the window after ten minutes", async () => {
    await db.exec("set role service_role");
    try {
      for (let i = 0; i < 10; i++) {
        const result = await db.query<{ allowed: boolean }>("select public.allow_unlock_attempt('test-ip') as allowed");
        expect(result.rows[0].allowed).toBe(true);
      }
      const blocked = await db.query<{ allowed: boolean }>("select public.allow_unlock_attempt('test-ip') as allowed");
      expect(blocked.rows[0].allowed).toBe(false);
      await db.exec("update public.unlock_attempts set started_at = now() - interval '11 minutes'");
      const allowed = await db.query<{ allowed: boolean }>("select public.allow_unlock_attempt('test-ip') as allowed");
      expect(allowed.rows[0].allowed).toBe(true);
    } finally { await db.exec("reset role"); }
  });
});

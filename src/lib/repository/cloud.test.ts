import { afterEach, describe, expect, it, vi } from "vitest";
import { SupabaseStudyRepository } from "./cloud";
import { emptySnapshot } from "../progress/snapshot";

afterEach(() => vi.unstubAllGlobals());

function fakeCloud() {
  let snapshot = emptySnapshot();
  let revision = 0;
  let lastId = "";
  let initialized = false;
  let loseResponse = false;
  const bodies: string[] = [];
  vi.stubGlobal("fetch", vi.fn(async (_url, init) => {
    if (!init?.body) return Response.json({ snapshot, revision, initialized });
    bodies.push(init.body);
    const body = JSON.parse(init.body);
    if (body.mutationId === lastId) return Response.json({ revision });
    if (body.revision !== revision) return Response.json({ error: "conflict" }, { status: 409 });
    snapshot = body.snapshot; lastId = body.mutationId; revision++; initialized = true;
    if (loseResponse) { loseResponse = false; throw new Error("response lost"); }
    return Response.json({ revision });
  }));
  return { bodies, loseNextResponse: () => { loseResponse = true; }, advance: () => { revision++; } };
}

describe("Supabase repository", () => {
  it("reuses the identical mutation after a lost response without duplicating history", async () => {
    const server = fakeCloud();
    const repo = new SupabaseStudyRepository();
    await repo.load();
    server.loseNextResponse();
    const result = { itemId: "test", date: "2026-10-27", accuracy: 1 };
    await expect(repo.appendDictation(result)).rejects.toThrow("response lost");
    await repo.appendDictation(result);
    expect(server.bodies[0]).toBe(server.bodies[1]);
    expect((await repo.load()).dictations).toEqual([result]);
  });

  it("saves and removes drafts, replaces backups, and resets without becoming uninitialized", async () => {
    fakeCloud();
    const repo = new SupabaseStudyRepository();
    await repo.load();
    await repo.saveDraft("2026-W44", "Draft");
    expect((await repo.load()).drafts["2026-W44"]).toBe("Draft");
    await repo.saveDraft("2026-W44", "");
    expect((await repo.load()).drafts).toEqual({});
    await repo.replaceAll({ ...emptySnapshot(), drafts: { "2026-W44": "Imported" } });
    await repo.clearAll();
    expect(await repo.load()).toEqual(emptySnapshot());
    expect(repo.initialized).toBe(true);
  });

  it("does not overwrite another device and refuses refresh with a pending mutation", async () => {
    const server = fakeCloud();
    const repo = new SupabaseStudyRepository();
    await repo.load(); server.advance();
    await expect(repo.saveDraft("2026-W44", "local")).rejects.toMatchObject({ status: 409 });
    await expect(repo.load()).rejects.toThrow();
  });
});

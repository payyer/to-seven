import { afterEach, describe, expect, it, vi } from "vitest";
import { emptySnapshot } from "./snapshot";
vi.mock("@/data/words", () => ({ WORDS: [], PRIORITY_WORD_IDS: [] }));

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

async function setup(local: Record<string, string> = {}, initialized = false) {
  vi.resetModules();
  const data = { ...local };
  const storage = Object.assign(data, {
    getItem: (key: string) => data[key] ?? null,
    setItem: (key: string, value: string) => { data[key] = value; },
    removeItem: (key: string) => { delete data[key]; },
    key: (i: number) => Object.keys(data).filter(k => k.startsWith("ielts-vocab:"))[i] ?? null,
    get length() { return Object.keys(data).filter(k => k.startsWith("ielts-vocab:")).length; },
  });
  vi.stubGlobal("window", { localStorage: storage });
  vi.stubGlobal("document", { createElement: () => ({ click: vi.fn() }) });
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:backup");
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  let snapshot = emptySnapshot();
  let revision = initialized ? 1 : 0;
  vi.stubGlobal("fetch", vi.fn(async (_url, init) => {
    if (!init?.body) return Response.json({ snapshot, revision, initialized });
    const body = JSON.parse(init.body);
    if (body.revision !== revision) return Response.json({ error: "conflict" }, { status: 409 });
    snapshot = body.snapshot;
    initialized = true;
    return Response.json({ revision: ++revision });
  }));
  return { store: await import("../store"), snapshot: () => snapshot, data };
}

describe("cloud study store", { timeout: 15_000 }, () => {
  it("offers migration before any automatic plan write, keeps local data, and imports drafts", async () => {
    const key = "ielts-vocab:writing-draft:2026-W44";
    const { store, snapshot, data } = await setup({ [key]: "Old writing draft", "ielts-vocab:v1:settings": JSON.stringify({ dailyNewWords: 7 }) });
    await store.ensureLoaded();
    expect(store.exportSnapshot()).toBeNull();
    expect(snapshot().plan).toBeNull();
    await store.finishMigration(true);
    expect(snapshot().drafts["2026-W44"]).toBe("Old writing draft");
    expect(snapshot().settings.dailyNewWords).toBe(7);
    expect(data[key]).toBe("Old writing draft");
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it("starts fresh when requested and does not reimport retained local progress after reset", async () => {
    const { store, snapshot, data } = await setup({ "ielts-vocab:writing-draft:2026-W44": "Old draft" });
    await store.ensureLoaded();
    await store.finishMigration(false);
    expect(snapshot().drafts).toEqual({});
    await store.resetAll();
    await store.refreshCloud();
    expect(store.exportSnapshot()).not.toBeNull();
    expect(snapshot().drafts).toEqual({});
    expect(data["ielts-vocab:writing-draft:2026-W44"]).toBe("Old draft");
  });

  it("debounces drafts and includes unsaved drafts in recovery exports", async () => {
    const { store, snapshot } = await setup({}, true);
    await store.ensureLoaded();
    await vi.waitFor(() => expect(snapshot().plan).not.toBeNull());
    vi.useFakeTimers();
    store.saveDraft("2026-W44", "First");
    store.saveDraft("2026-W44", "Latest");
    expect(store.exportSnapshot()?.drafts["2026-W44"]).toBe("Latest");
    expect(snapshot().drafts).toEqual({});
    await vi.advanceTimersByTimeAsync(500);
    expect(snapshot().drafts["2026-W44"]).toBe("Latest");
    store.saveDraft("2026-W44", "Leaving editor");
    store.flushDraft("2026-W44");
    await vi.advanceTimersByTimeAsync(0);
    expect(snapshot().drafts["2026-W44"]).toBe("Leaving editor");
  });

  it("reloads cloud progress when retrying a failed refresh", async () => {
    const { store, snapshot } = await setup({}, true);
    await store.ensureLoaded();
    await vi.waitFor(() => expect(snapshot().plan).not.toBeNull());
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockRejectedValueOnce(new Error("network unavailable"));
    await store.refreshCloud();
    const readsBeforeRetry = fetchMock.mock.calls.filter(([, init]) => !init?.body).length;
    await store.retryCloud();
    const readsAfterRetry = fetchMock.mock.calls.filter(([, init]) => !init?.body).length;
    expect(readsAfterRetry).toBe(readsBeforeRetry + 1);
  });
});

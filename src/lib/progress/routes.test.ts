import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const { rpc, single } = vi.hoisted(() => ({ rpc: vi.fn(), single: vi.fn() }));
vi.mock("./server", () => ({ supabaseServer: () => ({ rpc, from: () => ({ select: () => ({ eq: () => ({ single }) }) }) }) }));
import { GET, PATCH } from "@/app/api/progress/route";
import { POST as unlock } from "@/app/api/session/route";
import { issueSession, SESSION_COOKIE } from "./session";
import { emptySnapshot } from "./snapshot";

beforeEach(() => {
  vi.stubEnv("APP_ACCESS_CODE", "test-code");
  vi.stubEnv("APP_SESSION_SECRET", "s".repeat(48));
  rpc.mockReset(); single.mockReset();
});
afterEach(() => vi.unstubAllEnvs());

function request(body?: unknown, authenticated = true, origin = "https://study.test") {
  return new Request("https://study.test/api/progress", { method: body ? "PATCH" : "GET", headers: {
    "Content-Type": "application/json", origin,
    ...(authenticated ? { cookie: `${SESSION_COOKIE}=${issueSession()}` } : {}),
  }, ...(body ? { body: JSON.stringify(body) } : {}) });
}
const mutation = () => ({ revision: 0, mutationId: crypto.randomUUID(), snapshot: emptySnapshot(), initializeOnly: false });

describe("protected cloud routes", () => {
  it("rejects unauthorized reads/writes and cross-origin writes before database access", async () => {
    expect((await GET(request(undefined, false))).status).toBe(401);
    expect((await PATCH(request(mutation(), false))).status).toBe(401);
    expect((await PATCH(request(mutation(), true, "https://evil.test"))).status).toBe(403);
    expect(rpc).not.toHaveBeenCalled(); expect(single).not.toHaveBeenCalled();
  });
  it("loads an uninitialized record without caching or initializing it", async () => {
    single.mockResolvedValue({ data: { snapshot: null, revision: 0 }, error: null });
    const response = await GET(request());
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(await response.json()).toEqual({ snapshot: emptySnapshot(), revision: 0, initialized: false });
    expect(rpc).not.toHaveBeenCalled();
  });
  it("validates snapshots, passes atomic saves to SQL, and reports conflicts", async () => {
    expect((await PATCH(request({ ...mutation(), snapshot: {} }))).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
    rpc.mockResolvedValue({ data: { revision: 1 }, error: null });
    expect((await PATCH(request(mutation()))).status).toBe(200);
    rpc.mockResolvedValue({ data: { conflict: true }, error: null });
    expect((await PATCH(request(mutation()))).status).toBe(409);
  });
  it("issues a private HttpOnly cookie only after the correct code and rate-limit check", async () => {
    rpc.mockResolvedValue({ data: true, error: null });
    const make = (code: string) => new Request("https://study.test/api/session", { method: "POST", headers: { origin: "https://study.test", "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
    expect((await unlock(make("wrong"))).status).toBe(401);
    const response = await unlock(make("test-code"));
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")).toContain("SameSite=strict");
    rpc.mockResolvedValue({ data: false, error: null });
    expect((await unlock(make("test-code"))).status).toBe(429);
  });
});

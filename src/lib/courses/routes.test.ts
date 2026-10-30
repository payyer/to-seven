import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const { rpc, maybeSingle, from } = vi.hoisted(() => ({
  rpc: vi.fn(),
  maybeSingle: vi.fn(),
  from: vi.fn(),
}));
vi.mock("../progress/server", () => ({
  supabaseServer: () => ({ rpc, from }),
}));
import { GET, PATCH } from "@/app/api/course-progress/[levelId]/route";
import { issueSession, SESSION_COOKIE } from "../progress/session";
import { emptyCourseSnapshot } from "./practice";
const ctx = (levelId = "pre-intermediate") => ({
  params: Promise.resolve({ levelId }),
});
beforeEach(() => {
  vi.stubEnv("APP_ACCESS_CODE", "test");
  vi.stubEnv("APP_SESSION_SECRET", "s".repeat(48));
  rpc.mockReset();
  from
    .mockReset()
    .mockReturnValue({ select: () => ({ eq: () => ({ maybeSingle }) }) });
  maybeSingle.mockReset().mockResolvedValue({ data: null, error: null });
});
afterEach(() => vi.unstubAllEnvs());
function request(body?: unknown, auth = true, origin = "https://study.test") {
  return new Request(
    "https://study.test/api/course-progress/pre-intermediate",
    {
      method: body ? "PATCH" : "GET",
      headers: {
        "content-type": "application/json",
        origin,
        ...(auth ? { cookie: `${SESSION_COOKIE}=${issueSession()}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    },
  );
}
const body = () => ({
  revision: 0,
  mutationId: crypto.randomUUID(),
  snapshot: emptyCourseSnapshot(),
});
describe("course API", () => {
  it("enforces session/origin and rejects unknown levels before storage", async () => {
    expect((await GET(request(undefined, false), ctx())).status).toBe(401);
    expect(
      (await PATCH(request(body(), true, "https://evil.test"), ctx())).status,
    ).toBe(403);
    expect((await GET(request(), ctx("unknown"))).status).toBe(404);
    expect(from).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });
  it("loads a missing level read-only and never touches study_progress", async () => {
    const response = await GET(request(), ctx());
    expect(await response.json()).toEqual({
      snapshot: emptyCourseSnapshot(),
      revision: 0,
    });
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(from).toHaveBeenCalledWith("course_progress");
    expect(rpc).not.toHaveBeenCalled();
  });
  it("validates the separate snapshot and reports multi-device conflicts", async () => {
    expect(
      (await PATCH(request({ ...body(), snapshot: {} }), ctx())).status,
    ).toBe(400);
    const invalid = body();
    invalid.snapshot.questions["intermediate-l1"] = {
      attempts: 1,
      correctAttempts: 0,
      lastCorrect: false,
      lastAnswer: [],
      lastAttemptAt: new Date().toISOString(),
    };
    expect((await PATCH(request(invalid), ctx())).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
    rpc.mockResolvedValue({ data: { revision: 1 }, error: null });
    expect((await PATCH(request(body()), ctx())).status).toBe(200);
    expect(rpc.mock.calls[0][0]).toBe("save_course_progress");
    rpc.mockResolvedValue({ data: { conflict: true }, error: null });
    expect((await PATCH(request(body()), ctx())).status).toBe(409);
  });
});

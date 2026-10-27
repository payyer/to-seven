import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { issueSession, validSession, requireOrigin, requireSession, SESSION_COOKIE, SESSION_SECONDS, readJson } from "./session";

beforeEach(() => {
  vi.stubEnv("APP_ACCESS_CODE", "private-test-code");
  vi.stubEnv("APP_SESSION_SECRET", "s".repeat(48));
});
afterEach(() => vi.unstubAllEnvs());

describe("browser access", () => {
  it("accepts a signed cookie and rejects expired, tampered, and rotated sessions", () => {
    const now = Date.now();
    const token = issueSession(now);
    expect(validSession(token, now)).toBe(true);
    expect(validSession(token, now + SESSION_SECONDS * 1000)).toBe(false);
    expect(validSession(token + "tamper", now)).toBe(false);
    vi.stubEnv("APP_ACCESS_CODE", "rotated-code");
    expect(validSession(token, now)).toBe(false);
  });

  it("requires a session and exact same origin on mutations", () => {
    expect(() => requireSession(new Request("https://study.test/api/progress"))).toThrow();
    const request = new Request("https://study.test/api/progress", { headers: { cookie: `${SESSION_COOKIE}=${issueSession()}`, origin: "https://study.test" } });
    expect(() => requireSession(request)).not.toThrow();
    expect(() => requireOrigin(request)).not.toThrow();
    expect(() => requireOrigin(new Request(request, { headers: { origin: "https://evil.test" } }))).toThrow();
    expect(() => requireOrigin(new Request("https://study.test/api/progress"))).toThrow();
  });

  it("bounds request sizes and rejects malformed JSON", async () => {
    const request = (body: string) => new Request("https://study.test", { method: "POST", headers: { "Content-Type": "application/json" }, body });
    await expect(readJson(request("{}"), 1)).rejects.toMatchObject({ status: 413 });
    await expect(readJson(request("{"))).rejects.toMatchObject({ status: 400 });
  });
});

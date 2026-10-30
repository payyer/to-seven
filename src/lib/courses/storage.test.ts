import { afterEach, describe, expect, it, vi } from "vitest";
import { CourseRepository } from "./repository";
import { CourseStore } from "./store";
import { emptyCourseSnapshot } from "./practice";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
describe("course cloud saves", () => {
  it("retains exact failed requests and serializes later changes without main progress calls", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ revision: 0, snapshot: emptyCourseSnapshot() }),
      )
      .mockResolvedValueOnce(
        Response.json({ error: "offline" }, { status: 503 }),
      )
      .mockResolvedValueOnce(Response.json({ revision: 1 }))
      .mockResolvedValueOnce(Response.json({ revision: 2 }));
    vi.stubGlobal("fetch", fetcher);
    const store = new CourseStore(new CourseRepository("pre-intermediate"));
    await store.load();
    expect(fetcher).toHaveBeenCalledTimes(1);
    store.change((s) => ({
      ...s,
      history: [
        {
          id: "first",
          date: new Date().toISOString(),
          total: 1,
          correct: 0,
          lessonIds: [1],
        },
      ],
    }));
    await expect(store.queue.flush()).rejects.toThrow("offline");
    const failed = fetcher.mock.calls[1][1].body;
    await store.retry();
    expect(fetcher.mock.calls[2][1].body).toBe(failed);
    store.change(() => emptyCourseSnapshot());
    await store.queue.flush();
    expect(fetcher.mock.calls[3][1].body).toContain('"revision":1');
    expect(
      fetcher.mock.calls.every(
        (c) => c[0] === "/api/course-progress/pre-intermediate",
      ),
    ).toBe(true);
  });
  it("coalesces typing and flushes the latest draft before the next action", async () => {
    vi.useFakeTimers();
    const repo = new CourseRepository("pre-intermediate");
    vi.spyOn(repo, "load").mockResolvedValue(emptyCourseSnapshot());
    const save = vi.spyOn(repo, "save").mockResolvedValue();
    const store = new CourseStore(repo);
    await store.load();
    store.change(
      (s) => ({
        ...s,
        history: [
          {
            id: "a",
            date: new Date().toISOString(),
            total: 0,
            correct: 0,
            lessonIds: [1],
          },
        ],
      }),
      true,
    );
    store.change(
      (s) => ({ ...s, history: [{ ...s.history[0], id: "b" }] }),
      true,
    );
    expect(save).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(500);
    await store.queue.flush();
    expect(save).toHaveBeenCalledTimes(1);
    expect(save.mock.calls[0][0].history[0].id).toBe("b");
  });
});

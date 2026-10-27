import { describe, expect, it } from "vitest";
import { SaveQueue } from "./queue";

describe("save queue", () => {
  it("keeps failed writes ahead of later writes and retries the same task", async () => {
    const calls: string[] = [];
    let online = false;
    const queue = new SaveQueue();
    queue.enqueue(async () => { calls.push("first"); if (!online) throw new Error("offline"); });
    queue.enqueue(async () => { calls.push("second"); });
    await expect(queue.flush()).rejects.toThrow("offline");
    expect(calls).toEqual(["first"]);
    expect(queue.pending).toBe(true);
    online = true;
    await queue.retry();
    expect(calls).toEqual(["first", "first", "second"]);
    expect(queue.pending).toBe(false);
  });

  it("drains tasks added during a task", async () => {
    const queue = new SaveQueue();
    let saved = false;
    queue.enqueue(async () => { queue.enqueue(async () => { saved = true; }); });
    await queue.flush();
    expect(saved).toBe(true);
  });
});

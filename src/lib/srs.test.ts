import { describe, expect, it } from "vitest";
import { isMastered, knownCard, newCard, previewInterval, schedule } from "./srs";

const DAY0 = "2026-10-01";

describe("srs", () => {
  it("từ mới đến hạn ôn sau 1 ngày", () => {
    const card = newCard("colleague", DAY0);
    expect(card.due).toBe("2026-10-02");
  });

  it("nhớ liên tiếp đi theo lịch 3 → 7 → 14 ngày rồi nhân ease", () => {
    let card = newCard("colleague", DAY0);
    const intervals: number[] = [];
    let day = card.due;
    for (let i = 0; i < 4; i++) {
      card = schedule(card, "good", day);
      intervals.push(card.interval);
      day = card.due;
    }
    expect(intervals).toEqual([3, 7, 14, 35]);
  });

  it("đạt 14 ngày thì tính là đã thuộc", () => {
    let card = newCard("w", DAY0);
    card = schedule(card, "good", "2026-10-02");
    card = schedule(card, "good", "2026-10-05");
    expect(isMastered(card)).toBe(false);
    card = schedule(card, "good", "2026-10-12");
    expect(isMastered(card)).toBe(true);
    expect(card.masteredAt).toBe("2026-10-12");
  });

  it("quên thì quay về 1 ngày, giảm ease, mất trạng thái đã thuộc", () => {
    const card = knownCard("w", DAY0);
    const next = schedule(card, "again", "2026-10-15");
    expect(next.interval).toBe(1);
    expect(next.reps).toBe(0);
    expect(next.ease).toBeCloseTo(2.3);
    expect(next.lapses).toBe(1);
    expect(next.masteredAt).toBeUndefined();
  });

  it("khó tăng ít và không lên bậc, dễ nhảy 2 bậc", () => {
    expect(previewInterval(newCard("w", DAY0), "hard")).toBe(2);
    const card = schedule(newCard("w", DAY0), "good", "2026-10-02"); // reps 1, interval 3
    expect(previewInterval(card, "hard")).toBe(5);
    expect(schedule(card, "hard", "2026-10-05").reps).toBe(1);
    const late = { ...card, reps: 4, interval: 35 };
    expect(previewInterval(late, "hard")).toBe(42);
    expect(previewInterval(card, "good")).toBe(7);
    expect(previewInterval(card, "easy")).toBe(14);
  });

  it("ease không xuống dưới 1.3", () => {
    let card = newCard("w", DAY0);
    for (let i = 0; i < 20; i++) card = schedule(card, "again", DAY0);
    expect(card.ease).toBe(1.3);
  });
});

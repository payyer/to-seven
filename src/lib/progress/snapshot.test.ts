import { describe, expect, it } from "vitest";
import { emptySnapshot, parseSnapshot } from "./snapshot";
import { newCard } from "../srs";
import { scorePlacement } from "../placement";
import { computeWeekStats, rulePlan } from "../report";

describe("cloud snapshot", () => {
  it("loads older backups and defaults missing drafts and history", () => {
    const result = parseSnapshot({ settings: { dailyNewWords: 7 }, cards: {}, activity: {} });
    expect(result.drafts).toEqual({});
    expect(result.sentences).toEqual([]);
    expect(result.settings.dailyNewWords).toBe(7);
    expect(result.settings.focusLevel).toBe("A2");
  });

  it("round trips generated cards, placement, reports, and drafts", () => {
    const snapshot = emptySnapshot();
    snapshot.cards.test = newCard("test", "2026-10-27");
    snapshot.drafts["2026-W44"] = "My unfinished essay";
    snapshot.placement = scorePlacement([], "2026-10-27");
    const stats = computeWeekStats(snapshot, "2026-10-27");
    snapshot.reports.push({ week: stats.week, createdAt: "2026-10-27", stats, plan: rulePlan(stats, 10), source: "rule" });
    expect(parseSnapshot(JSON.parse(JSON.stringify(snapshot)))).toEqual(snapshot);
  });

  it.each([null, [], { settings: {}, cards: null, activity: {} }, { settings: {}, cards: { broken: {} }, activity: {} }, { ...emptySnapshot(), drafts: { "2026-W44": "x".repeat(1501) } }])("rejects malformed snapshots", value => {
    expect(() => parseSnapshot(value)).toThrow();
  });
});

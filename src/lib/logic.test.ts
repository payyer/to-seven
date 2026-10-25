import { describe, expect, it } from "vitest";
import { PLACEMENT_BANDS } from "@/data/placement";
import { WORDS } from "@/data/words";
import { addDays, diffDays, startOfWeek } from "./date";
import { scorePlacement, type PlacementAnswer } from "./placement";
import { pickNewWords, syncPlan } from "./planner";
import { knownCard, newCard } from "./srs";
import { computeStreak } from "./stats";
import { charDiff, checkAnswer, findWordInSentence, maskWord, parseStress, stressedSyllableIndex } from "./text";
import { DEFAULT_SETTINGS } from "./types";

describe("date", () => {
  it("cộng ngày qua tháng/năm", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(diffDays("2026-10-01", "2026-10-15")).toBe(14);
  });
  it("tuần bắt đầu thứ Hai", () => {
    expect(startOfWeek("2026-10-17")).toBe("2026-10-12"); // thứ Bảy → thứ Hai
    expect(startOfWeek("2026-10-12")).toBe("2026-10-12");
    expect(startOfWeek("2026-10-18")).toBe("2026-10-12"); // Chủ nhật
  });
});

describe("text", () => {
  it("chấm đáp án: đúng / gần đúng / sai", () => {
    expect(checkAnswer("  Colleague ", "colleague")).toBe("correct");
    expect(checkAnswer("colleage", "colleague")).toBe("close");
    expect(checkAnswer("friend", "colleague")).toBe("wrong");
    expect(checkAnswer("", "colleague")).toBe("empty");
    expect(checkAnswer("neighbor", "neighbour", ["neighbor"])).toBe("correct");
    expect(checkAnswer("cat", "car")).toBe("wrong");
  });

  it("tìm từ đã chia trong câu", () => {
    expect(findWordInSentence("I often have lunch with my colleagues.", "colleague")).toEqual([27, 37]);
    expect(maskWord("I applied for a job.", "apply")).toBe("I _____ for a job.");
    expect(maskWord("We celebrated her birthday.", "celebrate")).toBe("We _____ her birthday.");
    expect(maskWord("I want to take up swimming.", "take up")).toBe("I want to _____ swimming.");
  });

  it("so sánh từng ký tự", () => {
    const diff = charDiff("colleage", "colleague");
    expect(diff.answer.filter((p) => p.kind === "missing").map((p) => p.text).join("")).toBe("u");
    expect(diff.given.every((p) => p.kind === "same")).toBe(true);
  });

  it("tách trọng âm", () => {
    expect(parseStress("ex·PE·ri·ence").map((p) => p.stressed)).toEqual([false, true, false, false]);
    expect(stressedSyllableIndex("ex·PE·ri·ence")).toEqual({ index: 2, total: 4 });
    expect(stressedSyllableIndex("part-TIME")).toBeNull();
  });
});

describe("kho từ", () => {
  it("id không trùng", () => {
    const ids = WORDS.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(WORDS.map((w) => [w.word, w] as const))("%s: dữ liệu hợp lệ", (_, w) => {
    // Trọng âm ghép lại phải đúng chính tả của từ.
    expect(w.stress.replace(/·/g, "").toLowerCase()).toBe(w.word.toLowerCase());
    expect(parseStress(w.stress).some((p) => p.stressed)).toBe(true);
    expect(w.ipa).toMatch(/^\/.+\/$/);
    if (w.stress.split(/[·\s-]/).length > 1) expect(w.ipa).toContain("ˈ");
    expect(w.vi.trim()).not.toBe("");
    expect(w.collocations).toHaveLength(2);
    // Câu ví dụ phải chứa từ (để tô đậm và làm gợi ý điền chỗ trống).
    expect(findWordInSentence(w.example, w.word)).not.toBeNull();
    expect(w.exampleVi.trim()).not.toBe("");
  });
});

describe("placement", () => {
  it("có 30 câu, mỗi câu 4 phương án khác nhau", () => {
    const items = PLACEMENT_BANDS.flatMap((b) => b.items);
    expect(items).toHaveLength(30);
    for (const item of items) expect(new Set(item.options).size).toBe(4);
  });

  const answer = (pattern: (band: number, i: number) => boolean | null): PlacementAnswer[] =>
    PLACEMENT_BANDS.flatMap((b) => b.items.map((_, i) => ({ band: b.band, correct: pattern(b.band, i) })));

  it("đúng hết → B2+, ~6.000 word family", () => {
    const r = scorePlacement(answer(() => true), "2026-10-17");
    expect(r.estimatedFamilies).toBe(6000);
    expect(r.level).toBe("B2+");
  });

  it("chỉ biết 2 band đầu → A2, nên học nhóm B1", () => {
    const r = scorePlacement(answer((band) => (band <= 2 ? true : null)), "2026-10-17");
    expect(r.estimatedFamilies).toBe(2000);
    expect(r.level).toBe("A2");
    expect(r.recommendedLevel).toBe("B1");
  });

  it("đoán mò bị trừ điểm", () => {
    // band 3: 2 đúng, 3 sai → 2 − 3/3 = 1 → 20%
    const r = scorePlacement(answer((band, i) => (band <= 2 ? true : band === 3 ? i < 2 : null)), "2026-10-17");
    expect(r.bands[2].ratio).toBeCloseTo(0.2);
    expect(r.estimatedFamilies).toBe(2200);
  });
});

describe("planner & streak", () => {
  it("ưu tiên level trọng tâm và chủ đề ưu tiên", () => {
    const ids = pickNewWords(WORDS, {}, new Set(), 5, { ...DEFAULT_SETTINGS, focusLevel: "B1", preferredTopics: ["food"] }, []);
    const picked = ids.map((id) => WORDS.find((w) => w.id === id)!);
    expect(picked.every((w) => w.level === "B1" && w.topic === "food")).toBe(true);
  });

  it("từ người học tự gửi được học trước, đúng thứ tự gửi, bỏ qua từ đã học", () => {
    const settings = { ...DEFAULT_SETTINGS, focusLevel: "A2" as const, preferredTopics: ["food" as const] };
    const cards = { advice: newCard("advice", "2026-10-20") };
    const ids = pickNewWords(WORDS, cards, new Set(), 6, settings);
    expect(ids).toEqual(["revolve", "plenty-of", "province", "cause", "climate", "discuss"]);
  });

  it("danh sách ưu tiên chỉ chứa id có trong kho, không trùng", async () => {
    const { MY_WORD_IDS, PRIORITY_WORD_IDS, WORD_BY_ID } = await import("@/data/words");
    expect(new Set(PRIORITY_WORD_IDS).size).toBe(PRIORITY_WORD_IDS.length);
    for (const id of PRIORITY_WORD_IDS) expect(WORD_BY_ID[id], id).toBeDefined();
    expect(new Set(MY_WORD_IDS).size).toBe(MY_WORD_IDS.length);
    expect(MY_WORD_IDS).toHaveLength(65);
    // Từ tự gửi học trước, rồi tới từ trên lớp.
    expect(PRIORITY_WORD_IDS.slice(0, MY_WORD_IDS.length)).toEqual(MY_WORD_IDS);
  });

  it("LIST trên lớp: đánh số liên tục, id có trong kho, gắn nhãn đúng", async () => {
    const { CLASS_LISTS } = await import("@/data/class-words");
    const { CLASS_WORD_IDS, PRIORITY_WORD_IDS, WORD_BY_ID } = await import("@/data/words");
    expect(CLASS_LISTS.map((l) => l.list)).toEqual(CLASS_LISTS.map((_, i) => i + 1));
    for (const id of CLASS_WORD_IDS) {
      expect(WORD_BY_ID[id], id).toBeDefined();
      expect(WORD_BY_ID[id].classLists?.length, id).toBeGreaterThan(0);
      expect(PRIORITY_WORD_IDS).toContain(id);
    }
    expect(WORD_BY_ID.colleague.classLists).toEqual([4, 5]);
    expect(WORD_BY_ID["verbal-communication"]).toMatchObject({ topic: "class", classLists: [1] });
  });

  it("kế hoạch ngày bù từ khi người dùng báo đã biết", () => {
    const today = "2026-10-17";
    const settings = { ...DEFAULT_SETTINGS, dailyNewWords: 5 };
    const plan = syncPlan(null, today, WORDS, {}, settings);
    expect(plan.wordIds).toHaveLength(5);
    const cards = { [plan.wordIds[0]]: knownCard(plan.wordIds[0], today), [plan.wordIds[1]]: newCard(plan.wordIds[1], today) };
    const next = syncPlan(plan, today, WORDS, cards, settings);
    expect(next.wordIds).toHaveLength(6);
    // Giảm chỉ tiêu không xoá từ đã học.
    const smaller = syncPlan(next, today, WORDS, cards, { ...settings, dailyNewWords: 1 });
    expect(smaller.wordIds).toEqual(plan.wordIds.slice(0, 2));
  });

  it("streak không đứt nếu hôm nay chưa học", () => {
    const a = { newWords: 1, reviews: 0, forgot: 0 };
    const activity = { "2026-10-14": a, "2026-10-15": a, "2026-10-16": a };
    expect(computeStreak(activity, "2026-10-17")).toBe(3);
    expect(computeStreak({ ...activity, "2026-10-17": a }, "2026-10-17")).toBe(4);
    expect(computeStreak(activity, "2026-10-18")).toBe(0);
  });
});

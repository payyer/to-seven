import { describe, expect, it } from "vitest";
import { SPEAKING_QUESTIONS } from "@/data/speaking-questions";
import { TOPICS } from "@/data/topics";
import { WRITING_PROMPTS } from "@/data/writing-prompts";
import { isoWeek } from "./date";
import { applyFix, isCorrectFix, makeTextErrorEntries, sanitizeIssues } from "./mistakes";
import { computeWeekStats, rulePlan } from "./report";
import { newCard } from "./srs";
import type { DayActivity, ErrorEntry, SentenceIssue } from "./types";
import { countWords, promptForWeek, wordCountState } from "./writing";

const issue = (wrong: string, correction: string, rule = "agreement-third-person-s"): SentenceIssue => ({
  rule,
  wrong,
  correction,
  hintVi: "Động từ cần đổi thế nào?",
  explanationVi: "…",
});

describe("tuần ISO", () => {
  it.each([
    ["2026-10-17", "2026-W42"],
    ["2026-01-01", "2026-W01"], // thứ Năm
    ["2027-01-01", "2026-W53"], // thứ Sáu → thuộc tuần cuối năm trước
    ["2024-12-30", "2025-W01"], // thứ Hai → tuần 1 năm sau
  ])("%s → %s", (day, week) => expect(isoWeek(day)).toBe(week));
});

describe("writing", () => {
  it("đếm từ như IELTS", () => {
    expect(countWords("Dear Tom,  I'm writing to you — about my e-mail.")).toBe(9);
    expect(countWords("   ")).toBe(0);
    expect(wordCountState(79)).toBe("short");
    expect(wordCountState(100)).toBe("ok");
    expect(wordCountState(121)).toBe("long");
  });

  it("mỗi tuần một đề cố định, đổi đề khi sang tuần", () => {
    expect(promptForWeek("2026-10-12").id).toBe(promptForWeek("2026-10-18").id);
    expect(promptForWeek("2026-10-19").id).not.toBe(promptForWeek("2026-10-18").id);
    expect(promptForWeek("2025-06-01")).toBeDefined(); // trước mốc vẫn ra đề
  });

  it("26 đề, id không trùng, có 3 gạch đầu dòng", () => {
    expect(WRITING_PROMPTS).toHaveLength(26);
    expect(new Set(WRITING_PROMPTS.map((p) => p.id)).size).toBe(26);
    for (const p of WRITING_PROMPTS) expect(p.bullets).toHaveLength(3);
  });
});

describe("speaking data", () => {
  it("70 câu hỏi, mỗi chủ đề 5 câu, id không trùng", () => {
    expect(SPEAKING_QUESTIONS).toHaveLength(70);
    expect(new Set(SPEAKING_QUESTIONS.map((q) => q.id)).size).toBe(70);
    for (const t of TOPICS.filter((t) => t.id !== "mylist" && t.id !== "class")) expect(SPEAKING_QUESTIONS.filter((q) => q.topic === t.id)).toHaveLength(5);
  });
});

describe("lỗi trong bài dài", () => {
  const text = "I live in Hanoi. My sister go to work by bus. She like it.";
  const practice = { en: "He works here.", vi: "Anh ấy làm ở đây." };

  it("lưu câu chứa lỗi và câu chỉ sửa đúng lỗi đó", () => {
    let n = 0;
    const entries = makeTextErrorEntries(
      text,
      [issue("My sister go", "My sister goes"), issue("She like", "She likes"), issue("not here", "x")],
      "writing",
      practice,
      "2026-10-17",
      () => `id${++n}`,
    );
    expect(entries).toHaveLength(2); // lỗi không tìm thấy bị bỏ qua
    expect(entries[0]).toMatchObject({
      source: "writing",
      sentence: "My sister go to work by bus.",
      corrected: "My sister goes to work by bus.",
      hintVi: "Động từ cần đổi thế nào?",
    });
    expect(entries[1].corrected).toBe("She likes it.");
  });

  it("applyFix ưu tiên nguyên từ", () => {
    expect(applyFix("It is late and i am tired", "i", "I")).toBe("It is late and I am tired");
  });

  it("lỗi viết hoa phải gõ đúng chữ hoa", () => {
    expect(isCorrectFix("capitalization", "i", "I")).toBe(false);
    expect(isCorrectFix("capitalization", "I", "I")).toBe(true);
    expect(isCorrectFix("agreement-third-person-s", "she GOES.", "She goes")).toBe(true);
  });

  it("gợi ý lộ đáp án bị thay bằng gợi ý theo quy tắc; lỗi trùng bị bỏ", () => {
    const out = sanitizeIssues([
      { ...issue("She go", "She goes"), hintVi: "Đổi thành She goes nhé" },
      issue("She go", "She goes"),
      issue("ok", "ok"),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].hintVi).toBe("Xem lại: ngôi thứ 3 số ít thêm -s/-es.");
  });
});

describe("báo cáo tuần", () => {
  const day = (d: Partial<DayActivity>): DayActivity => ({ newWords: 0, reviews: 0, forgot: 0, ...d });
  const error = (pattern: string, createdAt: string): ErrorEntry => ({
    id: `${pattern}-${createdAt}`,
    pattern,
    category: "agreement",
    rule: pattern,
    wrong: "She go",
    correction: "She goes",
    explanationVi: "",
    sentence: "She go.",
    corrected: "She goes.",
    similar: { en: "", vi: "" },
    wordId: null,
    createdAt,
    box: 0,
    due: createdAt,
  });

  const data = {
    activity: {
      "2026-10-12": day({ newWords: 10, reviews: 20, forgot: 4, speaking: 2 }),
      "2026-10-13": day({ newWords: 10, reviews: 30, forgot: 6, writing: 1 }),
      "2026-10-15": day({ reviews: 10, forgot: 0, sentences: 3 }),
      "2026-10-20": day({ newWords: 99 }), // tuần sau, không tính
    },
    cards: {
      a: { ...newCard("a", "2026-10-01"), masteredAt: "2026-10-14" },
      b: { ...newCard("b", "2026-10-01"), masteredAt: "2026-10-01" },
    },
    errors: [
      error("agreement-third-person-s", "2026-10-12"),
      error("agreement-third-person-s", "2026-10-15"),
      error("article-missing", "2026-10-13"),
      error("article-missing", "2026-10-05"),
    ],
    dictations: [
      { itemId: "x", date: "2026-10-14", accuracy: 0.8 },
      { itemId: "y", date: "2026-10-16", accuracy: 1 },
    ],
  };

  it("tổng hợp số liệu trong tuần", () => {
    const s = computeWeekStats(data, "2026-10-12");
    expect(s).toMatchObject({
      week: "2026-W42",
      end: "2026-10-18",
      activeDays: 3,
      newWords: 20,
      mastered: 1,
      reviews: 60,
      forgot: 10,
      speaking: 2,
      writing: 1,
      sentences: 3,
      dictations: 2,
      newErrors: 3,
    });
    expect(s.reviewAccuracy).toBeCloseTo(50 / 60);
    expect(s.dictationAvg).toBeCloseTo(0.9);
    expect(s.topErrors[0]).toMatchObject({ pattern: "agreement-third-person-s", count: 2 });
  });

  it("kế hoạch dự phòng: độ chính xác thấp → giảm từ mới, đủ 7 ngày", () => {
    const s = computeWeekStats(data, "2026-10-12");
    const plan = rulePlan({ ...s, reviewAccuracy: 0.7 }, 10);
    expect(plan.suggestedDailyNewWords).toBe(7);
    expect(plan.focusAreas[0].titleVi).toBe("Ôn kỹ hơn");
    expect(plan.focusAreas.length).toBeLessThanOrEqual(3);
    expect(plan.days.map((d) => d.dayVi)).toEqual(["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ nhật"]);
  });

  it("tuần trống vẫn ra báo cáo", () => {
    const s = computeWeekStats({ activity: {}, cards: {}, errors: [], dictations: [] }, "2026-10-12");
    expect(s.reviewAccuracy).toBeNull();
    expect(rulePlan(s, 10).summaryVi).toContain("chưa có lượt ôn");
  });
});

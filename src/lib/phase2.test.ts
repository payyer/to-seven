import { describe, expect, it } from "vitest";
import { DICTATIONS } from "@/data/dictation";
import {
  addErrors,
  checkErrorFix,
  countPatterns,
  expectedFix,
  makeErrorEntries,
  patternKey,
  reviewError,
  RULE_IDS,
  RULES,
} from "./mistakes";
import { diffAccuracy, splitSentences, wordDiff } from "./text";
import type { SentenceFeedback } from "./types";

const TODAY = "2026-10-17";
let seq = 0;
const id = () => `e${++seq}`;

const feedback = (issues: SentenceFeedback["issues"], original = "She go to work by bus.", corrected = "She goes to work by bus."): SentenceFeedback => ({
  original,
  corrected,
  isCorrect: issues.length === 0,
  usesTargetWord: true,
  issues,
  commentVi: "",
  similar: { en: "He works in an office.", vi: "Anh ấy làm việc ở văn phòng." },
});

const sva = { rule: "agreement-third-person-s", wrong: "She go", correction: "She goes", explanationVi: "…" };

describe("wordDiff", () => {
  it("khớp hoàn toàn khi chỉ khác hoa thường và dấu câu", () => {
    const ops = wordDiff("My name is Lan.", "my name is lan");
    expect(ops.every((o) => o.type === "equal")).toBe(true);
    expect(diffAccuracy(ops)).toBe(1);
  });

  it("chế độ nghiêm ngặt tính cả hoa thường và dấu câu", () => {
    const ops = wordDiff("My name is Lan.", "my name is lan", true);
    expect(ops.map((o) => o.type)).toEqual(["replace", "equal", "equal", "replace"]);
  });

  it("phân biệt sai, thiếu, thừa", () => {
    const ops = wordDiff("I go to work by bus every morning", "I goes to work bus every the morning");
    expect(ops).toEqual([
      { type: "equal", ref: "I", input: "I" },
      { type: "replace", ref: "go", input: "goes" },
      { type: "equal", ref: "to", input: "to" },
      { type: "equal", ref: "work", input: "work" },
      { type: "missing", ref: "by" },
      { type: "equal", ref: "bus", input: "bus" },
      { type: "equal", ref: "every", input: "every" },
      { type: "extra", input: "the" },
      { type: "equal", ref: "morning", input: "morning" },
    ]);
    expect(diffAccuracy(ops)).toBeCloseTo(6 / 8);
  });

  it("tách câu", () => {
    expect(splitSentences("I live here. It is quiet! Do you?")).toEqual(["I live here.", "It is quiet!", "Do you?"]);
  });
});

describe("sổ lỗi", () => {
  it("mọi quy tắc đều thuộc một nhóm hợp lệ", () => {
    expect(RULE_IDS.length).toBe(Object.keys(RULES).length);
  });

  it("chính tả gom theo từ đúng, lỗi khác gom theo quy tắc", () => {
    expect(patternKey({ rule: "spelling", correction: "Because" })).toBe("spelling:because");
    expect(patternKey(sva)).toBe("agreement-third-person-s");
  });

  it("tạo lỗi mới ở hộp 0, hẹn ôn ngày mai", () => {
    const [e] = makeErrorEntries(feedback([sva]), "commute", TODAY, id);
    expect(e).toMatchObject({ category: "agreement", box: 0, due: "2026-10-18", wordId: "commute" });
  });

  it("mắc lại lỗi cùng kiểu thì lỗi cũ về hộp 0 và được đếm lặp lại", () => {
    const [old] = makeErrorEntries(feedback([sva]), null, "2026-10-01", id);
    const progressed = { ...old, box: 3, due: "2026-10-30" };
    const [again] = makeErrorEntries(feedback([{ ...sva, wrong: "He like", correction: "He likes" }]), null, TODAY, id);
    const all = addErrors([progressed], [again], TODAY);
    expect(all[0]).toMatchObject({ box: 0, due: "2026-10-18" });
    expect(countPatterns(all).get("agreement-third-person-s")).toBe(2);
  });

  it("Leitner: đúng lên hộp, 5 lần đúng là khắc phục, sai về hộp 0", () => {
    let [e] = makeErrorEntries(feedback([sva]), null, TODAY, id);
    const dues: string[] = [];
    for (let i = 0; i < 5; i++) {
      e = reviewError(e, true, TODAY);
      dues.push(e.due);
    }
    expect(dues.slice(0, 4)).toEqual(["2026-10-20", "2026-10-24", "2026-10-31", "2026-11-16"]);
    expect(e.fixedAt).toBe(TODAY);
    const relapsed = reviewError(e, false, TODAY);
    expect(relapsed).toMatchObject({ box: 0, fixedAt: undefined, due: "2026-10-18" });
  });

  it("chấm bài sửa lỗi: đoạn sửa hoặc cả câu khi không tô được đoạn sai", () => {
    const [e] = makeErrorEntries(feedback([sva]), null, TODAY, id);
    expect(checkErrorFix(e, "she goes")).toBe(true);
    expect(checkErrorFix(e, "She go")).toBe(false);
    const [loose] = makeErrorEntries(feedback([{ ...sva, wrong: "not in sentence" }]), null, TODAY, id);
    expect(expectedFix(loose)).toBe("She goes to work by bus.");
    expect(checkErrorFix(loose, "she goes to work by bus")).toBe(true);
  });
});

describe("findFragment", () => {
  it("ưu tiên khớp nguyên từ", async () => {
    const { findFragment } = await import("./text");
    expect(findFragment("It is late and i am tired", "i")).toBe(15);
    expect(findFragment("She go to work", "She go")).toBe(0);
    expect(findFragment("abc", "")).toBe(-1);
  });
});

describe("dictation", () => {
  it("id không trùng, có bản dịch", () => {
    expect(new Set(DICTATIONS.map((d) => d.id)).size).toBe(DICTATIONS.length);
    for (const d of DICTATIONS) expect(d.vi.length).toBeGreaterThan(0);
  });
});

import { addDays } from "./date";
import { findFragment, normalizeAnswer, splitSentences } from "./text";
import type { ErrorCategory, ErrorEntry, ErrorSource, SentenceFeedback, SentenceIssue } from "./types";

export const CATEGORY_LABEL: Record<ErrorCategory, string> = {
  tense: "Thì",
  agreement: "Hoà hợp chủ ngữ – động từ",
  article: "Mạo từ",
  spelling: "Chính tả",
  "word-choice": "Dùng từ",
  other: "Ngữ pháp khác",
};

export const CATEGORIES = Object.keys(CATEGORY_LABEL) as ErrorCategory[];

/**
 * Danh sách quy tắc cố định để AI phân loại lỗi.
 * Mã ổn định giúp đếm lỗi lặp lại chính xác hơn so với mô tả tự do.
 */
export const RULES = {
  "tense-present-simple": { category: "tense", label: "Hiện tại đơn (thói quen, sự thật)" },
  "tense-past-simple": { category: "tense", label: "Quá khứ đơn (việc đã xong)" },
  "tense-present-perfect": { category: "tense", label: "Hiện tại hoàn thành" },
  "tense-continuous": { category: "tense", label: "Thì tiếp diễn" },
  "tense-future": { category: "tense", label: "Tương lai (will / be going to)" },
  "verb-form": { category: "tense", label: "Dạng động từ (to V, V-ing, V3)" },
  "agreement-third-person-s": { category: "agreement", label: "Ngôi thứ 3 số ít thêm -s/-es" },
  "agreement-be": { category: "agreement", label: "Chia động từ be (am/is/are/was/were)" },
  "agreement-there-is-are": { category: "agreement", label: "There is / There are" },
  "agreement-plural-subject": { category: "agreement", label: "Chủ ngữ số nhiều / không đếm được" },
  "article-a-an": { category: "article", label: "a hay an" },
  "article-missing": { category: "article", label: "Thiếu mạo từ" },
  "article-unnecessary": { category: "article", label: "Thừa mạo từ" },
  "article-the": { category: "article", label: "Dùng the cho vật xác định" },
  spelling: { category: "spelling", label: "Chính tả" },
  "word-wrong-meaning": { category: "word-choice", label: "Dùng sai từ / sai nghĩa" },
  "word-collocation": { category: "word-choice", label: "Kết hợp từ (collocation)" },
  "word-form": { category: "word-choice", label: "Sai loại từ (danh/tính/trạng từ)" },
  preposition: { category: "word-choice", label: "Giới từ" },
  "plural-noun": { category: "other", label: "Danh từ số nhiều" },
  "word-order": { category: "other", label: "Trật tự từ" },
  "missing-word": { category: "other", label: "Thiếu từ (chủ ngữ, động từ…)" },
  capitalization: { category: "other", label: "Viết hoa" },
  other: { category: "other", label: "Lỗi khác" },
} as const satisfies Record<string, { category: ErrorCategory; label: string }>;

export type RuleId = keyof typeof RULES;
export const RULE_IDS = Object.keys(RULES) as [RuleId, ...RuleId[]];

export function ruleInfo(rule: string): { category: ErrorCategory; label: string } {
  return RULES[rule as RuleId] ?? RULES.other;
}

/** Lỗi chính tả gom theo từ đúng; các lỗi khác gom theo quy tắc. */
export function patternKey(issue: Pick<SentenceIssue, "rule" | "correction">): string {
  return issue.rule === "spelling" ? `spelling:${normalizeAnswer(issue.correction)}` : issue.rule;
}

/** Leitner 5 hộp: ôn đúng lên hộp, sai về hộp 0. Qua hộp cuối = đã khắc phục. */
export const BOX_INTERVALS = [1, 3, 7, 14, 30];

export function makeErrorEntries(
  feedback: SentenceFeedback,
  wordId: string | null,
  today: string,
  newId: () => string,
): ErrorEntry[] {
  return feedback.issues.map((issue) =>
    toEntry(issue, {
      source: "sentence",
      sentence: feedback.original,
      corrected: feedback.corrected,
      similar: feedback.similar,
      wordId,
      today,
      id: newId(),
    }),
  );
}

function toEntry(
  issue: SentenceIssue,
  ctx: { source: ErrorSource; sentence: string; corrected: string; similar: ErrorEntry["similar"]; wordId: string | null; today: string; id: string },
): ErrorEntry {
  return {
    id: ctx.id,
    pattern: patternKey(issue),
    category: ruleInfo(issue.rule).category,
    rule: issue.rule,
    wrong: issue.wrong,
    correction: issue.correction,
    explanationVi: issue.explanationVi,
    hintVi: issue.hintVi,
    source: ctx.source,
    sentence: ctx.sentence,
    corrected: ctx.corrected,
    similar: ctx.similar,
    wordId: ctx.wordId,
    createdAt: ctx.today,
    box: 0,
    due: addDays(ctx.today, BOX_INTERVALS[0]),
  };
}

/** Thay đoạn sai đầu tiên (ưu tiên nguyên từ) bằng đoạn sửa. */
export function applyFix(text: string, wrong: string, correction: string): string {
  const index = findFragment(text, wrong);
  return index < 0 ? text : text.slice(0, index) + correction + text.slice(index + wrong.length);
}

/**
 * Lỗi trong bài nói / bài viết dài: mỗi lỗi lưu kèm CÂU chứa nó (không lưu cả bài),
 * câu đúng chỉ sửa đúng lỗi đó — để bài ôn tập trung vào một lỗi.
 * Lỗi không tìm thấy trong bài thì bỏ qua.
 */
export function makeTextErrorEntries(
  text: string,
  issues: SentenceIssue[],
  source: ErrorSource,
  practice: ErrorEntry["similar"],
  today: string,
  newId: () => string,
): ErrorEntry[] {
  const sentences = splitSentences(text);
  return issues.flatMap((issue) => {
    const sentence = sentences.find((s) => findFragment(s, issue.wrong) >= 0);
    if (!sentence) return [];
    return [
      toEntry(issue, {
        source,
        sentence,
        corrected: applyFix(sentence, issue.wrong, issue.correction),
        similar: practice,
        wordId: null,
        today,
        id: newId(),
      }),
    ];
  });
}

/**
 * Thêm lỗi mới vào sổ. Nếu một lỗi cùng kiểu đã có, các lỗi cũ đó bị đưa về hộp 0
 * (mắc lại nghĩa là chưa khắc phục).
 */
export function addErrors(existing: ErrorEntry[], added: ErrorEntry[], today: string): ErrorEntry[] {
  const repeated = new Set(added.map((e) => e.pattern));
  const reset = existing.map((e) =>
    repeated.has(e.pattern) && (e.box > 0 || e.fixedAt)
      ? { ...e, box: 0, due: addDays(today, BOX_INTERVALS[0]), fixedAt: undefined }
      : e,
  );
  return [...reset, ...added];
}

export function reviewError(entry: ErrorEntry, correct: boolean, today: string): ErrorEntry {
  if (!correct) {
    return { ...entry, box: 0, due: addDays(today, BOX_INTERVALS[0]), lastReviewedAt: today, fixedAt: undefined };
  }
  const box = entry.box + 1;
  if (box >= BOX_INTERVALS.length) {
    return { ...entry, box, due: addDays(today, 365), lastReviewedAt: today, fixedAt: today };
  }
  return { ...entry, box, due: addDays(today, BOX_INTERVALS[box]), lastReviewedAt: today };
}

export function isErrorDue(entry: ErrorEntry, today: string): boolean {
  return !entry.fixedAt && entry.due <= today;
}

/** Số lần mỗi kiểu lỗi xuất hiện. */
export function countPatterns(errors: ErrorEntry[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const e of errors) counts.set(e.pattern, (counts.get(e.pattern) ?? 0) + 1);
  return counts;
}

export function patternLabel(entry: Pick<ErrorEntry, "rule" | "correction">): string {
  return entry.rule === "spelling" ? `Chính tả: “${entry.correction}”` : ruleInfo(entry.rule).label;
}

/** Bài ôn có tô được đoạn sai trong câu không. Không tô được thì người học gõ lại cả câu. */
export function canHighlight(entry: Pick<ErrorEntry, "sentence" | "wrong">): boolean {
  return findFragment(entry.sentence, entry.wrong) >= 0;
}

/** Đáp án mong đợi khi ôn: đoạn sửa (nếu tô được đoạn sai) hoặc cả câu đúng. */
export function expectedFix(entry: ErrorEntry): string {
  return canHighlight(entry) ? entry.correction : entry.corrected;
}

/** So cách sửa của người học với đáp án, bỏ qua hoa thường, dấu câu, khoảng trắng thừa. */
export function sameFix(answer: string, expected: string): boolean {
  const normalize = (s: string) => normalizeAnswer(s).replace(/[.,!?;:"]/g, "").replace(/\s+/g, " ").trim();
  return normalize(answer) === normalize(expected);
}

/** Chấm một lần sửa. Lỗi viết hoa thì bản thân chữ hoa là đáp án → phân biệt hoa thường. */
export function isCorrectFix(rule: string, answer: string, expected: string): boolean {
  if (rule === "capitalization") return answer.trim().replace(/[.,!?;:]+$/, "") === expected.trim().replace(/[.,!?;:]+$/, "");
  return sameFix(answer, expected);
}

export function checkErrorFix(entry: ErrorEntry, answer: string): boolean {
  return isCorrectFix(entry.rule, answer, expectedFix(entry));
}

/**
 * Kiểm tra lại từng lỗi AI trả về:
 * - gợi ý không được chứa đáp án (nếu có, thay bằng gợi ý theo quy tắc);
 * - bỏ lỗi trùng đoạn sai hoặc không có đoạn sửa.
 */
export function sanitizeIssues(issues: SentenceIssue[]): SentenceIssue[] {
  const seen = new Set<string>();
  return issues
    .filter((i) => i.correction.trim() && i.wrong.trim() !== i.correction.trim())
    .filter((i) => {
      if (seen.has(i.wrong)) return false;
      seen.add(i.wrong);
      return true;
    })
    .map((i) => {
      const leaks = i.correction.trim().length > 1 && i.hintVi?.toLowerCase().includes(i.correction.trim().toLowerCase());
      return leaks || !i.hintVi?.trim() ? { ...i, hintVi: `Xem lại: ${ruleInfo(i.rule).label.toLowerCase()}.` } : i;
    });
}

import { WRITING_PROMPTS, type WritingPrompt } from "@/data/writing-prompts";
import { diffDays, startOfWeek } from "./date";

export const WRITING_MIN = 80;
export const WRITING_MAX = 120;
/** Số lần nộp tối đa mỗi tuần (bản đầu + 2 lần viết lại) để giới hạn chi phí AI. */
export const MAX_SUBMISSIONS_PER_WEEK = 3;
/** Thứ Hai mốc để xoay vòng đề. */
const EPOCH = "2026-01-05";

/** Đếm từ như khi chấm IELTS: mọi cụm ký tự có chữ hoặc số (kể cả "don't", "e-mail"). */
export function countWords(text: string): number {
  return text.split(/\s+/).filter((t) => /[A-Za-z0-9]/.test(t)).length;
}

/** Mỗi tuần một đề cố định, xoay vòng theo số tuần tính từ mốc. */
export function promptForWeek(dayKey: string): WritingPrompt {
  const weeks = Math.floor(diffDays(EPOCH, startOfWeek(dayKey)) / 7);
  const n = WRITING_PROMPTS.length;
  return WRITING_PROMPTS[((weeks % n) + n) % n];
}

export type WordCountState = "short" | "ok" | "long";

export function wordCountState(count: number): WordCountState {
  if (count < WRITING_MIN) return "short";
  if (count > WRITING_MAX) return "long";
  return "ok";
}

/** Nội dung đề gửi cho AI. */
export function promptText(p: WritingPrompt): string {
  return [p.prompt, ...p.bullets.map((b) => `- ${b}`)].join("\n");
}

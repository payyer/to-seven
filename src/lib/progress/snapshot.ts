import { z } from "zod";
import { DEFAULT_SETTINGS, type StudySnapshot } from "../types";

const text = z.string().max(100_000);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const count = z.number().int().nonnegative();
const level = z.enum(["A1", "A2", "B1", "B2"]);
const practice = z.object({ en: text, vi: text });
const issue = z.object({ rule: text, wrong: text, correction: text, hintVi: text.optional(), explanationVi: text });
const issues = z.array(issue);
const upgrade = z.object({ original: text, better: text, whyVi: text });
const peer = z.object({ status: z.enum(["good", "weak", "missing"]), commentVi: text });
const settings = z.object({
  dailyNewWords: z.number().int().min(5).max(15), focusLevel: level,
  preferredTopics: z.array(z.enum(["work", "study", "home", "hometown", "routine", "hobbies", "food", "travel", "technology", "health", "weather", "shopping", "people", "entertainment", "mylist", "class"])),
  preferRealAudio: z.boolean(),
});
const card = z.object({
  wordId: text, reps: count, ease: z.number().positive(), interval: count, due: date,
  lapses: count, learnedAt: date, lastReviewedAt: date.optional(), masteredAt: date.optional(),
  known: z.boolean().optional(), misspells: count.optional(), spellStreak: count.optional(), lastMisspelledAt: date.optional(),
});
const activity = z.object({ newWords: count, reviews: count, forgot: count,
  sentences: count.optional(), dictations: count.optional(), errorReviews: count.optional(),
  speaking: count.optional(), writing: count.optional(), spelling: count.optional() });
const plan = z.object({ date, wordIds: z.array(text), extra: count });
const placement = z.object({ takenAt: date, bands: z.array(z.object({ band: z.number(), label: text, correct: count, wrong: count, unknown: count, ratio: z.number() })), estimatedFamilies: z.number(), level: z.enum(["A1", "A2", "B1", "B2", "B2+"]), recommendedLevel: level });
const sentence = z.object({ id: text, wordId: text.nullable(), targetWord: text, createdAt: date,
  feedback: z.object({ original: text, corrected: text, isCorrect: z.boolean(), usesTargetWord: z.boolean(), issues, commentVi: text, similar: practice }) });
const error = z.object({ id: text, pattern: text, category: z.enum(["tense", "agreement", "article", "spelling", "word-choice", "other"]), rule: text, wrong: text, correction: text, explanationVi: text, hintVi: text.optional(), source: z.enum(["sentence", "speaking", "writing"]).optional(), sentence: text, corrected: text, similar: practice, wordId: text.nullable(), createdAt: date, box: count.max(5), due: date, lastReviewedAt: date.optional(), fixedAt: date.optional() });
const speaking = z.object({ id: text, questionId: text, question: text, inputMode: z.enum(["voice", "text"]), durationSec: z.number().nonnegative().nullable(), createdAt: date,
  feedback: z.object({ answer: text, peer: z.object({ point: peer, explain: peer, example: peer, result: peer }), issues, vocabUpgrades: z.array(upgrade), recentWordIdeas: z.array(z.object({ word: text, sentence: text })), improvedAnswer: text, commentVi: text, practice }) });
const writing = z.object({ id: text, week: text, promptId: text, text, wordCount: count, createdAt: date,
  feedback: z.object({ text, issues, registerSuggestions: z.array(upgrade), correctedText: text, taskCommentVi: text, commentVi: text, practice }) });
const report = z.object({ week: text, createdAt: date, source: z.enum(["ai", "rule"]),
  stats: z.object({ week: text, start: date, end: date, activeDays: count, newWords: count, mastered: count, reviews: count, forgot: count, reviewAccuracy: z.number().nullable(), sentences: count, speaking: count, writing: count, dictations: count, dictationAvg: z.number().nullable(), errorReviews: count, newErrors: count, topErrors: z.array(z.object({ pattern: text, label: text, count, wrong: text, correction: text })) }),
  plan: z.object({ summaryVi: text, focusAreas: z.array(z.object({ titleVi: text, whyVi: text, actionVi: text })), days: z.array(z.object({ dayVi: text, tasksVi: z.array(text) })), suggestedDailyNewWords: z.number() }) });

export const snapshotSchema = z.object({
  settings: settings.prefault(DEFAULT_SETTINGS), cards: z.record(z.string(), card).default({}),
  plan: plan.nullable().default(null), activity: z.record(z.string(), activity).default({}),
  placement: placement.nullable().default(null), sentences: z.array(sentence).default([]),
  errors: z.array(error).default([]), dictations: z.array(z.object({ itemId: text, date, accuracy: z.number().min(0).max(1) })).default([]),
  speaking: z.array(speaking).default([]), writings: z.array(writing).default([]), reports: z.array(report).default([]),
  drafts: z.record(z.string().regex(/^\d{4}-W\d{2}$/), z.string().max(1500)).default({}),
});

export function parseSnapshot(value: unknown): StudySnapshot {
  if (!value || typeof value !== "object" || !("settings" in value) || !("cards" in value) || !("activity" in value)) {
    throw new Error("File không đúng định dạng sao lưu của app.");
  }
  const input = value as Record<string, unknown>;
  const result = snapshotSchema.safeParse({ ...input, settings: { ...DEFAULT_SETTINGS, ...(input.settings as object) } });
  if (!result.success) throw new Error("Dữ liệu học không hợp lệ. Kiểm tra lại file sao lưu.");
  return result.data;
}

export function emptySnapshot(): StudySnapshot { return snapshotSchema.parse({}); }

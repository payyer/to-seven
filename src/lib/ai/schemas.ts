import "server-only";

import * as z from "zod/v4";
import { RULE_IDS } from "@/lib/mistakes";

/** Schema Zod cho mọi phản hồi AI. Claude bị ràng buộc trả đúng các schema này (structured output). */

const Issue = z.object({
  rule: z.enum(RULE_IDS),
  wrong: z.string(),
  correction: z.string(),
  hintVi: z.string(),
  explanationVi: z.string(),
});

const Practice = z.object({ en: z.string(), vi: z.string() });

const Upgrade = z.object({ original: z.string(), better: z.string(), whyVi: z.string() });

export const SentenceFeedbackSchema = z.object({
  isCorrect: z.boolean(),
  usesTargetWord: z.boolean(),
  corrected: z.string(),
  issues: z.array(Issue),
  commentVi: z.string(),
  similar: Practice,
});

const PeerPart = z.object({ status: z.enum(["good", "weak", "missing"]), commentVi: z.string() });

export const SpeakingFeedbackSchema = z.object({
  peer: z.object({ point: PeerPart, explain: PeerPart, example: PeerPart, result: PeerPart }),
  issues: z.array(Issue),
  vocabUpgrades: z.array(Upgrade),
  recentWordIdeas: z.array(z.object({ word: z.string(), sentence: z.string() })),
  improvedAnswer: z.string(),
  commentVi: z.string(),
  practice: Practice,
});

export const WritingFeedbackSchema = z.object({
  issues: z.array(Issue),
  registerSuggestions: z.array(Upgrade),
  correctedText: z.string(),
  taskCommentVi: z.string(),
  commentVi: z.string(),
  practice: Practice,
});

export const WeeklyPlanSchema = z.object({
  summaryVi: z.string(),
  focusAreas: z.array(z.object({ titleVi: z.string(), whyVi: z.string(), actionVi: z.string() })),
  days: z.array(z.object({ dayVi: z.string(), tasksVi: z.array(z.string()) })),
  suggestedDailyNewWords: z.number(),
});

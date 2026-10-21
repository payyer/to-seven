import "server-only";

import { SPEAKING_FEEDBACK_PROMPT } from "@/lib/prompts";
import type { SpeakingFeedback } from "@/lib/types";
import { sanitizeIssues } from "@/lib/mistakes";
import { callStructured, tag } from "./client";
import { SpeakingFeedbackSchema } from "./schemas";

export interface SpeakingInput {
  question: string;
  answer: string;
  inputMode: "voice" | "text";
  recentWords: { word: string; vi: string }[];
}

export async function getSpeakingFeedback(input: SpeakingInput): Promise<SpeakingFeedback> {
  const words = input.recentWords.map((w) => `${w.word} (${w.vi})`).join(", ") || "(none)";
  const parsed = await callStructured({
    schema: SpeakingFeedbackSchema,
    system: SPEAKING_FEEDBACK_PROMPT,
    user: [
      `Input mode: ${input.inputMode}`,
      `Recently learned words: ${words}`,
      tag("question", input.question),
      tag("answer", input.answer),
    ].join("\n"),
    maxTokens: 6000,
  });
  // Chỉ giữ gợi ý dùng từ nằm trong danh sách từ đã học.
  const allowed = new Set(input.recentWords.map((w) => w.word.toLowerCase()));
  return {
    ...parsed,
    answer: input.answer,
    issues: sanitizeIssues(parsed.issues),
    recentWordIdeas: parsed.recentWordIdeas.filter((i) => allowed.has(i.word.toLowerCase())),
  };
}

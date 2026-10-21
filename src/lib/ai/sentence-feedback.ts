import "server-only";

import { SENTENCE_FEEDBACK_PROMPT } from "@/lib/prompts";
import type { SentenceFeedback } from "@/lib/types";
import { sanitizeIssues } from "@/lib/mistakes";
import { callStructured, tag } from "./client";
import { SentenceFeedbackSchema } from "./schemas";

export async function getSentenceFeedback(input: {
  word: string;
  meaningVi: string;
  sentence: string;
}): Promise<SentenceFeedback> {
  const parsed = await callStructured({
    schema: SentenceFeedbackSchema,
    system: SENTENCE_FEEDBACK_PROMPT,
    user: `Target word: ${input.word} (meaning: ${input.meaningVi})\n${tag("sentence", input.sentence)}`,
    maxTokens: 4000,
  });
  const issues = sanitizeIssues(parsed.issues);
  return { ...parsed, issues, original: input.sentence, isCorrect: parsed.isCorrect && issues.length === 0 };
}

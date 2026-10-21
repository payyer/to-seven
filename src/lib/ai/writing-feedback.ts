import "server-only";

import { WRITING_FEEDBACK_PROMPT } from "@/lib/prompts";
import type { WritingFeedback } from "@/lib/types";
import { sanitizeIssues } from "@/lib/mistakes";
import { callStructured, tag } from "./client";
import { WritingFeedbackSchema } from "./schemas";

export interface WritingInput {
  taskType: string;
  prompt: string;
  text: string;
}

export async function getWritingFeedback(input: WritingInput): Promise<WritingFeedback> {
  const parsed = await callStructured({
    schema: WritingFeedbackSchema,
    system: WRITING_FEEDBACK_PROMPT,
    user: [`Task type: ${input.taskType}`, tag("task", input.prompt), tag("text", input.text)].join("\n"),
    maxTokens: 10000,
  });
  return { ...parsed, text: input.text, issues: sanitizeIssues(parsed.issues) };
}

import { aiRoute, isMockMode, optionalString, requireString } from "@/lib/ai/guard";
import { mockWritingFeedback } from "@/lib/ai/mock";
import { getWritingFeedback } from "@/lib/ai/writing-feedback";

export const maxDuration = 90;

export const POST = aiRoute(async (body) => {
  const input = {
    taskType: optionalString(body, "taskType", 40) || "opinion",
    prompt: requireString(body, "prompt", "đề bài", 10, 800),
    text: requireString(body, "text", "bài viết", 20, 1500),
  };
  const feedback = isMockMode() ? mockWritingFeedback(input) : await getWritingFeedback(input);
  return { feedback };
});

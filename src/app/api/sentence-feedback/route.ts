import { aiRoute, isMockMode, optionalString, requireString } from "@/lib/ai/guard";
import { mockSentenceFeedback } from "@/lib/ai/mock";
import { getSentenceFeedback } from "@/lib/ai/sentence-feedback";

export const maxDuration = 60;

export const POST = aiRoute(async (body) => {
  const input = {
    word: requireString(body, "word", "từ cần luyện", 1, 60),
    meaningVi: optionalString(body, "meaningVi", 120),
    sentence: requireString(body, "sentence", "câu", 2, 300).replace(/\s+/g, " "),
  };
  const feedback = isMockMode() ? mockSentenceFeedback(input) : await getSentenceFeedback(input);
  return { feedback };
});

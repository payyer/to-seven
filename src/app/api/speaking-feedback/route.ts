import { aiRoute, isMockMode, requireString } from "@/lib/ai/guard";
import { mockSpeakingFeedback } from "@/lib/ai/mock";
import { getSpeakingFeedback } from "@/lib/ai/speaking-feedback";

export const maxDuration = 60;

export const POST = aiRoute(async (body) => {
  const recentWords = Array.isArray(body.recentWords)
    ? body.recentWords
        .filter((w): w is { word: string; vi: string } => typeof w?.word === "string" && typeof w?.vi === "string")
        .slice(0, 15)
        .map((w) => ({ word: w.word.slice(0, 40), vi: w.vi.slice(0, 80) }))
    : [];
  const input = {
    question: requireString(body, "question", "câu hỏi", 3, 200),
    answer: requireString(body, "answer", "câu trả lời", 2, 1200).replace(/\s+/g, " "),
    inputMode: body.inputMode === "voice" ? ("voice" as const) : ("text" as const),
    recentWords,
  };
  const feedback = isMockMode() ? mockSpeakingFeedback(input) : await getSpeakingFeedback(input);
  return { feedback };
});

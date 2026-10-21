import "server-only";

import { WEEKLY_PLAN_PROMPT } from "@/lib/prompts";
import type { WeeklyPlan } from "@/lib/types";
import { callStructured, tag } from "./client";
import { WeeklyPlanSchema } from "./schemas";

export async function getWeeklyPlan(input: { stats: unknown; previous: unknown; dailyNewWords: number }): Promise<WeeklyPlan> {
  const parsed = await callStructured({
    schema: WeeklyPlanSchema,
    system: WEEKLY_PLAN_PROMPT,
    user: [
      `Current setting: ${input.dailyNewWords} new words per day.`,
      tag("this_week", JSON.stringify(input.stats)),
      tag("previous_week", JSON.stringify(input.previous ?? null)),
    ].join("\n"),
    maxTokens: 6000,
  });
  return {
    ...parsed,
    suggestedDailyNewWords: Math.min(15, Math.max(5, Math.round(parsed.suggestedDailyNewWords))),
    days: parsed.days.slice(0, 7),
  };
}

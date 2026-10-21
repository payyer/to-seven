import { AiError } from "@/lib/ai/client";
import { aiRoute, isMockMode } from "@/lib/ai/guard";
import { mockWeeklyPlan } from "@/lib/ai/mock";
import { getWeeklyPlan } from "@/lib/ai/weekly-plan";

export const maxDuration = 60;

export const POST = aiRoute(async (body) => {
  if (!body.stats || typeof body.stats !== "object") throw new AiError("Thiếu số liệu tuần.", 400);
  // Số liệu do app tự tính; giới hạn kích thước để tránh gửi dữ liệu lạ lên AI.
  if (JSON.stringify(body).length > 6000) throw new AiError("Dữ liệu quá lớn.", 400);
  const dailyNewWords = typeof body.dailyNewWords === "number" ? body.dailyNewWords : 10;
  const plan = isMockMode()
    ? mockWeeklyPlan()
    : await getWeeklyPlan({ stats: body.stats, previous: body.previous, dailyNewWords });
  return { plan };
});

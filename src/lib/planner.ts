import { TOPICS } from "@/data/topics";
import { PRIORITY_WORD_IDS, WORD_BY_ID } from "@/data/words";
import { addDays } from "./date";
import type { CardState, DailyPlan, Level, Settings, Word } from "./types";
import { LEVELS } from "./types";

/**
 * Thứ tự ưu tiên level: đúng level trọng tâm → cao hơn 1 → thấp hơn 1 → các level còn lại.
 * Ví dụ trọng tâm B1: B1, B2, A2, A1.
 */
function levelRank(level: Level, focus: Level): number {
  const d = LEVELS.indexOf(level) - LEVELS.indexOf(focus);
  if (d === 0) return 0;
  if (d === 1) return 1;
  if (d === -1) return 2;
  return 3 + Math.abs(d);
}

function topicRank(settings: Settings): Map<string, number> {
  const preferred = settings.preferredTopics;
  const rest = TOPICS.map((t) => t.id).filter((id) => !preferred.includes(id));
  return new Map([...preferred, ...rest].map((id, i) => [id, i]));
}

/**
 * Chọn từ mới chưa học.
 * 1. Từ người học tự gửi (`priority`, theo đúng thứ tự gửi) luôn đi trước, bất kể level.
 * 2. Sau đó theo level ưu tiên, rồi theo chủ đề — mỗi ngày thường học trọn một nhóm chủ đề.
 */
export function pickNewWords(
  words: Word[],
  cards: Record<string, CardState>,
  exclude: Set<string>,
  count: number,
  settings: Settings,
  priority: string[] = PRIORITY_WORD_IDS,
): string[] {
  if (count <= 0) return [];
  const topics = topicRank(settings);
  const priorityRank = new Map(priority.map((id, i) => [id, i]));
  const rankOf = (id: string) => priorityRank.get(id) ?? Infinity;
  return words
    .map((w, index) => ({ w, index }))
    .filter(({ w }) => !cards[w.id] && !exclude.has(w.id))
    .sort(
      (a, b) =>
        (rankOf(a.w.id) === rankOf(b.w.id) ? 0 : rankOf(a.w.id) < rankOf(b.w.id) ? -1 : 1) ||
        levelRank(a.w.level, settings.focusLevel) - levelRank(b.w.level, settings.focusLevel) ||
        (topics.get(a.w.topic) ?? 99) - (topics.get(b.w.topic) ?? 99) ||
        a.index - b.index,
    )
    .slice(0, count)
    .map(({ w }) => w.id);
}

/**
 * Đảm bảo kế hoạch hôm nay có đúng số từ:
 * chỉ tiêu ngày + số từ học thêm + số từ người dùng báo "đã biết" (được bù bằng từ khác).
 */
export function syncPlan(
  plan: DailyPlan | null,
  today: string,
  words: Word[],
  cards: Record<string, CardState>,
  settings: Settings,
): DailyPlan {
  const base: DailyPlan = plan && plan.date === today ? plan : { date: today, wordIds: [], extra: 0 };
  const knownToday = base.wordIds.filter((id) => cards[id]?.known && cards[id].learnedAt === today).length;
  const target = settings.dailyNewWords + base.extra + knownToday;

  let wordIds = base.wordIds;
  if (wordIds.length < target) {
    const added = pickNewWords(words, cards, new Set(wordIds), target - wordIds.length, settings);
    wordIds = [...wordIds, ...added];
  } else if (wordIds.length > target) {
    // Bớt các từ chưa học ở cuối danh sách, không đụng tới từ đã học.
    const next = [...wordIds];
    for (let i = next.length - 1; i >= 0 && next.length > target; i--) {
      if (!cards[next[i]]) next.splice(i, 1);
    }
    wordIds = next;
  }

  if (base === plan && wordIds === plan.wordIds) return plan;
  return { ...base, wordIds };
}

export function samePlan(a: DailyPlan | null, b: DailyPlan | null): boolean {
  if (!a || !b) return a === b;
  return a.date === b.date && a.extra === b.extra && a.wordIds.join() === b.wordIds.join();
}

/** Từ học trong 14 ngày gần nhất (mới nhất trước), tối đa 15 từ — để nhắc dùng trong Speaking/Writing. */
export function recentWords(cards: Record<string, CardState>, today: string, days = 14, limit = 15): Word[] {
  const since = addDays(today, -(days - 1));
  return Object.values(cards)
    .filter((c) => !c.known && c.learnedAt >= since && WORD_BY_ID[c.wordId])
    .sort((a, b) => b.learnedAt.localeCompare(a.learnedAt))
    .slice(0, limit)
    .map((c) => WORD_BY_ID[c.wordId]);
}

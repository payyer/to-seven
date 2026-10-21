import { addDays, startOfWeek } from "./date";
import { isDue, isMastered } from "./srs";
import type { CardState, DayActivity } from "./types";

export function isActiveDay(day: DayActivity | undefined): boolean {
  if (!day) return false;
  const extra = (day.sentences ?? 0) + (day.dictations ?? 0) + (day.errorReviews ?? 0) + (day.speaking ?? 0) + (day.writing ?? 0) + (day.spelling ?? 0);
  return day.newWords + day.reviews + extra > 0;
}

/**
 * Chuỗi ngày học liên tiếp. Nếu hôm nay chưa học, chuỗi vẫn tính đến hôm qua
 * (chưa bị đứt cho tới khi hết ngày).
 */
export function computeStreak(activity: Record<string, DayActivity>, today: string): number {
  let day = isActiveDay(activity[today]) ? today : addDays(today, -1);
  let streak = 0;
  while (isActiveDay(activity[day])) {
    streak++;
    day = addDays(day, -1);
  }
  return streak;
}

export interface Overview {
  learned: number;
  mastered: number;
  dueToday: number;
  streak: number;
  studiedToday: boolean;
}

export function computeOverview(
  cards: Record<string, CardState>,
  activity: Record<string, DayActivity>,
  today: string,
): Overview {
  const list = Object.values(cards);
  return {
    learned: list.length,
    mastered: list.filter(isMastered).length,
    dueToday: list.filter((c) => isDue(c, today)).length,
    streak: computeStreak(activity, today),
    studiedToday: isActiveDay(activity[today]),
  };
}

export interface WeekPoint {
  weekStart: string;
  newWords: number;
  reviews: number;
  /** Tổng số từ đã thuộc tính đến cuối tuần (theo trạng thái hiện tại của thẻ). */
  masteredTotal: number;
}

export function computeWeekly(
  cards: Record<string, CardState>,
  activity: Record<string, DayActivity>,
  today: string,
  weeks = 8,
): WeekPoint[] {
  const currentWeek = startOfWeek(today);
  const mastered = Object.values(cards)
    .map((c) => c.masteredAt)
    .filter((d): d is string => !!d);

  return Array.from({ length: weeks }, (_, i) => {
    const weekStart = addDays(currentWeek, -7 * (weeks - 1 - i));
    const weekEnd = addDays(weekStart, 6);
    let newWords = 0;
    let reviews = 0;
    for (let d = 0; d < 7; d++) {
      const day = activity[addDays(weekStart, d)];
      if (day) {
        newWords += day.newWords;
        reviews += day.reviews;
      }
    }
    return {
      weekStart,
      newWords,
      reviews,
      masteredTotal: mastered.filter((m) => m <= weekEnd).length,
    };
  });
}

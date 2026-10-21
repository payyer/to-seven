import { addDays } from "./date";
import type { CardState, Grade } from "./types";

/**
 * Lịch ôn kiểu SM-2 rút gọn.
 * - 4 lần nhớ đầu tiên đi theo các bậc cố định 1 → 3 → 7 → 14 ngày.
 * - Sau bậc 14 ngày, khoảng cách nhân với hệ số dễ (ease) như SM-2.
 * - Quên: về lại bậc đầu (1 ngày), giảm ease.
 * - Khó: không lên bậc, khoảng cách tăng ít (nửa đường tới bậc kế), giảm nhẹ ease.
 * - Dễ: nhảy 2 bậc, tăng ease.
 */
export const STEPS = [1, 3, 7, 14];
export const MASTERED_INTERVAL = 14;
const START_EASE = 2.5;
const MIN_EASE = 1.3;

export const GRADE_LABEL: Record<Grade, string> = {
  again: "Quên",
  hard: "Khó",
  good: "Nhớ",
  easy: "Dễ",
};

export const GRADES: Grade[] = ["again", "hard", "good", "easy"];

export function newCard(wordId: string, today: string): CardState {
  return {
    wordId,
    reps: 0,
    ease: START_EASE,
    interval: 1,
    due: addDays(today, 1),
    lapses: 0,
    learnedAt: today,
  };
}

/** Từ người dùng đã biết sẵn: xếp thẳng vào bậc 14 ngày để kiểm tra lại sau. */
export function knownCard(wordId: string, today: string): CardState {
  return {
    wordId,
    reps: STEPS.length - 1,
    ease: START_EASE,
    interval: MASTERED_INTERVAL,
    due: addDays(today, MASTERED_INTERVAL),
    lapses: 0,
    learnedAt: today,
    masteredAt: today,
    known: true,
  };
}

function intervalForReps(card: CardState, reps: number, multiplier: number): number {
  if (reps < STEPS.length) return STEPS[reps];
  return Math.max(card.interval + 1, Math.round(card.interval * multiplier));
}

function nextValues(card: CardState, grade: Grade) {
  switch (grade) {
    case "again":
      return {
        reps: 0,
        interval: STEPS[0],
        ease: Math.max(MIN_EASE, card.ease - 0.2),
        lapses: card.lapses + 1,
      };
    case "hard":
      // Không lên bậc; khoảng cách nằm giữa bậc hiện tại và bậc kế (1→2, 3→5, 7→10), sau đó ×1.2.
      return {
        reps: card.reps,
        interval:
          card.reps + 1 < STEPS.length
            ? Math.floor((STEPS[card.reps] + STEPS[card.reps + 1]) / 2)
            : intervalForReps(card, STEPS.length, 1.2),
        ease: Math.max(MIN_EASE, card.ease - 0.15),
        lapses: card.lapses,
      };
    case "good": {
      const reps = card.reps + 1;
      return { reps, interval: intervalForReps(card, reps, card.ease), ease: card.ease, lapses: card.lapses };
    }
    case "easy": {
      const reps = card.reps + 2;
      return {
        reps,
        interval: intervalForReps(card, reps, card.ease * 1.3),
        ease: card.ease + 0.15,
        lapses: card.lapses,
      };
    }
  }
}

/** Số ngày đến lần ôn kế tiếp nếu chấm `grade` — để hiển thị trên nút. */
export function previewInterval(card: CardState, grade: Grade): number {
  return nextValues(card, grade).interval;
}

export function schedule(card: CardState, grade: Grade, today: string): CardState {
  const next = nextValues(card, grade);
  const mastered = next.interval >= MASTERED_INTERVAL;
  return {
    ...card,
    ...next,
    due: addDays(today, next.interval),
    lastReviewedAt: today,
    masteredAt: mastered ? (card.masteredAt ?? today) : undefined,
  };
}

export function isMastered(card: CardState): boolean {
  return card.interval >= MASTERED_INTERVAL;
}

export function isDue(card: CardState, today: string): boolean {
  return card.due <= today;
}

export function formatInterval(days: number): string {
  if (days < 30) return `${days} ngày`;
  const months = Math.round(days / 30);
  return `~${months} tháng`;
}

import { checkAnswer } from "./text";
import type { CardState, Word } from "./types";

/** Gõ đúng ngay lần đầu bấy nhiêu lần liên tiếp thì coi như đã sửa được lỗi chính tả. */
export const SPELL_FIXED_STREAK = 3;

/** Luyện chính tả chấm chặt: chỉ đúng từng chữ cái mới tính (cho phép cách viết Anh-Mỹ / đồng nghĩa đã khai báo). */
export function isSpelledRight(input: string, word: Word): boolean {
  return checkAnswer(input, word.word, word.altSpellings) === "correct";
}

/** Ghi kết quả lần gõ đầu tiên của một từ. */
export function recordSpell(card: CardState, ok: boolean, today: string): CardState {
  if (ok) return { ...card, spellStreak: (card.spellStreak ?? 0) + 1 };
  return { ...card, misspells: (card.misspells ?? 0) + 1, spellStreak: 0, lastMisspelledAt: today };
}

/** Từ đã từng gõ sai và chưa gõ đúng đủ 3 lần liên tiếp. */
export function isWeakSpelling(card: CardState): boolean {
  return (card.misspells ?? 0) > 0 && (card.spellStreak ?? 0) < SPELL_FIXED_STREAK;
}

/** Từ đã từng sai nhưng nay gõ đúng ổn định. */
export function isFixedSpelling(card: CardState): boolean {
  return (card.misspells ?? 0) > 0 && (card.spellStreak ?? 0) >= SPELL_FIXED_STREAK;
}

/** Từ hay viết sai: chuỗi đúng ngắn nhất trước, rồi sai nhiều nhất, rồi sai gần đây nhất. */
export function weakSpellingCards(cards: Record<string, CardState>): CardState[] {
  return Object.values(cards)
    .filter(isWeakSpelling)
    .sort(
      (a, b) =>
        (a.spellStreak ?? 0) - (b.spellStreak ?? 0) ||
        (b.misspells ?? 0) - (a.misspells ?? 0) ||
        (b.lastMisspelledAt ?? "").localeCompare(a.lastMisspelledAt ?? ""),
    );
}

/**
 * Lượt luyện chính tả: từ hay sai trước, phần còn lại lấy từ đã học (không tính từ "đã biết"),
 * ưu tiên từ ít được gõ đúng nhất và học gần đây nhất.
 */
export function buildSpellingDrill(cards: Record<string, CardState>, count: number): string[] {
  const weak = weakSpellingCards(cards).map((c) => c.wordId);
  const rest = Object.values(cards)
    .filter((c) => !c.known && !weak.includes(c.wordId))
    .sort((a, b) => (a.spellStreak ?? 0) - (b.spellStreak ?? 0) || b.learnedAt.localeCompare(a.learnedAt))
    .map((c) => c.wordId);
  return [...weak, ...rest].slice(0, count);
}

export function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** "_ _ _ _" theo số chữ cái, giữ dấu cách / gạch nối / dấu nháy. */
export function letterPattern(word: string, revealFirst = false): string {
  return word
    .replace(/[a-z]/gi, (ch, i: number) => (revealFirst && i === 0 ? ch : "_"))
    .split("")
    .join(" ");
}

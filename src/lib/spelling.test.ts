import { describe, expect, it } from "vitest";
import { WORD_BY_ID } from "@/data/words";
import {
  buildSpellingDrill,
  isFixedSpelling,
  isSpelledRight,
  isWeakSpelling,
  letterPattern,
  recordSpell,
  weakSpellingCards,
} from "./spelling";
import { newCard, schedule } from "./srs";
import type { CardState } from "./types";

const T = "2026-10-21";

describe("chấm chính tả", () => {
  it("chỉ đúng từng chữ cái mới tính, gần đúng vẫn là sai", () => {
    const w = WORD_BY_ID.colleague;
    expect(isSpelledRight(" Colleague ", w)).toBe(true);
    expect(isSpelledRight("colleage", w)).toBe(false);
  });

  it("chấp nhận cách viết khác đã khai báo", () => {
    expect(isSpelledRight("neighbor", WORD_BY_ID.neighbour)).toBe(true);
    expect(isSpelledRight("coupon", WORD_BY_ID.voucher)).toBe(true);
  });

  it("mẫu chữ cái giữ dấu cách, gạch nối, dấu nháy", () => {
    expect(letterPattern("take off")).toBe("_ _ _ _   _ _ _");
    expect(letterPattern("must-see")).toBe("_ _ _ _ - _ _ _");
    expect(letterPattern("Easter", true)).toBe("E _ _ _ _ _");
  });
});

describe("theo dõi lỗi chính tả", () => {
  it("sai thì tăng số lần sai và về 0 chuỗi đúng; đúng 3 lần liên tiếp thì coi như đã sửa", () => {
    let card = recordSpell(newCard("colleague", T), false, T);
    expect(card).toMatchObject({ misspells: 1, spellStreak: 0, lastMisspelledAt: T });
    expect(isWeakSpelling(card)).toBe(true);
    card = recordSpell(recordSpell(card, true, T), true, T);
    expect(isWeakSpelling(card)).toBe(true);
    card = recordSpell(card, true, T);
    expect(isWeakSpelling(card)).toBe(false);
    expect(isFixedSpelling(card)).toBe(true);
    card = recordSpell(card, false, "2026-10-22");
    expect(card).toMatchObject({ misspells: 2, spellStreak: 0, lastMisspelledAt: "2026-10-22" });
  });

  it("từ chưa sai bao giờ không nằm trong danh sách hay sai", () => {
    const card = recordSpell(newCard("salary", T), true, T);
    expect(isWeakSpelling(card)).toBe(false);
    expect(isFixedSpelling(card)).toBe(false);
  });

  it("lịch ôn giữ nguyên dữ liệu chính tả", () => {
    const card = recordSpell(newCard("colleague", T), false, T);
    expect(schedule(card, "good", "2026-10-22")).toMatchObject({ misspells: 1, spellStreak: 0 });
  });

  it("lượt luyện: từ hay sai trước (chuỗi đúng ngắn, sai nhiều), rồi tới từ đã học, bỏ từ 'đã biết'", () => {
    const cards: Record<string, CardState> = {
      a: { ...newCard("a", "2026-10-01"), misspells: 1, spellStreak: 2 },
      b: { ...newCard("b", "2026-10-02"), misspells: 3, spellStreak: 0 },
      c: { ...newCard("c", "2026-10-03"), misspells: 1, spellStreak: 0 },
      d: { ...newCard("d", "2026-10-10") },
      e: { ...newCard("e", "2026-10-05"), spellStreak: 4 },
      f: { ...newCard("f", "2026-10-20"), known: true },
    };
    expect(weakSpellingCards(cards).map((c) => c.wordId)).toEqual(["b", "c", "a"]);
    expect(buildSpellingDrill(cards, 10)).toEqual(["b", "c", "a", "d", "e"]);
    expect(buildSpellingDrill(cards, 2)).toEqual(["b", "c"]);
  });
});

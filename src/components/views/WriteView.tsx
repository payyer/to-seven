"use client";

import { useState } from "react";
import { WORD_BY_ID } from "@/data/words";
import { formatShort } from "@/lib/date";
import { useAppState } from "@/lib/store";
import type { CardState } from "@/lib/types";
import { Icon } from "../Icon";
import { SentencePractice } from "../SentencePractice";
import { Button, ButtonLink, Card, Loading, PageHeader } from "../ui";

/** Ưu tiên từ mới học gần đây và từ chưa vững (reps thấp). */
function suggestWord(cards: CardState[], exclude?: string): string | null {
  const pool = cards
    .filter((c) => !c.known && WORD_BY_ID[c.wordId] && c.wordId !== exclude)
    .sort((a, b) => a.reps - b.reps || b.learnedAt.localeCompare(a.learnedAt))
    .slice(0, 12);
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)].wordId;
}

export function WriteView() {
  const state = useAppState();
  const [wordId, setWordId] = useState<string | null>(null);

  if (!state) return <Loading />;
  const learned = Object.values(state.cards).filter((c) => !c.known && WORD_BY_ID[c.wordId]);

  if (learned.length === 0) {
    return (
      <div>
        <PageHeader title="Đặt câu" />
        <Card className="text-center">
          <p className="text-ink-2">Bạn chưa học từ nào. Học vài từ mới rồi quay lại luyện đặt câu nhé.</p>
          <div className="mt-4">
            <ButtonLink href="/learn">Học từ mới</ButtonLink>
          </div>
        </Card>
      </div>
    );
  }

  // Chọn từ lần đầu trong handler/khởi tạo, không trong render (Math.random).
  const currentId = wordId && WORD_BY_ID[wordId] ? wordId : learned[0].wordId;
  const word = WORD_BY_ID[currentId];
  const history = state.sentences.slice(-8).reverse();

  return (
    <div className="space-y-4">
      <PageHeader title="Đặt câu" subtitle="Chọn một từ đã học và viết một câu về chính bạn.">
        <Button variant="secondary" onClick={() => setWordId(suggestWord(learned, currentId))}>
          <Icon name="repeat" /> Đổi từ khác
        </Button>
      </PageHeader>

      <Card>
        <label className="mb-4 flex flex-wrap items-center gap-2 text-sm text-ink-2">
          Từ:
          <select
            value={currentId}
            onChange={(e) => setWordId(e.target.value)}
            className="rounded-lg border border-line bg-surface px-3 py-1.5 font-semibold text-ink outline-none focus:border-accent"
          >
            {learned
              .map((c) => WORD_BY_ID[c.wordId])
              .sort((a, b) => a.word.localeCompare(b.word))
              .map((w) => (
                <option key={w.id} value={w.id}>
                  {w.word} — {w.vi}
                </option>
              ))}
          </select>
        </label>
        <SentencePractice key={word.id} word={word} />
      </Card>

      {history.length > 0 && (
        <div>
          <h2 className="mb-2 text-xs font-semibold tracking-wide text-ink-3 uppercase">Câu gần đây</h2>
          <ul className="space-y-2">
            {history.map((s) => (
              <li key={s.id} className="rounded-xl border border-line bg-surface px-4 py-3 text-sm">
                <div className="flex items-center justify-between gap-2 text-xs text-ink-3">
                  <span>
                    <strong className="text-ink-2">{s.targetWord}</strong> · {formatShort(s.createdAt)}
                  </span>
                  <span className={s.feedback.isCorrect ? "text-good" : "text-warn"}>
                    {s.feedback.isCorrect ? "Đúng" : `${s.feedback.issues.length} lỗi`}
                  </span>
                </div>
                <p className="mt-1">{s.feedback.isCorrect ? s.feedback.original : s.feedback.corrected}</p>
                {!s.feedback.isCorrect && <p className="text-ink-3 line-through">{s.feedback.original}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

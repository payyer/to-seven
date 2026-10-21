"use client";

import { useState } from "react";
import { WORD_BY_ID } from "@/data/words";
import { formatShort } from "@/lib/date";
import { buildSpellingDrill, isFixedSpelling, SPELL_FIXED_STREAK, weakSpellingCards } from "@/lib/spelling";
import { useAppState } from "@/lib/store";
import { Icon } from "../Icon";
import { SpeakWord } from "../Pronounce";
import { SpellQuiz } from "../Spelling";
import { Button, ButtonLink, Card, Loading, PageHeader } from "../ui";

const DRILL_SIZE = 10;

type Mode = "listen" | "meaning";
const MODE_LABEL: Record<Mode, string> = { listen: "Nghe – gõ", meaning: "Nhìn nghĩa – gõ" };

export function SpellingView() {
  const state = useAppState();
  const [mode, setMode] = useState<Mode>("listen");
  const [session, setSession] = useState<{ ids: string[]; mode: Mode; n: number } | null>(null);

  if (!state) return <Loading />;
  const { cards, settings } = state;

  if (session) {
    return (
      <div>
        <PageHeader title="Luyện chính tả" subtitle={MODE_LABEL[session.mode]} />
        <SpellQuiz
          key={session.n}
          words={session.ids.map((id) => WORD_BY_ID[id])}
          mode={session.mode}
          preferReal={settings.preferRealAudio}
          exitLabel="Về trang chính tả"
          onExit={() => setSession(null)}
        />
      </div>
    );
  }

  const weak = weakSpellingCards(cards).filter((c) => WORD_BY_ID[c.wordId]);
  const fixed = Object.values(cards).filter((c) => isFixedSpelling(c) && WORD_BY_ID[c.wordId]);
  const learned = Object.values(cards).filter((c) => !c.known).length;
  const drill = buildSpellingDrill(cards, DRILL_SIZE).filter((id) => WORD_BY_ID[id]);

  return (
    <div>
      <PageHeader
        title="Luyện chính tả"
        subtitle={`Nghe hoặc nhìn nghĩa rồi gõ lại từ. Từ hay viết sai được hỏi trước; gõ đúng ngay ${SPELL_FIXED_STREAK} lần liên tiếp thì coi như đã sửa xong.`}
      />

      <dl className="mb-4 grid grid-cols-3 gap-2">
        {[
          { label: "Hay viết sai", value: weak.length, tone: weak.length ? "text-bad" : "" },
          { label: "Đã sửa được", value: fixed.length, tone: fixed.length ? "text-good" : "" },
          { label: "Từ đã học", value: learned, tone: "" },
        ].map((t) => (
          <div key={t.label} className="rounded-2xl border border-line bg-surface px-3 py-3">
            <dt className="text-xs text-ink-3">{t.label}</dt>
            <dd className={`tabular text-2xl font-bold ${t.tone}`}>{t.value}</dd>
          </div>
        ))}
      </dl>

      {drill.length === 0 ? (
        <Card className="text-center">
          <p className="text-sm text-ink-2">Chưa có từ nào để luyện. Học vài từ mới trước đã.</p>
          <div className="mt-4">
            <ButtonLink href="/learn">Học từ mới</ButtonLink>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="mb-3 text-sm font-medium">Cách luyện</div>
          <div className="mb-4 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Cách luyện">
            {(Object.keys(MODE_LABEL) as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={mode === m}
                onClick={() => setMode(m)}
                className={`rounded-xl border px-3 py-2.5 text-left text-sm ${
                  mode === m ? "border-accent bg-accent-soft font-semibold text-accent-strong" : "border-line hover:bg-surface-2"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Icon name={m === "listen" ? "headphones" : "book"} /> {MODE_LABEL[m]}
                </span>
                <span className="mt-0.5 block text-xs font-normal text-ink-3">
                  {m === "listen" ? "Nghe phát âm, gõ lại từ" : "Đọc nghĩa tiếng Việt, gõ từ"}
                </span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-2">
              {drill.length} từ
              {weak.length > 0 ? `, gồm ${Math.min(weak.length, drill.length)} từ hay viết sai` : ""}.
            </p>
            <Button onClick={() => setSession({ ids: drill, mode, n: Date.now() })} autoFocus>
              Bắt đầu <Icon name="arrowRight" />
            </Button>
          </div>
        </Card>
      )}

      <h2 className="mt-6 mb-2 text-xs font-semibold tracking-wide text-ink-3 uppercase">Từ hay viết sai</h2>
      {weak.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line px-4 py-6 text-center text-sm text-ink-3">
          Chưa có từ nào. Khi bạn gõ sai lúc ôn tập hoặc kiểm tra chính tả, từ đó sẽ hiện ở đây.
        </p>
      ) : (
        <ul className="space-y-2">
          {weak.map((c) => (
            <SpellRow key={c.wordId} wordId={c.wordId} misspells={c.misspells ?? 0} streak={c.spellStreak ?? 0} last={c.lastMisspelledAt} />
          ))}
        </ul>
      )}

      {fixed.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-ink-2">Đã sửa được ({fixed.length} từ)</summary>
          <ul className="mt-2 space-y-2">
            {fixed.map((c) => (
              <SpellRow key={c.wordId} wordId={c.wordId} misspells={c.misspells ?? 0} streak={c.spellStreak ?? 0} last={c.lastMisspelledAt} />
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function SpellRow({ wordId, misspells, streak, last }: { wordId: string; misspells: number; streak: number; last?: string }) {
  const word = WORD_BY_ID[wordId];
  const done = Math.min(streak, SPELL_FIXED_STREAK);
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="font-semibold">{word.word}</div>
        <div className="truncate text-sm text-ink-2">{word.vi}</div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-3">
          <span className="text-bad">Sai {misspells} lần</span>
          {last && <span>gần nhất {formatShort(last)}</span>}
          <span className="flex items-center gap-1" aria-label={`Đúng liên tiếp ${done}/${SPELL_FIXED_STREAK}`}>
            {Array.from({ length: SPELL_FIXED_STREAK }, (_, i) => (
              <span key={i} className={`h-2 w-2 rounded-full ${i < done ? "bg-good" : "bg-line"}`} />
            ))}
          </span>
        </div>
      </div>
      <SpeakWord word={word.word} size="sm" />
    </li>
  );
}

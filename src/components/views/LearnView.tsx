"use client";

import { useEffect, useState } from "react";
import { WORD_BY_ID } from "@/data/words";
import { isDue } from "@/lib/srs";
import { playWord } from "@/lib/speech";
import { learnMore, learnWord, markKnown, useAppState } from "@/lib/store";
import type { Word } from "@/lib/types";
import { Icon } from "../Icon";
import { SpeakWord, StressHint, StressWord } from "../Pronounce";
import { Button, ButtonLink, Card, Kbd, Loading, PageHeader, ProgressBar } from "../ui";
import { SentencePractice } from "../SentencePractice";
import { Usage, WordMeta } from "../WordBits";

const FACES = ["Nghĩa", "Cách đọc", "Cách dùng", "Đặt câu"] as const;

export function LearnView() {
  const state = useAppState();
  if (!state) return <Loading />;

  const { plan, cards, settings, today } = state;
  const goal = settings.dailyNewWords + plan.extra;
  const learned = plan.wordIds.filter((id) => cards[id] && !cards[id].known);
  const currentId = plan.wordIds.find((id) => !cards[id]);
  const due = Object.values(cards).filter((c) => isDue(c, today)).length;

  return (
    <div>
      <PageHeader title="Học từ mới" subtitle={`Mỗi từ: nghĩa → cách đọc → cách dùng → tự đặt câu. Chỉ tiêu hôm nay: ${goal} từ.`} />

      <div className="mb-4 flex items-center gap-3">
        <ProgressBar value={learned.length} max={goal} label="Tiến độ học hôm nay" />
        <span className="tabular shrink-0 text-sm font-medium text-ink-2">
          {learned.length}/{goal}
        </span>
      </div>

      {currentId ? (
        <LearnCard key={currentId} word={WORD_BY_ID[currentId]} preferReal={settings.preferRealAudio} />
      ) : (
        <DoneCard learnedIds={learned} due={due} bankEmpty={plan.wordIds.length < goal} />
      )}

      {plan.wordIds.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-xs font-semibold tracking-wide text-ink-3 uppercase">Từ của hôm nay</h2>
          <ul className="flex flex-wrap gap-1.5">
            {plan.wordIds.map((id) => {
              const card = cards[id];
              const status = !card ? (id === currentId ? "current" : "todo") : card.known ? "known" : "done";
              const styles = {
                current: "border-accent bg-accent-soft text-accent-strong font-semibold",
                todo: "border-line text-ink-3",
                done: "border-good/30 bg-good-soft text-good",
                known: "border-line bg-surface-2 text-ink-3 line-through",
              };
              return (
                <li
                  key={id}
                  className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-sm ${styles[status]}`}
                  title={status === "known" ? "Đã biết – hẹn kiểm tra sau 14 ngày" : undefined}
                >
                  {status === "done" && <Icon name="check" className="h-3 w-3" />}
                  {status === "todo" ? "•••" : WORD_BY_ID[id]?.word}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function LearnCard({ word, preferReal }: { word: Word; preferReal: boolean }) {
  const [face, setFace] = useState(0);
  const isLast = face === FACES.length - 1;

  const goTo = (next: number) => {
    setFace(next);
    if (next === 1) void playWord(word.word, { preferReal });
  };

  const advance = () => (isLast ? learnWord(word.id) : goTo(face + 1));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (target?.closest("input, textarea, select")) return;
      // Enter/Space trên nút đang focus đã tự kích hoạt nút đó.
      const onControl = !!target?.closest("button, a");
      if (e.key === "ArrowRight" || (!onControl && (e.key === "Enter" || e.key === " "))) {
        e.preventDefault();
        if (face === FACES.length - 1) learnWord(word.id);
        else {
          setFace(face + 1);
          if (face + 1 === 1) void playWord(word.word, { preferReal });
        }
      } else if (e.key === "ArrowLeft" && face > 0) {
        setFace(face - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [face, word, preferReal]);

  return (
    <Card flush>
      <div className="flex border-b border-line" role="tablist" aria-label="Các mặt của thẻ">
        {FACES.map((label, i) => (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={face === i}
            onClick={() => goTo(i)}
            className={`flex-1 border-b-2 px-1 py-3 text-xs whitespace-nowrap sm:text-sm ${
              face === i ? "border-accent font-semibold text-accent-strong" : "border-transparent text-ink-3 hover:text-ink"
            }`}
          >
            <span className="tabular mr-1 text-xs">{i + 1}.</span>
            {label}
          </button>
        ))}
      </div>

      <div className="min-h-75 p-5 sm:p-7" role="tabpanel">
        {face === 0 && (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <WordMeta word={word} />
            <div className="text-4xl font-bold tracking-tight sm:text-5xl">{word.word}</div>
            <div className="ipa text-ink-3">{word.ipa}</div>
            <div className="mt-2 rounded-2xl bg-surface-2 px-6 py-4">
              <div className="text-xs text-ink-3">Nghĩa</div>
              <div className="text-2xl font-semibold">{word.vi}</div>
            </div>
            <SpeakWord word={word.word} />
          </div>
        )}

        {face === 1 && (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <StressWord stress={word.stress} />
            <div className="ipa text-xl text-ink-2">{word.ipa}</div>
            <p className="text-sm text-ink-2">
              <StressHint stress={word.stress} />
            </p>
            <SpeakWord word={word.word} />
            <p className="mt-2 max-w-sm rounded-xl bg-warn-soft px-4 py-2.5 text-sm text-warn">
              Nghe rồi đọc to theo 3 lần. Đọc to, dài và cao giọng hơn ở âm tiết in đậm, các âm tiết còn lại đọc lướt nhẹ.
            </p>
          </div>
        )}

        {face === 2 && (
          <div className="space-y-5">
            <div className="flex items-baseline justify-between gap-3">
              <div className="text-2xl font-bold">{word.word}</div>
              <div className="text-sm text-ink-2">{word.vi}</div>
            </div>
            <Usage word={word} />
          </div>
        )}

        {face === 3 && (
          <div className="space-y-4">
            <div className="flex items-baseline justify-between gap-3">
              <div className="text-2xl font-bold">{word.word}</div>
              <div className="text-sm text-ink-2">{word.vi}</div>
            </div>
            <SentencePractice word={word} />
          </div>
        )}
      </div>

      {isLast && (
        <p className="border-t border-line px-5 pt-3 text-xs text-ink-3">
          Viết xong hoặc muốn bỏ qua bước này thì bấm “Đã học xong từ này”. Lỗi AI chỉ ra được lưu vào Sổ lỗi sai.
        </p>
      )}

      <div className={`flex flex-wrap items-center justify-between gap-3 p-4 ${isLast ? "" : "border-t border-line"}`}>
        <Button variant="ghost" onClick={() => markKnown(word.id)} title="Bỏ qua từ này, app sẽ hỏi lại sau 14 ngày">
          Tôi đã biết từ này
        </Button>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <span className="hidden text-xs text-ink-3 sm:inline">
            <Kbd>←</Kbd> <Kbd>→</Kbd>
          </span>
          {face > 0 && (
            <Button variant="secondary" onClick={() => setFace(face - 1)}>
              Quay lại
            </Button>
          )}
          <Button onClick={advance}>
            {isLast ? (
              <>
                <Icon name="check" /> Đã học xong từ này
              </>
            ) : (
              <>
                {FACES[face + 1]} <Icon name="arrowRight" />
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function DoneCard({ learnedIds, due, bankEmpty }: { learnedIds: string[]; due: number; bankEmpty: boolean }) {
  return (
    <Card className="text-center">
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-good-soft text-good">
        <Icon name="check" className="h-6 w-6" />
      </div>
      <h2 className="text-xl font-bold">
        {bankEmpty ? "Bạn đã học hết kho từ hiện có!" : "Xong chỉ tiêu hôm nay!"}
      </h2>
      <p className="mt-1 text-sm text-ink-2">
        {learnedIds.length > 0
          ? `Hôm nay bạn đã học ${learnedIds.length} từ. Lần ôn đầu tiên là ngày mai, bạn sẽ phải tự gõ lại từ.`
          : "Hôm nay chưa có từ mới nào."}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {due > 0 && <ButtonLink href="/review">Ôn tập {due} thẻ</ButtonLink>}
        {!bankEmpty && (
          <Button variant={due > 0 ? "secondary" : "primary"} onClick={() => learnMore(5)}>
            Học thêm 5 từ
          </Button>
        )}
        <ButtonLink href="/" variant="secondary">
          Về tổng quan
        </ButtonLink>
      </div>
      {learnedIds.length > 0 && (
        <ul className="mt-6 grid gap-1.5 text-left sm:grid-cols-2">
          {learnedIds.map((id) => (
            <li key={id} className="flex justify-between gap-2 rounded-lg bg-surface-2 px-3 py-1.5 text-sm">
              <span className="font-medium">{WORD_BY_ID[id].word}</span>
              <span className="truncate text-ink-2">{WORD_BY_ID[id].vi}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

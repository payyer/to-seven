"use client";

import { useState, type FormEvent } from "react";
import { diffAccuracy, findFragment, wordDiff } from "@/lib/text";
import type { SentenceFeedback } from "@/lib/types";
import { DiffText } from "./DiffText";
import { Icon } from "./Icon";
import { SpeakText } from "./Pronounce";
import { TryFirstFix } from "./TryFirstFix";
import { Button } from "./ui";

/** Câu gốc với các đoạn sai được gạch chân đỏ. */
export function MarkedSentence({ sentence, fragments }: { sentence: string; fragments: string[] }) {
  const ranges: [number, number][] = [];
  for (const f of fragments) {
    const start = findFragment(sentence, f);
    if (start >= 0 && !ranges.some(([a, b]) => start < b && start + f.length > a)) ranges.push([start, start + f.length]);
  }
  ranges.sort((a, b) => a[0] - b[0]);
  const parts: { text: string; marked: boolean }[] = [];
  let pos = 0;
  for (const [a, b] of ranges) {
    if (a > pos) parts.push({ text: sentence.slice(pos, a), marked: false });
    parts.push({ text: sentence.slice(a, b), marked: true });
    pos = b;
  }
  if (pos < sentence.length) parts.push({ text: sentence.slice(pos), marked: false });
  return (
    <>
      {parts.map((p, i) =>
        p.marked ? (
          <mark key={i} className="rounded bg-bad-soft px-0.5 text-bad underline decoration-wavy decoration-1 underline-offset-4">
            {p.text}
          </mark>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  );
}

/** Luyện lại: dịch câu tương tự sang tiếng Anh, so với câu mẫu. Câu mẫu chỉ hiện sau khi thử. */
export function PracticeSentence({ practice }: { practice: { en: string; vi: string } }) {
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const ops = checked ? wordDiff(practice.en, answer) : [];

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (answer.trim()) setChecked(true);
  };

  return (
    <div className="rounded-xl bg-surface-2 p-4">
      <h3 className="text-xs font-semibold tracking-wide text-ink-3 uppercase">Luyện lại với câu tương tự</h3>
      <p className="mt-1.5 text-sm">
        Dịch sang tiếng Anh: <strong className="text-ink">“{practice.vi}”</strong>
      </p>
      <form onSubmit={submit} className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          value={answer}
          onChange={(e) => {
            setAnswer(e.target.value);
            setChecked(false);
          }}
          placeholder="Gõ câu tiếng Anh…"
          aria-label="Câu dịch của bạn"
          autoComplete="off"
          spellCheck={false}
          className="flex-1 rounded-lg border border-line bg-surface px-3 py-2 outline-none focus:border-accent focus:ring-2 focus:ring-accent/25"
        />
        <div className="flex gap-2">
          <Button type="submit" variant="secondary" disabled={!answer.trim()} className="flex-1 sm:flex-none">
            So sánh
          </Button>
          <Button variant="ghost" onClick={() => setChecked(true)} className="flex-1 sm:flex-none">
            Xem câu mẫu
          </Button>
        </div>
      </form>
      {checked && (
        <div className="mt-3 space-y-1.5 text-sm">
          {answer.trim() && (
            <>
              <DiffText ops={ops} />
              <p className="tabular text-xs text-ink-3">
                Khớp {Math.round(diffAccuracy(ops) * 100)}% với câu mẫu — câu của bạn có thể vẫn đúng nếu diễn đạt khác.
              </p>
            </>
          )}
          <div className="flex items-center gap-1">
            <span className="text-ink-2">Câu mẫu:</span> <strong>{practice.en}</strong>
            <SpeakText text={practice.en} />
          </div>
        </div>
      )}
    </div>
  );
}

export function SentenceFeedbackView({ feedback, targetWord }: { feedback: SentenceFeedback; targetWord: string }) {
  const notEnglish = !feedback.corrected;
  const [done, setDone] = useState(feedback.issues.length === 0);

  return (
    <div className="space-y-4">
      <div
        className={`flex items-center gap-2 rounded-xl px-4 py-3 font-semibold ${
          feedback.isCorrect ? "bg-good-soft text-good" : "bg-warn-soft text-warn"
        }`}
        role="status"
      >
        <Icon name={feedback.isCorrect ? "check" : "bulb"} />
        {notEnglish
          ? "Chưa chấm được câu này"
          : feedback.isCorrect
            ? "Câu đúng rồi!"
            : `Có ${feedback.issues.length} chỗ cần sửa — thử tự sửa trước nhé`}
      </div>

      {feedback.commentVi && (
        <p className="rounded-xl bg-accent-soft px-4 py-3 text-sm text-accent-strong">{feedback.commentVi}</p>
      )}

      {!notEnglish && !feedback.usesTargetWord && (
        <p className="rounded-xl border border-warn/40 px-4 py-2 text-sm text-warn">
          Câu chưa dùng từ <strong>{targetWord}</strong> (hoặc dùng chưa đúng nghĩa). Hãy thử viết lại có từ này.
        </p>
      )}

      {!notEnglish && feedback.issues.length > 0 && (
        <TryFirstFix text={feedback.original} issues={feedback.issues} onComplete={() => setDone(true)} />
      )}

      {!notEnglish && done && (
        <>
          <div>
            <h3 className="mb-1 text-xs font-semibold tracking-wide text-ink-3 uppercase">
              {feedback.isCorrect ? "Câu của bạn" : "Câu đúng"}
            </h3>
            <div className="flex items-start gap-2">
              {feedback.isCorrect ? (
                <p className="flex-1 text-lg leading-relaxed">{feedback.corrected}</p>
              ) : (
                <DiffText ops={wordDiff(feedback.corrected, feedback.original, true)} className="flex-1 text-lg" />
              )}
              <SpeakText text={feedback.corrected} />
            </div>
          </div>
          {feedback.similar.en && <PracticeSentence key={feedback.similar.en} practice={feedback.similar} />}
        </>
      )}
    </div>
  );
}

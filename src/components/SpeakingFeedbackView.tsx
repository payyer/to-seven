"use client";

import { useState } from "react";
import type { PeerStatus, SpeakingFeedback } from "@/lib/types";
import { countWords } from "@/lib/writing";
import { Icon, type IconName } from "./Icon";
import { SpeakText } from "./Pronounce";
import { PracticeSentence } from "./SentenceFeedbackView";
import { TryFirstFix } from "./TryFirstFix";

const PEER_LABEL = {
  point: { en: "Point", vi: "Ý chính" },
  explain: { en: "Explain", vi: "Giải thích" },
  example: { en: "Example", vi: "Ví dụ" },
  result: { en: "Result", vi: "Kết luận" },
} as const;

const STATUS: Record<PeerStatus, { label: string; icon: IconName; tone: string }> = {
  good: { label: "Có", icon: "check", tone: "bg-good-soft text-good" },
  weak: { label: "Còn yếu", icon: "bulb", tone: "bg-warn-soft text-warn" },
  missing: { label: "Thiếu", icon: "x", tone: "bg-bad-soft text-bad" },
};

export function SpeakingFeedbackView({
  feedback,
  durationSec,
}: {
  feedback: SpeakingFeedback;
  durationSec: number | null;
}) {
  const [done, setDone] = useState(feedback.issues.length === 0);
  const words = countWords(feedback.answer);
  const wpm = durationSec && durationSec >= 5 ? Math.round((words / durationSec) * 60) : null;

  return (
    <div className="space-y-5">
      <p className="tabular text-sm text-ink-3">
        {words} từ{durationSec ? ` · nói ${durationSec} giây` : ""}
        {wpm ? ` · khoảng ${wpm} từ/phút` : ""}
        {wpm !== null && wpm < 80 ? " — thử nói liền mạch hơn" : ""}
      </p>

      {feedback.commentVi && (
        <p className="rounded-xl bg-accent-soft px-4 py-3 text-sm text-accent-strong">{feedback.commentVi}</p>
      )}

      <section>
        <h3 className="mb-2 text-xs font-semibold tracking-wide text-ink-3 uppercase">Cấu trúc câu trả lời (PEER)</h3>
        <ul className="grid gap-2 sm:grid-cols-2">
          {(Object.keys(PEER_LABEL) as (keyof typeof PEER_LABEL)[]).map((key) => {
            const part = feedback.peer[key];
            const s = STATUS[part.status];
            return (
              <li key={key} className="rounded-xl border border-line p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">
                    {PEER_LABEL[key].en} <span className="font-normal text-ink-3">· {PEER_LABEL[key].vi}</span>
                  </span>
                  <span className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${s.tone}`}>
                    <Icon name={s.icon} className="h-3.5 w-3.5" /> {s.label}
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-ink-2">{part.commentVi}</p>
              </li>
            );
          })}
        </ul>
      </section>

      {feedback.issues.length > 0 ? (
        <TryFirstFix text={feedback.answer} issues={feedback.issues} onComplete={() => setDone(true)} />
      ) : (
        <p className="flex items-center gap-2 rounded-xl bg-good-soft px-4 py-3 text-sm font-medium text-good">
          <Icon name="check" /> Không có lỗi ngữ pháp đáng kể. Tốt lắm!
        </p>
      )}

      {!done && (
        <p className="text-sm text-ink-3">Sửa xong (hoặc xem đáp án) các lỗi ở trên để mở gợi ý từ vựng và câu trả lời mẫu.</p>
      )}

      {done && (
        <>
          {feedback.vocabUpgrades.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-semibold tracking-wide text-ink-3 uppercase">Từ vựng hay hơn</h3>
              <ul className="space-y-2">
                {feedback.vocabUpgrades.map((u, i) => (
                  <li key={i} className="rounded-xl border border-line p-3 text-sm">
                    <span className="text-ink-2">{u.original}</span>
                    <Icon name="arrowRight" className="mx-2 inline h-3.5 w-3.5 text-ink-3" />
                    <strong className="text-accent-strong">{u.better}</strong>
                    <p className="mt-1 text-ink-3">{u.whyVi}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {feedback.recentWordIdeas.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-semibold tracking-wide text-ink-3 uppercase">Dùng từ mới học vào câu trả lời</h3>
              <ul className="space-y-2">
                {feedback.recentWordIdeas.map((idea, i) => (
                  <li key={i} className="flex items-start gap-2 rounded-xl bg-surface-2 p-3 text-sm">
                    <span className="shrink-0 rounded-md bg-accent-soft px-2 py-0.5 font-semibold text-accent-strong">
                      {idea.word}
                    </span>
                    <span className="flex-1">{idea.sentence}</span>
                    <SpeakText text={idea.sentence} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {feedback.improvedAnswer && (
            <section className="rounded-xl border border-accent/40 p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold tracking-wide text-ink-3 uppercase">Câu trả lời mẫu từ ý của bạn</h3>
                <SpeakText text={feedback.improvedAnswer} label="Nghe câu trả lời mẫu" />
              </div>
              <p className="mt-2 text-lg leading-relaxed">{feedback.improvedAnswer}</p>
              <p className="mt-2 text-xs text-ink-3">Nghe rồi đọc theo (shadowing) 2–3 lần, sau đó tự trả lời lại không nhìn.</p>
            </section>
          )}

          {feedback.practice.en && <PracticeSentence key={feedback.practice.en} practice={feedback.practice} />}
        </>
      )}
    </div>
  );
}

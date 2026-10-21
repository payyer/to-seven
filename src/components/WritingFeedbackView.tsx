"use client";

import { useState } from "react";
import { wordDiff } from "@/lib/text";
import type { WritingFeedback } from "@/lib/types";
import { DiffLegend, DiffText } from "./DiffText";
import { Icon } from "./Icon";
import { PracticeSentence } from "./SentenceFeedbackView";
import { TryFirstFix } from "./TryFirstFix";

export function WritingFeedbackView({ feedback }: { feedback: WritingFeedback }) {
  const [done, setDone] = useState(feedback.issues.length === 0);
  const notEnglish = !feedback.correctedText;

  return (
    <div className="space-y-5">
      {feedback.commentVi && (
        <p className="rounded-xl bg-accent-soft px-4 py-3 text-sm text-accent-strong">{feedback.commentVi}</p>
      )}
      {feedback.taskCommentVi && (
        <div className="rounded-xl border border-line px-4 py-3 text-sm">
          <div className="mb-0.5 text-xs font-semibold tracking-wide text-ink-3 uppercase">Yêu cầu của đề</div>
          <p className="text-ink-2">{feedback.taskCommentVi}</p>
        </div>
      )}

      {!notEnglish && feedback.issues.length > 0 && (
        <TryFirstFix text={feedback.text} issues={feedback.issues} onComplete={() => setDone(true)} />
      )}
      {!notEnglish && feedback.issues.length === 0 && (
        <p className="flex items-center gap-2 rounded-xl bg-good-soft px-4 py-3 text-sm font-medium text-good">
          <Icon name="check" /> Không có lỗi ngữ pháp, mạo từ hay chính tả. Tuyệt vời!
        </p>
      )}
      {!done && (
        <p className="text-sm text-ink-3">Sửa xong (hoặc xem đáp án) các lỗi ở trên để mở gợi ý giọng văn và bài đã sửa.</p>
      )}

      {done && !notEnglish && (
        <>
          {feedback.registerSuggestions.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-semibold tracking-wide text-ink-3 uppercase">Đổi sang giọng văn phù hợp</h3>
              <ul className="space-y-2">
                {feedback.registerSuggestions.map((s, i) => (
                  <li key={i} className="rounded-xl border border-line p-3 text-sm">
                    <span className="text-ink-2">{s.original}</span>
                    <Icon name="arrowRight" className="mx-2 inline h-3.5 w-3.5 text-ink-3" />
                    <strong className="text-accent-strong">{s.better}</strong>
                    <p className="mt-1 text-ink-3">{s.whyVi}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {feedback.issues.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-semibold tracking-wide text-ink-3 uppercase">Bài đã sửa (giữ nguyên ý của bạn)</h3>
              <DiffText
                ops={wordDiff(feedback.correctedText, feedback.text, true)}
                className="rounded-xl bg-surface-2 p-4 whitespace-pre-line"
              />
              <div className="mt-2">
                <DiffLegend />
              </div>
            </section>
          )}

          {feedback.practice.en && <PracticeSentence key={feedback.practice.en} practice={feedback.practice} />}
        </>
      )}
    </div>
  );
}

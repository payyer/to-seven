"use client";

import { useEffect, useState } from "react";
import { TASK_GUIDE, WRITING_PROMPTS, type WritingPrompt } from "@/data/writing-prompts";
import { requestWritingFeedback } from "@/lib/ai-client";
import { addDays, formatShort, isoWeek, startOfWeek } from "@/lib/date";
import { recentWords } from "@/lib/planner";
import { flushDraft, recordWriting, saveDraft, useAppState } from "@/lib/store";
import { findWordInSentence } from "@/lib/text";
import type { WritingFeedback, WritingSubmission } from "@/lib/types";
import {
  countWords,
  MAX_SUBMISSIONS_PER_WEEK,
  promptForWeek,
  promptText,
  WRITING_MAX,
  WRITING_MIN,
  wordCountState,
} from "@/lib/writing";
import { Icon } from "../Icon";
import { Badge, Button, Card, Kbd, Loading, PageHeader } from "../ui";
import { WritingFeedbackView } from "../WritingFeedbackView";

export function WritingView() {
  const state = useAppState();
  if (!state) return <Loading />;

  const week = isoWeek(state.today);
  const monday = startOfWeek(state.today);
  const prompt = promptForWeek(state.today);
  const thisWeek = state.writings.filter((w) => w.week === week);
  const history = state.writings.slice().reverse();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Writing tuần này"
        subtitle={`Tuần ${week.slice(-2)} (${formatShort(monday)}–${formatShort(addDays(monday, 6))}) · ${WRITING_MIN}–${WRITING_MAX} từ`}
      />
      <PromptCard prompt={prompt} />
      <Editor
        key={week}
        week={week}
        draft={state.drafts[week] ?? ""}
        prompt={prompt}
        usedSubmissions={thisWeek.length}
        recent={recentWords(state.cards, state.today).map((w) => w.word)}
      />
      {history.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-semibold tracking-wide text-ink-3 uppercase">Bài đã nộp</h2>
          <ul className="space-y-2">
            {history.map((s) => (
              <HistoryItem key={s.id} submission={s} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function PromptCard({ prompt }: { prompt: WritingPrompt }) {
  const guide = TASK_GUIDE[prompt.type];
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="accent">{guide.label}</Badge>
      </div>
      <h2 className="mt-2 font-semibold">{prompt.titleVi}</h2>
      <p className="mt-2 whitespace-pre-line">{prompt.prompt}</p>
      <ul className="mt-1 list-disc space-y-0.5 pl-6">
        {prompt.bullets.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
      <details className="group mt-4 rounded-xl bg-surface-2 px-4 py-3 text-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between font-medium [&::-webkit-details-marker]:hidden">
          Gợi ý cách viết
          <Icon name="chevronDown" className="h-4 w-4 text-ink-3 transition-transform group-open:rotate-180" />
        </summary>
        <ul className="mt-2 space-y-1 text-ink-2">
          {guide.tipsVi.map((t) => (
            <li key={t}>• {t}</li>
          ))}
        </ul>
        <p className="mt-3 text-xs font-semibold tracking-wide text-ink-3 uppercase">Mẫu câu hữu ích</p>
        <ul className="mt-1 space-y-0.5">
          {guide.phrases.map((p) => (
            <li key={p} className="italic">
              {p}
            </li>
          ))}
        </ul>
      </details>
    </Card>
  );
}

function Editor({
  week,
  prompt,
  usedSubmissions,
  draft,
  recent,
}: {
  week: string;
  prompt: WritingPrompt;
  usedSubmissions: number;
  draft: string;
  recent: string[];
}) {
  const [text, setText] = useState(draft);
  useEffect(() => () => flushDraft(week), [week]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<WritingFeedback | null>(null);

  const words = countWords(text);
  const countState = wordCountState(words);
  const left = MAX_SUBMISSIONS_PER_WEEK - usedSubmissions;

  const change = (value: string) => {
    setText(value);
    saveDraft(week, value);
  };

  const submit = async () => {
    if (loading || words < 40 || left <= 0) return;
    setLoading(true);
    setError(null);
    try {
      const result = await requestWritingFeedback({ taskType: prompt.type, prompt: promptText(prompt), text: text.trim() });
      setFeedback(result);
      if (result.correctedText) {
        recordWriting({ week, promptId: prompt.id, text: result.text, wordCount: words, feedback: result });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không chấm được bài, thử lại nhé.");
    } finally {
      setLoading(false);
    }
  };

  if (feedback) {
    return (
      <Card>
        <h2 className="mb-4 font-semibold">Góp ý cho bài của bạn</h2>
        <WritingFeedbackView feedback={feedback} />
        <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
          {/* usedSubmissions đã gồm bài vừa nộp (store cập nhật ngay). */}
          <span className="text-xs text-ink-3">Còn {Math.max(0, left)} lần nộp tuần này</span>
          <Button variant="secondary" onClick={() => setFeedback(null)} disabled={left <= 0}>
            Viết lại bản mới
          </Button>
        </div>
      </Card>
    );
  }

  const countTone = countState === "ok" ? "text-good" : "text-warn";

  return (
    <Card>
      {recent.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5 text-sm">
          <span className="text-xs text-ink-3">Thử dùng:</span>
          {recent.slice(0, 10).map((w) => {
            const used = !!findWordInSentence(text, w);
            return (
              <span
                key={w}
                className={`rounded-full border px-2 py-0.5 ${used ? "border-good/40 bg-good-soft font-semibold text-good" : "border-line text-ink-2"}`}
              >
                {w}
              </span>
            );
          })}
        </div>
      )}
      <label htmlFor="writing-text" className="sr-only">
        Bài viết
      </label>
      <textarea
        id="writing-text"
        value={text}
        onChange={(e) => change(e.target.value.slice(0, 1500))}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) void submit();
        }}
        rows={11}
        placeholder={prompt.type === "opinion" ? "In my opinion, …" : "Dear …,"}
        spellCheck={false}
        className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base leading-relaxed outline-none focus:border-accent focus:ring-2 focus:ring-accent/25"
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className={`tabular font-medium ${countTone}`} aria-live="polite">
          {words} từ ·{" "}
          {countState === "short" ? `cần thêm ${WRITING_MIN - words} từ` : countState === "long" ? `dài hơn ${words - WRITING_MAX} từ` : "độ dài đạt"}
        </span>
        <span className="text-xs text-ink-3">Bản nháp tự lưu lên Supabase</span>
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-ink-3">
          {left > 0 ? `Còn ${left}/${MAX_SUBMISSIONS_PER_WEEK} lần nộp tuần này` : "Đã hết lượt nộp tuần này — hẹn tuần sau!"}
        </span>
        <Button onClick={submit} disabled={loading || words < 40 || left <= 0}>
          {loading ? "AI đang chấm bài…" : "Nộp bài để AI chữa"}
          {!loading && (
            <span className="hidden sm:inline">
              <Kbd>Ctrl</Kbd> <Kbd>Enter</Kbd>
            </span>
          )}
        </Button>
      </div>
    </Card>
  );
}

function HistoryItem({ submission }: { submission: WritingSubmission }) {
  const prompt = WRITING_PROMPTS.find((p) => p.id === submission.promptId);
  return (
    <li>
      <details className="group rounded-2xl border border-line bg-surface">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
          <span className="min-w-0">
            <span className="block truncate font-medium">{prompt?.titleVi ?? submission.promptId}</span>
            <span className="tabular text-xs text-ink-3">
              Tuần {submission.week.slice(-2)} · {formatShort(submission.createdAt)} · {submission.wordCount} từ ·{" "}
              {submission.feedback.issues.length} lỗi
            </span>
          </span>
          <Icon name="chevronDown" className="h-4 w-4 shrink-0 text-ink-3 transition-transform group-open:rotate-180" />
        </summary>
        <div className="border-t border-line px-4 py-4">
          <WritingFeedbackView feedback={submission.feedback} />
        </div>
      </details>
    </li>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import { CATEGORY_LABEL, isCorrectFix, ruleInfo } from "@/lib/mistakes";
import { findFragment } from "@/lib/text";
import type { SentenceIssue } from "@/lib/types";
import { Icon } from "./Icon";
import { Badge, Button } from "./ui";

type Status = "todo" | "wrong" | "correct" | "revealed";

/** Văn bản với các đoạn sai được gạch chân và đánh số tương ứng với danh sách lỗi. */
function NumberedText({ text, issues, statuses }: { text: string; issues: SentenceIssue[]; statuses: Status[] }) {
  const marks: { start: number; end: number; n: number }[] = [];
  issues.forEach((issue, n) => {
    const start = findFragment(text, issue.wrong);
    const end = start + issue.wrong.length;
    if (start >= 0 && !marks.some((m) => start < m.end && end > m.start)) marks.push({ start, end, n });
  });
  marks.sort((a, b) => a.start - b.start);

  const parts: React.ReactNode[] = [];
  let pos = 0;
  for (const m of marks) {
    if (m.start > pos) parts.push(text.slice(pos, m.start));
    const fixed = statuses[m.n] === "correct" || statuses[m.n] === "revealed";
    parts.push(
      <mark
        key={m.n}
        className={`rounded px-0.5 underline decoration-wavy decoration-1 underline-offset-4 ${
          fixed ? "bg-good-soft text-good decoration-good/60" : "bg-bad-soft text-bad"
        }`}
      >
        {fixed ? issues[m.n].correction : text.slice(m.start, m.end)}
        <sup className="tabular ml-0.5 text-[10px] font-bold">{m.n + 1}</sup>
      </mark>,
    );
    pos = m.end;
  }
  if (pos < text.length) parts.push(text.slice(pos));
  return <p className="text-lg leading-loose">{parts}</p>;
}

function IssueTry({
  issue,
  index,
  status,
  onStatus,
}: {
  issue: SentenceIssue;
  index: number;
  status: Status;
  onStatus: (s: Status) => void;
}) {
  const [answer, setAnswer] = useState("");
  const info = ruleInfo(issue.rule);
  const finished = status === "correct" || status === "revealed";

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || finished) return;
    onStatus(isCorrectFix(issue.rule, answer, issue.correction) ? "correct" : "wrong");
  };

  return (
    <li className="rounded-xl border border-line p-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="tabular grid h-5 w-5 place-items-center rounded-full bg-surface-2 text-xs font-bold">{index + 1}</span>
        <Badge tone="warn">{CATEGORY_LABEL[info.category]}</Badge>
        {status === "correct" && (
          <span className="ml-auto flex items-center gap-1 text-sm font-semibold text-good">
            <Icon name="check" /> Bạn sửa đúng!
          </span>
        )}
      </div>

      <p className="mt-2 text-sm text-ink-2">
        <Icon name="bulb" className="mr-1 inline h-3.5 w-3.5 text-warn" />
        {issue.hintVi?.trim() || `Xem lại: ${info.label.toLowerCase()}.`}
      </p>

      {!finished && (
        <form onSubmit={submit} className="mt-2 flex flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor={`fix-${index}`}>
            Sửa lỗi số {index + 1}
          </label>
          <input
            id={`fix-${index}`}
            value={answer}
            onChange={(e) => {
              setAnswer(e.target.value);
              if (status === "wrong") onStatus("todo");
            }}
            placeholder={`Sửa “${issue.wrong}” thành…`}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            className={`flex-1 rounded-lg border bg-surface px-3 py-2 outline-none focus:ring-2 focus:ring-accent/25 ${
              status === "wrong" ? "border-bad" : "border-line focus:border-accent"
            }`}
          />
          <div className="flex gap-2">
            <Button type="submit" variant="secondary" disabled={!answer.trim()} className="flex-1 sm:flex-none">
              Kiểm tra
            </Button>
            <Button variant="ghost" onClick={() => onStatus("revealed")} className="flex-1 sm:flex-none">
              Xem đáp án
            </Button>
          </div>
        </form>
      )}
      {status === "wrong" && <p className="mt-1.5 text-sm text-bad">Chưa đúng, thử lại một lần nữa nhé.</p>}

      {finished && (
        <div className="mt-2 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <del className="rounded bg-bad-soft px-1.5 py-0.5 text-bad">{issue.wrong || "∅"}</del>
            <Icon name="arrowRight" className="h-4 w-4 text-ink-3" />
            <ins className="rounded bg-good-soft px-1.5 py-0.5 font-semibold text-good no-underline">{issue.correction}</ins>
          </div>
          <p className="text-sm text-ink-2">{issue.explanationVi}</p>
        </div>
      )}
    </li>
  );
}

/**
 * "Tự sửa trước": chỉ tô chỗ sai + gợi ý; người học tự gõ cách sửa và được chấm ngay trên máy.
 * Đáp án của từng lỗi chỉ hiện khi sửa đúng hoặc khi người học chủ động bấm "Xem đáp án".
 * `onComplete` được gọi khi mọi lỗi đã xong (đúng hoặc đã xem đáp án).
 */
export function TryFirstFix({ text, issues, onComplete }: { text: string; issues: SentenceIssue[]; onComplete: () => void }) {
  const [statuses, setStatuses] = useState<Status[]>(() => issues.map(() => "todo"));
  const doneCount = statuses.filter((s) => s === "correct" || s === "revealed").length;
  const allDone = doneCount === issues.length;

  const update = (next: Status[]) => {
    const wasDone = statuses.every((s) => s === "correct" || s === "revealed");
    setStatuses(next);
    if (!wasDone && next.every((s) => s === "correct" || s === "revealed")) onComplete();
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-semibold tracking-wide text-ink-3 uppercase">
          Tự sửa trước · <span className="tabular">{doneCount}/{issues.length}</span>
        </h3>
        {!allDone && (
          <button
            type="button"
            onClick={() => update(statuses.map((s) => (s === "correct" ? s : "revealed")))}
            className="text-sm font-medium text-ink-3 underline-offset-2 hover:text-ink hover:underline"
          >
            Xem tất cả đáp án
          </button>
        )}
      </div>
      <NumberedText text={text} issues={issues} statuses={statuses} />
      <ol className="space-y-2">
        {issues.map((issue, i) => (
          <IssueTry
            key={i}
            issue={issue}
            index={i}
            status={statuses[i]}
            onStatus={(s) => update(statuses.map((old, j) => (j === i ? s : old)))}
          />
        ))}
      </ol>
    </div>
  );
}

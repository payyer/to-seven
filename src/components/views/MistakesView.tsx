"use client";

import { useState, type FormEvent } from "react";
import { formatShort } from "@/lib/date";
import {
  BOX_INTERVALS,
  canHighlight,
  CATEGORIES,
  CATEGORY_LABEL,
  checkErrorFix,
  countPatterns,
  expectedFix,
  isErrorDue,
  patternLabel,
  ruleInfo,
} from "@/lib/mistakes";
import { deleteError, reviewError, useAppState } from "@/lib/store";
import type { ErrorCategory, ErrorEntry, ErrorSource } from "@/lib/types";
import { Icon } from "../Icon";
import { SpeakText } from "../Pronounce";
import { MarkedSentence } from "../SentenceFeedbackView";
import { Badge, Button, ButtonLink, Card, Loading, PageHeader, ProgressBar } from "../ui";

type Filter = ErrorCategory | "all" | "fixed";

const SOURCE_LABEL: Record<ErrorSource, string> = { sentence: "từ Đặt câu", speaking: "từ Speaking", writing: "từ Writing" };

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function MistakesView() {
  const state = useAppState();
  const [filter, setFilter] = useState<Filter>("all");
  const [queue, setQueue] = useState<string[] | null>(null);

  if (!state) return <Loading />;
  const { errors, today } = state;
  const due = errors.filter((e) => isErrorDue(e, today));
  const open = errors.filter((e) => !e.fixedAt);

  if (queue) {
    return <ReviewSession ids={queue} errors={errors} onExit={() => setQueue(null)} />;
  }

  if (errors.length === 0) {
    return (
      <div>
        <PageHeader title="Sổ lỗi sai" />
        <Card className="text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-accent-soft text-accent-strong">
            <Icon name="notebook" className="h-6 w-6" />
          </div>
          <p className="text-ink-2">Chưa có lỗi nào. Khi bạn đặt câu và AI chỉ ra lỗi, lỗi sẽ được lưu ở đây để ôn lại.</p>
          <div className="mt-4">
            <ButtonLink href="/practice/write">Đặt câu ngay</ButtonLink>
          </div>
        </Card>
      </div>
    );
  }

  const patternCounts = countPatterns(errors);
  const byCategory = CATEGORIES.map((c) => ({ c, n: errors.filter((e) => e.category === c).length }));
  const maxCat = Math.max(1, ...byCategory.map((x) => x.n));
  const repeated = [...patternCounts.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([pattern, n]) => ({ n, entry: errors.findLast((e) => e.pattern === pattern)! }));

  const list = errors
    .filter((e) =>
      filter === "all" ? true : filter === "fixed" ? !!e.fixedAt : e.category === filter && !e.fixedAt,
    )
    .slice()
    .reverse();

  return (
    <div className="space-y-4">
      <PageHeader title="Sổ lỗi sai" subtitle="Lỗi AI chỉ ra khi bạn đặt câu. Ôn đúng 5 lần liên tiếp (1→3→7→14→30 ngày) là khắc phục.">
        {due.length > 0 ? (
          <Button onClick={() => setQueue(shuffle(due.map((e) => e.id)))}>Ôn {due.length} lỗi đến hạn</Button>
        ) : (
          open.length > 0 && (
            <Button variant="secondary" onClick={() => setQueue(shuffle(open.map((e) => e.id)).slice(0, 10))}>
              Ôn thêm (chưa đến hạn)
            </Button>
          )
        )}
      </PageHeader>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold">Lỗi theo loại</h2>
          <ul className="space-y-2.5">
            {byCategory.map(({ c, n }) => (
              <li key={c}>
                <button
                  type="button"
                  onClick={() => setFilter(filter === c ? "all" : c)}
                  className="w-full text-left"
                  aria-pressed={filter === c}
                >
                  <div className="mb-1 flex justify-between text-sm">
                    <span className={filter === c ? "font-semibold text-accent-strong" : "text-ink-2"}>{CATEGORY_LABEL[c]}</span>
                    <span className="tabular font-semibold">{n}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${(n / maxCat) * 100}%` }} />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="font-semibold">Lỗi hay lặp lại</h2>
          {repeated.length === 0 ? (
            <p className="mt-2 text-sm text-ink-3">Chưa có lỗi nào lặp lại. Tốt lắm!</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {repeated.map(({ n, entry }) => (
                <li key={entry.pattern} className="flex items-start justify-between gap-3 text-sm">
                  <span>
                    <span className="font-medium">{patternLabel(entry)}</span>
                    <span className="block text-xs text-ink-3">
                      gần nhất: {entry.wrong} → {entry.correction}
                    </span>
                  </span>
                  <Badge tone="warn">{n} lần</Badge>
                </li>
              ))}
            </ul>
          )}
          <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
            <div>
              <dt className="text-xs text-ink-3">Tổng lỗi</dt>
              <dd className="tabular text-lg font-semibold">{errors.length}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-3">Đang ôn</dt>
              <dd className="tabular text-lg font-semibold">{open.length}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-3">Đã khắc phục</dt>
              <dd className="tabular text-lg font-semibold text-good">{errors.length - open.length}</dd>
            </div>
          </dl>
        </Card>
      </div>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Lọc lỗi">
        {(["all", ...CATEGORIES, "fixed"] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-1 text-sm ${
              filter === f ? "border-accent bg-accent-soft font-medium text-accent-strong" : "border-line text-ink-2 hover:bg-surface-2"
            }`}
          >
            {f === "all" ? "Tất cả" : f === "fixed" ? "Đã khắc phục" : CATEGORY_LABEL[f]}
          </button>
        ))}
      </div>

      <ul className="space-y-2">
        {list.map((e) => (
          <ErrorRow key={e.id} entry={e} repeat={patternCounts.get(e.pattern) ?? 1} today={today} />
        ))}
      </ul>
      {list.length === 0 && <p className="py-6 text-center text-sm text-ink-3">Không có lỗi nào trong mục này.</p>}
    </div>
  );
}

function ErrorRow({ entry, repeat, today }: { entry: ErrorEntry; repeat: number; today: string }) {
  const info = ruleInfo(entry.rule);
  const status = entry.fixedAt
    ? "Đã khắc phục"
    : isErrorDue(entry, today)
      ? "Cần ôn hôm nay"
      : `Ôn ngày ${formatShort(entry.due)}`;
  return (
    <li className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone="warn">{CATEGORY_LABEL[entry.category]}</Badge>
        <span className="text-xs text-ink-3">{info.label}</span>
        {repeat > 1 && <Badge tone="accent">lặp lại {repeat} lần</Badge>}
        <span className="text-xs text-ink-3">· {SOURCE_LABEL[entry.source ?? "sentence"]}</span>
        <span className={`ml-auto text-xs ${entry.fixedAt ? "text-good" : "text-ink-3"}`}>{status}</span>
      </div>
      <p className="mt-2">
        <MarkedSentence sentence={entry.sentence} fragments={[entry.wrong]} />
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm">
        <del className="rounded bg-bad-soft px-1.5 text-bad">{entry.wrong || "∅"}</del>
        <Icon name="arrowRight" className="h-3.5 w-3.5 text-ink-3" />
        <ins className="rounded bg-good-soft px-1.5 font-semibold text-good no-underline">{entry.correction}</ins>
      </div>
      <p className="mt-1.5 text-sm text-ink-2">{entry.explanationVi}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2" aria-label={`Tiến độ khắc phục ${Math.min(entry.box, 5)}/5`}>
          {BOX_INTERVALS.map((_, i) => (
            <span key={i} className={`h-1.5 w-5 rounded-full ${i < entry.box ? "bg-good" : "bg-surface-2"}`} />
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Xoá lỗi này khỏi sổ? (Dùng khi AI chấm nhầm)")) deleteError(entry.id);
          }}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-ink-3 hover:bg-bad-soft hover:text-bad"
        >
          <Icon name="trash" className="h-3.5 w-3.5" /> Xoá (AI chấm nhầm)
        </button>
      </div>
    </li>
  );
}

function ReviewSession({ ids, errors, onExit }: { ids: string[]; errors: ErrorEntry[]; onExit: () => void }) {
  const [pos, setPos] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const entries = ids.map((id) => errors.find((e) => e.id === id)).filter((e): e is ErrorEntry => !!e);

  if (pos >= entries.length) {
    return (
      <div>
        <PageHeader title="Ôn sổ lỗi" />
        <Card className="text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-good-soft text-good">
            <Icon name="check" className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold">Xong phiên ôn lỗi!</h2>
          <p className="mt-1 text-sm text-ink-2">
            Bạn sửa đúng {correctCount}/{entries.length} lỗi.
          </p>
          <div className="mt-5">
            <Button onClick={onExit}>Về sổ lỗi</Button>
          </div>
        </Card>
      </div>
    );
  }

  const entry = entries[pos];
  return (
    <div>
      <PageHeader title="Ôn sổ lỗi">
        <Button variant="ghost" onClick={onExit}>
          Thoát
        </Button>
      </PageHeader>
      <div className="mb-4 flex items-center gap-3">
        <ProgressBar value={pos} max={entries.length} label="Tiến độ ôn lỗi" />
        <span className="tabular shrink-0 text-sm font-medium text-ink-2">
          {pos + 1}/{entries.length}
        </span>
      </div>
      <FixCard
        key={entry.id + pos}
        entry={entry}
        onDone={(correct) => {
          reviewError(entry.id, correct);
          if (correct) setCorrectCount((n) => n + 1);
          setPos((p) => p + 1);
        }}
      />
    </div>
  );
}

function FixCard({ entry, onDone }: { entry: ErrorEntry; onDone: (correct: boolean) => void }) {
  const [answer, setAnswer] = useState("");
  const [verdict, setVerdict] = useState<boolean | null>(null);
  const highlight = canHighlight(entry);
  const info = ruleInfo(entry.rule);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (verdict !== null) return onDone(verdict);
    if (answer.trim()) setVerdict(checkErrorFix(entry, answer));
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone="warn">{CATEGORY_LABEL[entry.category]}</Badge>
        <span className="text-xs text-ink-3">{SOURCE_LABEL[entry.source ?? "sentence"]}</span>
      </div>
      <p className="mt-2 text-sm text-ink-2">
        <Icon name="bulb" className="mr-1 inline h-3.5 w-3.5 text-warn" />
        {entry.hintVi?.trim() || `Gợi ý: ${info.label.toLowerCase()}.`}
      </p>
      <p className="mt-3 text-sm text-ink-3">{highlight ? "Sửa phần bị tô đỏ trong câu:" : "Viết lại cả câu cho đúng:"}</p>
      <p className="mt-1 text-xl leading-relaxed">
        <MarkedSentence sentence={entry.sentence} fragments={highlight ? [entry.wrong] : []} />
      </p>

      <form onSubmit={submit} className="mt-4 space-y-3">
        <input
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          readOnly={verdict !== null}
          autoFocus
          autoComplete="off"
          spellCheck={false}
          placeholder={highlight ? `Thay “${entry.wrong}” bằng…` : "Gõ câu đúng…"}
          aria-label="Cách sửa của bạn"
          className={`w-full rounded-xl border bg-surface px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-accent/25 ${
            verdict === null ? "border-line focus:border-accent" : verdict ? "border-good" : "border-bad"
          }`}
        />

        {verdict === null ? (
          <div className="flex justify-between gap-2">
            <Button variant="secondary" onClick={() => setVerdict(false)}>
              Không biết
            </Button>
            <Button type="submit" disabled={!answer.trim()}>
              Kiểm tra
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className={`rounded-xl px-4 py-3 ${verdict ? "bg-good-soft text-good" : "bg-bad-soft text-bad"}`}>
              <div className="font-semibold">{verdict ? "Chính xác!" : `Đáp án: ${expectedFix(entry)}`}</div>
              <p className="mt-1 text-sm text-ink-2">{entry.explanationVi}</p>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <span className="text-ink-3">Câu đúng:</span> <strong>{entry.corrected}</strong>
              <SpeakText text={entry.corrected} />
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              {!verdict && answer.trim() && (
                <Button variant="ghost" onClick={() => onDone(true)}>
                  Tôi sửa đúng theo cách khác
                </Button>
              )}
              <Button type="submit" autoFocus>
                Tiếp tục <Icon name="arrowRight" />
              </Button>
            </div>
          </div>
        )}
      </form>
    </Card>
  );
}

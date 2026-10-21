"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { WORD_BY_ID } from "@/data/words";
import { formatLong } from "@/lib/date";
import { playWord } from "@/lib/speech";
import { formatInterval, GRADE_LABEL, GRADES, isDue, previewInterval } from "@/lib/srs";
import { gradeCard, logPractice, useAppState } from "@/lib/store";
import { charDiff, checkAnswer, maskWord, type AnswerVerdict, type DiffPart } from "@/lib/text";
import { POS_LABEL, type CardState, type Grade, type Word } from "@/lib/types";
import { Icon } from "../Icon";
import { SpeakWord, StressWord } from "../Pronounce";
import { Badge, Button, ButtonLink, Card, Kbd, Loading, PageHeader, ProgressBar } from "../ui";
import { Highlighted } from "../WordBits";

type QueueItem = { id: string; relearn: boolean };
type Tally = Record<Grade, number>;
const EMPTY_TALLY: Tally = { again: 0, hard: 0, good: 0, easy: 0 };

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function ReviewView() {
  const state = useAppState();
  const [queue, setQueue] = useState<QueueItem[] | null>(null);
  const [pos, setPos] = useState(0);
  const [tally, setTally] = useState<Tally>(EMPTY_TALLY);

  if (!state) return <Loading />;
  const { cards, today, settings } = state;
  const dueIds = Object.values(cards)
    .filter((c) => isDue(c, today))
    .sort((a, b) => a.due.localeCompare(b.due))
    .map((c) => c.wordId);

  const start = () => {
    setQueue(shuffle(dueIds).map((id) => ({ id, relearn: false })));
    setPos(0);
    setTally(EMPTY_TALLY);
  };

  if (!queue) {
    return (
      <div>
        <PageHeader title="Ôn tập" subtitle="Nhìn nghĩa tiếng Việt, tự gõ lại từ tiếng Anh, rồi tự chấm mức độ nhớ." />
        <StartCard dueCount={dueIds.length} cards={cards} today={today} onStart={start} />
      </div>
    );
  }

  const firstPass = queue.filter((q) => !q.relearn).length;
  const doneFirstPass = queue.slice(0, pos).filter((q) => !q.relearn).length;

  if (pos >= queue.length) {
    return (
      <div>
        <PageHeader title="Ôn tập" />
        <SummaryCard tally={tally} total={firstPass} moreDue={dueIds.length} onRestart={start} />
      </div>
    );
  }

  const item = queue[pos];
  const word = WORD_BY_ID[item.id];
  const card = cards[item.id];

  const finish = (grade: Grade | null) => {
    if (item.relearn || !grade) {
      logPractice();
    } else {
      gradeCard(item.id, grade);
      setTally((t) => ({ ...t, [grade]: t[grade] + 1 }));
      // Từ bị quên được hỏi lại một lần ở cuối phiên (không đổi lịch).
      if (grade === "again") setQueue((q) => [...(q ?? []), { id: item.id, relearn: true }]);
    }
    setPos((p) => p + 1);
  };

  return (
    <div>
      <PageHeader title="Ôn tập" subtitle={item.relearn ? "Ôn lại từ vừa quên" : undefined} />
      <div className="mb-4 flex items-center gap-3">
        <ProgressBar value={doneFirstPass} max={firstPass} label="Tiến độ phiên ôn" />
        <span className="tabular shrink-0 text-sm font-medium text-ink-2">
          {doneFirstPass}/{firstPass}
        </span>
      </div>
      {word && card ? (
        <RecallCard
          key={`${pos}-${item.id}`}
          word={word}
          card={card}
          relearn={item.relearn}
          preferReal={settings.preferRealAudio}
          onDone={finish}
        />
      ) : (
        // Thẻ trỏ tới từ không còn trong kho: bỏ qua.
        <Button onClick={() => setPos((p) => p + 1)}>Bỏ qua</Button>
      )}
    </div>
  );
}

function StartCard({
  dueCount,
  cards,
  today,
  onStart,
}: {
  dueCount: number;
  cards: Record<string, CardState>;
  today: string;
  onStart: () => void;
}) {
  if (dueCount === 0) {
    const upcoming = Object.values(cards)
      .filter((c) => c.due > today)
      .sort((a, b) => a.due.localeCompare(b.due));
    const next = upcoming[0]?.due;
    const nextCount = upcoming.filter((c) => c.due === next).length;
    return (
      <Card className="text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-good-soft text-good">
          <Icon name="check" className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold">Không có thẻ nào cần ôn</h2>
        <p className="mt-1 text-sm text-ink-2">
          {next ? `Lần ôn tới: ${formatLong(next)} (${nextCount} thẻ).` : "Hãy học vài từ mới — ngày mai chúng sẽ xuất hiện ở đây."}
        </p>
        <div className="mt-4">
          <ButtonLink href="/learn">Học từ mới</ButtonLink>
        </div>
      </Card>
    );
  }
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="tabular text-3xl font-bold">{dueCount}</div>
          <div className="text-sm text-ink-2">thẻ đến hạn hôm nay</div>
        </div>
        <Button onClick={onStart} autoFocus>
          Bắt đầu ôn <Icon name="arrowRight" />
        </Button>
      </div>
      <ol className="mt-5 space-y-1.5 text-sm text-ink-2">
        <li>
          1. Đọc nghĩa tiếng Việt, <strong className="text-ink">tự gõ</strong> từ tiếng Anh (không xem đáp án trước).
        </li>
        <li>2. Xem đáp án, nghe lại phát âm, so từng chữ cái nếu gõ sai.</li>
        <li>
          3. Tự chấm: <strong className="text-ink">Quên / Khó / Nhớ / Dễ</strong>. App sẽ hẹn lần ôn tiếp theo (1 → 3 → 7 → 14 ngày…).
        </li>
      </ol>
    </Card>
  );
}

function letterPattern(word: string, reveal: boolean): string {
  return word.replace(/[a-z]/gi, (ch, i: number) => (reveal && i === 0 ? ch : "_")).split("").join(" ");
}

function suggestGrade(verdict: AnswerVerdict | "gaveup", hints: number): Grade {
  if (verdict === "gaveup" || verdict === "wrong") return "again";
  if (verdict === "close" || hints > 0) return "hard";
  return "good";
}

function DiffLine({ parts }: { parts: DiffPart[] }) {
  return (
    <span className="font-mono text-lg tracking-wide">
      {parts.map((p, i) => (
        <span
          key={i}
          className={
            p.kind === "extra"
              ? "rounded-sm bg-bad-soft text-bad line-through"
              : p.kind === "missing"
                ? "rounded-sm bg-good-soft font-bold text-good underline"
                : ""
          }
        >
          {p.text}
        </span>
      ))}
    </span>
  );
}

function RecallCard({
  word,
  card,
  relearn,
  preferReal,
  onDone,
}: {
  word: Word;
  card: CardState;
  relearn: boolean;
  preferReal: boolean;
  onDone: (grade: Grade | null) => void;
}) {
  const [input, setInput] = useState("");
  const [verdict, setVerdict] = useState<AnswerVerdict | "gaveup" | null>(null);
  const [hints, setHints] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const revealed = verdict !== null;
  const suggested = verdict ? suggestGrade(verdict, hints) : "good";
  const masked = maskWord(word.example, word.word);
  const maxHints = masked ? 2 : 1;

  const reveal = (v: AnswerVerdict | "gaveup") => {
    setVerdict(v);
    inputRef.current?.blur();
    void playWord(word.word, { preferReal });
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (revealed) return;
    const v = checkAnswer(input, word.word, word.altSpellings);
    if (v !== "empty") reveal(v);
  };

  useEffect(() => {
    if (!revealed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest("button, a")) return;
      if (relearn) {
        if (e.key === "Enter") onDone(null);
        return;
      }
      const index = ["1", "2", "3", "4"].indexOf(e.key);
      if (index >= 0) onDone(GRADES[index]);
      else if (e.key === "Enter") onDone(suggested);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [revealed, relearn, suggested, onDone]);

  const diff = verdict && verdict !== "correct" && input.trim() ? charDiff(input.trim(), word.word) : null;

  const banner = {
    correct: { tone: "bg-good-soft text-good", text: "Chính xác!" },
    close: { tone: "bg-warn-soft text-warn", text: "Gần đúng — chú ý chính tả" },
    wrong: { tone: "bg-bad-soft text-bad", text: "Chưa đúng" },
    gaveup: { tone: "bg-surface-2 text-ink-2", text: "Đáp án là" },
    empty: { tone: "", text: "" },
  };

  return (
    <Card flush>
      <div className="p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone="accent">{POS_LABEL[word.pos]}</Badge>
          {relearn && <Badge tone="warn">Ôn lại</Badge>}
        </div>
        <div className="mt-3 text-sm text-ink-3">Từ tiếng Anh nào có nghĩa là</div>
        <div className="mt-1 text-3xl font-bold tracking-tight">{word.vi}</div>

        <form onSubmit={submit} className="mt-5">
          <label htmlFor="answer" className="sr-only">
            Gõ từ tiếng Anh
          </label>
          <input
            id="answer"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            readOnly={revealed}
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="Gõ từ tiếng Anh…"
            className={`w-full rounded-xl border bg-surface px-4 py-3 text-xl outline-none focus:border-accent focus:ring-2 focus:ring-accent/25 ${
              revealed
                ? verdict === "correct"
                  ? "border-good"
                  : verdict === "close"
                    ? "border-warn"
                    : "border-bad"
                : "border-line"
            }`}
          />

          {!revealed && (
            <>
              <div className="mt-3 space-y-1 text-sm text-ink-3">
                <div className="font-mono tracking-wide">
                  {letterPattern(word.word, hints >= 1)}{" "}
                  <span className="font-sans">
                    ({word.word.includes(" ") ? `${word.word.split(" ").length} từ, ` : ""}
                    {word.word.replace(/[^a-z]/gi, "").length} chữ cái)
                  </span>
                </div>
                {hints >= 2 && masked && <div className="text-ink-2 italic">“{masked}”</div>}
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-2">
                  {hints < maxHints && (
                    <Button variant="ghost" onClick={() => setHints((h) => h + 1)}>
                      <Icon name="bulb" /> Gợi ý {hints === 0 ? "chữ đầu" : "câu ví dụ"}
                    </Button>
                  )}
                  <Button variant="secondary" onClick={() => reveal("gaveup")}>
                    Không nhớ
                  </Button>
                </div>
                <Button type="submit" disabled={!input.trim()}>
                  Kiểm tra <Kbd>Enter</Kbd>
                </Button>
              </div>
            </>
          )}
        </form>

        {revealed && verdict && (
          <div className="mt-5 space-y-4">
            <div className={`rounded-xl px-4 py-3 ${banner[verdict].tone}`}>
              <div className="flex items-center gap-1.5 font-semibold">
                {verdict === "correct" && <Icon name="check" />}
                {verdict === "wrong" && <Icon name="x" />}
                {banner[verdict].text}
              </div>
              {diff && (
                <div className="mt-2 space-y-1 text-sm text-ink-2">
                  <div>
                    Bạn gõ: <DiffLine parts={diff.given} />
                  </div>
                  <div>
                    Đáp án: <DiffLine parts={diff.answer} />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-3xl font-bold">{word.word}</div>
                <div className="mt-1 flex flex-wrap items-baseline gap-3">
                  <StressWord stress={word.stress} size="md" />
                  <span className="ipa text-ink-3">{word.ipa}</span>
                </div>
              </div>
              <SpeakWord word={word.word} />
            </div>

            <div className="rounded-xl bg-surface-2 p-3">
              <p>
                <Highlighted sentence={word.example} word={word.word} />
              </p>
              <p className="mt-0.5 text-sm text-ink-2">{word.exampleVi}</p>
              <p className="mt-2 text-xs text-ink-3">Hay đi với: {word.collocations.join(" · ")}</p>
            </div>
          </div>
        )}
      </div>

      {revealed && (
        <div className="border-t border-line p-4">
          {relearn ? (
            <div className="flex justify-end">
              <Button onClick={() => onDone(null)} autoFocus>
                Tiếp tục <Kbd>Enter</Kbd>
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-2 text-xs text-ink-3">Bạn nhớ từ này thế nào? (gợi ý được viền xanh)</div>
              <div className="grid grid-cols-4 gap-2">
                {GRADES.map((g, i) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => onDone(g)}
                    className={`flex flex-col items-center rounded-xl border px-1 py-2.5 text-sm transition-colors hover:bg-surface-2 ${
                      g === suggested ? "border-accent ring-2 ring-accent/25" : "border-line"
                    }`}
                  >
                    <span className="font-semibold">{GRADE_LABEL[g]}</span>
                    <span className="tabular text-xs text-ink-3">{formatInterval(previewInterval(card, g))}</span>
                    <span className="mt-1 hidden sm:block">
                      <Kbd>{i + 1}</Kbd>
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  );
}

function SummaryCard({
  tally,
  total,
  moreDue,
  onRestart,
}: {
  tally: Tally;
  total: number;
  moreDue: number;
  onRestart: () => void;
}) {
  const remembered = tally.good + tally.easy + tally.hard;
  return (
    <Card className="text-center">
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-good-soft text-good">
        <Icon name="check" className="h-6 w-6" />
      </div>
      <h2 className="text-xl font-bold">Xong phiên ôn tập!</h2>
      <p className="mt-1 text-sm text-ink-2">
        Bạn nhớ được {remembered}/{total} từ.
        {tally.again > 0 && ` ${tally.again} từ bị quên sẽ được hỏi lại vào ngày mai.`}
      </p>
      <dl className="mx-auto mt-5 grid max-w-sm grid-cols-4 gap-2">
        {GRADES.map((g) => (
          <div key={g} className="rounded-xl bg-surface-2 py-2">
            <dt className="text-xs text-ink-3">{GRADE_LABEL[g]}</dt>
            <dd className="tabular text-lg font-semibold">{tally[g]}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {moreDue > 0 && <Button onClick={onRestart}>Ôn tiếp {moreDue} thẻ</Button>}
        <ButtonLink href="/learn" variant={moreDue > 0 ? "secondary" : "primary"}>
          Học từ mới
        </ButtonLink>
        <ButtonLink href="/" variant="secondary">
          Về tổng quan
        </ButtonLink>
      </div>
    </Card>
  );
}

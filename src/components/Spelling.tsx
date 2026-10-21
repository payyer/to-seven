"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { playWord } from "@/lib/speech";
import { isSpelledRight, letterPattern, shuffle } from "@/lib/spelling";
import { recordSpelling } from "@/lib/store";
import { charDiff, type DiffPart } from "@/lib/text";
import { POS_LABEL, type Word } from "@/lib/types";
import { Icon } from "./Icon";
import { SpeakWord } from "./Pronounce";
import { Badge, Button, Card, Kbd, ProgressBar } from "./ui";

export function DiffLine({ parts }: { parts: DiffPart[] }) {
  return (
    <span className="font-mono text-lg tracking-wide break-all">
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

/** So từng chữ cái: chữ thừa gạch đỏ, chữ thiếu tô xanh. */
export function SpellDiff({ given, answer }: { given: string; answer: string }) {
  const diff = charDiff(given, answer);
  return (
    <div className="space-y-1 text-sm text-ink-2">
      <div>
        Bạn gõ: <DiffLine parts={diff.given} />
      </div>
      <div>
        Đáp án: <DiffLine parts={diff.answer} />
      </div>
    </div>
  );
}

const INPUT =
  "w-full rounded-xl border bg-surface px-4 py-3 text-xl outline-none focus:border-accent focus:ring-2 focus:ring-accent/25";

/** Thuộc tính chung cho ô gõ từ: tắt tự sửa / gợi ý của bàn phím điện thoại. */
const NO_ASSIST = {
  autoComplete: "off",
  autoCorrect: "off",
  autoCapitalize: "off",
  spellCheck: false,
} as const;

export type SpellMode = "copy" | "meaning" | "listen";

/**
 * Gõ một từ cho đến khi đúng từng chữ cái.
 * - copy: nhìn từ và chép lại;
 * - meaning: nhìn nghĩa tiếng Việt, gõ từ theo trí nhớ;
 * - listen: nghe phát âm, gõ lại (nghĩa là gợi ý, phải bấm mới hiện).
 * Gõ sai: hiện so sánh từng chữ cái, xoá ô và bắt gõ lại.
 */
export function SpellTask({
  word,
  mode,
  preferReal,
  onFirstTry,
  onPass,
  passLabel = "Tiếp tục",
}: {
  word: Word;
  mode: SpellMode;
  preferReal: boolean;
  onFirstTry?: (ok: boolean) => void;
  onPass: () => void;
  passLabel?: string;
}) {
  const [input, setInput] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [lastWrong, setLastWrong] = useState<string | null>(null);
  const [passed, setPassed] = useState(false);
  const [showMeaning, setShowMeaning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === "listen") void playWord(word.word, { preferReal });
  }, [mode, word, preferReal]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (passed || !input.trim()) return;
    const ok = isSpelledRight(input, word);
    if (attempts === 0) onFirstTry?.(ok);
    setAttempts((a) => a + 1);
    if (ok) {
      setPassed(true);
      if (mode !== "listen") void playWord(word.word, { preferReal });
    } else {
      setLastWrong(input.trim());
      setInput("");
      inputRef.current?.focus();
    }
  };

  const multiWord = word.word.includes(" ");
  const pattern = (
    <div className="font-mono text-sm tracking-wide text-ink-3">
      {letterPattern(word.word)}{" "}
      <span className="font-sans">
        ({multiWord ? `${word.word.split(" ").length} từ, ` : ""}
        {word.word.replace(/[^a-z]/gi, "").length} chữ cái)
      </span>
    </div>
  );

  return (
    <div className="space-y-4">
      {mode === "copy" && (
        <div className="text-center">
          <div className="text-sm text-ink-3">Chép lại từ này</div>
          <div className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{word.word}</div>
          <div className="ipa mt-1 text-ink-3">{word.ipa}</div>
        </div>
      )}

      {mode === "meaning" && (
        <div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="accent">{POS_LABEL[word.pos]}</Badge>
          </div>
          <div className="mt-3 text-sm text-ink-3">Gõ từ tiếng Anh có nghĩa là</div>
          <div className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{word.vi}</div>
          <div className="mt-2">{pattern}</div>
        </div>
      )}

      {mode === "listen" && (
        <div className="space-y-3">
          <div className="text-sm text-ink-3">Nghe rồi gõ lại từ</div>
          <SpeakWord word={word.word} />
          {pattern}
          {showMeaning ? (
            <div className="text-sm text-ink-2">
              Nghĩa: <span className="font-medium text-ink">{word.vi}</span>
            </div>
          ) : (
            !passed && (
              <Button variant="ghost" onClick={() => setShowMeaning(true)}>
                <Icon name="bulb" /> Gợi ý nghĩa
              </Button>
            )
          )}
        </div>
      )}

      <form onSubmit={submit} className="space-y-3">
        <label htmlFor={`spell-${word.id}`} className="sr-only">
          Gõ từ tiếng Anh
        </label>
        <input
          id={`spell-${word.id}`}
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          readOnly={passed}
          autoFocus
          {...NO_ASSIST}
          placeholder={lastWrong ? "Gõ lại cho đúng…" : "Gõ từ tiếng Anh…"}
          className={`${INPUT} ${passed ? "border-good" : lastWrong ? "border-bad" : "border-line"}`}
        />
        {!passed && (
          <div className="flex justify-end">
            <Button type="submit" disabled={!input.trim()}>
              Kiểm tra <Kbd>Enter</Kbd>
            </Button>
          </div>
        )}
      </form>

      {lastWrong && !passed && (
        <div className="rounded-xl bg-bad-soft px-4 py-3">
          <div className="mb-2 flex items-center gap-1.5 font-semibold text-bad">
            <Icon name="x" /> Chưa đúng — nhìn kỹ rồi gõ lại
          </div>
          <SpellDiff given={lastWrong} answer={word.word} />
        </div>
      )}

      {passed && (
        <div className="space-y-3">
          <div className="rounded-xl bg-good-soft px-4 py-3 text-good">
            <div className="flex items-center gap-1.5 font-semibold">
              <Icon name="check" /> {attempts === 1 ? "Chính xác!" : "Đúng rồi!"}
            </div>
            {attempts > 1 && <div className="mt-0.5 text-sm">Lần sau cố gõ đúng ngay lần đầu nhé.</div>}
          </div>
          {mode !== "copy" && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-2xl font-bold">{word.word}</div>
                <div className="ipa text-sm text-ink-3">{word.ipa}</div>
              </div>
              <SpeakWord word={word.word} size="sm" />
            </div>
          )}
          <div className="flex justify-end">
            <Button onClick={onPass} autoFocus>
              {passLabel} <Kbd>Enter</Kbd>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Ô "gõ lại cho đúng" sau khi đã xem đáp án (dùng trong Ôn tập). */
export function RetypeBox({ word, onDone }: { word: Word; onDone: () => void }) {
  const [input, setInput] = useState("");
  const [wrong, setWrong] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (isSpelledRight(input, word)) onDone();
    else {
      setWrong(true);
      setInput("");
    }
  };

  return (
    <form onSubmit={submit} className="rounded-xl border border-warn/40 bg-warn-soft p-3">
      <label htmlFor={`retype-${word.id}`} className="mb-2 block text-sm font-medium text-warn">
        Gõ lại từ đúng một lần để nhớ cách viết
      </label>
      <div className="flex gap-2">
        <input
          id={`retype-${word.id}`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoFocus
          {...NO_ASSIST}
          placeholder={word.word.replace(/[a-z]/gi, "·")}
          className={`min-w-0 flex-1 rounded-lg border bg-surface px-3 py-2 text-lg outline-none focus:ring-2 focus:ring-accent/25 ${
            wrong ? "border-bad" : "border-line focus:border-accent"
          }`}
        />
        <Button type="submit" disabled={!input.trim()}>
          OK
        </Button>
      </div>
      {wrong && <p className="mt-1.5 text-sm text-bad">Chưa khớp, nhìn đáp án ở trên và gõ lại.</p>}
    </form>
  );
}

type QuizItem = { id: string; retry: boolean };

/**
 * Bài gõ chính tả nhiều từ (kiểm tra cuối buổi, luyện từ hay sai).
 * Lần gõ đầu của mỗi từ được ghi vào thẻ; từ sai được hỏi lại một lần ở cuối lượt.
 */
export function SpellQuiz({
  words,
  mode,
  preferReal,
  onExit,
  exitLabel = "Xong",
}: {
  words: Word[];
  mode: Exclude<SpellMode, "copy">;
  preferReal: boolean;
  onExit: () => void;
  exitLabel?: string;
}) {
  // Giữ nguyên danh sách lúc bắt đầu: thẻ thay đổi trong lúc làm bài không làm đổi lượt.
  const [list] = useState(() => shuffle(words));
  const [queue, setQueue] = useState<QuizItem[]>(() => list.map((w) => ({ id: w.id, retry: false })));
  const [pos, setPos] = useState(0);
  const [missed, setMissed] = useState<string[]>([]);
  const byId = Object.fromEntries(list.map((w) => [w.id, w]));

  if (pos >= queue.length) {
    const right = list.length - missed.length;
    return (
      <Card className="text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-good-soft text-good">
          <Icon name="check" className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold">Xong bài chính tả!</h2>
        <p className="mt-1 text-sm text-ink-2">
          Gõ đúng ngay lần đầu {right}/{list.length} từ.
          {missed.length > 0 && " Các từ sai được đưa vào “Từ hay viết sai” để luyện lại."}
        </p>
        {missed.length > 0 && (
          <ul className="mt-4 flex flex-wrap justify-center gap-1.5">
            {missed.map((id) => (
              <li key={id} className="rounded-full border border-bad/30 bg-bad-soft px-2.5 py-0.5 text-sm text-bad">
                {byId[id].word}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-5 flex justify-center">
          <Button onClick={onExit} autoFocus>
            {exitLabel}
          </Button>
        </div>
      </Card>
    );
  }

  const item = queue[pos];
  const firstPass = queue.filter((q) => !q.retry).length;
  const done = queue.slice(0, pos).filter((q) => !q.retry).length;

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <ProgressBar value={done} max={firstPass} label="Tiến độ bài chính tả" />
        <span className="tabular shrink-0 text-sm font-medium text-ink-2">
          {done}/{firstPass}
        </span>
      </div>
      <Card>
        {item.retry && (
          <div className="mb-3">
            <Badge tone="warn">Gõ lại từ vừa sai</Badge>
          </div>
        )}
        <SpellTask
          key={`${pos}-${item.id}`}
          word={byId[item.id]}
          mode={mode}
          preferReal={preferReal}
          onFirstTry={(ok) => {
            if (item.retry) return;
            recordSpelling(item.id, ok);
            if (!ok) {
              setMissed((m) => [...m, item.id]);
              setQueue((q) => [...q, { id: item.id, retry: true }]);
            }
          }}
          onPass={() => setPos((p) => p + 1)}
        />
      </Card>
    </div>
  );
}

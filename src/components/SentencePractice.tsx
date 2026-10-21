"use client";

import { useRef, useState, type FormEvent } from "react";
import { TOPIC_BY_ID } from "@/data/topics";
import { requestSentenceFeedback } from "@/lib/ai-client";
import { recordSentence } from "@/lib/store";
import type { SentenceFeedback, Word } from "@/lib/types";
import { Icon } from "./Icon";
import { SentenceFeedbackView } from "./SentenceFeedbackView";
import { Button, Kbd } from "./ui";

const MAX_LENGTH = 300;

/** Viết một câu có dùng từ, gửi AI chữa, lưu lỗi vào sổ. */
export function SentencePractice({ word }: { word: Word }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<SentenceFeedback | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    const sentence = text.trim();
    if (!sentence || loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await requestSentenceFeedback({ word: word.word, meaningVi: word.vi, sentence });
      setFeedback(result);
      // Chỉ lưu khi AI chấm được (câu tiếng Anh hợp lệ).
      if (result.corrected) recordSentence(word.id, word.word, result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không chấm được câu, thử lại nhé.");
    } finally {
      setLoading(false);
    }
  };

  const insert = (phrase: string) => {
    setText((t) => (t.trim() ? `${t.trimEnd()} ${phrase}` : phrase));
    inputRef.current?.focus();
  };

  const again = () => {
    setFeedback(null);
    setText("");
    setError(null);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  if (feedback) {
    return (
      <div className="space-y-4">
        <SentenceFeedbackView feedback={feedback} targetWord={word.word} />
        <Button variant="secondary" onClick={again}>
          Viết câu khác với “{word.word}”
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label htmlFor={`sentence-${word.id}`} className="font-medium">
          Viết 1 câu về bạn có dùng <strong className="text-accent-strong">{word.word}</strong>
        </label>
        <p className="mt-0.5 text-sm text-ink-3">
          Gợi ý Part 1: <em>“{TOPIC_BY_ID[word.topic].sampleQuestion}”</em>
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {word.collocations.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => insert(c)}
            className="rounded-full border border-line px-2.5 py-0.5 text-sm text-ink-2 hover:border-accent hover:text-accent-strong"
            title="Chèn vào câu"
          >
            + {c}
          </button>
        ))}
      </div>
      <textarea
        id={`sentence-${word.id}`}
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) void submit();
        }}
        rows={3}
        placeholder="Viết về công việc, việc học, nơi ở, sở thích… của chính bạn"
        spellCheck={false}
        autoCapitalize="sentences"
        className="w-full resize-y rounded-xl border border-line bg-surface px-4 py-3 text-lg outline-none placeholder:text-ink-3/70 focus:border-accent focus:ring-2 focus:ring-accent/25"
      />
      {error && (
        <p role="alert" className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">
          {error}
        </p>
      )}
      <div className="flex items-center justify-between gap-2">
        <span className="tabular text-xs text-ink-3">
          {text.length}/{MAX_LENGTH}
        </span>
        <Button type="submit" disabled={!text.trim() || loading}>
          {loading ? (
            "AI đang chữa…"
          ) : (
            <>
              <Icon name="check" /> Chữa câu <span className="hidden sm:inline"><Kbd>Ctrl</Kbd> <Kbd>Enter</Kbd></span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

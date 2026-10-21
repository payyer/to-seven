"use client";

import { useState } from "react";
import { DICTATIONS, type DictationItem } from "@/data/dictation";
import { WORD_BY_ID } from "@/data/words";
import { canSpeak, speak } from "@/lib/speech";
import { recordDictation, useAppState } from "@/lib/store";
import { diffAccuracy, splitSentences, wordDiff } from "@/lib/text";
import type { DictationResult } from "@/lib/types";
import { DiffLegend, DiffText } from "../DiffText";
import { Icon } from "../Icon";
import { Badge, Button, Card, Kbd, Loading, PageHeader } from "../ui";

type Source = "library" | "words" | "custom";
type Exercise = { id: string; title: string; text: string; vi?: string };

const MAX_CUSTOM = 600;

function bestScores(results: DictationResult[]): Map<string, number> {
  const best = new Map<string, number>();
  for (const r of results) best.set(r.itemId, Math.max(best.get(r.itemId) ?? 0, r.accuracy));
  return best;
}

export function DictationView() {
  const state = useAppState();
  const [source, setSource] = useState<Source>("library");
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [custom, setCustom] = useState("");

  if (!state) return <Loading />;

  const learnedWords = Object.values(state.cards)
    .filter((c) => !c.known && WORD_BY_ID[c.wordId])
    .map((c) => WORD_BY_ID[c.wordId]);

  const randomWordExercise = (): Exercise | null => {
    if (learnedWords.length === 0) return null;
    const w = learnedWords[Math.floor(Math.random() * learnedWords.length)];
    return { id: `word:${w.id}`, title: `Câu ví dụ của từ “${w.word}”`, text: w.example, vi: w.exampleVi };
  };

  if (exercise) {
    const next = () => {
      if (exercise.id.startsWith("word:")) return setExercise(randomWordExercise());
      const i = DICTATIONS.findIndex((d) => d.id === exercise.id);
      setExercise(i >= 0 && i + 1 < DICTATIONS.length ? fromItem(DICTATIONS[i + 1]) : null);
    };
    return (
      <div>
        <PageHeader title="Nghe – chép" subtitle={exercise.title}>
          <Button variant="ghost" onClick={() => setExercise(null)}>
            Chọn bài khác
          </Button>
        </PageHeader>
        <DictationPlayer key={exercise.id + exercise.text} exercise={exercise} onNext={exercise.id === "custom" ? undefined : next} />
      </div>
    );
  }

  const best = bestScores(state.dictations);

  return (
    <div className="space-y-4">
      <PageHeader title="Nghe – chép" subtitle="Nghe rồi gõ lại chính xác từng từ. App tô đỏ chỗ sai, xanh chỗ còn thiếu." />

      {!canSpeak() && (
        <p className="rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn">
          Trình duyệt này không hỗ trợ đọc văn bản (SpeechSynthesis). Hãy dùng Chrome hoặc Edge.
        </p>
      )}

      <div className="flex rounded-xl bg-surface-2 p-1 text-sm" role="tablist" aria-label="Nguồn bài nghe">
        {(
          [
            ["library", "Bài có sẵn"],
            ["words", "Câu từ đã học"],
            ["custom", "Tự soạn"],
          ] as [Source, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={source === id}
            onClick={() => setSource(id)}
            className={`flex-1 rounded-lg px-3 py-2 font-medium ${source === id ? "bg-surface text-ink shadow-sm" : "text-ink-3 hover:text-ink"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {source === "library" &&
        (["A1", "A2", "B1"] as const).map((level) => (
          <section key={level}>
            <h2 className="mb-2 text-xs font-semibold tracking-wide text-ink-3 uppercase">
              {level} · {level === "A1" ? "một câu ngắn" : level === "A2" ? "1–2 câu" : "đoạn ngắn"}
            </h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {DICTATIONS.filter((d) => d.level === level).map((d) => {
                const score = best.get(d.id);
                return (
                  <li key={d.id}>
                    <button
                      type="button"
                      onClick={() => setExercise(fromItem(d))}
                      className="flex w-full items-center justify-between gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-left hover:border-accent"
                    >
                      <span>
                        <span className="font-medium">{d.title}</span>
                        <span className="block text-xs text-ink-3">{d.text.split(/\s+/).length} từ</span>
                      </span>
                      {score !== undefined && (
                        <Badge tone={score >= 0.95 ? "good" : "neutral"}>{Math.round(score * 100)}%</Badge>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

      {source === "words" && (
        <Card>
          {learnedWords.length === 0 ? (
            <p className="text-sm text-ink-2">Chưa có từ nào đã học. Học vài từ mới để luyện nghe câu ví dụ của chúng.</p>
          ) : (
            <>
              <p className="text-sm text-ink-2">
                Nghe câu ví dụ của một trong {learnedWords.length} từ bạn đã học — vừa luyện nghe vừa ôn từ trong ngữ cảnh.
              </p>
              <Button className="mt-3" onClick={() => setExercise(randomWordExercise())}>
                <Icon name="headphones" /> Nghe một câu ngẫu nhiên
              </Button>
            </>
          )}
        </Card>
      )}

      {source === "custom" && (
        <Card>
          <label htmlFor="custom-text" className="font-medium">
            Dán đoạn tiếng Anh bạn muốn luyện
          </label>
          <p className="mt-0.5 text-sm text-ink-3">Ví dụ: câu trả lời Speaking bạn tự soạn, hoặc một đoạn trong bài Writing.</p>
          <textarea
            id="custom-text"
            value={custom}
            onChange={(e) => setCustom(e.target.value.slice(0, MAX_CUSTOM))}
            rows={4}
            className="mt-3 w-full rounded-xl border border-line bg-surface px-4 py-3 outline-none focus:border-accent focus:ring-2 focus:ring-accent/25"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="tabular text-xs text-ink-3">
              {custom.length}/{MAX_CUSTOM}
            </span>
            <Button
              disabled={custom.trim().split(/\s+/).length < 2}
              onClick={() => setExercise({ id: "custom", title: "Văn bản tự soạn", text: custom.trim().replace(/\s+/g, " ") })}
            >
              Bắt đầu nghe
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function fromItem(d: DictationItem): Exercise {
  return { id: d.id, title: `${d.level} · ${d.title}`, text: d.text, vi: d.vi };
}

function DictationPlayer({ exercise, onNext }: { exercise: Exercise; onNext?: () => void }) {
  const [answer, setAnswer] = useState("");
  const [plays, setPlays] = useState(0);
  const [strict, setStrict] = useState(false);
  const [checked, setChecked] = useState(false);
  const sentences = splitSentences(exercise.text);

  const play = (text: string, rate: number) => {
    speak(text, rate);
    setPlays((p) => p + 1);
  };

  const ops = checked ? wordDiff(exercise.text, answer, strict) : [];
  const accuracy = diffAccuracy(ops);

  const check = () => {
    if (!answer.trim() || checked) return;
    setChecked(true);
    recordDictation(exercise.id, diffAccuracy(wordDiff(exercise.text, answer, strict)));
  };

  const retry = () => {
    setChecked(false);
    setAnswer("");
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => play(exercise.text, 0.9)}>
          <Icon name="volume" /> Nghe
        </Button>
        <Button variant="secondary" onClick={() => play(exercise.text, 0.65)}>
          <Icon name="slow" /> Nghe chậm
        </Button>
        {sentences.length > 1 &&
          sentences.map((s, i) => (
            <Button key={i} variant="ghost" onClick={() => play(s, 0.75)} title={`Nghe riêng câu ${i + 1}`}>
              Câu {i + 1}
            </Button>
          ))}
        <span className="tabular ml-auto text-xs text-ink-3">Đã nghe {plays} lần</span>
      </div>

      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) check();
        }}
        readOnly={checked}
        rows={sentences.length > 1 ? 4 : 2}
        placeholder="Gõ lại những gì bạn nghe được…"
        aria-label="Phần bạn chép lại"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        className="mt-4 w-full rounded-xl border border-line bg-surface px-4 py-3 text-lg outline-none focus:border-accent focus:ring-2 focus:ring-accent/25"
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-ink-2">
          <input
            type="checkbox"
            checked={strict}
            onChange={(e) => setStrict(e.target.checked)}
            disabled={checked}
            className="h-4 w-4 accent-accent"
          />
          Tính cả viết hoa và dấu câu
        </label>
        {!checked ? (
          <Button onClick={check} disabled={!answer.trim()}>
            Kiểm tra <span className="hidden sm:inline"><Kbd>Ctrl</Kbd> <Kbd>Enter</Kbd></span>
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={retry}>
              Làm lại
            </Button>
            {onNext && (
              <Button onClick={onNext}>
                Bài tiếp <Icon name="arrowRight" />
              </Button>
            )}
          </div>
        )}
      </div>

      {checked && (
        <div className="mt-5 space-y-3 border-t border-line pt-4">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-semibold">Kết quả</h3>
            <span
              className={`tabular text-2xl font-bold ${accuracy >= 0.95 ? "text-good" : accuracy >= 0.7 ? "text-warn" : "text-bad"}`}
            >
              {Math.round(accuracy * 100)}%
            </span>
          </div>
          <DiffText ops={ops} className="text-lg" />
          <DiffLegend />
          <div className="rounded-xl bg-surface-2 p-3 text-sm">
            <p className="font-medium">{exercise.text}</p>
            {exercise.vi && <p className="mt-1 text-ink-2">{exercise.vi}</p>}
          </div>
        </div>
      )}
    </Card>
  );
}

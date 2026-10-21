"use client";

import { useEffect, useRef, useState } from "react";
import { SPEAKING_BY_ID, SPEAKING_QUESTIONS } from "@/data/speaking-questions";
import { TOPIC_BY_ID, TOPICS } from "@/data/topics";
import { requestSpeakingFeedback } from "@/lib/ai-client";
import { formatShort } from "@/lib/date";
import { recentWords } from "@/lib/planner";
import { isRecognitionSupported, startRecognition, type Recognizer } from "@/lib/speech-recognition";
import { recordSpeaking, useAppState } from "@/lib/store";
import { findWordInSentence } from "@/lib/text";
import type { PeerStatus, SpeakingFeedback, TopicId, Word } from "@/lib/types";
import { countWords } from "@/lib/writing";
import { Icon } from "../Icon";
import { MicButton } from "../MicButton";
import { SpeakText } from "../Pronounce";
import { SpeakingFeedbackView } from "../SpeakingFeedbackView";
import { Badge, Button, Card, Kbd, Loading, PageHeader } from "../ui";

function pickQuestion(topic: TopicId | "all", exclude?: string): string {
  const pool = SPEAKING_QUESTIONS.filter((q) => (topic === "all" || q.topic === topic) && q.id !== exclude);
  return pool[Math.floor(Math.random() * pool.length)].id;
}

const PEER_DOT: Record<PeerStatus, string> = { good: "bg-good", weak: "bg-warn", missing: "bg-bad" };

export function SpeakingView() {
  const state = useAppState();
  const [topic, setTopic] = useState<TopicId | "all">("all");
  const [questionId, setQuestionId] = useState(SPEAKING_QUESTIONS[0].id);
  const [round, setRound] = useState(0);

  if (!state) return <Loading />;
  const question = SPEAKING_BY_ID[questionId];
  const words = recentWords(state.cards, state.today);
  const history = state.speaking.slice(-5).reverse();

  const next = () => {
    setQuestionId(pickQuestion(topic, questionId));
    setRound((r) => r + 1);
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Speaking Part 1" subtitle="Trả lời 2–4 câu (20–30 giây). Nói bằng micro hoặc gõ.">
        <select
          value={topic}
          onChange={(e) => {
            const t = e.target.value as TopicId | "all";
            setTopic(t);
            setQuestionId(pickQuestion(t));
            setRound((r) => r + 1);
          }}
          aria-label="Chủ đề"
          className="rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        >
          <option value="all">Mọi chủ đề</option>
          {TOPICS.filter((t) => SPEAKING_QUESTIONS.some((q) => q.topic === t.id)).map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </PageHeader>

      <Card>
        <div className="flex items-center justify-between gap-2">
          <Badge>{TOPIC_BY_ID[question.topic].name}</Badge>
          <Button variant="ghost" onClick={next}>
            <Icon name="repeat" /> Câu khác
          </Button>
        </div>
        <div className="mt-3 flex items-start gap-2">
          <p className="flex-1 text-2xl leading-snug font-semibold">{question.question}</p>
          <SpeakText text={question.question} label="Nghe câu hỏi" />
        </div>
      </Card>

      <AnswerPanel key={`${questionId}-${round}`} question={question} words={words} onNext={next} />

      {history.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-semibold tracking-wide text-ink-3 uppercase">Lượt nói gần đây</h2>
          <ul className="space-y-2">
            {history.map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{h.question}</span>
                  <span className="text-xs text-ink-3">
                    {formatShort(h.createdAt)} · {h.inputMode === "voice" ? "nói" : "gõ"} · {h.feedback.issues.length} lỗi
                  </span>
                </span>
                <span className="flex shrink-0 gap-1" aria-label="PEER: Point, Explain, Example, Result">
                  {(["point", "explain", "example", "result"] as const).map((k) => (
                    <span key={k} title={k} className={`h-2.5 w-2.5 rounded-full ${PEER_DOT[h.feedback.peer[k].status]}`} />
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function AnswerPanel({
  question,
  words,
  onNext,
}: {
  question: { id: string; question: string };
  words: Word[];
  onNext: () => void;
}) {
  const [text, setText] = useState("");
  const [interim, setInterim] = useState("");
  const [listening, setListening] = useState(false);
  const [usedVoice, setUsedVoice] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ feedback: SpeakingFeedback; durationSec: number | null } | null>(null);
  const recognizer = useRef<Recognizer | null>(null);
  const [supported] = useState(() => isRecognitionSupported());

  // Đồng hồ khi đang nói; dừng micro khi rời trang (Activity ẩn trang sẽ chạy cleanup).
  useEffect(() => {
    if (!listening) return;
    const timer = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(timer);
  }, [listening]);
  useEffect(() => () => recognizer.current?.stop(), []);

  const toggleMic = () => {
    if (listening) {
      recognizer.current?.stop();
      return;
    }
    setMicError(null);
    const base = text.trim();
    recognizer.current = startRecognition({
      onText: (finalText, partial) => {
        setText([base, finalText].filter(Boolean).join(" "));
        setInterim(partial);
      },
      onError: setMicError,
      onStop: () => {
        setListening(false);
        setInterim("");
        recognizer.current = null;
      },
    });
    if (recognizer.current) {
      setListening(true);
      setUsedVoice(true);
    }
  };

  const submit = async () => {
    const answer = text.trim();
    if (countWords(answer) < 3 || loading) return;
    recognizer.current?.stop();
    setLoading(true);
    setError(null);
    try {
      const feedback = await requestSpeakingFeedback({
        question: question.question,
        answer,
        inputMode: usedVoice ? "voice" : "text",
        recentWords: words.map((w) => ({ word: w.word, vi: w.vi })),
      });
      const durationSec = usedVoice ? seconds : null;
      setResult({ feedback, durationSec });
      if (feedback.improvedAnswer) {
        recordSpeaking({
          questionId: question.id,
          question: question.question,
          inputMode: usedVoice ? "voice" : "text",
          durationSec,
          feedback,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không nhận được góp ý, thử lại nhé.");
    } finally {
      setLoading(false);
    }
  };

  const retry = () => {
    setResult(null);
    setText("");
    setSeconds(0);
    setUsedVoice(false);
  };

  if (result) {
    return (
      <Card>
        <h2 className="mb-1 font-semibold">Góp ý</h2>
        <p className="mb-4 rounded-lg bg-surface-2 px-3 py-2 text-sm text-ink-2">“{result.feedback.answer}”</p>
        <SpeakingFeedbackView feedback={result.feedback} durationSec={result.durationSec} />
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={retry}>
            Trả lời lại câu này
          </Button>
          <Button onClick={onNext}>
            Câu hỏi tiếp <Icon name="arrowRight" />
          </Button>
        </div>
      </Card>
    );
  }

  const wordCount = countWords(text);

  return (
    <Card>
      {words.length > 0 && (
        <div className="mb-4">
          <p className="mb-1.5 text-xs text-ink-3">Thử dùng 1–2 từ mới học (từ đã dùng sẽ sáng lên):</p>
          <div className="flex flex-wrap gap-1.5">
            {words.map((w) => {
              const used = !!findWordInSentence(text, w.word);
              return (
                <span
                  key={w.id}
                  title={w.vi}
                  className={`rounded-full border px-2.5 py-0.5 text-sm ${
                    used ? "border-good/40 bg-good-soft font-semibold text-good" : "border-line text-ink-2"
                  }`}
                >
                  {used && <Icon name="check" className="mr-1 inline h-3 w-3" />}
                  {w.word}
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <MicButton listening={listening} disabled={!supported || loading} onToggle={toggleMic} />
        <div className="min-w-0 text-sm">
          {!supported ? (
            <p className="text-warn">Trình duyệt này không nhận giọng nói. Hãy gõ câu trả lời, hoặc dùng Chrome (Android) / Safari (iPhone).</p>
          ) : listening ? (
            <p className="font-medium text-bad">
              Đang nghe… <span className="tabular">{seconds}s</span> — bấm lần nữa để dừng
            </p>
          ) : (
            <p className="text-ink-2">Bấm mic và trả lời như đang thi. Nói xong có thể sửa lại chữ máy nghe nhầm.</p>
          )}
          {micError && <p className="mt-1 text-bad">{micError}</p>}
        </div>
      </div>

      <label htmlFor="speaking-answer" className="sr-only">
        Câu trả lời
      </label>
      <textarea
        id="speaking-answer"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) void submit();
        }}
        readOnly={listening}
        rows={4}
        placeholder="Câu trả lời của bạn sẽ hiện ở đây — hoặc gõ trực tiếp"
        spellCheck={false}
        className="mt-4 w-full rounded-xl border border-line bg-surface px-4 py-3 text-lg outline-none focus:border-accent focus:ring-2 focus:ring-accent/25"
      />
      {interim && <p className="mt-1 text-sm text-ink-3 italic">{interim}…</p>}

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">
          {error}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="tabular text-xs text-ink-3">{wordCount} từ · Part 1 nên 30–60 từ</span>
        <Button onClick={submit} disabled={wordCount < 3 || loading || listening}>
          {loading ? "AI đang nghe lại…" : "Nhận góp ý"}
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

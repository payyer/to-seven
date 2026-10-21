"use client";

import { useEffect, useState } from "react";
import { PLACEMENT_BANDS } from "@/data/placement";
import { TOPIC_BY_ID } from "@/data/topics";
import { WORDS } from "@/data/words";
import { formatLong } from "@/lib/date";
import { IELTS_HINT, scorePlacement, TARGET_FAMILIES, type PlacementAnswer } from "@/lib/placement";
import { savePlacement, useAppState } from "@/lib/store";
import type { PlacementResult, TopicId } from "@/lib/types";
import { Icon } from "../Icon";
import { Button, ButtonLink, Card, Kbd, Loading, PageHeader, ProgressBar } from "../ui";

type Question = { band: number; word: string; options: string[]; answer: string };

const STARTER_TOPICS: TopicId[] = ["work", "study", "hometown", "home", "hobbies"];

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuestions(): Question[] {
  return PLACEMENT_BANDS.flatMap((b) =>
    b.items.map((item) => ({ band: b.band, word: item.word, options: shuffle(item.options), answer: item.options[0] })),
  );
}

export function PlacementView() {
  const state = useAppState();
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [answers, setAnswers] = useState<PlacementAnswer[]>([]);

  if (!state) return <Loading />;

  const start = () => {
    setQuestions(buildQuestions());
    setAnswers([]);
  };

  if (!questions) {
    return state.placement ? (
      <ResultView result={state.placement} onRetake={start} />
    ) : (
      <IntroCard onStart={start} />
    );
  }

  const choose = (choice: string | null) => {
    const q = questions[answers.length];
    const next = [...answers, { band: q.band, correct: choice === null ? null : choice === q.answer }];
    if (next.length === questions.length) {
      savePlacement(scorePlacement(next, state.today));
      setQuestions(null);
      setAnswers([]);
    } else {
      setAnswers(next);
    }
  };

  return (
    <QuestionCard
      key={answers.length}
      question={questions[answers.length]}
      index={answers.length}
      total={questions.length}
      onChoose={choose}
    />
  );
}

function IntroCard({ onStart }: { onStart: () => void }) {
  return (
    <div>
      <PageHeader title="Kiểm tra từ vựng đầu vào" subtitle="30 từ, khó dần từ A1 đến B2 · khoảng 5 phút" />
      <Card>
        <ul className="space-y-2 text-sm text-ink-2">
          <li className="flex gap-2">
            <Icon name="target" className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            Mỗi câu hiện một từ tiếng Anh, bạn chọn nghĩa tiếng Việt đúng.
          </li>
          <li className="flex gap-2">
            <Icon name="bulb" className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <span>
              <strong className="text-ink">Đừng đoán mò.</strong> Không chắc thì bấm “Tôi không biết”. Câu chọn sai bị trừ điểm để bù cho
              việc đoán trúng.
            </span>
          </li>
          <li className="flex gap-2">
            <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            Kết quả: ước lượng số word family bạn biết, trình độ tương ứng và nhóm từ nên học trước.
          </li>
        </ul>
        <div className="mt-6">
          <Button onClick={onStart} autoFocus>
            Bắt đầu <Icon name="arrowRight" />
          </Button>
        </div>
      </Card>
    </div>
  );
}

function QuestionCard({
  question,
  index,
  total,
  onChoose,
}: {
  question: Question;
  index: number;
  total: number;
  onChoose: (choice: string | null) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const i = ["1", "2", "3", "4"].indexOf(e.key);
      if (i >= 0) onChoose(question.options[i]);
      else if (e.key === "0" || e.key === "5") onChoose(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [question, onChoose]);

  return (
    <div>
      <PageHeader title="Kiểm tra từ vựng" subtitle={PLACEMENT_BANDS[question.band - 1].label} />
      <div className="mb-4 flex items-center gap-3">
        <ProgressBar value={index} max={total} label="Tiến độ bài kiểm tra" />
        <span className="tabular shrink-0 text-sm font-medium text-ink-2">
          {index + 1}/{total}
        </span>
      </div>
      <Card>
        <div className="py-6 text-center">
          <div className="text-sm text-ink-3">Nghĩa của từ</div>
          <div className="mt-1 text-4xl font-bold tracking-tight">{question.word}</div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {question.options.map((opt, i) => (
            <button
              key={opt}
              type="button"
              onClick={() => onChoose(opt)}
              className="flex items-center gap-3 rounded-xl border border-line px-4 py-3 text-left transition-colors hover:border-accent hover:bg-accent-soft"
            >
              <Kbd>{i + 1}</Kbd>
              <span className="font-medium">{opt}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onChoose(null)}
          className="mt-3 w-full rounded-xl border border-dashed border-line px-4 py-3 text-sm text-ink-2 hover:bg-surface-2"
        >
          Tôi không biết từ này <Kbd>0</Kbd>
        </button>
      </Card>
    </div>
  );
}

function ResultView({ result, onRetake }: { result: PlacementResult; onRetake: () => void }) {
  const available = WORDS.filter((w) => w.level === result.recommendedLevel).length;
  return (
    <div>
      <PageHeader title="Kết quả kiểm tra từ vựng" subtitle={`Làm ngày ${formatLong(result.takenAt)}`}>
        <Button variant="secondary" onClick={onRetake}>
          Làm lại
        </Button>
      </PageHeader>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="sm:col-span-1">
          <div className="text-xs text-ink-3">Trình độ từ vựng</div>
          <div className="mt-1 text-4xl font-bold text-accent-strong">{result.level}</div>
          <div className="mt-1 text-xs text-ink-3">IELTS {IELTS_HINT[result.level]}</div>
        </Card>
        <Card className="sm:col-span-2">
          <div className="text-xs text-ink-3">Vốn từ ước tính</div>
          <div className="mt-1 text-2xl font-semibold">
            ~{result.estimatedFamilies.toLocaleString("vi-VN")} <span className="text-base font-normal text-ink-2">word family</span>
          </div>
          <div className="mt-3">
            <ProgressBar value={result.estimatedFamilies} max={TARGET_FAMILIES} label="Vốn từ so với mục tiêu" />
            <div className="mt-1 text-xs text-ink-3">
              Mục tiêu band 5.5 cần khoảng {TARGET_FAMILIES.toLocaleString("vi-VN")} word family
            </div>
          </div>
        </Card>
      </div>

      <Card className="mt-3">
        <h2 className="font-semibold">Nên học trước</h2>
        <p className="mt-1 text-sm text-ink-2">
          Nhóm từ <strong className="text-ink">{result.recommendedLevel}</strong> ({available} từ trong kho). App đã đặt nhóm này làm ưu tiên khi
          chọn từ mới mỗi ngày. Bắt đầu với các chủ đề Part 1 hay gặp:
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {STARTER_TOPICS.map((t) => (
            <span key={t} className="rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-accent-strong">
              {TOPIC_BY_ID[t].name}
            </span>
          ))}
        </div>
        <div className="mt-5">
          <ButtonLink href="/learn">
            Học ngay <Icon name="arrowRight" />
          </ButtonLink>
        </div>
      </Card>

      <Card className="mt-3">
        <h2 className="mb-3 font-semibold">Chi tiết theo nhóm độ khó</h2>
        <ul className="space-y-3">
          {result.bands.map((b) => (
            <li key={b.band}>
              <div className="mb-1 flex justify-between gap-2 text-sm">
                <span className="font-medium">{b.label}</span>
                <span className="tabular text-ink-3">
                  {b.correct} đúng · {b.wrong} sai · {b.unknown} không biết
                </span>
              </div>
              <ProgressBar value={Math.round(b.ratio * 100)} max={100} label={`Mức nắm ${b.label}`} />
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-ink-3">
          Đây là ước lượng nhanh từ 30 câu, chỉ để chọn điểm bắt đầu. Điểm mỗi nhóm = đúng − sai/3 (trừ phần đoán mò). Mốc quy đổi
          IELTS chỉ để tham khảo.
        </p>
      </Card>
    </div>
  );
}

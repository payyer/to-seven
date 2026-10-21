"use client";

import { useState } from "react";
import { CLASS_LISTS } from "@/data/class-words";
import { TOPICS } from "@/data/topics";
import { WORDS } from "@/data/words";
import { formatLong } from "@/lib/date";
import { isMastered } from "@/lib/srs";
import { useAppState } from "@/lib/store";
import { normalizeAnswer } from "@/lib/text";
import { LEVELS, type CardState, type Level, type TopicId, type Word } from "@/lib/types";
import { Icon } from "../Icon";
import { SpeakWord, StressWord } from "../Pronounce";
import { Badge, Loading, PageHeader } from "../ui";
import { Usage, WordMeta } from "../WordBits";

type Status = "all" | "new" | "learning" | "mastered";

const STATUS_LABEL: Record<Status, string> = {
  all: "Tất cả",
  new: "Chưa học",
  learning: "Đang học",
  mastered: "Đã thuộc",
};

function statusOf(card: CardState | undefined): Exclude<Status, "all"> {
  if (!card) return "new";
  return isMastered(card) ? "mastered" : "learning";
}

/** Chủ đề, hoặc một LIST trên lớp ("list-3"). */
type TopicFilter = TopicId | "all" | `list-${number}`;

function matchesTopic(w: Word, filter: TopicFilter): boolean {
  if (filter === "all") return true;
  // "Từ trên lớp" gồm cả từ đã có sẵn ở chủ đề khác nhưng nằm trong LIST.
  if (filter === "class") return Boolean(w.classLists?.length);
  if (filter.startsWith("list-")) return w.classLists?.includes(Number(filter.slice(5))) ?? false;
  return w.topic === filter;
}

const SELECT =
  "rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/25";

export function WordsView() {
  const state = useAppState();
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<TopicFilter>("all");
  const [level, setLevel] = useState<Level | "all">("all");
  const [status, setStatus] = useState<Status>("all");

  if (!state) return <Loading />;
  const { cards } = state;

  const q = normalizeAnswer(query);
  const list = WORDS.filter(
    (w) =>
      matchesTopic(w, topic) &&
      (level === "all" || w.level === level) &&
      (status === "all" || statusOf(cards[w.id]) === status) &&
      (!q || w.word.toLowerCase().includes(q) || w.vi.toLowerCase().includes(q)),
  );

  return (
    <div>
      <PageHeader title="Kho từ" subtitle={`${WORDS.length} từ theo chủ đề IELTS Speaking Part 1 và các LIST trên lớp`} />

      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm từ tiếng Anh hoặc nghĩa tiếng Việt…"
          aria-label="Tìm từ"
          className={SELECT}
        />
        <select value={topic} onChange={(e) => setTopic(e.target.value as TopicFilter)} aria-label="Chủ đề" className={SELECT}>
          <option value="all">Mọi chủ đề</option>
          {TOPICS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
          <optgroup label="Từng LIST trên lớp">
            {CLASS_LISTS.map((l) => (
              <option key={l.list} value={`list-${l.list}`}>
                LIST {l.list} · {l.title}
              </option>
            ))}
          </optgroup>
        </select>
        <select value={level} onChange={(e) => setLevel(e.target.value as Level | "all")} aria-label="Level" className={SELECT}>
          <option value="all">Mọi level</option>
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as Status)} aria-label="Trạng thái" className={SELECT}>
          {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      <p className="tabular mb-2 text-sm text-ink-3">{list.length} từ</p>

      <ul className="space-y-2">
        {list.map((w) => {
          const card = cards[w.id];
          const s = statusOf(card);
          return (
            <li key={w.id}>
              <details className="group rounded-2xl border border-line bg-surface open:shadow-sm">
                <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="font-semibold">{w.word}</span>
                      <span className="ipa text-sm text-ink-3">{w.ipa}</span>
                    </div>
                    <div className="truncate text-sm text-ink-2">{w.vi}</div>
                  </div>
                  {s !== "new" && <Badge tone={s === "mastered" ? "good" : "accent"}>{STATUS_LABEL[s]}</Badge>}
                  <Badge>{w.level}</Badge>
                  <Icon name="chevronDown" className="h-4 w-4 shrink-0 text-ink-3 transition-transform group-open:rotate-180" />
                </summary>
                <div className="space-y-4 border-t border-line px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <StressWord stress={w.stress} size="md" />
                    <SpeakWord word={w.word} size="sm" />
                  </div>
                  <WordMeta word={w} />
                  <Usage word={w} />
                  {card && (
                    <p className="text-xs text-ink-3">
                      Học ngày {formatLong(card.learnedAt)} · lần ôn tới {formatLong(card.due)} · khoảng cách {card.interval} ngày
                    </p>
                  )}
                </div>
              </details>
            </li>
          );
        })}
      </ul>
      {list.length === 0 && <p className="py-10 text-center text-sm text-ink-3">Không có từ nào khớp bộ lọc.</p>}
    </div>
  );
}

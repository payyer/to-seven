import { TOPIC_BY_ID } from "@/data/topics";
import { findWordInSentence } from "@/lib/text";
import { POS_LABEL, type Word } from "@/lib/types";
import { SpeakText } from "./Pronounce";
import { Badge } from "./ui";

export function WordMeta({ word }: { word: Word }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge tone="accent">{POS_LABEL[word.pos]}</Badge>
      <Badge>{word.level}</Badge>
      <Badge>{TOPIC_BY_ID[word.topic].name}</Badge>
      {word.classLists?.map((n) => (
        <Badge key={n} tone="good">
          LIST {n}
        </Badge>
      ))}
    </div>
  );
}

/** Câu có từ đang học được tô đậm. */
export function Highlighted({ sentence, word }: { sentence: string; word: string }) {
  const range = findWordInSentence(sentence, word);
  if (!range) return <>{sentence}</>;
  return (
    <>
      {sentence.slice(0, range[0])}
      <mark className="rounded bg-accent-soft px-0.5 font-semibold text-accent-strong">{sentence.slice(...range)}</mark>
      {sentence.slice(range[1])}
    </>
  );
}

export function Usage({ word }: { word: Word }) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="mb-2 text-xs font-semibold tracking-wide text-ink-3 uppercase">Collocation hay dùng</h3>
        <ul className="space-y-2">
          {word.collocations.map((c) => (
            <li key={c} className="flex items-center justify-between gap-2 rounded-xl bg-surface-2 py-1.5 pr-1.5 pl-3">
              <span className="font-medium">
                <Highlighted sentence={c} word={word.word} />
              </span>
              <SpeakText text={c} label="Nghe cụm từ" />
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="mb-2 text-xs font-semibold tracking-wide text-ink-3 uppercase">Câu ví dụ</h3>
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <p className="text-lg leading-relaxed">
              <Highlighted sentence={word.example} word={word.word} />
            </p>
            <p className="mt-1 text-sm text-ink-2">{word.exampleVi}</p>
          </div>
          <SpeakText text={word.example} />
        </div>
      </div>
    </div>
  );
}

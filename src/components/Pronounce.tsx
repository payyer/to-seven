"use client";

import { useState } from "react";
import { playWord, speak } from "@/lib/speech";
import { useAppState } from "@/lib/store";
import { parseStress, stressedSyllableIndex } from "@/lib/text";
import { Icon } from "./Icon";

/** Nút nghe một từ: bình thường + chậm. */
export function SpeakWord({ word, size = "md" }: { word: string; size?: "sm" | "md" }) {
  const state = useAppState();
  const preferReal = state?.settings.preferRealAudio ?? true;
  const [busy, setBusy] = useState(false);

  const play = async (slow: boolean) => {
    setBusy(true);
    try {
      await playWord(word, { preferReal, slow });
    } finally {
      setBusy(false);
    }
  };

  const cls =
    size === "sm"
      ? "h-8 w-8 rounded-lg"
      : "h-10 gap-1.5 rounded-xl px-3 text-sm font-medium";

  return (
    <span className="inline-flex gap-1.5">
      <button
        type="button"
        onClick={() => play(false)}
        disabled={busy}
        className={`inline-flex items-center justify-center bg-accent-soft text-accent-strong hover:brightness-95 disabled:opacity-60 ${cls}`}
        aria-label={`Nghe phát âm từ ${word}`}
      >
        <Icon name="volume" className="h-4 w-4" />
        {size === "md" && "Nghe"}
      </button>
      <button
        type="button"
        onClick={() => play(true)}
        disabled={busy}
        className={`inline-flex items-center justify-center border border-line text-ink-2 hover:bg-surface-2 disabled:opacity-60 ${cls}`}
        aria-label={`Nghe chậm từ ${word}`}
      >
        <Icon name="slow" className="h-4 w-4" />
        {size === "md" && "Chậm"}
      </button>
    </span>
  );
}

/** Nút nghe một câu (dùng giọng đọc máy). */
export function SpeakText({ text, label = "Nghe câu" }: { text: string; label?: string }) {
  return (
    <button
      type="button"
      onClick={() => speak(text, 0.9)}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-3 hover:bg-surface-2 hover:text-accent-strong"
      aria-label={`${label}: ${text}`}
      title={label}
    >
      <Icon name="volume" className="h-4 w-4" />
    </button>
  );
}

/** Hiển thị trọng âm: âm tiết mang trọng âm to, đậm, gạch chân. */
export function StressWord({ stress, size = "lg" }: { stress: string; size?: "md" | "lg" }) {
  const parts = parseStress(stress);
  const base = size === "lg" ? "text-3xl" : "text-lg";
  return (
    <span className={`inline-flex flex-wrap items-baseline ${base}`} aria-label={`Trọng âm: ${stress}`}>
      {parts.map((p, i) =>
        p.separator ? (
          <span key={i} className="px-1 text-ink-3">
            {p.text === "-" ? "-" : " "}
          </span>
        ) : (
          <span key={i} className="flex items-baseline">
            {i > 0 && !parts[i - 1].separator && <span className="px-0.5 text-ink-3">·</span>}
            <span
              className={
                p.stressed
                  ? "font-bold text-accent-strong underline decoration-2 underline-offset-4"
                  : "font-normal text-ink-2"
              }
            >
              {p.stressed ? p.text.toUpperCase() : p.text}
            </span>
          </span>
        ),
      )}
    </span>
  );
}

export function StressHint({ stress }: { stress: string }) {
  const info = stressedSyllableIndex(stress);
  if (!info) return <span>Nhấn mạnh phần viết HOA khi đọc cả cụm.</span>;
  return (
    <span>
      Trọng âm rơi vào âm tiết thứ <strong className="text-ink">{info.index}</strong> trên {info.total}.
    </span>
  );
}

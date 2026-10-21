"use client";

import { Icon } from "./Icon";

/** Nút micro lớn: bấm để nói, bấm lần nữa để dừng. */
export function MicButton({
  listening,
  disabled,
  onToggle,
}: {
  listening: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={listening}
      aria-label={listening ? "Dừng ghi âm" : "Bấm để nói"}
      className={`relative grid h-16 w-16 shrink-0 place-items-center rounded-full text-on-accent shadow-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50 ${
        listening ? "bg-bad" : "bg-accent hover:bg-accent-strong"
      }`}
    >
      {listening && <span className="absolute inset-0 animate-ping rounded-full bg-bad/40" aria-hidden="true" />}
      <Icon name={listening ? "stop" : "mic"} className="relative h-7 w-7" />
    </button>
  );
}

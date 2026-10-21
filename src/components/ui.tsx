import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANT: Record<Variant, string> = {
  primary: "bg-accent text-on-accent hover:bg-accent-strong disabled:opacity-50",
  secondary: "border border-line bg-surface text-ink hover:bg-surface-2 disabled:opacity-50",
  ghost: "text-ink-2 hover:bg-surface-2 disabled:opacity-50",
  danger: "border border-bad/40 bg-surface text-bad hover:bg-bad-soft",
};

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type="button" className={`${BASE} ${VARIANT[variant]} ${className}`} {...props} />;
}

export function ButtonLink({
  href,
  variant = "primary",
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={`${BASE} ${VARIANT[variant]} ${className}`}>
      {children}
    </Link>
  );
}

export function Card({
  className = "",
  flush = false,
  children,
}: {
  className?: string;
  /** Bỏ padding mặc định khi nội dung tự chia vùng (tab, footer). */
  flush?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={`rounded-2xl border border-line bg-surface ${flush ? "overflow-hidden" : "p-5"} ${className}`}>
      {children}
    </section>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-2">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "accent" | "good" | "warn" }) {
  const tones = {
    neutral: "bg-surface-2 text-ink-2",
    accent: "bg-accent-soft text-accent-strong",
    good: "bg-good-soft text-good",
    warn: "bg-warn-soft text-warn",
  };
  return <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className="h-2 w-full overflow-hidden rounded-full bg-accent-soft"
    >
      <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Đang tải dữ liệu">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-surface-2" />
      <div className="h-40 animate-pulse rounded-2xl bg-surface-2" />
      <div className="h-24 animate-pulse rounded-2xl bg-surface-2" />
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded border border-line bg-surface-2 px-1.5 py-0.5 font-sans text-[11px] text-ink-3">{children}</kbd>
  );
}

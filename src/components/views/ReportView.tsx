"use client";

import Link from "next/link";
import { useState } from "react";
import { requestWeeklyPlan } from "@/lib/ai-client";
import { addDays, formatShort, startOfWeek } from "@/lib/date";
import { computeWeekStats, rulePlan } from "@/lib/report";
import { saveReport, updateSettings, useAppState } from "@/lib/store";
import type { WeeklyReport, WeekStats } from "@/lib/types";
import { Icon, type IconName } from "../Icon";
import { Badge, Button, Card, Loading, PageHeader } from "../ui";

const pct = (v: number | null) => (v === null ? "—" : `${Math.round(v * 100)}%`);

function Tile({
  label,
  value,
  icon,
  delta,
  note,
}: {
  label: string;
  value: string;
  icon: IconName;
  delta?: number | null;
  note?: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-center gap-1.5 text-xs text-ink-3">
        <Icon name={icon} className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {delta !== undefined && delta !== null && delta !== 0 && (
        <div className={`tabular mt-0.5 text-xs font-medium ${delta > 0 ? "text-good" : "text-bad"}`}>
          {delta > 0 ? "▲" : "▼"} {Math.abs(delta)} so với tuần trước
        </div>
      )}
      {note && <div className="mt-0.5 text-xs text-ink-3">{note}</div>}
    </div>
  );
}

export function ReportView() {
  const state = useAppState();
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!state) return <Loading />;

  const weekStart = addDays(startOfWeek(state.today), offset * 7);
  const stats = computeWeekStats(state, weekStart);
  const prev = computeWeekStats(state, addDays(weekStart, -7));
  const saved = state.reports.find((r) => r.week === stats.week);
  const current = offset === 0;
  const accDelta =
    stats.reviewAccuracy !== null && prev.reviewAccuracy !== null
      ? Math.round((stats.reviewAccuracy - prev.reviewAccuracy) * 100)
      : null;

  const store = (plan: WeeklyReport["plan"], source: WeeklyReport["source"], s: WeekStats) =>
    saveReport({ week: s.week, createdAt: state.today, stats: s, plan, source });

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const plan = await requestWeeklyPlan({ stats, previous: prev, dailyNewWords: state.settings.dailyNewWords });
      store(plan, "ai", stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tạo được kế hoạch.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Báo cáo tuần" subtitle="Tổng kết việc học và kế hoạch cho tuần sau." />

      <div className="flex items-center justify-between gap-2 rounded-2xl border border-line bg-surface px-2 py-2">
        <Button variant="ghost" onClick={() => setOffset((o) => o - 1)} aria-label="Tuần trước" disabled={offset <= -12}>
          <Icon name="chevronLeft" />
        </Button>
        <div className="text-center">
          <div className="font-semibold">
            Tuần {stats.week.slice(-2)} {current && <Badge tone="accent">đang diễn ra</Badge>}
          </div>
          <div className="tabular text-xs text-ink-3">
            {formatShort(stats.start)} – {formatShort(stats.end)}
          </div>
        </div>
        <Button variant="ghost" onClick={() => setOffset((o) => o + 1)} aria-label="Tuần sau" disabled={current}>
          <Icon name="chevronRight" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="Ngày học" value={`${stats.activeDays}/7`} icon="flame" delta={stats.activeDays - prev.activeDays} />
        <Tile label="Từ mới" value={String(stats.newWords)} icon="book" delta={stats.newWords - prev.newWords} />
        <Tile label="Từ đã thuộc" value={String(stats.mastered)} icon="check" note="đạt mốc 14 ngày trong tuần" />
        <Tile
          label="Chính xác khi ôn"
          value={pct(stats.reviewAccuracy)}
          icon="repeat"
          delta={accDelta}
          note={`${stats.reviews} lượt ôn, ${stats.forgot} lần quên`}
        />
        <Tile label="Câu đã viết" value={String(stats.sentences)} icon="pen" delta={stats.sentences - prev.sentences} />
        <Tile label="Speaking" value={String(stats.speaking)} icon="mic" delta={stats.speaking - prev.speaking} note="lượt trả lời" />
        <Tile label="Writing" value={String(stats.writing)} icon="notebook" note="bài đã nộp" />
        <Tile
          label="Nghe – chép"
          value={String(stats.dictations)}
          icon="headphones"
          note={stats.dictationAvg !== null ? `đúng trung bình ${pct(stats.dictationAvg)}` : "chưa làm bài nào"}
        />
      </div>

      <Card>
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold">Lỗi hay gặp trong tuần</h2>
          <Link href="/practice/mistakes" className="text-sm font-medium text-accent-strong hover:underline">
            Mở Sổ lỗi
          </Link>
        </div>
        {stats.topErrors.length === 0 ? (
          <p className="mt-2 text-sm text-ink-3">Tuần này chưa ghi nhận lỗi nào.</p>
        ) : (
          <ol className="mt-3 space-y-2">
            {stats.topErrors.map((e, i) => (
              <li key={e.pattern} className="flex items-start justify-between gap-3 text-sm">
                <span>
                  <span className="tabular mr-1.5 text-ink-3">{i + 1}.</span>
                  <span className="font-medium">{e.label}</span>
                  <span className="block pl-5 text-xs text-ink-3">
                    ví dụ: {e.wrong} → {e.correction}
                  </span>
                </span>
                <Badge tone="warn">{e.count} lần</Badge>
              </li>
            ))}
          </ol>
        )}
        <p className="mt-3 text-xs text-ink-3">
          {stats.newErrors} lỗi mới · {stats.errorReviews} lượt ôn sổ lỗi
        </p>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Kế hoạch tuần sau</h2>
          {saved && (
            <span className="text-xs text-ink-3">
              {saved.source === "ai" ? "AI soạn" : "Gợi ý cơ bản"} · {formatShort(saved.createdAt)}
            </span>
          )}
        </div>

        {saved ? (
          <PlanView
            report={saved}
            dailyNewWords={state.settings.dailyNewWords}
            onApply={(n) => updateSettings({ dailyNewWords: n })}
          />
        ) : (
          <p className="mt-2 text-sm text-ink-2">
            {current
              ? "Tuần đang diễn ra — bạn có thể tạo kế hoạch ngay hoặc đợi cuối tuần để số liệu đầy đủ hơn."
              : "Chưa có kế hoạch cho tuần này."}
          </p>
        )}

        {error && (
          <div role="alert" className="mt-3 rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">
            {error}{" "}
            <button type="button" className="font-semibold underline" onClick={() => store(rulePlan(stats, state.settings.dailyNewWords), "rule", stats)}>
              Dùng gợi ý cơ bản (không cần AI)
            </button>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <Button onClick={generate} disabled={loading} variant={saved ? "secondary" : "primary"}>
            {loading ? "AI đang lập kế hoạch…" : saved ? "Tạo lại kế hoạch" : "Tạo kế hoạch tuần sau"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function PlanView({
  report,
  dailyNewWords,
  onApply,
}: {
  report: WeeklyReport;
  dailyNewWords: number;
  onApply: (n: number) => void;
}) {
  const { plan } = report;
  return (
    <div className="mt-3 space-y-4">
      <p className="rounded-xl bg-accent-soft px-4 py-3 text-sm text-accent-strong">{plan.summaryVi}</p>

      <ol className="space-y-2">
        {plan.focusAreas.map((f, i) => (
          <li key={i} className="rounded-xl border border-line p-3 text-sm">
            <div className="font-semibold">
              <span className="tabular mr-1.5 text-ink-3">{i + 1}.</span>
              {f.titleVi}
            </div>
            <p className="mt-1 text-ink-3">{f.whyVi}</p>
            <p className="mt-1 text-ink-2">→ {f.actionVi}</p>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface-2 px-4 py-3 text-sm">
        <span>
          Gợi ý: <strong>{plan.suggestedDailyNewWords} từ mới/ngày</strong>
          {plan.suggestedDailyNewWords === dailyNewWords ? " (đang dùng)" : ` (hiện tại ${dailyNewWords})`}
        </span>
        {plan.suggestedDailyNewWords !== dailyNewWords && (
          <Button variant="secondary" onClick={() => onApply(plan.suggestedDailyNewWords)}>
            Áp dụng
          </Button>
        )}
      </div>

      <ul className="grid gap-2 sm:grid-cols-2">
        {plan.days.map((d) => (
          <li key={d.dayVi} className="rounded-xl border border-line p-3 text-sm">
            <div className="font-semibold">{d.dayVi}</div>
            <ul className="mt-1 space-y-0.5 text-ink-2">
              {d.tasksVi.map((t, i) => (
                <li key={i}>• {t}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

"use client";
import { formatLong } from "@/lib/date";
import { computeOverview, computeWeekly } from "@/lib/stats";
import { useAppState } from "@/lib/store";
import { ButtonLink, Card, Loading, ProgressBar } from "../ui";
import { WeeklyChart } from "../WeeklyChart";
export function DashboardView() {
  const state = useAppState();
  if (!state) return <Loading />;
  const { cards, activity, today, plan, settings } = state;
  const overview = computeOverview(cards, activity, today),
    weekly = computeWeekly(cards, activity, today);
  const learned = plan.wordIds.filter(
    (id) => cards[id] && !cards[id].known,
  ).length;
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-ink-3">{formatLong(today)}</p>
        <h1 className="mt-1 text-2xl font-bold">Hôm nay mình học gì?</h1>
      </div>
      <Card>
        <h2 className="font-semibold">Giữ nhịp học từ vựng</h2>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-medium">{overview.dueToday} từ đến hạn ôn</p>
            <p className="text-sm text-ink-2">
              Nhìn nghĩa, tự gõ lại từ đã học.
            </p>
          </div>
          <ButtonLink href="/review">Ôn từ</ButtonLink>
        </div>
        <div className="mt-5 border-t border-line pt-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium">Học từ mới</p>
              <p className="text-sm text-ink-2">
                {learned}/{settings.dailyNewWords + plan.extra} từ hôm nay
              </p>
            </div>
            <ButtonLink href="/learn" variant="secondary">
              Học tiếp
            </ButtonLink>
          </div>
          <ProgressBar
            value={learned}
            max={settings.dailyNewWords + plan.extra}
            label="Từ mới hôm nay"
          />
        </div>
      </Card>
      <Card className="border-accent/40">
        <p className="text-xs font-semibold tracking-wide text-accent-strong uppercase">
          Theo giáo trình
        </p>
        <h2 className="mt-2 text-xl font-semibold">
          Pre-intermediate · Lesson 1–12
        </h2>
        <p className="my-3 text-sm leading-6 text-ink-2">
          Luyện bài gốc, bài bổ sung và xem lại câu sai. Tiến độ cấp độ được lưu
          riêng.
        </p>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/courses/pre-intermediate">
            Tiếp tục ôn theo cấp độ
          </ButtonLink>
          <ButtonLink href="/grammar" variant="secondary">
            Xem ngữ pháp
          </ButtonLink>
        </div>
      </Card>
      <div className="grid grid-cols-3 gap-3">
        {[
          ["Đã học", overview.learned],
          ["Đã thuộc", overview.mastered],
          ["Chuỗi ngày", overview.streak],
        ].map(([label, value]) => (
          <Card key={label}>
            <p className="text-xs text-ink-3">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
          </Card>
        ))}
      </div>
      <Card>
        <WeeklyChart data={weekly} />
      </Card>
    </div>
  );
}

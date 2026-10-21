"use client";

import Link from "next/link";
import { formatLong, isoWeek } from "@/lib/date";
import { isErrorDue } from "@/lib/mistakes";
import { IELTS_HINT, TARGET_FAMILIES } from "@/lib/placement";
import { computeOverview, computeWeekly } from "@/lib/stats";
import { useAppState } from "@/lib/store";
import { Icon, type IconName } from "../Icon";
import { ButtonLink, Card, Loading, ProgressBar } from "../ui";
import { WeeklyChart } from "../WeeklyChart";

function StatTile({ label, value, icon, note }: { label: string; value: number; icon: IconName; note?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-center gap-1.5 text-xs text-ink-3">
        <Icon name={icon} className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold">{value.toLocaleString("vi-VN")}</div>
      {note && <div className="mt-0.5 text-xs text-ink-3">{note}</div>}
    </div>
  );
}

export function DashboardView() {
  const state = useAppState();
  if (!state) return <Loading />;

  const { cards, activity, plan, settings, placement, today } = state;
  const overview = computeOverview(cards, activity, today);
  const weekly = computeWeekly(cards, activity, today);
  const goal = settings.dailyNewWords + plan.extra;
  const learnedToday = plan.wordIds.filter((id) => cards[id] && !cards[id].known).length;
  const remaining = plan.wordIds.filter((id) => !cards[id]).length;
  const knownCount = Object.values(cards).filter((c) => c.known).length;
  const dueErrors = state.errors.filter((e) => isErrorDue(e, today)).length;
  const todaySentences = state.sentences.filter((s) => s.createdAt === today).length;
  const todayDictations = state.dictations.filter((d) => d.date === today).length;
  const todaySpeaking = state.speaking.filter((s) => s.createdAt === today).length;
  const wroteThisWeek = state.writings.some((w) => w.week === isoWeek(today));

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-ink-3">{formatLong(today)}</p>
        <h1 className="text-2xl font-bold tracking-tight">
          {overview.studiedToday ? "Làm tốt lắm, tiếp tục nhé!" : "Hôm nay mình học gì?"}
        </h1>
      </div>

      {!placement && (
        <Card className="border-accent/30 bg-accent-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-accent-strong">Bắt đầu bằng bài kiểm tra từ vựng</h2>
              <p className="mt-0.5 text-sm text-ink-2">
                30 câu, khoảng 5 phút. App sẽ ước lượng vốn từ và chọn nhóm từ phù hợp để bạn học trước.
              </p>
            </div>
            <ButtonLink href="/placement">Làm bài kiểm tra</ButtonLink>
          </div>
        </Card>
      )}

      <Card>
        <h2 className="mb-3 font-semibold">Việc hôm nay</h2>
        <div className="divide-y divide-line">
          <div className="flex items-center justify-between gap-3 pb-4">
            <div>
              <div className="font-medium">1. Ôn tập</div>
              <div className="text-sm text-ink-2">
                {overview.dueToday > 0 ? `${overview.dueToday} thẻ đến hạn — gõ lại từ tiếng Anh từ nghĩa tiếng Việt` : "Không còn thẻ nào cần ôn hôm nay"}
              </div>
            </div>
            {overview.dueToday > 0 ? (
              <ButtonLink href="/review">Ôn ngay</ButtonLink>
            ) : (
              <span className="flex items-center gap-1 text-sm font-medium text-good">
                <Icon name="check" /> Xong
              </span>
            )}
          </div>
          <div className="py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-medium">2. Học từ mới</div>
                <div className="tabular text-sm text-ink-2">
                  {learnedToday}/{goal} từ
                  {remaining === 0 && plan.wordIds.length < goal ? " · đã học hết kho từ" : ""}
                </div>
              </div>
              {remaining > 0 ? (
                <ButtonLink href="/learn" variant={overview.dueToday > 0 ? "secondary" : "primary"}>
                  {learnedToday > 0 ? "Học tiếp" : "Bắt đầu học"}
                </ButtonLink>
              ) : (
                <span className="flex items-center gap-1 text-sm font-medium text-good">
                  <Icon name="check" /> Xong
                </span>
              )}
            </div>
            <div className="mt-3">
              <ProgressBar value={learnedToday} max={goal} label="Tiến độ từ mới hôm nay" />
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 pt-4">
            <div>
              <div className="font-medium">3. Dùng từ</div>
              <div className="text-sm text-ink-2">
                {dueErrors > 0
                  ? `${dueErrors} lỗi trong sổ lỗi cần ôn`
                  : `Hôm nay: ${todaySentences} câu viết · ${todaySpeaking} câu nói · ${todayDictations} bài nghe`}
              </div>
              {!wroteThisWeek && (
                <Link href="/practice/writing" className="text-xs font-medium text-accent-strong hover:underline">
                  Chưa nộp Writing tuần này →
                </Link>
              )}
            </div>
            <ButtonLink href={dueErrors > 0 ? "/practice/mistakes" : "/practice"} variant="secondary">
              {dueErrors > 0 ? "Ôn lỗi" : "Luyện tập"}
            </ButtonLink>
          </div>
        </div>
        {overview.dueToday > 0 && remaining > 0 && (
          <p className="mt-4 flex items-start gap-1.5 text-xs text-ink-3">
            <Icon name="bulb" className="mt-px h-3.5 w-3.5 shrink-0" />
            Nên ôn bài cũ trước rồi mới học từ mới: nhớ lại đúng lúc sắp quên giúp từ vào trí nhớ dài hạn.
          </p>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          label="Đã học"
          value={overview.learned}
          icon="book"
          note={knownCount > 0 ? `gồm ${knownCount} từ đã biết sẵn` : undefined}
        />
        <StatTile label="Đã thuộc" value={overview.mastered} icon="check" note="nhớ được ≥ 14 ngày" />
        <StatTile label="Chuỗi ngày" value={overview.streak} icon="flame" note={overview.studiedToday ? "đã học hôm nay" : "học hôm nay để giữ chuỗi"} />
        <StatTile label="Cần ôn hôm nay" value={overview.dueToday} icon="repeat" />
      </div>

      <Card>
        <WeeklyChart data={weekly} />
        <div className="mt-3 border-t border-line pt-3 text-right">
          <Link href="/report" className="text-sm font-medium text-accent-strong hover:underline">
            Xem báo cáo tuần & kế hoạch tuần sau →
          </Link>
        </div>
      </Card>

      {placement && (
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold">Vốn từ ước tính</h2>
              <p className="mt-0.5 text-sm text-ink-2">
                Khoảng <strong className="text-ink">{placement.estimatedFamilies.toLocaleString("vi-VN")}</strong> word family ·
                trình độ {placement.level} (IELTS {IELTS_HINT[placement.level]})
              </p>
            </div>
            <Link href="/placement" className="text-sm font-medium text-accent-strong hover:underline">
              Kiểm tra lại
            </Link>
          </div>
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-xs text-ink-3">
              <span>Hiện tại</span>
              <span>Mục tiêu band 5.5 ≈ {TARGET_FAMILIES.toLocaleString("vi-VN")}</span>
            </div>
            <ProgressBar value={placement.estimatedFamilies} max={TARGET_FAMILIES} label="Vốn từ so với mục tiêu" />
          </div>
          <p className="mt-3 text-sm text-ink-2">
            Đang ưu tiên nhóm từ <strong className="text-ink">{settings.focusLevel}</strong>.{" "}
            <Link href="/settings" className="font-medium text-accent-strong hover:underline">
              Đổi trong Cài đặt
            </Link>
          </p>
        </Card>
      )}

      {!placement && overview.learned === 0 && (
        <div className="text-center">
          <ButtonLink href="/learn" variant="ghost">
            Bỏ qua kiểm tra, học luôn với nhóm {settings.focusLevel} <Icon name="arrowRight" />
          </ButtonLink>
        </div>
      )}
    </div>
  );
}

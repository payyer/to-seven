import { addDays, isoWeek } from "./date";
import { patternLabel } from "./mistakes";
import { isActiveDay } from "./stats";
import type { DayActivity, StudySnapshot, WeekStats, WeeklyPlan } from "./types";

type ReportSource = Pick<StudySnapshot, "activity" | "cards" | "errors" | "dictations">;

/** Số liệu của tuần bắt đầu từ `weekStart` (thứ Hai). Hàm thuần — có unit test. */
export function computeWeekStats(data: ReportSource, weekStart: string): WeekStats {
  const end = addDays(weekStart, 6);
  const inWeek = (d: string | undefined) => !!d && d >= weekStart && d <= end;

  const days: (DayActivity | undefined)[] = Array.from({ length: 7 }, (_, i) => data.activity[addDays(weekStart, i)]);
  const sum = (key: keyof DayActivity) => days.reduce((n, d) => n + (d?.[key] ?? 0), 0);

  const reviews = sum("reviews");
  const forgot = sum("forgot");
  const dictations = data.dictations.filter((d) => inWeek(d.date));
  const weekErrors = data.errors.filter((e) => inWeek(e.createdAt));

  const groups = new Map<string, typeof weekErrors>();
  for (const e of weekErrors) groups.set(e.pattern, [...(groups.get(e.pattern) ?? []), e]);
  const topErrors = [...groups.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 3)
    .map(([pattern, list]) => {
      const last = list[list.length - 1];
      return { pattern, label: patternLabel(last), count: list.length, wrong: last.wrong, correction: last.correction };
    });

  return {
    week: isoWeek(weekStart),
    start: weekStart,
    end,
    activeDays: days.filter(isActiveDay).length,
    newWords: sum("newWords"),
    mastered: Object.values(data.cards).filter((c) => !c.known && inWeek(c.masteredAt)).length,
    reviews,
    forgot,
    reviewAccuracy: reviews > 0 ? (reviews - forgot) / reviews : null,
    sentences: sum("sentences"),
    speaking: sum("speaking"),
    writing: sum("writing"),
    dictations: dictations.length,
    dictationAvg: dictations.length ? dictations.reduce((n, d) => n + d.accuracy, 0) / dictations.length : null,
    errorReviews: sum("errorReviews"),
    newErrors: weekErrors.length,
    topErrors,
  };
}

const DAYS = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ nhật"];

const pct = (v: number) => `${Math.round(v * 100)}%`;

/** Kế hoạch dự phòng theo luật đơn giản, dùng khi không gọi được AI. */
export function rulePlan(stats: WeekStats, dailyNewWords: number): WeeklyPlan {
  const focus: WeeklyPlan["focusAreas"] = [];
  let suggested = dailyNewWords;
  const acc = stats.reviewAccuracy;

  if (acc !== null && acc < 0.8) {
    suggested = Math.max(5, dailyNewWords - 3);
    focus.push({
      titleVi: "Ôn kỹ hơn",
      whyVi: `Độ chính xác khi ôn mới đạt ${pct(acc)} (nên trên 80%).`,
      actionVi: `Ôn hết thẻ đến hạn mỗi ngày trước khi học mới, giảm còn ${suggested} từ mới/ngày.`,
    });
  } else if (acc !== null && acc >= 0.9 && stats.activeDays >= 6) {
    suggested = Math.min(15, dailyNewWords + 2);
  }
  const top = stats.topErrors[0];
  if (top) {
    focus.push({
      titleVi: `Sửa lỗi: ${top.label}`,
      whyVi: `Gặp ${top.count} lần trong tuần (ví dụ: ${top.wrong} → ${top.correction}).`,
      actionVi: "Ôn Sổ lỗi mỗi ngày và tự viết 3 câu đúng với điểm ngữ pháp này.",
    });
  }
  if (stats.speaking < 5) {
    focus.push({
      titleVi: "Nói nhiều hơn",
      whyVi: `Tuần này mới có ${stats.speaking} lượt Speaking.`,
      actionVi: "Mỗi ngày trả lời 1–2 câu hỏi Speaking Part 1 bằng giọng nói.",
    });
  }
  if (stats.writing === 0) {
    focus.push({ titleVi: "Hoàn thành đề Writing", whyVi: "Tuần này chưa nộp bài Writing.", actionVi: "Dành 25 phút vào thứ Bảy cho đề Writing tuần." });
  }
  if (stats.activeDays < 5) {
    focus.push({
      titleVi: "Học đều mỗi ngày",
      whyVi: `Mới học ${stats.activeDays}/7 ngày.`,
      actionVi: "Đặt giờ cố định 30 phút mỗi ngày, ít nhất là ôn tập.",
    });
  }
  if (focus.length === 0) {
    focus.push({ titleVi: "Giữ nhịp", whyVi: "Tuần này bạn học đều và ôn tốt.", actionVi: "Giữ thói quen, thử dùng từ mới trong Speaking." });
  }

  return {
    summaryVi:
      `Tuần này bạn học ${stats.activeDays}/7 ngày, ${stats.newWords} từ mới` +
      (acc !== null ? `, độ chính xác khi ôn ${pct(acc)}.` : ", chưa có lượt ôn nào.") +
      ` Ưu tiên tuần tới: ${focus[0].titleVi.toLowerCase()}.`,
    focusAreas: focus.slice(0, 3),
    days: DAYS.map((dayVi, i) => ({
      dayVi,
      tasksVi:
        i === 6
          ? ["Ôn tập", "Nghe – chép 1 bài"]
          : i === 5
            ? ["Ôn tập", "Writing đề tuần (25 phút)"]
            : ["Ôn tập", `Học mới ${suggested} từ + đặt câu`, i % 2 === 0 ? "Speaking 2 câu" : "Ôn Sổ lỗi"],
    })),
    suggestedDailyNewWords: suggested,
  };
}

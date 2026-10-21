"use client";

import Link from "next/link";
import { isoWeek } from "@/lib/date";
import { isErrorDue } from "@/lib/mistakes";
import { weakSpellingCards } from "@/lib/spelling";
import { promptForWeek } from "@/lib/writing";
import { useAppState } from "@/lib/store";
import { Icon, type IconName } from "../Icon";
import { Loading, PageHeader } from "../ui";

function HubCard({
  href,
  icon,
  title,
  description,
  meta,
  highlight,
}: {
  href: string;
  icon: IconName;
  title: string;
  description: string;
  meta: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex gap-4 rounded-2xl border bg-surface p-5 transition-colors hover:border-accent ${
        highlight ? "border-accent/50" : "border-line"
      }`}
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent-strong">
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="font-semibold">{title}</span>
          <Icon name="arrowRight" className="h-4 w-4 text-ink-3 transition-transform group-hover:translate-x-0.5" />
        </span>
        <span className="mt-0.5 block text-sm text-ink-2">{description}</span>
        <span className={`mt-2 block text-xs ${highlight ? "font-semibold text-accent-strong" : "text-ink-3"}`}>{meta}</span>
      </span>
    </Link>
  );
}

export function PracticeHubView() {
  const state = useAppState();
  if (!state) return <Loading />;

  const { cards, errors, sentences, dictations, today } = state;
  const learned = Object.values(cards).filter((c) => !c.known).length;
  const weakSpelling = weakSpellingCards(cards).length;
  const dueErrors = errors.filter((e) => isErrorDue(e, today)).length;
  const openErrors = errors.filter((e) => !e.fixedAt).length;
  const todaySentences = sentences.filter((s) => s.createdAt === today).length;
  const todayDictations = dictations.filter((d) => d.date === today).length;
  const todaySpeaking = state.speaking.filter((s) => s.createdAt === today).length;
  const week = isoWeek(today);
  const wroteThisWeek = state.writings.some((w) => w.week === week);

  return (
    <div>
      <PageHeader title="Luyện tập" subtitle="Biến từ đã học thành từ tự dùng được: nói, viết, chính tả, sửa lỗi, nghe – chép." />
      <div className="space-y-3">
        <HubCard
          href="/practice/speaking"
          icon="mic"
          title="Speaking Part 1"
          description="Trả lời từng câu hỏi bằng giọng nói hoặc gõ. AI góp ý theo PEER, sửa thì và hoà hợp chủ ngữ – động từ, gợi ý từ hay hơn."
          meta={`Hôm nay đã trả lời ${todaySpeaking} câu`}
        />
        <HubCard
          href="/practice/writing"
          icon="notebook"
          title="Writing tuần này"
          description={`Đề tuần: “${promptForWeek(today).titleVi}” (80–120 từ). AI sửa ngữ pháp, mạo từ, chính tả và giọng văn.`}
          meta={wroteThisWeek ? "Đã nộp bài tuần này" : "Chưa nộp bài tuần này"}
          highlight={!wroteThisWeek}
        />
        <HubCard
          href="/practice/spelling"
          icon="keyboard"
          title="Luyện chính tả"
          description="Nghe hoặc nhìn nghĩa rồi gõ lại từ đã học. Từ bạn hay viết sai được hỏi trước cho đến khi gõ đúng ổn định."
          meta={
            weakSpelling > 0
              ? `${weakSpelling} từ hay viết sai cần luyện`
              : learned > 0
                ? `${learned} từ có thể luyện`
                : "Học vài từ mới trước đã"
          }
          highlight={weakSpelling > 0}
        />
        <HubCard
          href="/practice/write"
          icon="pen"
          title="Đặt câu với từ đã học"
          description="Viết 1 câu, AI chỉ ra lỗi, giải thích bằng tiếng Việt và cho câu tương tự để luyện lại."
          meta={learned > 0 ? `${learned} từ có thể luyện · hôm nay đã viết ${todaySentences} câu` : "Học vài từ mới trước đã"}
        />
        <HubCard
          href="/practice/mistakes"
          icon="notebook"
          title="Sổ lỗi sai"
          description="Mọi lỗi AI chỉ ra, xếp theo loại (thì, hoà hợp chủ ngữ – động từ, mạo từ, chính tả, dùng từ) và số lần lặp lại."
          meta={dueErrors > 0 ? `${dueErrors} lỗi cần ôn hôm nay` : `${openErrors} lỗi đang theo dõi`}
          highlight={dueErrors > 0}
        />
        <HubCard
          href="/practice/dictation"
          icon="headphones"
          title="Nghe – chép (dictation)"
          description="Nghe câu hoặc đoạn ngắn A1–B1 rồi gõ lại, app tô đỏ chỗ sai. Có thể dán văn bản tự soạn."
          meta={`Hôm nay đã làm ${todayDictations} bài`}
        />
        <HubCard
          href="/report"
          icon="chart"
          title="Báo cáo tuần"
          description="Tổng kết lỗi hay gặp, số từ mới, độ chính xác khi ôn và kế hoạch cho tuần sau."
          meta={`Tuần ${week.slice(-2)}`}
        />
      </div>
    </div>
  );
}

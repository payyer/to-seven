"use client";
import { useAppState } from "@/lib/store";
import { isDue } from "@/lib/srs";
import { WORDS } from "@/data/words";
import { ButtonLink, Card, Loading, PageHeader } from "../ui";
export function VocabularyView() {
  const state = useAppState();
  if (!state) return <Loading />;
  const due = Object.values(state.cards).filter((c) =>
    isDue(c, state.today),
  ).length;
  return (
    <div className="space-y-4">
      <PageHeader
        title="Từ vựng"
        subtitle="Kho từ chung và lịch ôn quen thuộc của bạn."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          [
            "/review",
            "Ôn từ đến hạn",
            `${due} từ cần ôn · nhìn nghĩa, gõ lại từ`,
          ],
          ["/learn", "Học từ mới", "Nghĩa, phát âm, viết nhớ và cách dùng"],
          [
            "/practice/spelling",
            "Luyện chính tả",
            "Nghe hoặc nhìn nghĩa rồi tự gõ",
          ],
          [
            "/words",
            "Kho từ",
            `${WORDS.length} từ · tìm theo chủ đề, LIST hoặc lesson`,
          ],
        ].map(([href, title, text]) => (
          <Card key={href}>
            <h2 className="font-semibold">{title}</h2>
            <p className="my-3 text-sm text-ink-2">{text}</p>
            <ButtonLink href={href}>Mở</ButtonLink>
          </Card>
        ))}
      </div>
      <Card>
        <h2 className="font-semibold">Ôn theo giáo trình</h2>
        <p className="my-3 text-sm text-ink-2">
          Bài từ vựng và ngữ pháp theo từng lesson, lưu tiến độ riêng.
        </p>
        <ButtonLink href="/courses" variant="secondary">
          Ôn theo cấp độ
        </ButtonLink>
      </Card>
    </div>
  );
}

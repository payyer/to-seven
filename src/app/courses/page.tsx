import { COURSE_LEVELS, COURSE_QUESTIONS, LESSONS } from "@/data/courses";
import { ButtonLink, Card, PageHeader } from "@/components/ui";
export default function Page() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Ôn theo cấp độ"
        subtitle="Theo sát giáo trình. Tiếp tục bài ôn giữa kỳ, cuối kỳ và các lesson mới."
      />
      {COURSE_LEVELS.map((level) => (
        <Card key={level.id} className="border-accent/40">
          <span className="text-xs font-semibold tracking-wider text-accent-strong uppercase">
            Giáo trình hiện tại
          </span>
          <h2 className="mt-2 text-2xl font-semibold">{level.title}</h2>
          <p className="mt-2 text-sm text-ink-2">{level.description}</p>
          <p className="my-4 text-sm text-ink-3">
            {LESSONS.filter((l) => l.levelId === level.id).length} lesson ·{" "}
            {
              COURSE_QUESTIONS.filter(
                (q) => q.levelId === level.id && q.source === "original",
              ).length
            }{" "}
            nhóm câu gốc ·{" "}
            {
              COURSE_QUESTIONS.filter(
                (q) => q.levelId === level.id && q.source === "additional",
              ).length
            }{" "}
            câu bổ sung
          </p>
          <ButtonLink href={`/courses/${level.id}`}>Mở bài ôn</ButtonLink>
        </Card>
      ))}
      <p className="text-sm leading-6 text-ink-3">
        Mỗi cấp độ có bài đang làm, kết quả và sổ lỗi riêng. Khi có thêm tài
        liệu, các lesson mới được bổ sung vào đây và giữ lại kết quả bạn đã làm.
      </p>
    </div>
  );
}

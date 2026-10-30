import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Loading } from "@/components/ui";
import { COURSE_LEVELS } from "@/data/courses";
import { CourseView } from "@/components/views/CourseView";
export function generateStaticParams() {
  return COURSE_LEVELS.map((l) => ({ levelId: l.id }));
}
export default async function Page({
  params,
}: {
  params: Promise<{ levelId: string }>;
}) {
  const { levelId } = await params;
  if (!COURSE_LEVELS.some((l) => l.id === levelId)) notFound();
  return (
    <Suspense fallback={<Loading />}>
      <CourseView levelId={levelId} />
    </Suspense>
  );
}

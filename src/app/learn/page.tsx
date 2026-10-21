import type { Metadata } from "next";
import { LearnView } from "@/components/views/LearnView";

export const metadata: Metadata = { title: "Học từ mới · IELTS Vocab" };

export default function LearnPage() {
  return <LearnView />;
}

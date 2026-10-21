import type { Metadata } from "next";
import { WritingView } from "@/components/views/WritingView";

export const metadata: Metadata = { title: "Writing tuần · IELTS Vocab" };

export default function WritingPage() {
  return <WritingView />;
}

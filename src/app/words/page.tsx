import type { Metadata } from "next";
import { WordsView } from "@/components/views/WordsView";

export const metadata: Metadata = { title: "Kho từ · IELTS Vocab" };

export default function WordsPage() {
  return <WordsView />;
}

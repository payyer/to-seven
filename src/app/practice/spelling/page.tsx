import type { Metadata } from "next";
import { SpellingView } from "@/components/views/SpellingView";

export const metadata: Metadata = { title: "Luyện chính tả · IELTS Vocab" };

export default function SpellingPage() {
  return <SpellingView />;
}

import type { Metadata } from "next";
import { MistakesView } from "@/components/views/MistakesView";

export const metadata: Metadata = { title: "Sổ lỗi sai · IELTS Vocab" };

export default function MistakesPage() {
  return <MistakesView />;
}

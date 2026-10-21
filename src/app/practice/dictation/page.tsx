import type { Metadata } from "next";
import { DictationView } from "@/components/views/DictationView";

export const metadata: Metadata = { title: "Nghe – chép · IELTS Vocab" };

export default function DictationPage() {
  return <DictationView />;
}

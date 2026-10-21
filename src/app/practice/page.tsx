import type { Metadata } from "next";
import { PracticeHubView } from "@/components/views/PracticeHubView";

export const metadata: Metadata = { title: "Luyện tập · IELTS Vocab" };

export default function PracticePage() {
  return <PracticeHubView />;
}

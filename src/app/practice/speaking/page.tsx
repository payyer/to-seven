import type { Metadata } from "next";
import { SpeakingView } from "@/components/views/SpeakingView";

export const metadata: Metadata = { title: "Speaking Part 1 · IELTS Vocab" };

export default function SpeakingPage() {
  return <SpeakingView />;
}

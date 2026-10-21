import type { Metadata } from "next";
import { ReviewView } from "@/components/views/ReviewView";

export const metadata: Metadata = { title: "Ôn tập · IELTS Vocab" };

export default function ReviewPage() {
  return <ReviewView />;
}

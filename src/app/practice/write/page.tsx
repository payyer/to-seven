import type { Metadata } from "next";
import { WriteView } from "@/components/views/WriteView";

export const metadata: Metadata = { title: "Đặt câu · IELTS Vocab" };

export default function WritePage() {
  return <WriteView />;
}

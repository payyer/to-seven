import type { Metadata } from "next";
import { ReportView } from "@/components/views/ReportView";

export const metadata: Metadata = { title: "Báo cáo tuần · IELTS Vocab" };

export default function ReportPage() {
  return <ReportView />;
}

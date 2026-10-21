import type { Metadata } from "next";
import { PlacementView } from "@/components/views/PlacementView";

export const metadata: Metadata = { title: "Kiểm tra đầu vào · IELTS Vocab" };

export default function PlacementPage() {
  return <PlacementView />;
}

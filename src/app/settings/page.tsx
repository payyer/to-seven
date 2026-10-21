import type { Metadata } from "next";
import { SettingsView } from "@/components/views/SettingsView";

export const metadata: Metadata = { title: "Cài đặt · IELTS Vocab" };

export default function SettingsPage() {
  return <SettingsView />;
}

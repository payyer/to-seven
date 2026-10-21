import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { Nav } from "@/components/Nav";
import "./globals.css";

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "IELTS Vocab · Học từ vựng mỗi ngày",
  description: "Học từ vựng IELTS theo chủ đề Speaking Part 1, ôn tập ngắt quãng và gõ lại từ để nhớ lâu.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${beVietnam.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <Nav />
        <main className="mx-auto w-full max-w-3xl px-4 pt-6 pb-28 sm:pb-12">{children}</main>
      </body>
    </html>
  );
}

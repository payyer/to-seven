import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { Nav } from "@/components/Nav";
import { AppFrame } from "@/components/AppFrame";
import "./globals.css";

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "My English · Từ vựng, ngữ pháp và ôn theo cấp độ",
  description: "Học từ vựng, tra cứu ngữ pháp và luyện theo giáo trình với tiến độ riêng cho từng cấp độ.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${beVietnam.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <Nav />
        <main className="mx-auto w-full max-w-3xl px-4 pt-6 pb-28 sm:pb-12"><AppFrame>{children}</AppFrame></main>
      </body>
    </html>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./Icon";

const LINKS: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Hôm nay", icon: "home" },
  { href: "/vocabulary", label: "Từ vựng", icon: "book" },
  { href: "/grammar", label: "Ngữ pháp", icon: "notebook" },
  { href: "/courses", label: "Ôn theo cấp độ", icon: "pen" },
];

export function Nav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : href === "/vocabulary"
        ? [
            "/vocabulary",
            "/words",
            "/learn",
            "/review",
            "/practice/spelling",
          ].some((p) => pathname.startsWith(p))
        : pathname.startsWith(href);

  const settingsActive = pathname.startsWith("/settings");

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-2 px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-sm font-bold text-on-accent">
              Aa
            </span>
            <span>My English</span>
          </Link>
          <div className="flex items-center gap-1">
            <nav className="hidden gap-1 sm:flex" aria-label="Điều hướng chính">
              {LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={isActive(l.href) ? "page" : undefined}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
                    isActive(l.href)
                      ? "bg-accent-soft font-semibold text-accent-strong"
                      : "text-ink-2 hover:bg-surface-2"
                  }`}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
            <Link
              href="/settings"
              aria-label="Cài đặt"
              title="Cài đặt"
              aria-current={settingsActive ? "page" : undefined}
              className={`grid h-9 w-9 place-items-center rounded-lg ${
                settingsActive
                  ? "bg-accent-soft text-accent-strong"
                  : "text-ink-2 hover:bg-surface-2"
              }`}
            >
              <Icon name="settings" className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>

      <nav
        className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 backdrop-blur sm:hidden"
        aria-label="Điều hướng chính"
      >
        <div className="grid grid-cols-4">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? "page" : undefined}
              className={`relative flex flex-col items-center gap-0.5 py-2 text-[11px] ${
                isActive(l.href)
                  ? "font-semibold text-accent-strong"
                  : "text-ink-3"
              }`}
            >
              <Icon name={l.icon} className="h-5 w-5" />
              {l.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}

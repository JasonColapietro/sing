"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProgress, levelForXp } from "@/lib/progress";

const LINKS = [
  { href: "/studio", label: "Studio" },
  { href: "/warmups", label: "Warmups" },
  { href: "/range", label: "Range" },
  { href: "/ear-training", label: "Ear" },
  { href: "/breath", label: "Breath" },
  { href: "/songs", label: "Songs" },
  { href: "/recorder", label: "Recorder" },
  { href: "/tools", label: "Tools" },
  { href: "/progress", label: "Progress" },
];

function Logo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="1" y="1" width="22" height="22" rx="6" fill="#1f1a13" />
      <rect x="6" y="12" width="2.6" height="7" rx="1.3" fill="#a69d8c" />
      <rect x="10.7" y="7" width="2.6" height="12" rx="1.3" fill="#f5b03e" />
      <rect x="15.4" y="10" width="2.6" height="9" rx="1.3" fill="#ff5a48" />
    </svg>
  );
}

export default function Nav() {
  const pathname = usePathname();
  const p = useProgress();
  const lvl = levelForXp(p.xp);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Logo />
          <span className="font-display text-lg tracking-tight">
            Suede Sing
          </span>
        </Link>
        <nav
          aria-label="Main"
          className="no-scrollbar flex flex-1 items-center gap-1 overflow-x-auto"
        >
          {LINKS.map((l) => {
            const active =
              pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-panel2 text-amber"
                    : "text-mut hover:text-ink"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <Link
          href="/progress"
          className="hidden shrink-0 items-center gap-2 rounded-full border border-line px-3 py-1.5 font-mono text-xs sm:flex"
        >
          <span className="text-amber">LV {lvl.level}</span>
          <span className="text-dim">·</span>
          <span className="tabular">{p.xp} XP</span>
          {p.streak.current > 0 && (
            <>
              <span className="text-dim">·</span>
              <span className="text-rec">{p.streak.current}d</span>
            </>
          )}
        </Link>
      </div>
    </header>
  );
}

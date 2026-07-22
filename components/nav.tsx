"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
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

function MenuIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M4.5 4.5l9 9m0-9l-9 9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Nav() {
  const pathname = usePathname();
  const p = useProgress();
  const lvl = levelForXp(p.xp);
  const [menuOpen, setMenuOpen] = useState(false);

  const currentLabel =
    LINKS.find((l) => pathname === l.href || pathname.startsWith(l.href + "/"))
      ?.label ?? "Menu";

  // Close the mobile menu on navigation. Adjusted during render (guarded by
  // prevPathname) rather than in an effect, per
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    if (menuOpen) setMenuOpen(false);
  }

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [menuOpen]);

  // Portaled to document.body: a fixed-position drawer nested inside the
  // sticky, backdrop-blurred header would be sized against the header's own
  // containing block (56px tall), not the viewport, since backdrop-filter
  // creates a new containing block for fixed descendants.
  const drawer = menuOpen
    ? createPortal(
        <div className="fixed inset-0 z-[60] sm:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-ink/40"
            onClick={() => setMenuOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="animate-fadeup absolute inset-0 flex flex-col overflow-y-auto bg-bg"
          >
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
              <Link
                href="/"
                className="flex items-center gap-2"
                onClick={() => setMenuOpen(false)}
              >
                <Image
                  src="/suede-logo.png"
                  alt=""
                  width={22}
                  height={22}
                  className="rounded-full"
                />
                <span className="font-display text-lg tracking-tight">
                  Suede Sing
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="rounded-full p-2 text-mut hover:text-ink"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="flex items-center gap-2 px-4 pt-4 font-mono text-xs text-dim">
              <span className="text-amber-ink">LV {lvl.level}</span>
              <span>·</span>
              <span className="tabular">{p.xp} XP</span>
              {p.streak.current > 0 && (
                <>
                  <span>·</span>
                  <span className="text-rec">{p.streak.current} day streak</span>
                </>
              )}
            </div>

            <nav
              aria-label="Main"
              className="mt-4 grid grid-cols-2 gap-2.5 px-4 pb-6"
            >
              {LINKS.map((l) => {
                const active =
                  pathname === l.href || pathname.startsWith(l.href + "/");
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setMenuOpen(false)}
                    className={`rounded-2xl border px-4 py-4 text-base transition-colors ${
                      active
                        ? "border-amber bg-panel2 text-amber-ink"
                        : "border-line bg-panel text-ink hover:border-line2"
                    }`}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4 sm:gap-4 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <Image
              src="/suede-logo.png"
              alt=""
              width={22}
              height={22}
              className="rounded-full"
            />
            <span className="font-display text-lg tracking-tight">
              Suede Sing
            </span>
          </Link>

          {/* Desktop / tablet: scrollable link row, unchanged from before */}
          <nav
            aria-label="Main"
            className="no-scrollbar hidden flex-1 items-center gap-1 overflow-x-auto sm:flex [mask-image:linear-gradient(to_right,black_calc(100%-28px),transparent)]"
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
                      ? "bg-panel2 text-amber-ink"
                      : "text-mut hover:text-ink"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          {/* Mobile: single trigger that names the current page and opens a full-screen menu */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            className="flex flex-1 items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm text-ink sm:hidden"
          >
            <MenuIcon />
            {currentLabel}
          </button>

          <Link
            href="/progress"
            className="hidden shrink-0 items-center gap-2 rounded-full border border-line px-3 py-1.5 font-mono text-xs sm:flex"
          >
            <span className="text-amber-ink">LV {lvl.level}</span>
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
      {drawer}
    </>
  );
}

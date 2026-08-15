"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProgress, levelForXp, localDay } from "@/lib/progress";
import { useIsPro, useProReady } from "@/lib/pro";
import { ProChip } from "@/components/pro/ui";
import { useModalFocus } from "@/lib/use-modal-focus";

const LINKS = [
  { href: "/studio", label: "Studio" },
  { href: "/warmups", label: "Warmups" },
  { href: "/range", label: "Range" },
  { href: "/singers", label: "Singers" },
  { href: "/ear-training", label: "Ear" },
  { href: "/breath", label: "Breath" },
  { href: "/songs", label: "Songs" },
  { href: "/recorder", label: "Recorder" },
  { href: "/tools", label: "Tools" },
  { href: "/analyze", label: "Analyze" },
  { href: "/progress", label: "Progress" },
  { href: "/book", label: "Book" },
  { href: "/atlas", label: "Atlas" },
];

function MenuIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
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

/** Solid once today is banked, outline while the streak is still at risk. */
function FlameIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="shrink-0"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.8}
    >
      <path
        d="M12 2.5c1 3-3 4.5-3 8a3 3 0 0 0 6 0c0-1.2-.6-2-.6-2 1.8.6 3.1 2.6 3.1 4.6a5.5 5.5 0 0 1-11 0c0-4.5 3.5-6 4.2-9.8.1-.5.8-1.2 1.3-.8Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** What the streak chip is allowed to say. */
export type StreakChipState = "banked" | "at-risk" | "none";

/**
 * The single definition of the streak chip's three states, shared by the header
 * chip here and the Streak card on /progress so the two cannot disagree.
 *
 * `streak.current` is only recomputed when a session is logged, so it keeps its
 * old value for days after the streak has actually died. "At risk" therefore
 * requires the last practice to have been *yesterday* — the same guard the
 * coach card uses — otherwise a long-dead streak would be advertised as
 * something today's practice could still save.
 */
export function streakChipState(
  streak: { current: number; lastDay: string | null },
  now: Date = new Date(),
): StreakChipState {
  if (streak.current <= 0 || !streak.lastDay) return "none";
  if (streak.lastDay === localDay(now)) return "banked";
  const yesterday = localDay(new Date(now.getTime() - 24 * 3600 * 1000));
  return streak.lastDay === yesterday ? "at-risk" : "none";
}

export default function Nav() {
  const pathname = usePathname();
  const p = useProgress();
  const lvl = levelForXp(p.xp);
  const isPro = useIsPro();
  const proReady = useProReady();
  // Prerendered HTML has no entitlement to read, so "not Pro" is a guess until
  // the client store reports in. Gate anything that would state something false;
  // the header pill is styling only and says "Pro" either way, so it uses this
  // directly rather than holding a third neutral state that every visitor sees.
  const proActive = proReady && isPro;
  const streak = streakChipState(p.streak);
  const [menuOpen, setMenuOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  useModalFocus(menuOpen, drawerRef);

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
            ref={drawerRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="animate-fadeup absolute inset-0 flex flex-col overflow-y-auto bg-bg outline-none"
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

            {/* Directly under the header: on a phone this is the only entry to
                the paid tier — /pro is deliberately not one of the thirteen
                room links — and at the bottom of the list it sat below the
                fold on every screen size. */}
            <div className="px-4 pt-4">
              <Link
                href="/pro"
                onClick={() => setMenuOpen(false)}
                className="relative block overflow-hidden rounded-2xl border border-amber/50 bg-panel px-4 py-4 transition-colors hover:border-amber"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber to-transparent"
                />
                <span className="flex items-center gap-2">
                  <ProChip />
                  <span className="font-display text-base font-extrabold">
                    Suede Pro
                  </span>
                </span>
                <span className="mt-1 block text-sm text-mut">
                  {proActive
                    ? "Gold channel active — manage your plan"
                    : "The coach on top of the studio"}
                </span>
              </Link>
            </div>

            <div className="flex items-center gap-2 px-4 pt-4 font-mono text-xs text-dim">
              <span className="text-amber-ink">LV {lvl.level}</span>
              <span>·</span>
              <span className="tabular">{p.xp} XP</span>
              {streak !== "none" && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1 text-rec">
                    <FlameIcon filled={streak === "banked"} />
                    <span className="tabular">{p.streak.current}</span>
                    <span>day streak</span>
                    {streak === "at-risk" && (
                      <span className="text-dim">· not yet today</span>
                    )}
                  </span>
                </>
              )}
            </div>

            <nav
              aria-label="Main"
              className="mt-4 grid grid-cols-2 gap-2.5 px-4 pb-8"
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
            className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm text-ink sm:hidden"
          >
            <MenuIcon />
            <span className="truncate">{currentLabel}</span>
          </button>

          {/* Shown at every width: on a phone the header was the one place Pro
              had no entry at all, and the drawer is two taps away. */}
          <Link
            href="/pro"
            className={`flex shrink-0 items-center rounded-full px-2.5 py-1.5 font-mono text-xs font-semibold uppercase tracking-[0.14em] transition-colors sm:px-3 ${
              proActive
                ? "bg-amber text-[#241a05] hover:bg-amber-soft"
                : "border border-amber/60 text-amber-ink hover:border-amber hover:bg-panel2"
            }`}
          >
            Pro
          </Link>

          <Link
            href="/progress"
            className="hidden shrink-0 items-center gap-2 rounded-full border border-line px-3 py-1.5 font-mono text-xs sm:flex"
          >
            <span className="text-amber-ink">LV {lvl.level}</span>
            <span className="text-dim">·</span>
            <span className="tabular">{p.xp} XP</span>
            {streak !== "none" && (
              <>
                <span className="text-dim">·</span>
                <span className="flex items-center gap-1 text-rec">
                  <FlameIcon filled={streak === "banked"} />
                  <span aria-hidden="true" className="tabular">
                    {p.streak.current}d
                  </span>
                  {streak === "at-risk" && (
                    <span aria-hidden="true" className="text-dim">
                      · today?
                    </span>
                  )}
                  {/* "5d · today?" is the compact form the header has room for;
                      the sentence is what a screen reader gets instead. */}
                  <span className="sr-only">
                    {streak === "banked"
                      ? `${p.streak.current} day streak, practiced today`
                      : `${p.streak.current} day streak, at risk — nothing practiced today`}
                  </span>
                </span>
              </>
            )}
          </Link>
        </div>
      </header>
      {drawer}
    </>
  );
}

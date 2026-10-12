"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccountAuth } from "@/lib/use-account-auth";
import { useProgress, levelForXp, localDay } from "@/lib/progress";
import { useIsPro, useProReady } from "@/lib/pro";
import { ProChip } from "@/components/pro/ui";
import { hasSomethingToSave, liveStreak } from "@/components/account/save-state";
import { useModalFocus } from "@/lib/use-modal-focus";
import { accountsReady } from "@/lib/accounts";
import { rangeTestHref } from "@/lib/site";

/**
 * The account controls are the nav's only use of Clerk's React SDK, so they
 * load as their own chunk, and only once accounts are live and the session has
 * resolved. A static import shipped about 42 KB of Clerk (gzipped) to every
 * page of a build where no account control can ever render.
 */
const NavAccount = dynamic(() => import("@/components/account/nav-account"));

/**
 * The app has five destinations, the way a phone singing app does: Home, Sing
 * (the live pitch meter and every measuring tool), Songs, Lessons (warmups,
 * ear, breath and the reading) and Progress. Every room still has its own page
 * and ranks for its own queries; `also` keeps the owning tab lit inside one.
 * The full room list lives in the More sheet.
 *
 * `href` is the tab's route, the one isActiveLink and ariaCurrentFor match on;
 * `target`, when set, is where tapping it goes. Sing lands on #start, as the
 * homepage's "Start singing" does: bare /range opens at the top, and on a
 * phone the start button sits under this tab bar.
 */
export const PRIMARY: {
  href: string;
  target?: string;
  label: string;
  also?: string[];
  icon: TabIconName;
}[] = [
  { href: "/", label: "Home", icon: "home" },
  {
    href: "/range",
    target: rangeTestHref({ mode: "pitch" }),
    label: "Sing",
    also: ["/studio", "/analyze", "/recorder", "/tools"],
    icon: "mic",
  },
  { href: "/songs", label: "Songs", also: ["/singers", "/can-you-sing"], icon: "note" },
  {
    href: "/warmups",
    label: "Lessons",
    also: ["/programs", "/ear-training", "/breath", "/learn", "/book", "/atlas", "/glossary"],
    icon: "book",
  },
  { href: "/progress", label: "Progress", icon: "chart" },
];

/**
 * Every room, for the More sheet. `href` and `target` work as in PRIMARY:
 * "Pitch & range" opens the same page as the Sing tab, at the same #start.
 */
export const LINKS: { href: string; target?: string; label: string; also?: string[] }[] = [
  { href: "/range", target: rangeTestHref({ mode: "pitch" }), label: "Pitch & range" },
  { href: "/studio", label: "Studio" },
  { href: "/warmups", label: "Warmups", also: ["/programs"] },
  { href: "/songs", label: "Songs" },
  { href: "/singers", label: "Singers" },
  { href: "/ear-training", label: "Ear training" },
  { href: "/breath", label: "Breath" },
  { href: "/tools", label: "Tools", also: ["/recorder", "/analyze"] },
  { href: "/learn", label: "Learn", also: ["/learn/voice", "/book", "/atlas", "/glossary"] },
  { href: "/progress", label: "Progress" },
];

/** True when the pathname sits inside the tab's own route or an absorbed one. */
export function isActiveLink(
  l: { href: string; also?: string[] },
  pathname: string,
): boolean {
  if (l.href === "/") return pathname === "/";
  return [l.href, ...(l.also ?? [])].some(
    (h) => pathname === h || pathname.startsWith(h + "/"),
  );
}

/**
 * aria-current for a nav link: "page" on the tab's own URL, "location" inside
 * a route it owns, nothing elsewhere. Shared by every navigation landmark so
 * the header row, the bottom tab bar and the drawer announce the same tab.
 */
export function ariaCurrentFor(
  l: { href: string; also?: string[] },
  pathname: string,
): "page" | "location" | undefined {
  if (!isActiveLink(l, pathname)) return undefined;
  return pathname === l.href ? "page" : "location";
}

export type TabIconName ="home" | "mic" | "note" | "book" | "chart";

export function TabIcon({ name, active }: { name: TabIconName; active: boolean }) {
  const common = {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: active ? 2.2 : 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (name) {
    case "home":
      return (
        <svg {...common}>
          <path d="M3.5 10.5 12 3.5l8.5 7V20a1 1 0 0 1-1 1h-5v-6h-5v6h-5a1 1 0 0 1-1-1z" fill={active ? "currentColor" : "none"} />
        </svg>
      );
    case "mic":
      return (
        <svg {...common}>
          <rect x="9" y="2.5" width="6" height="12" rx="3" fill={active ? "currentColor" : "none"} />
          <path d="M5 11a7 7 0 0 0 14 0M12 18v3.5" />
        </svg>
      );
    case "note":
      return (
        <svg {...common}>
          <path d="M9 18V5l11-2v13" />
          <circle cx="6" cy="18" r="3" fill={active ? "currentColor" : "none"} />
          <circle cx="17" cy="16" r="3" fill={active ? "currentColor" : "none"} />
        </svg>
      );
    case "book":
      return (
        <svg {...common}>
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" fill={active ? "currentColor" : "none"} />
          <path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" />
        </svg>
      );
    case "chart":
      return (
        <svg {...common}>
          <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
        </svg>
      );
  }
}

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
  // liveStreak is the one definition of "still alive" (today or yesterday),
  // shared with the in-page save prompt.
  if (liveStreak(streak, now) === 0) return "none";
  return streak.lastDay === localDay(now) ? "banked" : "at-risk";
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
  // Same discipline as proActive above, applied harder: signed-in and
  // signed-out are different controls, not two paint jobs on one, so nothing
  // account-shaped renders until Clerk has actually resolved the session. A
  // returning member would otherwise be shown a sign-in offer for the account
  // they are already in.
  const { isLoaded: authLoaded, isSignedIn } = useAccountAuth();
  // hasSomethingToSave is the shared definition of an earned prompt (a logged
  // session, a recorded take, a live streak, a measured range). The in-page
  // save prompt reads the same function, so the header cannot ask on a colder
  // page than that one does. Before it is true the affordance is still there,
  // just neutral: a visitor whose browser was wiped has nothing to lose and is
  // exactly the person who needs the way back in.
  const worthSaving = hasSomethingToSave(p);
  const streak = streakChipState(p.streak);
  // The fade on the right edge of the tab row is a scroll hint, so it should
  // only exist when there is something to scroll. Adding the account button
  // narrowed the row by 44px, which pushed "Progress" under a fade it could
  // never be scrolled out from behind: at 1280px the row does not overflow, so
  // the last tab sat permanently half-erased with no way to reveal it.
  const tabsRef = useRef<HTMLElement>(null);
  const [tabsOverflow, setTabsOverflow] = useState(false);
  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    const measure = () =>
      setTabsOverflow(el.scrollWidth - el.clientWidth - el.scrollLeft > 1);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    el.addEventListener("scroll", measure, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", measure);
    };
  }, []);

  const [menuOpen, setMenuOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  useModalFocus(menuOpen, drawerRef);

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
        <div className="fixed inset-0 z-[60]">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/60"
            onClick={() => setMenuOpen(false)}
          />
          <div
            ref={drawerRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="animate-fadeup absolute inset-y-0 right-0 flex w-full flex-col overflow-y-auto bg-bg outline-none sm:max-w-md sm:border-l sm:border-line"
          >
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
              <Link
                href="/"
                className="flex items-center gap-2"
                onClick={() => setMenuOpen(false)}
              >
                <Image
                  src="/suede-logo.png"
                  alt="Suede Sing logo"
                  width={22}
                  height={22}
                  className="rounded-full"
                />
                <span className="text-lg font-extrabold tracking-tight">
                  Suede Sing
                </span>
              </Link>
              {/* 44x44, because p-2 around an 18px glyph gave a 34px tap
                  target — under Apple's minimum on the one control a phone
                  reaches for most. The glyph stays 18px and the negative
                  margin spends the extra width into the row's own px-4
                  gutter, so the X sits where it always did and the row gets
                  no wider.

                  The square overlay is the hit region. `rounded-full` shapes
                  the global focus ring, but border-radius clips pointer
                  hit-testing too, which would leave the four corners of the
                  new box dead — a fifth of it. iOS does the same thing:
                  round button, square target. */}
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="relative -mr-1 flex size-11 shrink-0 items-center justify-center rounded-full text-mut after:absolute after:inset-0 hover:text-ink"
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
                className="relative block overflow-hidden rounded-2xl border border-violet/50 bg-panel px-4 py-4 transition-colors hover:border-violet"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet to-transparent"
                />
                <span className="flex items-center gap-2">
                  <ProChip />
                  <span className="text-base font-extrabold">
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
              <span className="text-violet-ink">LV {lvl.level}</span>
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

            {/* Sits with the LV/XP/streak line rather than with the Pro card,
                because that line is the thing it is offering to protect. It is
                also the phone's only account entry: the header has room for the
                Pro pill and the user button and nothing more. */}
            {accountsReady() && authLoaded && (
              <NavAccount
                placement="drawer"
                isSignedIn={Boolean(isSignedIn)}
                worthSaving={worthSaving}
                onNavigate={() => setMenuOpen(false)}
              />
            )}

            <nav
              aria-label="All rooms"
              className="mt-4 grid grid-cols-2 gap-2.5 px-4 pb-8"
            >
              {LINKS.map((l) => {
                const active = isActiveLink(l, pathname);
                return (
                  <Link
                    key={l.href}
                    href={l.target ?? l.href}
                    onClick={() => setMenuOpen(false)}
                    aria-current={ariaCurrentFor(l, pathname)}
                    className={`rounded-2xl border px-4 py-4 text-base transition-colors ${
                      active
                        ? "border-violet bg-panel2 text-violet-ink"
                        : "border-line bg-panel text-ink hover:border-line2 hover:bg-panel2"
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
      <header className="sticky top-0 z-50 border-b border-line/60 bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4 sm:gap-4 sm:px-6">
          <Link
            href="/"
            className="flex min-h-11 shrink-0 items-center gap-2"
          >
            <Image
              src="/suede-logo.png"
              alt="Suede Sing logo"
              width={22}
              height={22}
              className="rounded-full"
            />
            <span className="text-lg font-extrabold tracking-tight">
              Suede Sing
            </span>
          </Link>

          {/* Desktop / tablet: thumb-sized tabs with a fade only while more remain.
              Safe centring, not justify-center: between sm and ~1000px the row
              overflows, and plain centring pushes the overflow off the left
              edge where a scroll container cannot reach, leaving "Home"
              unclickable under the logo. Safe centring falls back to start. */}
          <nav
            aria-label="Main"
            ref={tabsRef}
            className={`no-scrollbar hidden flex-1 items-center justify-center-safe gap-1 overflow-x-auto sm:flex ${
              tabsOverflow
                ? "[mask-image:linear-gradient(to_right,black_calc(100%-28px),transparent)]"
                : ""
            }`}
          >
            {PRIMARY.map((l) => {
              const active = isActiveLink(l, pathname);
              return (
                <Link
                  key={l.href}
                  href={l.target ?? l.href}
                  aria-current={ariaCurrentFor(l, pathname)}
                  className={`flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${
                    active
                      ? "bg-ink text-bg"
                      : "text-mut hover:bg-panel2 hover:text-ink"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

<div className="flex-1 sm:hidden" />
          {/* Shown at every width: on a phone the header was the one place Pro
              had no entry at all, and the drawer is two taps away. */}
          <Link
            href="/pro"
            className={`flex min-h-11 shrink-0 items-center rounded-full px-2.5 py-1.5 font-mono text-xs font-semibold uppercase tracking-[0.14em] transition-colors sm:px-3 ${
              proActive
                ? "bg-brand text-white hover:bg-violet"
                : "border border-violet/60 text-violet-ink hover:border-violet hover:bg-panel2"
            }`}
          >
            Pro
          </Link>

          <Link
            href="/progress"
            className="hidden min-h-11 shrink-0 items-center gap-2 rounded-full border border-line px-3 py-1.5 font-mono text-xs transition-colors hover:border-line2 hover:bg-panel2 sm:flex"
          >
            <span className="text-violet-ink">LV {lvl.level}</span>
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

          {/* Last in the row, where an account control is looked for, and a
              glyph rather than a label because the row has no words left to
              give. At the max-w-6xl plateau the ten tabs need 706px and have
              777px, so anything past 71px (this slot plus its gap) starts
              masking the Progress tab — and a "Save progress" label alone is
              wider than that. The offer gets its sentence where there is room
              to say it: the drawer below, and the in-page save prompt.
              28px square either way, so signing in shifts nothing.

              Signed in it shows at every width, because the user button is the
              only route to signing out. Signed out it hides below sm: a phone
              header already carries the menu, the current page name and the Pro
              pill, and a free offer can wait two taps for the drawer. */}
          {accountsReady() && authLoaded && (
            <NavAccount
              placement="header"
              isSignedIn={Boolean(isSignedIn)}
              worthSaving={worthSaving}
            />
          )}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            aria-label="All rooms"
            className="relative flex size-11 shrink-0 items-center justify-center rounded-full border border-line text-ink transition-colors hover:bg-panel2"
          >
            <MenuIcon />
          </button>
        </div>
      </header>
      {drawer}
      <TabBar pathname={pathname} />
    </>
  );
}

/**
 * The phone's bottom tab bar: five destinations under the thumb, the shape
 * every mobile singing app uses. Hidden from sm up, where the header carries
 * the same five as pills. Rendered with its own label so screen readers can
 * tell it from the header row.
 */
function TabBar({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="Tabs"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line/70 bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl sm:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {PRIMARY.map((l) => {
          const active = isActiveLink(l, pathname);
          return (
            <li key={l.href}>
              <Link
                href={l.target ?? l.href}
                aria-current={ariaCurrentFor(l, pathname)}
                className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-bold transition-colors ${
                  active ? "text-ink" : "text-dim hover:text-mut"
                }`}
              >
                {/* The active tab was told apart by colour and stroke weight
                    alone; the bar on the top edge is a cue that survives
                    greyscale and a glance. Absolute, so no tab moves. */}
                {active && (
                  <span
                    aria-hidden
                    className="absolute inset-x-0 top-0 mx-auto h-0.5 w-8 rounded-full bg-pink"
                  />
                )}
                <span className={active ? "text-pink" : ""}>
                  <TabIcon name={l.icon} active={active} />
                </span>
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

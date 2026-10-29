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
 * Ten tabs, not fourteen: Recorder and Analyze fold into Tools, Programs into
 * Warmups, and Learn is the front door for the two books, glossary and
 * training guides. The absorbed rooms keep their pages (each ranks for its own
 * queries and is linked from its host tab and the footer) — `also` keeps the
 * host tab lit while you're inside one, so the header never claims you are
 * nowhere. Order follows the practice loop: warm up and sing, measure and
 * compare, then read and review.
 *
 * `prefetch: false` keeps a tab from fetching its page in the background on
 * every load. The header row is on screen at 640px and wider, so a prefetching
 * Singers tab pulled the whole /singers directory (about 230 KB) into every
 * page, the payload lib/singer-link-prefetch.test.ts keeps other links from
 * fetching unasked.
 */
export const LINKS: {
  href: string;
  target?: string;
  label: string;
  also?: string[];
  prefetch?: false;
}[] = [
  { href: "/studio", label: "Studio" },
  { href: "/warmups", label: "Warmups", also: ["/programs"] },
  { href: "/range", target: rangeTestHref(), label: "Range" },
  { href: "/singers", label: "Singers", prefetch: false },
  { href: "/ear-training", label: "Ear" },
  { href: "/breath", label: "Breath" },
  { href: "/songs", label: "Songs" },
  { href: "/tools", label: "Tools", also: ["/recorder", "/analyze"] },
  { href: "/learn", label: "Learn", also: ["/learn/voice", "/book", "/atlas", "/glossary"] },
  { href: "/progress", label: "Progress" },
];

/** True when the pathname sits inside the tab's own route or an absorbed one. */
function isActiveLink(
  l: { href: string; also?: string[] },
  pathname: string,
): boolean {
  return [l.href, ...(l.also ?? [])].some(
    (h) => pathname === h || pathname.startsWith(h + "/"),
  );
}

/**
 * aria-current for a nav link: "page" on the tab's own URL, "location" inside
 * a route it owns, nothing elsewhere. Shared by every navigation landmark so
 * the header row and the mobile drawer announce the same tab.
 */
export function ariaCurrentFor(
  l: { href: string; also?: string[] },
  pathname: string,
): "page" | "location" | undefined {
  if (!isActiveLink(l, pathname)) return undefined;
  return pathname === l.href ? "page" : "location";
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
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const [tabsOverflow, setTabsOverflow] = useState(false);
  const [tabsScrollable, setTabsScrollable] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    const measure = () => {
      // The menu depends on total overflow, not the remaining scroll distance:
      // it must still reach the first rooms after the row is scrolled to its end.
      // Measure the space the tabs would have without the overflow button.
      // Otherwise the button itself can keep the row overflowing forever
      // after resizing back to a desktop where all ten tabs would fit.
      const triggerWidth = menuTriggerRef.current?.getBoundingClientRect().width ?? 0;
      const menuSpace = el.clientWidth > 0 && triggerWidth > 0
        ? triggerWidth + parseFloat(getComputedStyle(el.parentElement!).columnGap)
        : 0;
      const scrollable = el.scrollWidth > el.clientWidth + menuSpace + 1;
      setTabsScrollable(scrollable);
      setTabsOverflow(el.scrollWidth - el.clientWidth - el.scrollLeft > 1);
      // Close only when the visible row can reach every room itself. A hidden
      // phone row has width zero and must not dismiss its own drawer.
      if (el.clientWidth > 0 && !scrollable) setMenuOpen(false);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    // Font loading can change the links without resizing the flex viewport.
    for (const link of el.children) ro.observe(link);
    el.addEventListener("scroll", measure, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", measure);
    };
  }, []);

  const drawerRef = useRef<HTMLDivElement>(null);
  useModalFocus(menuOpen, drawerRef);

  const currentLabel =
    LINKS.find((l) => isActiveLink(l, pathname))?.label ?? "Menu";

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
                {/* Decorative: the link already says "Suede Sing". */}
                <Image
                  src="/suede-logo.png"
                  alt=""
                  width={22}
                  height={22}
                  className="rounded-full"
                />
                <span className="font-display text-xl tracking-tight">
                  Suede Sing
                </span>
              </Link>
              {/* A 44x44 target around the 18px glyph; the negative margin
                  keeps the X where it was. The square ::after overlay is the
                  hit region, since border-radius would clip its corners. */}
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="relative -mr-1 flex size-11 shrink-0 items-center justify-center rounded-full text-mut after:absolute after:inset-0 hover:text-ink"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Keep Pro above the room list so it remains easy to find after
                opening the drawer. It also has a pill in the phone header. */}
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
                    ? "Pro is active · manage your plan"
                    : "The coach's full plan, on top of the free studio"}
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
              aria-label="Main"
              className="mt-4 grid grid-cols-2 gap-2.5 px-4 pb-8"
            >
              {LINKS.map((l) => {
                const active = isActiveLink(l, pathname);
                return (
                  <Link
                    key={l.href}
                    href={l.target ?? l.href}
                    prefetch={l.prefetch}
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
      <header className="sticky top-0 z-50 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4 sm:gap-4 sm:px-6">
          <Link
            href="/"
            className="flex min-h-11 shrink-0 items-center gap-2"
          >
            {/* Decorative: the link already says "Suede Sing", and the alt
                text made its name "Suede Sing logo Suede Sing". */}
            <Image
              src="/suede-logo.png"
              alt=""
              width={22}
              height={22}
              className="rounded-full"
            />
            <span className="font-display text-xl tracking-tight">
              Suede Sing
            </span>
          </Link>

          {/* Desktop / tablet: thumb-sized tabs with a fade only while more remain.
              Start-aligned so the first tab stays reachable when the row
              overflows on narrower screens. overflow-x-auto clips on both
              axes, and the 44px tabs filled the row's height, so a focused
              tab's ring (2px, 2px out) lost its top and bottom. p-1 gives the
              ring room inside the clip and -m-1 hands the space back, so the
              tabs sit exactly where they did. */}
          <nav
            aria-label="Main"
            ref={tabsRef}
            className={`no-scrollbar -m-1 hidden flex-1 items-center gap-2 overflow-x-auto p-1 sm:flex ${
              tabsOverflow
                ? "[mask-image:linear-gradient(to_right,black_calc(100%-28px),transparent)]"
                : ""
            }`}
          >
            {LINKS.map((l) => {
              const active = isActiveLink(l, pathname);
              return (
                <Link
                  key={l.href}
                  href={l.target ?? l.href}
                  prefetch={l.prefetch}
                  aria-current={ariaCurrentFor(l, pathname)}
                  className={`flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition-colors ${
                    active
                      ? "bg-panel2 text-violet-ink"
                      : "text-mut hover:text-ink"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          {/* Phones name the current room. An overflowing tab row keeps the
              same drawer available through a compact, visible Menu button. */}
          <button
            ref={menuTriggerRef}
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            className={`flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm text-ink sm:flex-none ${tabsScrollable ? "sm:flex" : "sm:hidden"}`}
          >
            <MenuIcon />
            {/* The 404 page is pre-rendered once with no real path, so its
                HTML says "Menu"; under /warmups/typo the client would compute
                "Warmups". Keeping the server's text is also the right label
                for a page that isn't there. */}
            <span className="truncate sm:hidden" suppressHydrationWarning>
              {currentLabel}
              {/* The visible label is the room; the hidden words say what the
                  button does: "Warmups, open menu". Inside the label's span,
                  so no stray space lands before the comma. */}
              <span className="sr-only">, open menu</span>
            </span>
            <span className="hidden sm:inline">Menu</span>
          </button>

          {/* Shown at every width: on a phone the header was the one place Pro
              had no entry at all, and the drawer is two taps away. */}
          <Link
            href="/pro"
            className={`flex min-h-11 shrink-0 items-center rounded-full px-2.5 py-1.5 font-mono text-xs font-semibold uppercase tracking-[0.14em] transition-colors sm:px-3 ${
              proActive
                ? "bg-violet text-[#241a05] hover:bg-violet"
                : "border border-violet/60 text-violet-ink hover:border-violet hover:bg-panel2"
            }`}
          >
            Pro
          </Link>

          {/* Fixed width at the 1280px plateau, so it shows only what fits
              there at any count: the level and, while a streak is alive, the
              flame (solid once today is banked, outline while it is at risk)
              and the day count. "LV 6 · 1230 XP · 12d · today?" took 250px
              and pushed Learn and Progress behind the Menu button, in a row
              that leaves this pill about 120px once the account control is
              beside it (see below). The XP count and the at-risk words are in the
              drawer and on /progress, and the sentence below is what a screen
              reader hears. */}
          <Link
            href="/progress"
            className="hidden min-h-11 shrink-0 items-center gap-2 rounded-full border border-line px-3 py-1.5 font-mono text-xs transition-colors hover:border-line2 hover:bg-panel2 sm:flex"
          >
            {/* Heard as "Level 6, 1230 XP": "LV" read as two letters, and
                the XP in its own span put a stray space before the comma. */}
            <span className="text-violet-ink">
              <span aria-hidden="true">LV</span>
              <span className="sr-only">Level</span> {lvl.level}
              <span className="sr-only">, {p.xp} XP</span>
            </span>
            {streak !== "none" && (
              <span className="flex items-center gap-1 text-rec">
                <FlameIcon filled={streak === "banked"} />
                <span aria-hidden="true" className="tabular">
                  {p.streak.current}d
                </span>
                <span className="sr-only">
                  {streak === "banked"
                    ? `, ${p.streak.current} day streak, practiced today`
                    : `, ${p.streak.current} day streak, at risk, nothing practiced today`}
                </span>
              </span>
            )}
          </Link>

          {/* Last in the row, a 28px glyph: at the max-w-6xl plateau the tabs,
              logo and pills leave about 50px, so a label would push Learn and
              Progress into the Menu. Signed in it shows at every width (the
              only route to signing out); signed out it hides below sm, where
              the drawer carries the offer. */}
          {accountsReady() && authLoaded && (
            <NavAccount
              placement="header"
              isSignedIn={Boolean(isSignedIn)}
              worthSaving={worthSaving}
            />
          )}
        </div>
      </header>
      {drawer}
    </>
  );
}

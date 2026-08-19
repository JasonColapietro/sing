"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProgress, levelForXp, localDay } from "@/lib/progress";
import { useIsPro, useProReady } from "@/lib/pro";
import { ProChip } from "@/components/pro/ui";
import { SectionLabel } from "@/components/ui";
import { APP_NAME, APP_STORE_URL } from "@/lib/app-store";
import { useModalFocus } from "@/lib/use-modal-focus";

export type NavItem = { href: string; label: string; external?: boolean };
export type NavGroup = { id: string; label: string; items: NavItem[] };

/**
 * The header used to render all thirteen rooms as one flat `overflow-x-auto`
 * row inside a `max-w-6xl` header. The row needed ~925px and got 777px at
 * 1280, so Progress, Book and Atlas fell off the right edge at *every* desktop
 * width — with `.no-scrollbar` on and only a fade mask, there was no scrollbar,
 * no chevron, and no cue that anything was hidden. Three indexed rooms were
 * unreachable from the header on any screen.
 *
 * The rooms are grouped instead of shrunk: five top-level items fit inside the
 * container with room to spare, and the grouping is the same one the mobile
 * drawer uses, so the two surfaces cannot describe the product differently.
 *
 * Every `<a href>` below ships in the server-rendered HTML at all times. The
 * closed menus are hidden with `visibility`/`opacity`, never unmounted and
 * never portaled, because a crawler reads the raw HTML and a menu that mounted
 * on click would take those destinations back out of the crawl path.
 * lib/internal-linking.test.tsx asserts that against rendered markup.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    id: "practice",
    label: "Practice",
    items: [
      { href: "/studio", label: "Studio" },
      { href: "/warmups", label: "Warmups" },
      { href: "/range", label: "Range" },
      { href: "/breath", label: "Breath" },
      { href: "/ear-training", label: "Ear training" },
    ],
  },
  {
    id: "perform",
    label: "Perform",
    items: [
      { href: "/songs", label: "Songs" },
      { href: "/recorder", label: "Recorder" },
      { href: "/analyze", label: "Analyze" },
      { href: "/tools", label: "Tools" },
    ],
  },
  {
    id: "library",
    label: "Library",
    items: [
      { href: "/singers", label: "Singers" },
      { href: "/atlas", label: "Atlas" },
      { href: "/book", label: "Book" },
      { href: "/glossary", label: "Glossary" },
    ],
  },
  {
    id: "apps",
    label: "Apps",
    items: [
      { href: "/extension", label: "Chrome extension" },
      { href: APP_STORE_URL, label: `${APP_NAME} for iPhone`, external: true },
    ],
  },
];

/** Promoted out of the groups: where a returning singer goes first. */
export const PROGRESS_LINK: NavItem = { href: "/progress", label: "Progress" };

/**
 * Every route the header can name, longest path first so `/singers/records`
 * wins over `/singers`. Footer-only and chrome-only destinations are included
 * so the mobile trigger never degrades to a generic "Menu" on a real page — it
 * used to do exactly that on /glossary, which was in no nav array at all.
 */
const ROUTE_LABELS: NavItem[] = [
  ...NAV_GROUPS.flatMap((g) => g.items).filter((i) => !i.external),
  PROGRESS_LINK,
  { href: "/singers/records", label: "Range records" },
  { href: "/pro", label: "Suede Pro" },
].sort((a, b) => b.href.length - a.href.length);

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
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

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      className={`shrink-0 transition-transform duration-150 ease-out ${
        open ? "rotate-180" : ""
      }`}
    >
      <path
        d="M2.5 4.5 6 8l3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
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

const TOP_ITEM =
  "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition-colors";
// Background shape and weight, not colour alone, so the current section
// survives greyscale.
const TOP_ITEM_ACTIVE = "bg-panel2 font-semibold text-amber-ink";
const TOP_ITEM_IDLE = "text-mut hover:text-ink";

/** One desktop group: a disclosure button over an always-rendered link list. */
function GroupMenu({
  group,
  pathname,
  open,
  onToggle,
  onClose,
  triggerRef,
}: {
  group: NavGroup;
  pathname: string;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  triggerRef: (el: HTMLButtonElement | null) => void;
}) {
  const groupActive = group.items.some(
    (i) => !i.external && isActive(pathname, i.href),
  );
  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`nav-group-${group.id}`}
        className={`${TOP_ITEM} ${groupActive ? TOP_ITEM_ACTIVE : TOP_ITEM_IDLE}`}
      >
        {group.label}
        <ChevronIcon open={open} />
      </button>

      <ul
        id={`nav-group-${group.id}`}
        // `visibility` — not unmounting, not display:none — keeps the anchors
        // in the server-rendered HTML while taking a closed menu out of the tab
        // order and the accessibility tree. globals.css zeroes the duration
        // under prefers-reduced-motion.
        //
        // `visibility` is in the closing transition only. Transitioning it on
        // the way *open* costs the menu its first 150ms of focusability:
        // Enter-then-Tab straight away tabbed past the whole menu, because the
        // computed visibility was still `hidden`. Closing keeps it, since a
        // discrete `visible → hidden` interpolation holds `visible` for the
        // duration and is what lets the fade-out finish before it disappears.
        className={`absolute left-0 top-full z-10 mt-2 min-w-[13rem] rounded-2xl border border-line bg-panel p-1.5 shadow-lg duration-150 ease-out ${
          open
            ? "visible translate-y-0 opacity-100 transition-[opacity,transform]"
            : "invisible -translate-y-1 opacity-0 transition-[opacity,transform,visibility]"
        }`}
      >
        {group.items.map((item) => {
          const active = !item.external && isActive(pathname, item.href);
          const className = `flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
            active
              ? "bg-panel2 font-semibold text-amber-ink"
              : "text-mut hover:bg-panel2 hover:text-ink"
          }`;
          return (
            <li key={item.href}>
              {item.external ? (
                <a href={item.href} className={className} onClick={onClose}>
                  {item.label}
                  <span aria-hidden="true" className="text-dim">
                    ↗
                  </span>
                </a>
              ) : (
                <Link
                  href={item.href}
                  className={className}
                  aria-current={active ? "page" : undefined}
                  onClick={onClose}
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** One drawer group: mono kicker over the same items the desktop menu holds. */
function DrawerGroup({
  group,
  pathname,
  onNavigate,
}: {
  group: NavGroup;
  pathname: string;
  onNavigate: () => void;
}) {
  return (
    <div className="mt-6">
      <SectionLabel>{group.label}</SectionLabel>
      <ul className="mt-3 grid grid-cols-2 gap-2.5">
        {group.items.map((item) => {
          const active = !item.external && isActive(pathname, item.href);
          const className = `block h-full rounded-2xl border px-4 py-4 text-base transition-colors ${
            active
              ? "border-amber bg-panel2 font-semibold text-amber-ink"
              : "border-line bg-panel text-ink hover:border-line2"
          }`;
          return (
            <li key={item.href}>
              {item.external ? (
                <a href={item.href} className={className} onClick={onNavigate}>
                  {item.label}{" "}
                  <span aria-hidden="true" className="text-dim">
                    ↗
                  </span>
                </a>
              ) : (
                <Link
                  href={item.href}
                  className={className}
                  aria-current={active ? "page" : undefined}
                  onClick={onNavigate}
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
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
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const desktopNavRef = useRef<HTMLElement>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  useModalFocus(menuOpen, drawerRef);

  const progressActive = isActive(pathname, PROGRESS_LINK.href);
  const currentLabel =
    pathname === "/"
      ? "Home"
      : (ROUTE_LABELS.find((l) => isActive(pathname, l.href))?.label ?? "Menu");

  // Close the mobile menu and any open group menu on navigation. Adjusted
  // during render (guarded by prevPathname) rather than in an effect, per
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    if (menuOpen) setMenuOpen(false);
    if (openGroup) setOpenGroup(null);
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

  // Escape and click-outside close the open group. Escape hands focus back to
  // the trigger it came from, so a keyboard user does not get dropped at the
  // top of the document.
  useEffect(() => {
    if (!openGroup) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!desktopNavRef.current?.contains(e.target as Node)) {
        setOpenGroup(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      triggerRefs.current[openGroup]?.focus();
      setOpenGroup(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openGroup]);

  // Portaled to document.body: a fixed-position drawer nested inside the
  // sticky, backdrop-blurred header would be sized against the header's own
  // containing block (56px tall), not the viewport, since backdrop-filter
  // creates a new containing block for fixed descendants.
  const drawer = menuOpen
    ? createPortal(
        <div className="fixed inset-0 z-[60] md:hidden">
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
                the paid tier — /pro is deliberately not one of the room links
                — and at the bottom of the list it sat below the fold on every
                screen size. */}
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

            {/* The same four groups the desktop header uses, as mono kickers.
                The flat thirteen-tile grid this replaces gave a phone no way to
                tell a practice room from a reference page. */}
            <nav aria-label="Main" className="mt-6 px-4 pb-10">
              <Link
                href={PROGRESS_LINK.href}
                onClick={() => setMenuOpen(false)}
                aria-current={progressActive ? "page" : undefined}
                className={`block rounded-2xl border px-4 py-4 text-base transition-colors ${
                  progressActive
                    ? "border-amber bg-panel2 font-semibold text-amber-ink"
                    : "border-line bg-panel text-ink hover:border-line2"
                }`}
              >
                {PROGRESS_LINK.label}
              </Link>
              {NAV_GROUPS.map((g) => (
                <DrawerGroup
                  key={g.id}
                  group={g}
                  pathname={pathname}
                  onNavigate={() => setMenuOpen(false)}
                />
              ))}
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

          {/* Desktop / tablet: four grouped disclosures plus Progress. Nothing
              overflows any more, so there is no scroll container and no fade
              mask pretending to be one. */}
          <nav
            ref={desktopNavRef}
            aria-label="Main"
            className="hidden flex-1 items-center gap-1 md:flex"
            // Tabbing past the last link of an open menu closes it.
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setOpenGroup(null);
              }
            }}
          >
            {NAV_GROUPS.map((g) => (
              <GroupMenu
                key={g.id}
                group={g}
                pathname={pathname}
                open={openGroup === g.id}
                onToggle={() =>
                  setOpenGroup((cur) => (cur === g.id ? null : g.id))
                }
                onClose={() => setOpenGroup(null)}
                triggerRef={(el) => {
                  triggerRefs.current[g.id] = el;
                }}
              />
            ))}
            <Link
              href={PROGRESS_LINK.href}
              aria-current={progressActive ? "page" : undefined}
              className={`${TOP_ITEM} ${
                progressActive ? TOP_ITEM_ACTIVE : TOP_ITEM_IDLE
              }`}
            >
              {PROGRESS_LINK.label}
            </Link>
          </nav>

          {/* Mobile: single trigger that names the current page and opens a full-screen menu */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm text-ink md:hidden"
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
            className="hidden shrink-0 items-center gap-2 rounded-full border border-line px-3 py-1.5 font-mono text-xs lg:flex"
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

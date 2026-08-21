"use client";

import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactElement,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignInButton, SignUpButton, UserButton, useAuth } from "@clerk/nextjs";
import { useProgress, levelForXp, localDay } from "@/lib/progress";
import { useIsPro, useProReady } from "@/lib/pro";
import { ProChip } from "@/components/pro/ui";
import { Button } from "@/components/ui";
import { hasSomethingToSave } from "@/components/account/save-prompt";
import { useModalFocus } from "@/lib/use-modal-focus";
import { accountsReady } from "@/lib/accounts";

/**
 * Ten tabs, not thirteen: Recorder and Analyze fold into Tools, and the two
 * books share one Books tab. The absorbed rooms keep their pages (each ranks
 * for its own queries and is linked from its host tab and the footer) — `also`
 * keeps the host tab lit while you're inside one, so the header never claims
 * you are nowhere. Order follows the practice loop: warm up and sing, measure
 * and compare, then read and review.
 */
const LINKS: { href: string; label: string; also?: string[] }[] = [
  { href: "/studio", label: "Studio" },
  { href: "/warmups", label: "Warmups" },
  { href: "/range", label: "Range" },
  { href: "/singers", label: "Singers" },
  { href: "/ear-training", label: "Ear" },
  { href: "/breath", label: "Breath" },
  { href: "/songs", label: "Songs" },
  { href: "/tools", label: "Tools", also: ["/recorder", "/analyze"] },
  { href: "/book", label: "Books", also: ["/atlas"] },
  { href: "/progress", label: "Progress" },
];

/** True when the pathname sits inside the tab's own route or an absorbed one. */
function isActiveLink(
  l: (typeof LINKS)[number],
  pathname: string,
): boolean {
  return [l.href, ...(l.also ?? [])].some(
    (h) => pathname === h || pathname.startsWith(h + "/"),
  );
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

/** Neutral head-and-shoulders glyph, drawn to match MenuIcon's line weight. */
function AccountIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <circle cx="8" cy="5.5" r="2.6" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M2.9 13.9c0-2.6 2.3-4.2 5.1-4.2s5.1 1.6 5.1 4.2"
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

type ClerkAppearance = NonNullable<
  ComponentProps<typeof UserButton>["appearance"]
>;

/**
 * The header's own copy of the site theme, spent on the sign-in modal and the
 * user button. Tailwind's semantic classes cannot reach Clerk's subtree, so
 * these name the tokens directly: app/globals.css puts them on `:root, :host`,
 * which Clerk's card and portals both inherit.
 *
 * The full version, with a note on why colorPrimary is the darker gold, lives
 * in app/sign-in/[[...sign-in]]/page.tsx. Keep the two in step. A route module
 * and a "use client" module cannot share one constant without a third file.
 */
const CLERK_APPEARANCE: ClerkAppearance = {
  variables: {
    colorPrimary: "var(--color-amber-ink)",
    colorPrimaryForeground: "var(--color-panel)",
    colorBackground: "var(--color-panel)",
    colorForeground: "var(--color-ink)",
    colorMuted: "var(--color-panel2)",
    colorMutedForeground: "var(--color-mut)",
    colorNeutral: "var(--color-ink)",
    colorInput: "var(--color-panel)",
    colorInputForeground: "var(--color-ink)",
    colorBorder: "var(--color-line)",
    colorRing: "var(--color-rec)",
    colorDanger: "var(--color-rec)",
    colorSuccess: "var(--color-ok-ink)",
    colorWarning: "var(--color-amber-ink)",
    fontFamily: "var(--font-display)",
    fontFamilyMono: "var(--font-mono)",
    borderRadius: "0.75rem",
  },
  options: {
    logoPlacement: "none",
    socialButtonsVariant: "blockButton",
  },
};

/**
 * The signed-out half of the account affordance.
 *
 * Two things it deliberately does not do. It passes no redirect URL, so the
 * modal closes onto whatever room the singer was already in — being thrown to
 * /progress mid-warmup would make a free offer feel like a detour. And it never
 * navigates to /sign-in: those pages exist for Clerk's own flows and for anyone
 * who lands on them, but a header control that leaves the page reads as a wall,
 * and nothing here is walled.
 *
 * Which modal opens follows what the browser holds. Someone with practice
 * behind them needs an account created; an empty browser is nearly always
 * someone returning to one they already have, which is exactly the person whose
 * backup is worth recovering. Both modals link to the other, so neither branch
 * is a dead end.
 */
function AccountOffer({
  earned,
  children,
}: {
  earned: boolean;
  /** A single element; Clerk clones it and hangs the modal off its onClick. */
  children: ReactElement;
}) {
  return earned ? (
    <SignUpButton mode="modal" appearance={CLERK_APPEARANCE}>
      {children}
    </SignUpButton>
  ) : (
    <SignInButton mode="modal" appearance={CLERK_APPEARANCE}>
      {children}
    </SignInButton>
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
  // Same discipline as proActive above, applied harder: signed-in and
  // signed-out are different controls, not two paint jobs on one, so nothing
  // account-shaped renders until Clerk has actually resolved the session. A
  // returning member would otherwise be shown a sign-in offer for the account
  // they are already in.
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  // hasSomethingToSave is the shared definition of an earned prompt (a logged
  // session, a recorded take, a streak, a measured range). It lives with the
  // in-page save prompt so the header cannot ask on a colder page than that one
  // does. Before it is true the affordance is still there, just neutral: a
  // visitor whose browser was wiped has nothing to lose and is exactly the
  // person who needs the way back in.
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
      setTabsOverflow(el.scrollWidth > el.clientWidth + 1);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const [menuOpen, setMenuOpen] = useState(false);
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

            {/* Sits with the LV/XP/streak line rather than with the Pro card,
                because that line is the thing it is offering to protect. It is
                also the phone's only account entry: the header has room for the
                Pro pill and the user button and nothing more. */}
            {accountsReady() && authLoaded && (
              <div className="px-4 pt-4">
                {isSignedIn ? (
                  <UserButton
                    appearance={CLERK_APPEARANCE}
                    userProfileMode="modal"
                    showName
                  />
                ) : worthSaving ? (
                  <>
                    <p className="text-sm text-mut">
                      This browser holds the only copy of your practice record. A
                      free account keeps a backup.
                    </p>
                    <AccountOffer earned>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2.5"
                        onClick={() => setMenuOpen(false)}
                      >
                        Back up my progress
                      </Button>
                    </AccountOffer>
                  </>
                ) : (
                  <AccountOffer earned={false}>
                    <button
                      type="button"
                      onClick={() => setMenuOpen(false)}
                      className="text-sm text-mut underline decoration-line2 underline-offset-4 transition-colors hover:text-ink hover:decoration-ink"
                    >
                      Sign in
                    </button>
                  </AccountOffer>
                )}
              </div>
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
            ref={tabsRef}
            className={`no-scrollbar hidden flex-1 items-center gap-1 overflow-x-auto sm:flex ${
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
          {accountsReady() &&
            authLoaded &&
            (isSignedIn ? (
              <span className="flex shrink-0 items-center">
                <UserButton
                  appearance={CLERK_APPEARANCE}
                  userProfileMode="modal"
                />
              </span>
            ) : (
              <AccountOffer earned={worthSaving}>
                <button
                  type="button"
                  // The glyph is neutral; the name carries the offer. It only
                  // mentions the practice record once there is one, so a first
                  // visit is never told what it stands to lose.
                  aria-label={
                    worthSaving
                      ? "Sign in to back up your practice record"
                      : "Sign in"
                  }
                  title={
                    worthSaving
                      ? "Sign in to back up your practice record"
                      : "Sign in"
                  }
                  className="hidden size-7 shrink-0 items-center justify-center rounded-full border border-line text-mut transition-colors hover:border-line2 hover:text-ink sm:inline-flex"
                >
                  <AccountIcon />
                </button>
              </AccountOffer>
            ))}
        </div>
      </header>
      {drawer}
    </>
  );
}

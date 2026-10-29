import Link from "next/link";
import type { MouseEventHandler, ReactNode, Ref } from "react";

import { MicAlert } from "@/components/mic-alert";
import { IconMic } from "@/components/icons";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/** Small mono uppercase label, styled like a console tape label. */
const LABEL_CLASS =
  "inline-block rounded border bg-panel px-2 py-0.5 font-mono text-label uppercase tracking-[0.1em]";

/*
 * The label's colour is a prop rather than a className override: cn() does
 * not merge, so a passed text-rec sat beside the base text-violet-ink and
 * whichever Tailwind emitted later won (violet, on the guide's "Vocal health").
 * violet is the default voice; rec marks health and safety, as the mic and
 * recording states do.
 */
const LABEL_TONES = {
  violet: "border-violet/35 text-violet-ink",
  rec: "border-rec/40 text-rec",
} as const;

/**
 * The in-body form of the label: the same mono text with a short gold
 * hairline before it and no box. A room page stacks eight to twelve
 * section labels, and as bordered pills they were the most visible thing on
 * the page; the pill now marks only a page's kicker (PageShell).
 */
const HAIRLINE_CLASS =
  "inline-flex items-center gap-2.5 font-mono text-label uppercase tracking-[0.14em] before:h-px before:w-6 before:shrink-0 before:bg-amber before:content-['']";
const HAIRLINE_TONES = {
  violet: "text-violet-ink",
  rec: "text-rec",
} as const;

export function SectionLabel({
  children,
  className,
  heading,
  hairline = false,
  tone = "violet",
}: {
  children: ReactNode;
  className?: string;
  /** Mono text with a gold hairline instead of the bordered pill. */
  hairline?: boolean;
  tone?: keyof typeof LABEL_TONES;
  /**
   * Also announce the label as an h2 to assistive tech, for a section whose
   * only visible title is this label. The visual stays the same span.
   */
  heading?: boolean;
}) {
  const classes = hairline
    ? cn(HAIRLINE_CLASS, HAIRLINE_TONES[tone], className)
    : cn(LABEL_CLASS, LABEL_TONES[tone], className);
  if (heading) {
    return (
      <>
        <h2 className="sr-only">{children}</h2>
        <span aria-hidden="true" className={classes}>
          {children}
        </span>
      </>
    );
  }
  return <span className={classes}>{children}</span>;
}

/** Standard page container + header. Every app page starts with this. */
export function PageShell({
  kicker,
  title,
  subtitle,
  actions,
  titleRef,
  children,
}: {
  kicker?: string;
  /** Usually a string; /changelog sets one word of it in the serif italic. */
  title: ReactNode;
  /** Usually a string; the /songs prerender carries two, one per pre-paint state. */
  subtitle?: ReactNode;
  actions?: ReactNode;
  /**
   * Makes the title a focus target (tabIndex -1, no ring), for a page that
   * moves focus to it after the control that was pressed went away.
   */
  titleRef?: Ref<HTMLHeadingElement>;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          {kicker && <SectionLabel className="mb-3">{kicker}</SectionLabel>}
          {titleRef ? (
            <h1 ref={titleRef} tabIndex={-1} className="text-4xl outline-none sm:text-5xl">
              {title}
            </h1>
          ) : (
            <h1 className="text-4xl sm:text-5xl">{title}</h1>
          )}
          {subtitle && <p className="mt-3 max-w-prose text-mut">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </main>
  );
}

/**
 * A section heading, one tier below the page title.
 *
 * There were ten literal `className="max-w-2xl text-3xl"` headings across the
 * landing and Pro pages, all 30px, each preceded by an identical 11px mono
 * label and followed by an identical muted paragraph. Meanwhile PageShell's h1
 * was `text-3xl sm:text-4xl`, so an interior page's own title was six pixels
 * larger than a section heading on the homepage — and on mobile, exactly the
 * same size. Nothing in the type ranked anything.
 *
 * The ladder is now: hero clamp(2.5rem…4.25rem) → page h1 text-4xl/5xl →
 * this at text-2xl/3xl → card title text-lg. Each rung is a clear step, and
 * this component is what stops the middle one drifting back.
 */
export function SectionHeading({
  label,
  children,
  lede,
  className,
  id,
  level = 2,
}: {
  /** The tape label above the heading. */
  label?: string;
  children: ReactNode;
  /** The one-line explanation that almost always follows. */
  lede?: ReactNode;
  className?: string;
  id?: string;
  /**
   * The outline level. A section's own title is an h2; a heading nested in
   * a titled section (a release's stories on /changelog) is an h3, styled
   * the same.
   */
  level?: 2 | 3;
}) {
  const Heading = level === 3 ? "h3" : "h2";
  return (
    <div className={cn("max-w-2xl", className)}>
      {label && <SectionLabel hairline className="mb-4">{label}</SectionLabel>}
      {/* An h3 takes the card-title face by default; this one is the same
          editorial tier as the h2, so it says so. */}
      <Heading id={id} className={level === 3 ? "font-display text-2xl font-normal sm:text-3xl" : "text-2xl sm:text-3xl"}>
        {children}
      </Heading>
      {lede && <p className="mt-3 text-mut">{lede}</p>}
    </div>
  );
}

export function Card({
  children,
  className,
  pad = true,
  tone = "flat",
}: {
  children: ReactNode;
  className?: string;
  pad?: boolean;
  /**
   * `flat` is the default page card. `raised` is for anything clickable and
   * carries a real hover — the product previously had one `shadow-lg` in the
   * whole repo, so a modal, a card and a page section all sat on the same
   * plane, and the dominant hover was a border tint of a few percent luminance
   * that most people cannot see. `well` is read-only chrome that should sit
   * under the page rather than on it.
   */
  tone?: "flat" | "raised" | "well";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl",
        tone === "well"
          ? "well"
          : tone === "raised"
            ? "lift border border-line bg-panel hover:border-violet/50"
            : "border border-line bg-panel",
        pad && "p-5 sm:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

type ButtonVariant = "rec" | "violet" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

/*
 * The outline variant's hover is a border change and the violet one carries a
 * shadow, so both are transitioned with the fill; otherwise those two snapped
 * while the colour faded. The press scale is a small movement, but movement
 * all the same, and is dropped under prefers-reduced-motion. A disabled
 * control does not press. `aria-disabled="true"` looks the same as
 * `disabled`: a button that must keep focus while it is busy (a buy button
 * whose checkout can fail and be retried) uses it, and its click handler
 * ignores the press itself.
 */
const buttonBase =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out-quint active:scale-[0.98] motion-reduce:active:scale-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:active:scale-100";
const buttonVariants: Record<ButtonVariant, string> = {
  rec: "bg-rec text-panel hover:bg-rec-hover",
  violet: "bg-violet-ink text-panel hover:bg-violet-hover",
  outline: "border border-field text-ink hover:border-violet-ink hover:text-violet-ink",
  ghost: "text-mut hover:text-ink hover:bg-panel2",
};

/** Shared search and select treatment: readable at arm's length, with a visible
 * boundary and 16px type so focusing a field does not zoom a phone viewport. */
export const FIELD_CLASS_NAME =
  "min-h-11 min-w-0 rounded-xl border border-field bg-panel px-3 py-2 text-base text-ink placeholder:text-dim transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-ink";
const buttonSizes: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};

export function Button({
  variant = "violet",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <button
      className={cn(buttonBase, buttonVariants[variant], buttonSizes[size], className)}
      {...props}
    />
  );
}

export function LinkButton({
  href,
  variant = "violet",
  size = "md",
  className,
  fullLoad = false,
  prefetch,
  onClick,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  /**
   * A plain anchor, so the browser follows the address itself instead of the
   * client router: for an address the router cannot resolve on its own
   * (lib/program-ids.ts programViewHref), or a jump within the page that the
   * browser should make, with `onClick={jumpInPage}` (below, which also says
   * what the router needs done after it).
   */
  fullLoad?: boolean;
  /**
   * Runs on the click, before the browser or the router follows the link.
   * Only a client component can pass one.
   */
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  /**
   * Passed to next/link. `false` drops the speculative background fetch of
   * the target's payload (a hub page's is its whole chart, up to 0.5 MB
   * decoded) while the click still navigates. Omitted keeps Next's default.
   */
  prefetch?: boolean;
  children: ReactNode;
}) {
  const classes = cn(buttonBase, buttonVariants[variant], buttonSizes[size], className);
  if (fullLoad) {
    return (
      <a href={href} onClick={onClick} className={classes}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} prefetch={prefetch} onClick={onClick} className={classes}>
      {children}
    </Link>
  );
}

/**
 * The click handler for a link within the page (a plain `<a href="#buy">`,
 * LinkButton `fullLoad`), which lets the browser make the jump and keeps the
 * history entry usable. Client components only, like any click handler.
 *
 * The browser's own jump scrolls even when the address already ends in the
 * fragment, where next/link makes no navigation at all: on /pro#buy, where
 * every Go Pro link lands, the hero's and the final call to action's "#buy"
 * buttons did nothing. It also moves the Tab starting point to the target,
 * as a skip link does, which next/link's scripted scroll did not, so the next
 * Tab went back to the hero. But the entry it writes carries no history
 * state, and the app router ignores a Back or Forward onto such an entry:
 * after the jump and a link to another page, Back changed the address and
 * left the other page on screen. So the state this page's entry had before
 * the jump goes back on the new one once the jump is made.
 */
export function jumpInPage() {
  const state: unknown = window.history.state;
  if (state === null || state === undefined) return;
  const repair = () => {
    if (window.history.state === null) {
      window.history.replaceState(state, "", window.location.href);
    }
  };
  window.addEventListener("hashchange", repair, { once: true });
  // A jump to the fragment the address already holds fires no hashchange, so
  // the listener goes with the click's own task rather than lingering until
  // a jump on some later page.
  window.setTimeout(() => {
    window.removeEventListener("hashchange", repair);
    repair();
  }, 0);
}

export function Stat({
  label,
  value,
  sub,
  tone = "ink",
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  tone?: "ink" | "violet" | "rec" | "ok" | "cool";
}) {
  const tones = {
    ink: "text-ink",
    violet: "text-violet-ink",
    rec: "text-rec",
    ok: "text-ok-ink",
    cool: "text-cool",
  } as const;
  return (
    <div>
      <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
        {label}
      </div>
      <div className={cn("tabular mt-1 font-mono text-2xl", tones[tone])}>
        {value}
      </div>
      {sub && <div className="mt-0.5 text-xs text-mut">{sub}</div>}
    </div>
  );
}

export function Pill({
  children,
  tone = "mut",
}: {
  children: ReactNode;
  tone?: "mut" | "violet" | "rec" | "ok" | "cool";
}) {
  const tones = {
    mut: "border-line text-mut",
    violet: "border-violet/40 text-violet-ink",
    rec: "border-rec/40 text-rec",
    ok: "border-ok/40 text-ok-ink",
    cool: "border-cool/40 text-cool",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function ProgressBar({
  value,
  label,
  tone = "neutral",
  className,
}: {
  value: number; // 0..100
  /**
   * The bar's accessible name, read with its value ("Loop 2 score, 64%").
   * Required: a role="progressbar" with no name is announced as a bare
   * number.
   */
  label: string;
  /**
   * `neutral` is the default because a progress bar is almost never a paid
   * surface, and violet has to mean one thing. Pass "violet" deliberately on Pro
   * surfaces; the rest of the app reads better with a bar that recedes.
   */
  tone?: "neutral" | "violet" | "rec" | "ok" | "cool";
  className?: string;
}) {
  const tones = {
    neutral: "bg-ink/25",
    violet: "bg-violet",
    rec: "bg-rec",
    ok: "bg-ok",
    cool: "bg-cool",
  } as const;
  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-panel2", className)}
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-300", tones[tone])}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line2 px-6 py-14 text-center">
      <div className="font-display text-xl font-normal">{title}</div>
      {hint && <p className="mt-2 max-w-sm text-sm text-mut">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** The mic glyph a permission gate wears; the badge that holds it decides the colour. */
function MicGlyph() {
  return <IconMic size={24} strokeWidth={1.6} />;
}

/**
 * The promise a room makes when it asks for the mic, in one place.
 *
 * The estate had two versions of this sentence in prose that means the same
 * thing. One sentence cannot be quietly weakened in one room while the others
 * keep the stronger claim.
 */
export const MIC_PRIVACY = "Audio is analyzed on this device and never uploaded.";

/**
 * The one shape a practice room asks for the microphone in: badge, what the
 * room does, where the audio goes, one button, the failure underneath it
 * (MicAlert, for its scroll-into-view). `tone="session"` draws it on the dark
 * session tokens inside a SessionShell. SongsMicGate (a Suspense fallback)
 * and the warmups gate card (exercise list, safety line) stay their own.
 */
export function MicGate({
  title,
  description,
  privacy = MIC_PRIVACY,
  enableLabel = "Enable microphone",
  onEnable,
  disabled = false,
  error = null,
  secondary,
  footer,
  audioSetup,
  tone = "page",
  bare = false,
  className,
}: {
  title: ReactNode;
  description: ReactNode;
  /** Override only where the true sentence differs — the recorder stores takes. */
  privacy?: string;
  enableLabel?: string;
  onEnable: () => void;
  disabled?: boolean;
  /** The failure, in the words of the room's mic hook. */
  error?: string | null;
  /** An alternative way in, e.g. song practice without a mic. */
  secondary?: ReactNode;
  /** The quiet Pro line, passed in so this file stays dependency-free. */
  footer?: ReactNode;
  /** The device picker (AudioSetup), rendered under the buttons. */
  audioSetup?: ReactNode;
  /** `session`: the dark tokens of SessionShell; the gate is then always bare. */
  tone?: "page" | "session";
  /** Set when the room already sits inside a Card, so none nests. */
  bare?: boolean;
  className?: string;
}) {
  const session = tone === "session";
  const t = session
    ? {
        badge: "border-[var(--s-line2)] bg-[var(--s-elev)] text-[var(--s-voice)]",
        title: "text-[var(--s-ink)]",
        desc: "text-[var(--s-mut)]",
        privacy: "text-[var(--s-dim)]",
        alert: "text-[var(--s-rec)]",
      }
    : {
        badge: "border-line2 bg-panel2 text-violet-ink",
        title: "",
        desc: "text-mut",
        privacy: "text-dim",
        alert: "text-rec",
      };
  const body = (
    <>
      <div className={cn("mx-auto flex h-14 w-14 items-center justify-center rounded-full border", t.badge)}>
        <MicGlyph />
      </div>
      <h2 className={cn("mt-5 text-2xl", t.title)}>{title}</h2>
      <p className={cn("mx-auto mt-2 max-w-md", t.desc)}>{description}</p>
      <p className={cn("mt-2 text-xs", t.privacy)}>{privacy}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {session ? (
          <button
            type="button"
            onClick={onEnable}
            disabled={disabled}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-transparent bg-[var(--s-ok)] px-5 py-2 text-sm text-[oklch(0.16_0.03_155)] transition-[filter] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--s-amber)] disabled:opacity-40"
          >
            {error ? "Try again" : enableLabel}
          </button>
        ) : (
          <Button variant="rec" size="lg" onClick={onEnable} disabled={disabled}>
            {error ? "Try again" : enableLabel}
          </Button>
        )}
        {secondary}
      </div>
      {error && (
        <MicAlert message={error} className={cn("mx-auto mt-4 max-w-md text-sm", t.alert)} />
      )}
      {audioSetup && <div className="mx-auto mt-6 max-w-xl text-left">{audioSetup}</div>}
      {footer && <div className="mt-4">{footer}</div>}
    </>
  );
  // In a session the gate fills the shell's body and scrolls there, so a short window never puts the button under the bottom bar.
  if (session)
    return (
      <div className={cn("flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-6 text-center", className)}>
        <div className="my-auto">{body}</div>
      </div>
    );
  if (bare) return <div className={cn("py-8 text-center", className)}>{body}</div>;
  return <Card className={cn("mx-auto max-w-2xl py-10 text-center", className)}>{body}</Card>;
}

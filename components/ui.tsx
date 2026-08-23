import Link from "next/link";
import type { ReactNode } from "react";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/** Small mono uppercase label, styled like a console tape label. */
export function SectionLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block rounded border border-line bg-panel px-2 py-0.5 font-mono text-label uppercase tracking-[0.1em] text-mut",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Standard page container + header. Every app page starts with this. */
export function PageShell({
  kicker,
  title,
  subtitle,
  actions,
  children,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          {kicker && <SectionLabel className="mb-3">{kicker}</SectionLabel>}
          <h1 className="text-4xl sm:text-5xl">{title}</h1>
          {subtitle && <p className="mt-3 max-w-prose text-mut">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
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
}: {
  /** The tape label above the heading. */
  label?: string;
  children: ReactNode;
  /** The one-line explanation that almost always follows. */
  lede?: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div className={cn("max-w-2xl", className)}>
      {label && <SectionLabel className="mb-4">{label}</SectionLabel>}
      <h2 id={id} className="text-2xl sm:text-3xl">
        {children}
      </h2>
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
            ? "lift border border-line bg-panel hover:border-amber/50"
            : "border border-line bg-panel",
        pad && "p-5 sm:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

type ButtonVariant = "rec" | "amber" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40";
const buttonVariants: Record<ButtonVariant, string> = {
  rec: "bg-rec text-[#fffaf2] hover:bg-[#b5493d]",
  amber: "bg-amber text-[#241a05] hover:bg-amber-soft",
  outline: "border border-line2 text-ink hover:border-amber hover:text-amber-ink",
  ghost: "text-mut hover:text-ink hover:bg-panel2",
};
const buttonSizes: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};

export function Button({
  variant = "amber",
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
  variant = "amber",
  size = "md",
  className,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(buttonBase, buttonVariants[variant], buttonSizes[size], className)}
    >
      {children}
    </Link>
  );
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
  tone?: "ink" | "amber" | "rec" | "ok" | "cool";
}) {
  const tones = {
    ink: "text-ink",
    amber: "text-amber-ink",
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
  tone?: "mut" | "amber" | "rec" | "ok" | "cool";
}) {
  const tones = {
    mut: "border-line text-mut",
    amber: "border-amber/40 text-amber-ink",
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
  tone = "neutral",
  className,
}: {
  value: number; // 0..100
  /**
   * `neutral` is the default because a progress bar is almost never a paid
   * surface, and amber has to mean one thing. Pass "amber" deliberately on Pro
   * surfaces; the rest of the app reads better with a bar that recedes.
   */
  tone?: "neutral" | "amber" | "rec" | "ok" | "cool";
  className?: string;
}) {
  const tones = {
    neutral: "bg-ink/25",
    amber: "bg-amber",
    rec: "bg-rec",
    ok: "bg-ok",
    cool: "bg-cool",
  } as const;
  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-panel2", className)}
      role="progressbar"
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
      <div className="text-xl">{title}</div>
      {hint && <p className="mt-2 max-w-sm text-sm text-mut">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

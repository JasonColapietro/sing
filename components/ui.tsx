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
        "inline-block rounded border border-line bg-panel px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.14em] text-mut",
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
          <h1 className="text-3xl sm:text-4xl">{title}</h1>
          {subtitle && <p className="mt-2 text-mut">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </main>
  );
}

export function Card({
  children,
  className,
  pad = true,
}: {
  children: ReactNode;
  className?: string;
  pad?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-panel",
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
    ok: "text-ok",
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
    ok: "border-ok/40 text-ok",
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
  tone = "amber",
  className,
}: {
  value: number; // 0..100
  tone?: "amber" | "rec" | "ok" | "cool";
  className?: string;
}) {
  const tones = {
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
      <div className="font-display text-xl">{title}</div>
      {hint && <p className="mt-2 max-w-sm text-sm text-mut">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

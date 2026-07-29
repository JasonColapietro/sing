import { Pill } from "@/components/ui";

export function LockGlyph({ className }: { className?: string }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <rect
        x="2.25"
        y="5.25"
        width="7.5"
        height="5"
        rx="1.25"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M4 5V3.75a2 2 0 014 0V5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Small amber "Pro" marker used on locked cards. */
export function ProPill() {
  return (
    <Pill tone="amber">
      <LockGlyph />
      Pro
    </Pill>
  );
}

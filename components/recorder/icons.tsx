/** Small inline SVG icons for the recorder page. All inherit currentColor. */

export function IconPlay({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
      <path d="M4.5 2.6v10.8L13.4 8 4.5 2.6z" fill="currentColor" />
    </svg>
  );
}

export function IconPause({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
      <rect x="3.4" y="2.6" width="3.4" height="10.8" rx="0.8" fill="currentColor" />
      <rect x="9.2" y="2.6" width="3.4" height="10.8" rx="0.8" fill="currentColor" />
    </svg>
  );
}

export function IconStop({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
      <rect x="3" y="3" width="10" height="10" rx="1.5" fill="currentColor" />
    </svg>
  );
}

export function IconRecordDot({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
      <circle cx="8" cy="8" r="5.2" fill="currentColor" />
    </svg>
  );
}

export function IconStar({
  filled = false,
  className = "h-4 w-4",
}: {
  filled?: boolean;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
      <path
        d="M8 1.6l1.96 3.97 4.38.64-3.17 3.09.75 4.36L8 11.6l-3.92 2.06.75-4.36-3.17-3.09 4.38-.64L8 1.6z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconTrash({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
      <path
        d="M2.5 4h11M6.5 4V2.8a.8.8 0 01.8-.8h1.4a.8.8 0 01.8.8V4M4 4l.7 9.1a1 1 0 001 .9h4.6a1 1 0 001-.9L12 4M6.6 6.8v4.4M9.4 6.8v4.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconDownload({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
      <path
        d="M8 2v7.5M8 9.5L5 6.6M8 9.5l3-2.9M3 11.5v1.3a1 1 0 001 1h8a1 1 0 001-1v-1.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconMic({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
      <path
        d="M8 1.8a2.1 2.1 0 012.1 2.1v3.4a2.1 2.1 0 11-4.2 0V3.9A2.1 2.1 0 018 1.8zM3.6 7.3a4.4 4.4 0 008.8 0M8 11.7v2.5M5.8 14.2h4.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

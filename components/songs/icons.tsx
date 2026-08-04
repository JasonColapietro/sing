import type { ReactNode } from "react";

type IconProps = { className?: string };

function Svg({
  children,
  className,
  filled = false,
}: {
  children: ReactNode;
  className?: string;
  filled?: boolean;
}) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export const IconPlay = (p: IconProps) => (
  <Svg filled {...p}>
    <path d="M8 5.5v13l11-6.5z" />
  </Svg>
);

export const IconPause = (p: IconProps) => (
  <Svg filled {...p}>
    <rect x="6" y="5" width="4" height="14" rx="1" />
    <rect x="14" y="5" width="4" height="14" rx="1" />
  </Svg>
);

export const IconRestart = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 12a8 8 0 1 1 2.6 5.9" />
    <polyline points="4 17 4 12 9 12" />
  </Svg>
);

export const IconMinus = (p: IconProps) => (
  <Svg {...p}>
    <line x1="5" y1="12" x2="19" y2="12" />
  </Svg>
);

export const IconPlus = (p: IconProps) => (
  <Svg {...p}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </Svg>
);

export const IconMic = (p: IconProps) => (
  <Svg {...p}>
    <rect x="9" y="2.5" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0" />
    <line x1="12" y1="18" x2="12" y2="21.5" />
  </Svg>
);

export const IconArrowLeft = (p: IconProps) => (
  <Svg {...p}>
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </Svg>
);

export const IconHeadphones = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 13.5a8 8 0 0 1 16 0" />
    <rect x="3.2" y="13" width="4" height="7" rx="1.6" />
    <rect x="16.8" y="13" width="4" height="7" rx="1.6" />
  </Svg>
);

export const IconExpand = (p: IconProps) => (
  <Svg {...p}>
    <polyline points="4 9 4 4 9 4" />
    <polyline points="15 4 20 4 20 9" />
    <polyline points="20 15 20 20 15 20" />
    <polyline points="9 20 4 20 4 15" />
  </Svg>
);

export const IconCollapse = (p: IconProps) => (
  <Svg {...p}>
    <polyline points="9 4 9 9 4 9" />
    <polyline points="20 9 15 9 15 4" />
    <polyline points="15 20 15 15 20 15" />
    <polyline points="4 15 9 15 9 20" />
  </Svg>
);

export const IconVolume = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4z" />
    <path d="M16 9.5a4 4 0 0 1 0 5" />
    <path d="M18.8 6.8a8 8 0 0 1 0 10.4" />
  </Svg>
);

/** Metronome: a pendulum on a plinth, for the click-during-play toggle. */
export const IconMetronome = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 4.5h6l3.5 15H5.5z" />
    <line x1="12" y1="19.5" x2="19" y2="7.5" />
  </Svg>
);

/** A→B loop marker, for drilling one section. */
export const IconSectionLoop = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6.5 8h11a3 3 0 0 1 0 6H10" />
    <polyline points="12.5 11 10 14 12.5 17" />
    <line x1="4" y1="4.5" x2="4" y2="19.5" />
    <line x1="20" y1="4.5" x2="20" y2="19.5" />
  </Svg>
);

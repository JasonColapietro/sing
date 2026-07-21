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

export const IconSkip = (p: IconProps) => (
  <Svg filled {...p}>
    <path d="M5 5v14l9-7z" />
    <rect x="16" y="5" width="3" height="14" rx="1" />
  </Svg>
);

export const IconStop = (p: IconProps) => (
  <Svg filled {...p}>
    <rect x="6" y="6" width="12" height="12" rx="2" />
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

export const IconArrowRight = (p: IconProps) => (
  <Svg {...p}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </Svg>
);

import type { ReactNode } from "react";
import { cn } from "./chip";

/** The paper object a figure sits on: a bordered panel with the warm resting shadow. */
export function FigureFrame({
  children,
  caption,
  className,
}: {
  children: ReactNode;
  /** One short line under the drawing, e.g. what the room will draw for real. */
  caption?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("figure overflow-hidden rounded-2xl border border-line bg-panel", className)}>
      {children}
      {caption && (
        <p className="border-t border-line px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
          {caption}
        </p>
      )}
    </div>
  );
}

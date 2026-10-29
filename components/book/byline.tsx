import Image from "next/image";
import type { ReactNode } from "react";
import { AUTHOR_NAME, AUTHOR_NODE } from "@/lib/author";

/** "Written by Jason Colapietro" with a 48px circular crop of the founder portrait. */
export function AuthorByline({
  lead = "Written by",
  children,
  className,
}: {
  lead?: string;
  /** What follows the linked name, e.g. ". Published by Suede AI." */
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={["flex items-center gap-3", className].filter(Boolean).join(" ")}>
      <Image
        src="/founder-portrait.jpg"
        alt=""
        width={48}
        height={48}
        sizes="48px"
        className="size-12 shrink-0 rounded-full object-cover object-[center_22%]"
      />
      <p className="text-sm text-mut">
        {lead}{" "}
        <a
          href={AUTHOR_NODE.url}
          rel="author"
          className="text-violet-ink underline decoration-violet/40 underline-offset-2 hover:decoration-violet"
        >
          {AUTHOR_NAME}
        </a>
        {children}
      </p>
    </div>
  );
}

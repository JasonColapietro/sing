import Link from "next/link";
import { Fragment, type ReactNode } from "react";

const LINK_CLASS =
  "text-violet-ink underline decoration-violet/40 underline-offset-2";

/**
 * "A", "A and B" or "A, B and C", each name linking to its profile.
 *
 * Hub sentences name record holders, and a record can be shared. Rendering a
 * tie through here keeps every holder in the sentence instead of the one that
 * happens to sort first.
 */
export function LinkedNames<T extends { slug: string; name: string }>({
  singers,
  after,
}: {
  singers: readonly T[];
  /** Text placed straight after each name, e.g. its range in parentheses. */
  after?: (singer: T) => ReactNode;
}) {
  return (
    <>
      {singers.map((s, i) => (
        <Fragment key={s.slug}>
          {i > 0 && (i === singers.length - 1 ? " and " : ", ")}
          <Link href={`/singers/${s.slug}`} className={LINK_CLASS}>
            {s.name}
          </Link>
          {after?.(s)}
        </Fragment>
      ))}
    </>
  );
}

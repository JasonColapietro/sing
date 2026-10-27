import Link from "next/link";

/**
 * The trail above a course page: Learn › Voice lessons › … › this page.
 * Each link is at least 24px tall (WCAG 2.5.8); the bare text was 19px.
 */
export function CourseBreadcrumbs({
  trail,
  current,
}: {
  trail: Array<{ href: string; label: string }>;
  current: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className="-mt-4 mb-6 text-sm text-mut">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <li>
          <Link href="/learn" className="inline-flex min-h-6 items-center hover:text-ink">
            Learn
          </Link>
        </li>
        {trail.map((t) => (
          <li key={t.href} className="flex items-center gap-2">
            <span aria-hidden="true">/</span>
            <Link href={t.href} className="inline-flex min-h-6 items-center hover:text-ink">
              {t.label}
            </Link>
          </li>
        ))}
        <li className="flex items-center gap-2">
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="text-ink">
            {current}
          </span>
        </li>
      </ol>
    </nav>
  );
}

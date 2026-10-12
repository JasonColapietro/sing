import Link from "next/link";
import { SINGERS, type Singer } from "@/lib/singers";

function singersByInitial(singers: readonly Singer[]) {
  const groups = new Map<string, Singer[]>();
  for (const singer of [...singers].sort((a, b) => a.name.localeCompare(b.name))) {
    // Fold accents so Ángela and Édith file under A and E, where localeCompare
    // already sorts them, instead of under their own one-name headings.
    const initial = singer.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .slice(0, 1)
      .toUpperCase();
    const group = groups.get(initial) ?? [];
    group.push(singer);
    groups.set(initial, group);
  }
  return [...groups.entries()];
}

/**
 * Static discovery is intentionally separate from the client directory. A
 * crawler receives this full A-Z index in raw HTML even when JavaScript is
 * unavailable; the interactive chart can therefore stay small on first load.
 */
export function SingerCrawlIndex({ singers = SINGERS }: { singers?: readonly Singer[] }) {
  return (
    <section data-singer-crawl-index="true" className="mt-12 border-t border-line pt-8">
      <h2 className="text-xl">Complete A–Z singer index</h2>
      <p className="mt-2 max-w-2xl text-sm text-mut">
        Every singer page, grouped alphabetically for direct reference and crawl discovery.
      </p>
      <div className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
        {singersByInitial(singers).map(([initial, group]) => (
          <div key={initial}>
            <h3 className="font-mono text-xs uppercase tracking-[0.14em] text-dim">{initial}</h3>
            <ul className="mt-2 columns-2 gap-x-4 text-sm">
              {group.map((singer) => (
                <li key={singer.slug} className="break-inside-avoid">
                  {/* Block and py-0.5: a one-letter name like "V" was an 8x19
                      target with rows 1px apart on a phone. prefetch off:
                      the default fetched a page payload for every one of
                      these 600-plus names as it scrolled into view. */}
                  <Link
                    href={`/singers/${singer.slug}`}
                    prefetch={false}
                    className="block py-0.5 text-mut underline decoration-line underline-offset-4 hover:text-violet-ink hover:decoration-violet"
                  >
                    {singer.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

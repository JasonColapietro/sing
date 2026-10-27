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
        Every singer in the catalog, A to Z. Each name opens that singer&apos;s reported range and its evidence status.
      </p>
      <div className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
        {singersByInitial(singers).map(([initial, group]) => (
          <div key={initial}>
            <h3 className="font-mono text-xs font-normal uppercase tracking-[0.14em] text-dim">{initial}</h3>
            {/* The row and link styles live once on the list, not on each of
                the 600-plus rows: written per link they were a 112-character
                class string repeated in the HTML and again in the inline
                payload. Block and py-0.5: a one-letter name like "V" was an
                8x19 target with rows 1px apart on a phone. Plain <a>, not
                next/link: prefetch was already off (the default fetched a
                page payload for every name as it scrolled into view), so
                next/link only added a client component per row to hydrate. */}
            <ul className="mt-2 columns-2 gap-x-4 text-sm [&>li]:break-inside-avoid [&_a]:block [&_a]:py-0.5 [&_a]:text-mut [&_a]:underline [&_a]:decoration-line [&_a]:underline-offset-4 [&_a]:hover:text-violet-ink [&_a]:hover:decoration-violet">
              {group.map((singer) => (
                <li key={singer.slug}>
                  <a href={`/singers/${singer.slug}`}>{singer.name}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

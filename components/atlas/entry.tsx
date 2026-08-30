import Link from "next/link";
import type { AtlasEntry } from "@/lib/atlas-data";
import { Pill } from "@/components/ui";

/**
 * One singer's entry inside an atlas chapter. No hooks, so the free sample
 * chapter can render it on the server while the gated reader uses it in the
 * client. The name links to the singer's free page, where the range plays out
 * loud and the reader can compare it with their own.
 */
export function AtlasEntryCard({ entry }: { entry: AtlasEntry }) {
  return (
    <article className="rounded-xl border border-line bg-bg p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-lg font-semibold">
          <Link
            href={`/singers/${entry.slug}`}
            className="transition-colors hover:text-violet-ink"
          >
            {entry.name}
          </Link>
        </h3>
        <span className="tabular font-mono text-sm text-mut">
          {entry.low}–{entry.high}
          <span className="ml-2 text-[11px] uppercase tracking-[0.1em] text-dim">
            {entry.span}
          </span>
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-dim">
        <Pill tone="cool">{entry.voiceType}</Pill>
        {entry.belt && <Pill tone="rec">full voice to {entry.belt}</Pill>}
        {entry.whistle && <Pill tone="violet">whistle register</Pill>}
        <span>
          {entry.country} · prominent since {entry.activeFrom} · known for
          &ldquo;{entry.signatureSong}&rdquo;
        </span>
      </div>

      {(entry.lowSource || entry.highSource) && (
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.12em] text-dim">
          {entry.lowSource && (
            <span>
              low {entry.low} heard in &ldquo;{entry.lowSource}&rdquo;
            </span>
          )}
          {entry.lowSource && entry.highSource && <span> · </span>}
          {entry.highSource && (
            <span>
              high {entry.high} heard in &ldquo;{entry.highSource}&rdquo;
            </span>
          )}
        </p>
      )}

      <p className="mt-3 text-sm text-mut">{entry.blurb}</p>
      {entry.technique && (
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-mut">
          {entry.technique}
        </p>
      )}
    </article>
  );
}

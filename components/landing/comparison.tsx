import { AppsTable } from "@/components/compare/parts";
import { COMPARISONS_CHECKED_LABEL, COMPETITORS } from "@/lib/comparisons";

/** Homepage and comparison pages use the same facts, prices and source links. */
export default function ComparisonTable() {
  return (
    <div className="w-full min-w-0">
      <AppsTable
        competitors={COMPETITORS}
        caption={`Suede Sing and ${COMPETITORS.length} singing apps: purpose, platforms and pricing.`}
        links="vs"
      />
      <p className="mt-3 font-mono text-xs text-dim">
        Competitor facts checked {COMPARISONS_CHECKED_LABEL} against their own
        sites and store listings. Prices vary; each price links to its source.
        Full comparisons below include the supporting sources.
      </p>
    </div>
  );
}

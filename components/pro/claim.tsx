import { PRO_PERKS } from "@/lib/pro";

/**
 * A claim on /pro: one PRO_PERKS row, its own title and sentence word for
 * word, so nothing the page says of Pro is typed twice. Each perk is headed
 * once on the page: the two with a chart or a drawing in the showcase above
 * the buy card, the rest in the unlock stack under it.
 */
export function Claim({ id, compact = false, className = "" }: { id: string; compact?: boolean; className?: string }) {
  const { title, desc } = PRO_PERKS.find((p) => p.id === id)!;
  return (
    <div className={className}>
      <h3 className={`font-extrabold text-ink ${compact ? "text-base" : "text-xl"}`}>{title}</h3>
      <p className="mt-1 max-w-md text-sm text-mut">{desc}</p>
    </div>
  );
}

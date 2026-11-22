import { TakeSample } from "@/components/pro/take-sample";

/**
 * One more thing Pro adds, shown under the homepage teaser's coach report:
 * the take analysis as a drawing that labels itself a sample.
 *
 * A server component with no data imports (the bundle rule at the top of
 * lib/pro-inventory.ts). No price and no link: the teaser's own two buttons
 * are the ways on, and the homepage states the price once, on the first of
 * them (pro-claims.test.tsx). The books are not drawn here: the teaser's
 * list already names them, and two cover cards pushed the room directory a
 * screen further down a phone.
 */
export function ProExhibits({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-2xl border border-line bg-panel p-4 sm:p-5 ${className}`}>
      <TakeSample />
      {/* The recorder's locked panel says the same of the real thing. */}
      <p className="mt-3 text-sm text-mut">
        The pitch line of each take, and two takes overlaid.
      </p>
    </div>
  );
}

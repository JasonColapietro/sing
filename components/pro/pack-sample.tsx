import { Card, Pill } from "@/components/ui";
import { PatternGlyph, patternShape } from "@/components/warmups/pattern-glyph";
import { PRO_ROUTINES, routineMinutes, stepExercise } from "@/components/warmups/routines";
import { ProChip } from "./ui";

/**
 * One real pro pack, drawn as its card in the warmups room: name, tagline,
 * the count and minutes line, and its first exercises as chips.
 *
 * Public surface: `PackSample()` and `PACK_SAMPLE` (the pack it draws).
 *
 * Rules:
 * - Everything on it is read from the pack itself (PRO_ROUTINES, built from
 *   PRO_PACKS), so it cannot describe a pack that does not ship. It is the
 *   first pack, the one /warmups#pro-packs lands on.
 * - A server component, and it must stay one: it imports the exercise
 *   catalogue, which /pro's client bundle does not carry. app/pro/page.tsx
 *   renders it and hands it to the page as a node.
 * - It mirrors RoutineGrid's card (components/warmups/routine-home.tsx)
 *   without the singer's stars and best score, which are a record and not
 *   part of the pack. Three chips then "+N more", as the room shows.
 * - Not a link and not a button: the showcase sells nothing itself.
 */
export const PACK_SAMPLE = PRO_ROUTINES[0];

/** How many exercise names the room's card shows before "+N more". */
const CHIPS = 3;

export function PackSample() {
  const exercises = PACK_SAMPLE.steps.map(stepExercise);
  const more = exercises.length - CHIPS;
  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-lg">{PACK_SAMPLE.name}</h4>
        <ProChip />
      </div>
      <p className="mt-2 text-sm text-mut">{PACK_SAMPLE.tagline}</p>
      <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
        {PACK_SAMPLE.steps.length} exercises
        <span className="mx-2 text-line2">·</span>~{routineMinutes(PACK_SAMPLE)} min
        <span className="mx-2 text-line2">·</span>Scored as you sing
      </p>
      <ol className="mt-4 flex flex-wrap gap-1.5" aria-label="Exercises in this pack">
        {exercises.slice(0, CHIPS).map((ex) => (
          <li key={ex.id}>
            <Pill tone="mut">
              <PatternGlyph shape={patternShape(ex)} className="h-4 w-4" />
              {ex.title}
            </Pill>
          </li>
        ))}
        {more > 0 && (
          <li>
            <Pill tone="mut">+{more} more</Pill>
          </li>
        )}
      </ol>
    </Card>
  );
}

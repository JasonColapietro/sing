import { dayNeedsPro, isRestDay, type Program } from "@/lib/programs";

/**
 * True when today's program day is one this singer cannot open: a free singer
 * past the free week of a Pro program, on a practice day still to do. Their
 * place is kept, so this holds every day until they upgrade or stop the
 * program, which is why the rooms must not lead with that day as "today's
 * plan": its only way forward is the paywall.
 */
export function programDayNeedsPro(
  active: { program: Program; view: { index: number; status: string } },
  isPro: boolean,
): boolean {
  if (isPro || active.view.status !== "todo") return false;
  const day = active.program.days[active.view.index];
  return day !== undefined && !isRestDay(day) && dayNeedsPro(active.program, active.view.index);
}

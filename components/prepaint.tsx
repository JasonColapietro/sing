"use client";

import { useId, useSyncExternalStore } from "react";
import { PREPAINT_GLOBAL, type PrepaintState } from "@/lib/prepaint";

/**
 * The React half of the pre-paint state (lib/prepaint.ts has the script and
 * the rules it follows; app/globals.css has the CSS).
 *
 * A component whose layout depends on the free cap or the running program
 * renders, while the page is server-rendered and hydrated, every state's
 * version of that part, each carrying a `data-prepaint-*` marker that the CSS
 * matches against the attributes the inline script put on <html>. From the
 * first render after hydration it renders from the real stores and drops the
 * markers, so the swap changes nothing on screen: the part that stays was
 * already showing, and the parts that go were already display:none.
 *
 * On a client-side navigation the component mounts already "hydrated" and
 * renders the real state straight away, where no inline script runs.
 */

const noChanges = () => () => {};
const onClient = () => true;
const onServer = () => false;

/**
 * False while rendering the server HTML and hydrating it, true from the first
 * render after hydration and on any client-side mount. Every store read with
 * useSyncExternalStore switches from its server snapshot in that same render,
 * which is what lets a marker come off exactly when the real state arrives.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(noChanges, onClient, onServer);
}

/**
 * The markers, only until hydration: spread onto the element whose visibility
 * the pre-paint decides. `plan` is "free", "capped" or "not-capped";
 * `program` and `slot` are documented with their rules in app/globals.css.
 */
export function prepaintMarker(
  hydrated: boolean,
  marker: { plan?: "free" | "capped" | "not-capped"; program?: string; slot?: string },
): Record<string, string> {
  if (hydrated) return {};
  const out: Record<string, string> = {};
  if (marker.plan) out["data-prepaint-plan"] = marker.plan;
  if (marker.program) out["data-prepaint-program"] = marker.program;
  if (marker.slot) out["data-prepaint-slot"] = marker.slot;
  return out;
}

/**
 * A short piece of text the server cannot know (the free minutes left, the
 * streak named on the cap wall), corrected before the first paint by the
 * script right after it from the value the pre-paint script left on window.
 * The pattern is Next's "preventing flash before hydration" guide's: React
 * keeps the corrected text through hydration (`suppressHydrationWarning`),
 * then renders its own value, which is the same text, from the next render.
 * The script is rendered only into the server HTML: on a client mount it
 * would not run, and React warns about a <script> it creates.
 */
export function PrepaintText({ value, field }: { value: string; field: keyof Pick<PrepaintState, "freeLeft" | "streakClause"> }) {
  const hydrated = useHydrated();
  const id = useId();
  return (
    <>
      <span id={id} suppressHydrationWarning>
        {value}
      </span>
      {!hydrated && (
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var p=window.${PREPAINT_GLOBAL};if(p)document.getElementById(${JSON.stringify(id)}).textContent=p.${field}}catch(e){}`,
          }}
        />
      )}
    </>
  );
}

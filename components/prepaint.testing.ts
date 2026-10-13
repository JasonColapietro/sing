/**
 * Test support for the pre-paint state (components/prepaint.tsx): the server
 * markup as a browser with a given state paints it before hydration, i.e. with
 * every element app/globals.css hides for that state removed. Mirrors the
 * display:none rules there; components/prepaint.test.tsx holds the two to the
 * same list.
 */

export interface PaintState {
  plan: "free" | "capped" | "pro";
  /** data-sing-program's tokens, or null for no program. */
  program?: string | null;
}

/** Each hidden-marker rule in globals.css, as the attribute it hides and when. */
export const HIDE_RULES: { selector: string; marker: string; hides: (s: PaintState) => boolean }[] = [
  {
    selector: 'html:not([data-sing-plan="free"]) [data-prepaint-plan="free"]',
    marker: 'data-prepaint-plan="free"',
    hides: (s) => s.plan !== "free",
  },
  {
    selector: 'html:not([data-sing-plan="capped"]) [data-prepaint-plan="capped"]',
    marker: 'data-prepaint-plan="capped"',
    hides: (s) => s.plan !== "capped",
  },
  {
    selector: 'html[data-sing-plan="capped"] [data-prepaint-plan="not-capped"]',
    marker: 'data-prepaint-plan="not-capped"',
    hides: (s) => s.plan === "capped",
  },
  {
    selector: 'html:not([data-sing-program]) [data-prepaint-slot|="program"]',
    marker: 'data-prepaint-slot="program-',
    hides: (s) => !s.program,
  },
  {
    selector: 'html:not([data-sing-program~="todo"]) [data-prepaint-slot="program-lead"]',
    marker: 'data-prepaint-slot="program-lead"',
    hides: (s) => !tokens(s).includes("todo"),
  },
  {
    selector: 'html[data-sing-program~="locked"] [data-prepaint-slot="program-lead"]',
    marker: 'data-prepaint-slot="program-lead"',
    hides: (s) => tokens(s).includes("locked"),
  },
];

function tokens(s: PaintState): string[] {
  return (s.program ?? "").split(" ").filter(Boolean);
}

/** Removes the element whose start tag begins at `start`, children and all. */
function removeElement(html: string, start: number): string {
  const name = /^<([a-zA-Z0-9]+)/.exec(html.slice(start))?.[1];
  if (!name) throw new Error("not a start tag");
  const open = new RegExp(`<${name}[\\s>/]|</${name}>`, "g");
  open.lastIndex = start + 1;
  let depth = 1;
  for (let m = open.exec(html); m; m = open.exec(html)) {
    depth += m[0].startsWith("</") ? -1 : 1;
    if (depth === 0) return html.slice(0, start) + html.slice(m.index + m[0].length);
  }
  throw new Error(`unclosed <${name}>`);
}

/** The server markup with everything the given pre-paint state hides taken out. */
export function paintedFor(html: string, state: PaintState): string {
  let out = html;
  for (const rule of HIDE_RULES) {
    if (!rule.hides(state)) continue;
    for (let at = out.indexOf(rule.marker); at !== -1; at = out.indexOf(rule.marker)) {
      out = removeElement(out, out.lastIndexOf("<", at));
    }
  }
  return out;
}

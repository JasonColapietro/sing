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
  /** data-sing-deeplink: the room whose deep link is loading, or null for none. */
  deeplink?: string | null;
}

/** The rooms that hold their front page back on their own deep link's load (lib/prepaint-config.ts deepLinks). */
const DEEPLINK_ROOMS = ["breath", "warmups", "ear"] as const;

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
    selector: 'html[data-sing-plan="pro"] [data-prepaint-plan="not-pro"]',
    marker: 'data-prepaint-plan="not-pro"',
    hides: (s) => s.plan === "pro",
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
  // A room's deep link: its front page hidden on its own link's load, and the
  // screen-tall block that holds its place shown on that load only.
  ...DEEPLINK_ROOMS.flatMap((room) => [
    {
      selector: `html[data-sing-deeplink="${room}"] [data-prepaint-deeplink="${room}"]`,
      marker: `data-prepaint-deeplink="${room}"`,
      hides: (s: PaintState) => s.deeplink === room,
    },
    {
      selector: `html:not([data-sing-deeplink="${room}"]) [data-prepaint-slot="deeplink-${room}"]`,
      marker: `data-prepaint-slot="deeplink-${room}"`,
      hides: (s: PaintState) => s.deeplink !== room,
    },
  ]),
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

/**
 * The server markup with every prepaintWords span painted as the words it
 * stands for, as the browser shows them before hydration and as the hydrated
 * render has them. React escapes text and attribute values the same way, so
 * the attribute's value goes in exactly as it is.
 */
export function wordsPainted(html: string): string {
  return html.replace(/<span data-prepaint-text="([^"]*)"><\/span>/g, "$1");
}

/**
 * What a reader that runs no script and applies no CSS (an answer-engine
 * crawler reading the static HTML) takes from the markup: its text.
 */
export function staticText(html: string): string {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * The site's faces for next/og share cards: Instrument Serif for the
 * headline, IBM Plex Mono for the labels, as app/layout.tsx sets them.
 *
 * next/og draws with its bundled sans unless it is handed font files, and
 * passing any replaces that default, so both faces come together or neither
 * does. They are fetched from Google Fonts (TTF, subset to the card's own
 * characters) when a card is drawn. A failed or slow fetch returns undefined
 * and the card draws in the default face: a share card must never fail a
 * build or a request over a font.
 */

export const OG_SERIF = "Instrument Serif";
export const OG_MONO = "IBM Plex Mono";

/** One font as ImageResponse's `fonts` option takes it. */
export interface OgFont {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 600;
  style: "normal";
}

const CSS_URL = "https://fonts.googleapis.com/css2";
const FAMILIES = [`family=${OG_SERIF.replaceAll(" ", "+")}`, `family=${OG_MONO.replaceAll(" ", "+")}:wght@400;600`];
const TIMEOUT_MS = 4000;

/** The @font-face blocks of a Google Fonts stylesheet: family, weight and TTF URL. */
export function parseFontFaces(css: string): Array<{ family: string; weight: number; url: string }> {
  const faces: Array<{ family: string; weight: number; url: string }> = [];
  for (const [, block] of css.matchAll(/@font-face\s*\{([^}]*)\}/g)) {
    const family = /font-family:\s*'([^']+)'/.exec(block)?.[1];
    const weight = Number(/font-weight:\s*(\d+)/.exec(block)?.[1] ?? 400);
    const url = /src:\s*url\(([^)]+)\)\s*format\('(?:truetype|opentype)'\)/.exec(block)?.[1];
    if (family && url) faces.push({ family, weight, url });
  }
  return faces;
}

async function fetchOk(url: string): Promise<Response> {
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res;
}

async function load(text: string): Promise<OgFont[] | undefined> {
  // Unit tests render the cards as markup; they never reach the network.
  if (process.env.VITEST) return undefined;
  try {
    const query = `${FAMILIES.join("&")}&text=${encodeURIComponent(text)}`;
    const css = await (await fetchOk(`${CSS_URL}?${query}`)).text();
    const faces = parseFontFaces(css);
    const fonts = await Promise.all(
      faces.map(async (f) => ({
        name: f.family,
        data: await (await fetchOk(f.url)).arrayBuffer(),
        weight: (f.weight >= 600 ? 600 : 400) as 400 | 600,
        style: "normal" as const,
      })),
    );
    const has = (name: string) => fonts.some((f) => f.name === name);
    return has(OG_SERIF) && has(OG_MONO) ? fonts : undefined;
  } catch {
    return undefined;
  }
}

const cache = new Map<string, Promise<OgFont[] | undefined>>();

/**
 * Fonts for a card that draws `text`, or undefined to draw in next/og's
 * default face. Spread into ImageResponse's options as `...(await
 * ogFontOptions(text))`.
 */
export async function ogFontOptions(text: string): Promise<{ fonts?: OgFont[] }> {
  // Every character the card may draw, plus digits and the separators the
  // cards share, so the subset covers what the caller forgot.
  const chars = [...new Set(`${text}0123456789·—–-+:.,'&$ `)].sort().join("");
  let pending = cache.get(chars);
  if (!pending) {
    // One entry per distinct card text; a long-lived server drawing every
    // singer's card starts over rather than holding them all.
    if (cache.size >= 64) cache.clear();
    pending = load(chars);
    cache.set(chars, pending);
    // A failure is not cached: the next request tries again.
    pending.then((fonts) => {
      if (!fonts) cache.delete(chars);
    });
  }
  const fonts = await pending;
  return fonts ? { fonts } : {};
}

/** Shared Playwright helpers for the /warmups path. */

/** `s` with every regular-expression metacharacter escaped. */
export const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * The exercise's row on the room's path. A row is a button whose accessible
 * name opens with the title (then its pills, ladder and stars), so anchoring
 * the name picks it out from the routine cards, whose names open with the
 * routine's, and from "Minor five-note scale". Today's three are links, not
 * buttons, and start at the plan's tempo, so they must not be what this hits.
 */
export const pathRow = (page, title) => page.getByRole("button", { name: new RegExp(`^${escapeRe(title)}`) });

/**
 * A newcomer's /warmups folds the path under "Every exercise": open it, as a
 * singer would, before reaching for a row. Runs through the page's own DOM, so
 * it is a no-op wherever there is no fold (including a stub test page).
 */
export async function openPath(page) {
  await page
    .evaluate(() => {
      for (const d of document.querySelectorAll("details")) {
        if (!d.open && /^Every exercise/.test(d.querySelector("summary")?.textContent?.trim() ?? "")) d.querySelector("summary")?.click();
      }
    })
    .catch(() => {});
}

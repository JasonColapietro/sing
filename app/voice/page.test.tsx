import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/app-store";
import VoicePage from "./page";

const html = renderToStaticMarkup(<VoicePage />);

describe("/voice, the app download page", () => {
  it("puts both store buttons in the hero, ahead of the link away to the browser test", () => {
    const appStore = html.indexOf(`href="${APP_STORE_URL}"`);
    const play = html.indexOf(`href="${PLAY_STORE_URL}"`);
    const test = html.indexOf('href="/range?mode=range#start"');
    expect(appStore).toBeGreaterThan(-1);
    expect(play).toBeGreaterThan(-1);
    expect(appStore).toBeLessThan(test);
    expect(play).toBeLessThan(test);
    // The phone row is hidden where the desktop card already sits beside the hero.
    expect(html).toMatch(/<div class="[^"]*\blg:hidden\b[^"]*"><a[^>]*href="https:\/\/apps\.apple\.com/);
  });

  it("states the free plan as every other page does", () => {
    expect(html).toContain("warmups, ear training, breath and songs for 5 free minutes of guided practice a day");
    expect(html).toContain("take recorder");
    expect(html).not.toContain("adds its own practice tools, on-device recordings");
  });
});

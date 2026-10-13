import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { UsePitchResult } from "@/lib/audio/use-pitch";
import { songBySlug } from "./data";
import { SongPlayer } from "./song-player";

/**
 * Every start scrolls the transport row into view, aligned to the bottom of
 * the screen, which on a phone puts the page's top above it. The free minutes
 * left are drawn inside the transport card, right above Play, so that scroll
 * brings them into view with it.
 */
describe("the free-minutes readout in the song player", () => {
  it("sits directly above the transport row", () => {
    const html = renderToStaticMarkup(
      <SongPlayer
        song={songBySlug("silent-night")!}
        pitch={{ listening: false, error: null } as unknown as UsePitchResult}
        range={{}}
        mode="rehearsal"
        onModeChange={() => {}}
        pass="guided"
        onPassChange={() => {}}
        onFinish={() => {}}
        onExit={() => {}}
        allowance={<p data-testid="allowance">Free guided practice today</p>}
      />,
    );
    const at = html.indexOf('data-testid="allowance"');
    const transport = html.indexOf('id="song-transport"');
    expect(at).toBeGreaterThan(-1);
    expect(transport).toBeGreaterThan(at);
    // Nothing between them but the readout's own close and the row's open.
    expect(html.slice(at, transport)).toMatch(/^data-testid="allowance">Free guided practice today<\/p><div $/);
  });
});

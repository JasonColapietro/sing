import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { UsePitchResult } from "@/lib/audio/use-pitch";
import { songBySlug } from "./data";
import { SongPlayer, afterMicOn, micOffPrompt } from "./song-player";
import type { GuidePass } from "./types";

/**
 * "Continue without a mic" opens the player unscored, and the line under the
 * piano roll says so. That line used to tell the singer to enable the
 * microphone with no control anywhere in the player to do it; leaving to look
 * for one landed a song-page visitor in a library where their song was Locked.
 */
function render(listening: boolean, pass: GuidePass) {
  return renderToStaticMarkup(
    <SongPlayer
      song={songBySlug("amazing-grace")!}
      pitch={{ listening, error: null } as unknown as UsePitchResult}
      range={{}}
      mode="rehearsal"
      onModeChange={() => {}}
      pass={pass}
      onPassChange={() => {}}
      onFinish={() => {}}
      onExit={() => {}}
    />,
  );
}

describe("the song player's microphone control", () => {
  it("sits under the line that asks for the mic when the mic is off", () => {
    const html = render(false, "listen");
    const line = html.indexOf("Practicing without a mic. Turn it on to see your live score.");
    const control = html.indexOf("Enable microphone");
    expect(line).toBeGreaterThan(-1);
    expect(control).toBeGreaterThan(line);
    // Before the transport row, beside the line, not between the allowance and Play.
    expect(control).toBeLessThan(html.indexOf('id="song-transport"'));
  });

  it("is not offered once the mic is on", () => {
    for (const pass of ["listen", "guided", "solo"] as const) {
      expect(render(true, pass), pass).not.toContain("Enable microphone");
    }
  });
});

describe("turning the microphone on from inside the player", () => {
  it("offers the control before a run and while paused, and says what it does", () => {
    expect(micOffPrompt("idle").control).toBe("Enable microphone");
    // A paused run was sung unheard, so the control starts it over.
    expect(micOffPrompt("paused").control).toBe("Enable microphone and restart");
    expect(micOffPrompt("paused").line).toBe("Practicing without a mic. Turn it on to see your live score.");
  });

  it("points at Pause while the song plays, where no control is drawn", () => {
    const running = micOffPrompt("running");
    expect(running.control).toBeNull();
    expect(running.line).toBe("Practicing without a mic. Pause to turn it on and be scored.");
  });

  it("gets a run ready to score without starting it before a run", () => {
    expect(afterMicOn("idle", "listen")).toEqual({ pass: "guided", restart: false });
    expect(afterMicOn("idle", "solo")).toEqual({ pass: "solo", restart: false });
  });

  it("starts a run already under way over, rather than scoring it from the middle", () => {
    // Scored from here, every note before the mic came on would be judged a
    // miss in one burst and logged with the score.
    expect(afterMicOn("paused", "guided")).toEqual({ pass: "guided", restart: true });
    expect(afterMicOn("paused", "listen")).toEqual({ pass: "guided", restart: true });
    // Play pressed while the permission prompt was up.
    expect(afterMicOn("running", "solo")).toEqual({ pass: "solo", restart: true });
  });

  it("leaves a finished run to the summary", () => {
    expect(afterMicOn("finished", "listen")).toBeNull();
  });
});

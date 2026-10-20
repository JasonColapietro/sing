import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { UsePitchResult } from "@/lib/audio/use-pitch";
import { songBySlug } from "./data";
import { createPendingRequest } from "./lib";
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

/**
 * The player's "Enable microphone" and the summary's "Enable microphone and
 * sing again" both await a permission prompt the singer can leave up while
 * they End practice or go Back to library. Allowed afterwards, the player's
 * restart ran on an unmounted player (timers, frames and the guide with
 * nothing to stop them) and the summary's pulled the singer back into the
 * song they had left. Both now wait the way `press` does here.
 */
describe("a microphone prompt answered after the singer moved on", () => {
  function prompt() {
    let answer: (granted: boolean) => void = () => {};
    const granted = new Promise<boolean>((resolve) => (answer = resolve));
    return { granted, answer };
  }

  /** As enableMic and onEnableMic: the work runs only if the request still holds. */
  async function press(request: ReturnType<typeof createPendingRequest>, granted: Promise<boolean>, work: () => void) {
    const current = request.begin();
    if (!(await granted) || !current()) return;
    work();
  }

  it("still starts the run when nothing moved", async () => {
    const request = createPendingRequest();
    const { granted, answer } = prompt();
    let started = 0;
    const pressed = press(request, granted, () => started++);
    answer(true);
    await pressed;
    expect(started).toBe(1);
  });

  it("starts nothing once the player or summary has gone, though access was granted", async () => {
    const request = createPendingRequest();
    const { granted, answer } = prompt();
    let started = 0;
    const pressed = press(request, granted, () => started++);
    request.cancel(); // End practice unmounts the player; Back to library leaves the summary.
    answer(true);
    await pressed;
    expect(started).toBe(0);
  });

  it("acts on the latest press only", async () => {
    const request = createPendingRequest();
    const { granted, answer } = prompt();
    const started: string[] = [];
    const first = press(request, granted, () => started.push("first"));
    const second = press(request, granted, () => started.push("second"));
    answer(true);
    await Promise.all([first, second]);
    expect(started).toEqual(["second"]);
  });

  it("takes a new press after a cancel", async () => {
    // The summary cancels on every view change, and a strict-mode remount
    // cancels once before the singer has pressed anything.
    const request = createPendingRequest();
    request.cancel();
    const { granted, answer } = prompt();
    let started = 0;
    const pressed = press(request, granted, () => started++);
    answer(true);
    await pressed;
    expect(started).toBe(1);
  });

  it("starts nothing when access is refused", async () => {
    const request = createPendingRequest();
    const { granted, answer } = prompt();
    let started = 0;
    const pressed = press(request, granted, () => started++);
    answer(false);
    await pressed;
    expect(started).toBe(0);
  });
});

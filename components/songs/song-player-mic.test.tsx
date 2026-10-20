import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { UsePitchResult } from "@/lib/audio/use-pitch";
import { songBySlug } from "./data";
import { createPendingRequest, type PlayerSetup } from "./lib";
import { SongPlayer, afterMicOn, loopPillText, micOffPrompt } from "./song-player";
import type { GuidePass, SessionMode } from "./types";

/**
 * "Continue without a mic" opens the player unscored, and the line under the
 * piano roll says so. That line used to tell the singer to enable the
 * microphone with no control anywhere in the player to do it; leaving to look
 * for one landed a song-page visitor in a library where their song was Locked.
 */
function render(
  listening: boolean,
  pass: GuidePass,
  { setup, mode = "rehearsal", slug = "amazing-grace" }: { setup?: PlayerSetup; mode?: SessionMode; slug?: string } = {},
) {
  return renderToStaticMarkup(
    <SongPlayer
      song={songBySlug(slug)!}
      pitch={{ listening, error: null } as unknown as UsePitchResult}
      range={{}}
      mode={mode}
      onModeChange={() => {}}
      pass={pass}
      onPassChange={() => {}}
      onFinish={() => {}}
      onExit={() => {}}
      setup={setup}
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

  it("draws the paused control beside Resume, where the singer just pressed Pause", () => {
    // Under the line, in the piano-roll card, it sat above a phone's screen
    // once the singer had scrolled down to the pass chips and pressed Play.
    expect(micOffPrompt("idle").at).toBe("line");
    expect(micOffPrompt("paused").at).toBe("transport");
    expect(micOffPrompt("running").at).toBeNull();
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

describe("the transport button's accessible name", () => {
  it("is its visible label, with no aria-label to disagree with Resume", () => {
    // Paused, the button read "Resume" with aria-label "Play": a voice-control
    // "click Resume" found nothing. The visible text now names it in every phase.
    const html = render(false, "guided");
    expect(html).not.toMatch(/aria-label="(Play|Pause|Resume)"/);
    expect(html).toMatch(/<button[^>]*>(<svg[^]*?<\/svg>)?Play<\/button>/);
  });
});

describe("the loop pill", () => {
  it("gives the plan before a run, never a loop 0", () => {
    expect(loopPillText("idle", "performance", 4, 0, 0)).toBe("4 loops");
    expect(loopPillText("idle", "performance", 1, 0, 0)).toBe("1 loop");
    expect(loopPillText("idle", "rehearsal", 4, 0, 0)).toBe("On repeat");
    expect(render(false, "guided", { mode: "performance" })).not.toContain("Loop 0");
    expect(render(false, "guided")).not.toContain("Loop 0");
  });

  it("counts loops once the run is under way", () => {
    expect(loopPillText("running", "performance", 4, 0, 1)).toBe("Loop 2 of 4");
    // A rehearsal counts every pass, across cycles of the planned loops.
    expect(loopPillText("paused", "rehearsal", 4, 1, 2)).toBe("Loop 7");
  });
});

/**
 * "Sing again" mounts a new player (the old one unmounted for the summary), so
 * it opens from the last run's setup or not at all: it used to come back at
 * the written key, 100%, the whole song and Any octave, and the same singing
 * then scored 0.
 */
describe("a player reopened from the last run's setup", () => {
  const setup: PlayerSetup = {
    songId: "amazing-grace",
    pickedSemis: 2,
    tempo: 0.8,
    tempoAuto: false,
    octaveAgnostic: false,
    loop: { startBeat: 0, endBeat: 2 },
    guidePct: 40,
    clickDuringPlay: true,
    recordTake: false,
  };
  const song = songBySlug("amazing-grace")!;

  it("opens at the key, rate, octave scoring, loop and desk that run was set up with", () => {
    expect(song.id).toBe(setup.songId);
    const html = render(true, "guided", { setup });
    expect(html).toContain(">+2<");
    expect(html).toContain(`>${Math.round(song.bpm * 0.8)}<`);
    expect(html).toContain("80%");
    expect(html).toContain("Exact octave");
    expect(html).toContain("40%");
    expect(html).toContain('title="Metronome click on every beat while the song plays" aria-pressed="true"');
    expect(html).not.toContain("Singing the whole song");
    expect(html).toContain("Drilling ");
  });

  it("opens fresh for any other song", () => {
    const html = render(true, "guided", { setup, slug: "silent-night" });
    expect(html).toContain("Any octave");
    expect(html).toContain("100%");
    expect(html).toContain("Singing the whole song");
    expect(html).not.toContain(">+2<");
    expect(html).toContain('title="Metronome click on every beat while the song plays" aria-pressed="false"');
  });
});

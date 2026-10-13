/**
 * The too-quiet hint: why a listening room shows nothing, and what to do.
 *
 * With automatic gain deliberately disabled, a singer at talking volume is
 * often under the floor the pitch detector needs, so this is the common case
 * rather than the odd one. Without a hint the room shows a dash and a bar that
 * never fills, with nothing to act on. The range test wrote this rule first;
 * the pitch meter shares it, so the two rooms say the same thing about the
 * same input. Pure, so it runs per frame in an effect or a draw loop.
 */

/**
 * How long to let a singer work before explaining why nothing is happening.
 * Long enough not to nag someone who is about to succeed, short enough that
 * nobody sits in front of a bar that never moves wondering what is wrong.
 */
export const HINT_AFTER_MS = 2500;

/** Below this there is nothing on the mic at all, not merely a quiet singer. */
export const SILENCE_FLOOR = 0.0015;

/** Loud enough, but no pitch came back: a breathy or unsteady note. */
export const UNPITCHED_HINT =
  "We can hear you, but we can't lock onto a pitch. Try a steady “ah” on one comfortable note.";

/** Something reached the mic, but never loud enough to measure. */
export const TOO_QUIET_HINT =
  "You're coming through too quietly to measure. Move closer to the mic, sing a little louder, or raise your input level in your system sound settings.";

/** Nothing above the noise floor at all: the wrong mic, or a busy one. */
export const NO_SOUND_HINT =
  "We're not picking up any sound. Check the right microphone is selected in your system sound settings, and that nothing else is using it.";

/** Rolling evidence about the mic, so the hint describes what was measured. */
export interface InputHintState {
  /** Unbroken time under the volume floor. */
  quietMs: number;
  /** Unbroken time loud enough but with no pitch. */
  unpitchedMs: number;
  /** The loudest frame since the state was made. */
  loudestSeen: number;
  /** Total time a pitch was heard since the state was made. */
  voicedMs: number;
  /** The hint on screen: it stays until a pitch is heard or another replaces it. */
  hint: string | null;
}

export function freshInputHint(): InputHintState {
  return { quietMs: 0, unpitchedMs: 0, loudestSeen: 0, voicedMs: 0, hint: null };
}

/**
 * Fold one frame into `state` and return the hint to show. A heard pitch
 * clears it at once. Loud but unpitched input, or input under `minVolume`,
 * names its cause after HINT_AFTER_MS of it unbroken; until then whatever
 * hint is showing stays, so moving between the two never flickers.
 */
export function nextInputHint(
  state: InputHintState,
  frame: { volume: number },
  dtMs: number,
  voiced: boolean,
  minVolume: number,
): string | null {
  state.loudestSeen = Math.max(state.loudestSeen, frame.volume);
  if (voiced) {
    state.quietMs = 0;
    state.unpitchedMs = 0;
    state.voicedMs += dtMs;
    state.hint = null;
  } else if (frame.volume >= minVolume) {
    state.quietMs = 0;
    state.unpitchedMs += dtMs;
    if (state.unpitchedMs >= HINT_AFTER_MS) state.hint = UNPITCHED_HINT;
  } else {
    state.unpitchedMs = 0;
    state.quietMs += dtMs;
    if (state.quietMs >= HINT_AFTER_MS) {
      state.hint = state.loudestSeen >= SILENCE_FLOOR ? TOO_QUIET_HINT : NO_SOUND_HINT;
    }
  }
  return state.hint;
}

/**
 * Voiced time after which the pitch meter treats a silence as a rest between
 * notes rather than a mic that cannot hear: the meter's own bar for a held
 * note. The range test asks for continuous singing and has no such rests.
 */
export const HEARD_MS = 300;

/**
 * The pitch meter's hint. It is an open room, so a singer it has already heard
 * hold a note and who then stops is resting, not too quiet: the quiet and
 * no-sound hints are only for a run that has not been heard yet. The
 * unpitched hint stays, since that input is still reaching the mic.
 */
export function meterInputHint(state: InputHintState): string | null {
  if (state.hint === UNPITCHED_HINT) return state.hint;
  return state.voicedMs >= HEARD_MS ? null : state.hint;
}

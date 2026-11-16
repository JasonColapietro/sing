import type { BlogPost } from "../types";
import { howToSingHighNotes } from "./how-to-sing-high-notes";
import { howToSingOnPitch } from "./how-to-sing-on-pitch";
import { howToFindYourMixedVoice } from "./how-to-find-your-mixed-voice";
import { howToSingWithVibrato } from "./how-to-sing-with-vibrato";
import { whyDoesMyVoiceCrack } from "./why-does-my-voice-crack-when-i-sing";
import { howToBeltWithoutStraining } from "./how-to-belt-without-straining";
import { soreThroatAfterSinging } from "./sore-throat-after-singing";
import { howToPracticeSingingAtHome } from "./how-to-practice-singing-at-home";
import { howToSingFromYourDiaphragm } from "./how-to-sing-from-your-diaphragm";
import { howToSingInHeadVoice } from "./how-to-sing-in-head-voice";
import { howToSingFalsetto } from "./how-to-sing-falsetto";
import { howToSingLowNotes } from "./how-to-sing-low-notes";
import { howToImproveVocalTone } from "./how-to-improve-vocal-tone";
import { howToSingRiffsAndRuns } from "./how-to-sing-riffs-and-runs";
import { howToSingHarmony } from "./how-to-sing-harmony";
import { howToOvercomeStageFright } from "./how-to-overcome-stage-fright-when-singing";
import { howToSingLouder } from "./how-to-sing-louder-without-shouting";
import { howToSingWithEmotion } from "./how-to-sing-with-emotion";
import { howToSingWithRasp } from "./how-to-sing-with-rasp";
import { howToReadMusicForSinging } from "./how-to-read-music-for-singing";
import { singingAuditionTips } from "./singing-audition-tips";
import { howToSingIntoAMicrophone } from "./how-to-sing-into-a-microphone";
import { vocalCoolDownExercises } from "./vocal-cool-down-exercises";
import { howToSingAndPlayGuitar } from "./how-to-sing-and-play-guitar-at-the-same-time";
import { canAnyoneLearnToSing } from "./can-anyone-learn-to-sing";
import { howLongToLearnToSing } from "./how-long-does-it-take-to-learn-to-sing";
import { singingWithACold } from "./singing-with-a-cold";
import { howToSingOpera } from "./how-to-sing-opera";
import { howToSingJazz } from "./how-to-sing-jazz";
import { howToSingCountryMusic } from "./how-to-sing-country-music";
import { howToSingMusicalTheater } from "./how-to-sing-musical-theater";
import { howToSingGospel } from "./how-to-sing-gospel";

/**
 * Every published post. Add the import and the entry here; the routes,
 * sitemap, footer, keyword map and llms.txt pick it up from lib/blog.
 */
export const POSTS: readonly BlogPost[] = [
  howToSingHighNotes,
  howToSingOnPitch,
  howToFindYourMixedVoice,
  howToSingWithVibrato,
  whyDoesMyVoiceCrack,
  howToBeltWithoutStraining,
  soreThroatAfterSinging,
  howToPracticeSingingAtHome,
  howToSingFromYourDiaphragm,
  howToSingInHeadVoice,
  howToSingFalsetto,
  howToSingLowNotes,
  howToImproveVocalTone,
  howToSingRiffsAndRuns,
  howToSingHarmony,
  howToOvercomeStageFright,
  howToSingLouder,
  howToSingWithEmotion,
  howToSingWithRasp,
  howToReadMusicForSinging,
  singingAuditionTips,
  howToSingIntoAMicrophone,
  vocalCoolDownExercises,
  howToSingAndPlayGuitar,
  canAnyoneLearnToSing,
  howLongToLearnToSing,
  singingWithACold,
  howToSingOpera,
  howToSingJazz,
  howToSingCountryMusic,
  howToSingMusicalTheater,
  howToSingGospel,
];

import type { BlogPost } from "../types";
import { howToSingHighNotes } from "./how-to-sing-high-notes";
import { howToSingOnPitch } from "./how-to-sing-on-pitch";
import { howToFindYourMixedVoice } from "./how-to-find-your-mixed-voice";
import { howToSingWithVibrato } from "./how-to-sing-with-vibrato";
import { whyDoesMyVoiceCrack } from "./why-does-my-voice-crack-when-i-sing";
import { howToBeltWithoutStraining } from "./how-to-belt-without-straining";
import { soreThroatAfterSinging } from "./sore-throat-after-singing";
import { howToPracticeSingingAtHome } from "./how-to-practice-singing-at-home";

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
];

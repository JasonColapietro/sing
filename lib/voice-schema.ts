import { APP_NAME, APP_STORE_URL, PLAY_STORE_URL, VOICE_PAGE_PATH } from "@/lib/app-store";
import { AUTHOR_ID } from "@/lib/author";
import { ORG_ID } from "@/lib/organization";
import { SITE_URL } from "@/lib/site";

export const VOICE_PAGE_URL = `${SITE_URL}${VOICE_PAGE_PATH}`;
export const ANDROID_EXERCISE_COUNT = 96;

/** Platform facts checked against the public Google Play listing on 2026-11-10.
 * The free download includes the range test; guided practice requires Pro.
 * Keep the store title intact and never copy ratings between platforms.
 */
export const VOICE_APP_NODES = [
  {
    "@type": "MobileApplication",
    "@id": `${VOICE_PAGE_URL}#ios`,
    name: `${APP_NAME}: Vocal Range Test`,
    applicationCategory: "EducationalApplication",
    applicationSubCategory: "Singing practice and vocal training",
    operatingSystem: "iOS 17.0 or later",
    url: `${VOICE_PAGE_URL}#ios`,
    installUrl: APP_STORE_URL,
    downloadUrl: APP_STORE_URL,
    sameAs: [APP_STORE_URL],
    description: "Vocal range testing and singing practice for iPhone from Suede AI. Free download with optional in-app purchases.",
    mainEntityOfPage: { "@id": VOICE_PAGE_URL },
    publisher: { "@id": ORG_ID },
    author: { "@id": AUTHOR_ID },
    offers: {
      "@type": "Offer", price: "0", priceCurrency: "USD", url: APP_STORE_URL,
      description: "Free download with optional in-app purchases.",
    },
  },
  {
    "@type": "MobileApplication",
    "@id": `${VOICE_PAGE_URL}#android`,
    name: `${APP_NAME}: Vocal Range Test`,
    applicationCategory: "EducationalApplication",
    applicationSubCategory: "Singing practice and vocal training",
    operatingSystem: "Android",
    identifier: "ai.suedeai.suedevoice",
    url: `${VOICE_PAGE_URL}#android`,
    installUrl: PLAY_STORE_URL,
    downloadUrl: PLAY_STORE_URL,
    sameAs: [PLAY_STORE_URL],
    description: `Android singing app with a free vocal range test and voice-type estimate. Suede Voice Pro unlocks ${ANDROID_EXERCISE_COUNT} vocal exercises, guided warmups, breath and ear training, and progress tracking. Audio analysis runs offline on your device.`,
    featureList: [
      "Free vocal range test and voice-type estimate",
      "Real-time pitch feedback",
      `${ANDROID_EXERCISE_COUNT} vocal exercises across 13 techniques with Pro`,
      "Guided vocal warmups and daily routines with Pro",
      "Breath control and ear training with Pro",
      "Practice history and progress tracking with Pro",
      "Offline, on-device audio analysis",
      "No ads or account required",
    ],
    mainEntityOfPage: { "@id": VOICE_PAGE_URL },
    publisher: { "@id": ORG_ID },
    author: { "@id": AUTHOR_ID },
    offers: {
      "@type": "Offer", price: "0", priceCurrency: "USD", url: PLAY_STORE_URL,
      name: "Free Android download and vocal range test",
      description: "Optional monthly or annual Suede Voice Pro subscription through Google Play unlocks guided practice and all vocal exercises.",
    },
  },
];

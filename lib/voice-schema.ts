import { APP_NAME, APP_STORE_URL, PLAY_STORE_URL, VOICE_PAGE_PATH } from "@/lib/app-store";
import { AUTHOR_ID } from "@/lib/author";
import { ORG_ID } from "@/lib/organization";
import { SITE_URL } from "@/lib/site";

export const VOICE_PAGE_URL = `${SITE_URL}${VOICE_PAGE_PATH}`;
export const ANDROID_EXERCISE_COUNT = 96;
/** Public US App Store listing and lookup API, checked 2026-11-11. */
export const IOS_APP_VERSION = "2.0";
export const IOS_FREE_FEATURES = [
  "Vocal range tests with no daily limit or account",
  "Lowest note, highest note and passaggio on a keyboard",
  "Voice-type estimate and pitch accuracy in cents",
];
export const IOS_PRO_FEATURES = [
  "96 scored vocal exercises across 13 techniques",
  "A daily plan with guided warmups, drills and routines",
  "26 public-domain songs that transpose to your range",
  "Live pitch studio, ear training, breath drills and recorder",
  "Practice history and range growth",
  "The Measured Voice book with a PDF to keep",
];

/** Unedited images from the current App Store listing; provenance in docs/seo. */
export const IOS_SCREENSHOTS = [
  {
    src: "/voice/ios-famous-ranges.jpg",
    alt: "Suede Voice for iPhone: famous singers with voice types and vocal range bars",
    caption: "Compare your range with famous singers",
  },
  {
    src: "/voice/ios-guided-drills.jpg",
    alt: "Suede Voice for iPhone: the exercise library with 96 drills and warmup categories",
    caption: "Choose a drill for the skill you want to practice",
  },
  {
    src: "/voice/ios-progress.jpg",
    alt: "Suede Voice for iPhone: practice streak, daily goal and weekly progress",
    caption: "Follow your practice over time",
  },
];

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
    softwareVersion: IOS_APP_VERSION,
    image: `${SITE_URL}/voice/ios-icon.jpg`,
    screenshot: IOS_SCREENSHOTS.map((shot) => `${SITE_URL}${shot.src}`),
    url: `${VOICE_PAGE_URL}#ios`,
    installUrl: APP_STORE_URL,
    downloadUrl: APP_STORE_URL,
    sameAs: [APP_STORE_URL],
    description: "Singing practice for iPhone from Suede AI. Unlimited vocal range tests are free; Suede Voice Pro adds a daily plan, scored exercises, songs and progress tracking.",
    featureList: [
      ...IOS_FREE_FEATURES,
      ...IOS_PRO_FEATURES.map((feature) => `${feature} with Pro`),
      "On-device audio analysis; recordings stay on your iPhone",
    ],
    mainEntityOfPage: { "@id": VOICE_PAGE_URL },
    publisher: { "@id": ORG_ID },
    author: { "@id": AUTHOR_ID },
    offers: {
      "@type": "Offer", price: "0", priceCurrency: "USD", url: APP_STORE_URL,
      description: "Free download and unlimited range tests. Suede Voice Pro is a separate in-app subscription for guided practice and additional tools; see the App Store for current prices.",
    },
  },
  {
    "@type": "MobileApplication",
    "@id": `${VOICE_PAGE_URL}#android`,
    name: `${APP_NAME}: Vocal Range Test`,
    applicationCategory: "EducationalApplication",
    applicationSubCategory: "Singing practice and vocal training",
    operatingSystem: "Android",
    image: `${SITE_URL}/voice/android-icon.png`,
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

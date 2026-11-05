/**
 * Competitor comparison data: the "Suede Sing vs X" and "X alternatives"
 * pages under /compare, the /compare hub, the sitemap and llms.txt all read
 * from this one module, so a price or a source changes in one place.
 *
 * Rules this file is held to (lib/comparisons.test.ts enforces the
 * mechanical ones):
 *
 * - Every competitor fact was checked against the source URLs listed with it
 *   on COMPARISONS_CHECKED. Nothing here is a weakness inferred from silence:
 *   where a source does not say something, the row says what the source does
 *   say, or that it is not listed.
 * - Every price carries "as of November 2026" (COMPARISONS_AS_OF) where it is
 *   printed.
 * - Suede Sing claims are read from the same constants the product pages use
 *   (pricing, free cap, inventory counts), so they cannot drift from the
 *   product.
 *
 * Candidates researched and left out on 2026-11-03: Vanido (current platform
 * and pricing could not be confirmed from a first-party source; third-party
 * pages disagree) and Erol Singer's Studio (no current first-party listing or
 * price could be found).
 */
import { FREE_DAILY_MINUTES } from "@/lib/practice-limits";
import { SINGER_COUNT, SONG_COUNT } from "@/lib/pro-inventory";
import { PRICING, SOLD_OUT_PLANS, formatPrice } from "@/lib/pro-shared";
import { POP_SONGS } from "@/lib/pop-songs";
import { CATALOG_LESSON_COUNT, COURSE } from "@/lib/voice-lessons";

/** The day every competitor fact below was checked against its sources. */
export const COMPARISONS_CHECKED = "2026-11-03";
/** Printed next to every competitor price. */
export const COMPARISONS_AS_OF = "as of November 2026";
/** The same date, as a reader sees it. */
export const COMPARISONS_CHECKED_LABEL = "November 3, 2026";

export const COMPARE_PATH = "/compare";

export interface Source {
  label: string;
  url: string;
}

export interface Faq {
  q: string;
  a: string;
}

/** One reason a singer picks Suede Sing, stated only from what the product does. */
export interface Edge {
  title: string;
  body: string;
}

/** The rows every comparison table prints, in order. */
export const ROW_LABELS = {
  platforms: "Where it runs",
  price: `Price (${COMPARISONS_AS_OF})`,
  free: "What you can use free",
  practice: "How practice works",
  range: "Vocal range tools",
  songs: "Songs",
  lessons: "Lessons and courses",
} as const;

export type RowKey = keyof typeof ROW_LABELS;
export const ROW_KEYS = Object.keys(ROW_LABELS) as RowKey[];

export interface Competitor {
  /** URL slug: /compare/suede-sing-vs-<slug> and /compare/<slug>-alternatives. */
  slug: string;
  name: string;
  /** The company that publishes it, as its own listing names it. */
  maker: string;
  /** Short label for hub tables: what the product is built around. */
  builtFor: string;
  /** Short price for hub tables; the full sentence is facts.price. */
  priceShort: string;
  /** A neutral, sourced paragraph: what this product is. */
  about: string;
  facts: Record<RowKey, string>;
  /** Why a singer weighing this product picks Suede Sing. */
  edges: Edge[];
  /** One question specific to this product, for the vs page FAQ. */
  vsQuestion: Faq;
  /** Search snippets, 70 to 155 characters each, unique across the site. */
  description: { vs: string; alternatives: string };
  sources: Source[];
}

/* ------------------------------------------------------------ Suede Sing --- */

const PRO_PRICE = formatPrice(PRICING.lifetime.amount);
const MONTHLY_SOLD_OUT = SOLD_OUT_PLANS.includes("monthly");

/** "$79 once for lifetime access" (with the monthly plan named only while it is on sale). */
export const SUEDE_PRICE_LINE = MONTHLY_SOLD_OUT
  ? `${PRO_PRICE} once for lifetime access`
  : `${formatPrice(PRICING.monthly.amount)} a month or ${PRO_PRICE} once for lifetime access`;

export const SUEDE_FACTS: Record<RowKey, string> = {
  platforms:
    "Any modern browser (Chrome, Safari, Edge or Firefox) on a phone or a computer, with nothing to install. Also a free Chrome extension and the Suede Voice app for iPhone and Android.",
  price: `Free plan, and Suede Pro at ${SUEDE_PRICE_LINE} (Early Access).`,
  free: `The pitch studio, range test, recorder, metronome, keyboard, drone, voice analyzer, the ${CATALOG_LESSON_COUNT}-lesson voice course and ${SINGER_COUNT} singer range pages, with no daily limit. Guided warmups, ear training, breath drills and song practice share ${FREE_DAILY_MINUTES} free minutes a day.`,
  practice:
    "A live pitch meter that reads your note in cents with a scrolling pitch trace, warmups scored note by note, ear-training games and breath drills with a sustain test.",
  range: `A free range test that measures your lowest and highest clear notes and estimates your voice type, then lines you up against ${SINGER_COUNT} singers' reported ranges.`,
  songs: `${SONG_COUNT} public-domain songs that open fitted to your measured range and score you note by note, plus key and range checks for ${POP_SONGS.length} popular songs.`,
  lessons: `A free ${COURSE.length}-stage voice course of ${CATALOG_LESSON_COUNT} short lessons and multi-week practice programs. Suede Pro adds two singing books in full.`,
};

/** The reasons that hold against every product on this list. */
export const SUEDE_EDGES = {
  browser: {
    title: "Open a browser and sing",
    body: "Suede Sing runs in Chrome, Safari, Edge or Firefox on a phone or a laptop. There is nothing to download before your first note, and the Suede Voice app is there for iPhone and Android when you want it.",
  },
  free: {
    title: "Free tools with no daily limit",
    body: `The pitch studio, the range test, the recorder and the ${CATALOG_LESSON_COUNT}-lesson voice course are free with no daily limit and no trial that expires. Guided practice gets ${FREE_DAILY_MINUTES} free minutes every day.`,
  },
  once: {
    title: "Pay once, keep it",
    body: `Suede Pro is ${SUEDE_PRICE_LINE}. It lifts the daily guided-practice limit, adds more warmups, both books with PDFs, pitch analysis on your recorded takes and progress sync across devices.`,
  },
  private: {
    title: "Your voice stays on your device",
    body: "Pitch analysis runs in the browser on your own device, and microphone audio is never uploaded. Recorder takes stay on the device, and Pro's sync carries scores and streaks, never audio.",
  },
  measured: {
    title: "Measure first, then practice",
    body: `The range test finds your lowest and highest clear notes in about two minutes. Songs then open fitted to that range, and you can line your result up against ${SINGER_COUNT} singers' reported ranges.`,
  },
  scored: {
    title: "Every rep is scored",
    body: "Warmups play each pattern, count you in and score your pitch note by note, and the pitch studio shows how many cents sharp or flat you are while you sing.",
  },
  noAds: {
    title: "No ads",
    body: "Suede Sing shows no ads on the free plan or on Pro. The practice room is the whole screen.",
  },
} satisfies Record<string, Edge>;

/* ----------------------------------------------------------- competitors --- */

export const COMPETITORS: Competitor[] = [
  {
    slug: "yousician",
    name: "Yousician",
    maker: "Yousician Ltd",
    builtFor: "Music lessons for five instruments, singing included",
    priceShort: "Premium+ $29.99 a month or $139.99 a year",
    about:
      "Yousician is a music-learning app from Yousician Ltd that teaches singing next to guitar, bass, ukulele and piano. The app listens through your microphone and gives feedback on pitch and timing, and its singing lessons cover technique, warm-ups and real songs. It runs on iOS, Android, Mac and PC.",
    facts: {
      platforms: "iOS and Android apps, plus Mac and PC.",
      price: `Premium+ is $29.99 a month or $139.99 a year on Yousician's US site, with a 7-day free trial (${COMPARISONS_AS_OF}).`,
      free: "A 7-day free trial of Premium+.",
      practice: "The app listens and gives feedback on your pitch and timing as you sing.",
      range: "Calibrates your vocal range so songs can be transposed to fit it.",
      songs: "A catalog of 10,000+ songs, lessons and exercises across its instruments.",
      lessons: "Lesson plans and singing lessons covering technique, warm-ups and real songs.",
    },
    edges: [
      {
        title: "Built for the voice and nothing else",
        body: "Every room in Suede Sing exists for singers: the pitch studio, the range test, warmups, ear training, breath drills, song practice and a voice course written for singers.",
      },
      {
        title: "One payment instead of a monthly bill",
        body: `Suede Pro is ${SUEDE_PRICE_LINE}. Yousician Premium+ on the monthly plan is $29.99 a month, so Suede Pro costs less than three months of it (${COMPARISONS_AS_OF}).`,
      },
      SUEDE_EDGES.free,
      SUEDE_EDGES.browser,
      SUEDE_EDGES.private,
    ],
    vsQuestion: {
      q: "How do I switch from Yousician to Suede Sing?",
      a: "Open sing.suedeai.ai/range in your browser and take the free range test. It measures your lowest and highest clear notes, songs then open fitted to that range, and a guided warmup is one tap away. There is nothing to install.",
    },
    description: {
      vs: "Suede Sing vs Yousician for singers: free browser pitch and range tools and $79 once for Pro, against $29.99 a month for Premium+ (November 2026).",
      alternatives:
        "Yousician alternatives for singing practice: Suede Sing in the browser with free pitch and range tools and a $79 one-time Pro, plus five more apps.",
    },
    sources: [
      { label: "Yousician: singing", url: "https://yousician.com/singing" },
      { label: "Yousician: Premium+ singing offer (US)", url: "https://yousician.com/lp/singing-us" },
      { label: "Yousician on the App Store (US)", url: "https://apps.apple.com/us/app/959883039" },
    ],
  },
  {
    slug: "singing-carrots",
    name: "Singing Carrots",
    maker: "Singing Carrots",
    builtFor: "Singing training in Chrome and on mobile",
    priceShort: "Not published; shown after an assessment",
    about:
      "Singing Carrots is a singing-training site that runs in Google Chrome on a computer, tablet or phone, with a companion app for iOS and Android. It offers a pitch training game, a vocal range test, a pitch accuracy test, a song search that matches titles to your range, beginner courses and leaderboards.",
    facts: {
      platforms: "Google Chrome on a computer, tablet or phone, plus a companion app for iOS and Android.",
      price: `Plan prices are not published. Its pricing page says plans are recommended after an assessment, and its homepage asks you to log in to see prices (${COMPARISONS_AS_OF}).`,
      free: "A free account. Paid plans are shown after you log in.",
      practice: "A pitch training game with instant visual feedback, plus sustain and breath training.",
      range: "A vocal range test and a pitch accuracy test.",
      songs: "A song search across 75,000+ titles that filters by your range, difficulty and genre.",
      lessons: "Courses including a 4-week beginner program and the 21-lesson All-Round Vocalist.",
    },
    edges: [
      {
        title: "The price is on the page",
        body: `Suede Pro is ${SUEDE_PRICE_LINE}, printed on the site for anyone to read. No quiz and no login stand between you and the number.`,
      },
      {
        title: "Any modern browser",
        body: "Suede Sing practices in Chrome, Safari, Edge or Firefox, on a phone or a computer, with nothing to install.",
      },
      SUEDE_EDGES.measured,
      SUEDE_EDGES.private,
      SUEDE_EDGES.free,
    ],
    vsQuestion: {
      q: "Do Suede Sing and Singing Carrots both work in the browser?",
      a: "Yes. Singing Carrots says it runs in Google Chrome on a computer, tablet or phone. Suede Sing runs in Chrome, Safari, Edge or Firefox, and its pitch analysis happens on your own device, so microphone audio is never uploaded.",
    },
    description: {
      vs: "Suede Sing vs Singing Carrots: both run in the browser. Suede Sing adds free tools with no daily limit and a $79 one-time Pro price on the page.",
      alternatives:
        "Singing Carrots alternatives: Suede Sing gives free pitch and range tools in any modern browser and a published $79 one-time Pro, plus five more apps.",
    },
    sources: [
      { label: "Singing Carrots: homepage", url: "https://singingcarrots.com/" },
      { label: "Singing Carrots: pricing", url: "https://singingcarrots.com/pro" },
    ],
  },
  {
    slug: "smule",
    name: "Smule",
    maker: "Smule, Inc.",
    builtFor: "Social karaoke, duets and live sessions",
    priceShort: "VIP passes from $5.99 on the App Store",
    about:
      "Smule is a social karaoke app from Smule, Inc. for iPhone, iPad and Android. Its App Store listing claims a catalog of 15 million+ songs, with duets, group songs, live sessions, audio effects and key changes to fit your range. A VIP subscription adds the full catalog, solo recording and starting your own duets.",
    facts: {
      platforms: "iPhone and iPad on the App Store, and Android on Google Play.",
      price: `VIP passes on the US App Store run from $5.99 to $12.99, with Weekly VIP Access at $7.99, billed weekly, monthly or yearly (${COMPARISONS_AS_OF}).`,
      free: "Joining other singers' duets. VIP adds solo recording, the full catalog and starting your own duets.",
      practice: "Sing along to karaoke tracks with real-time pitch help, audio effects, duets and group songs.",
      range: "Change a song's key to fit your range.",
      songs: "A karaoke catalog its App Store listing puts at 15 million+ songs.",
      lessons: "Its App Store listing describes karaoke, duets and live sessions and lists no lesson course.",
    },
    edges: [
      SUEDE_EDGES.scored,
      {
        title: "Practice in private",
        body: "Nothing you sing in Suede Sing is posted anywhere. Pitch analysis runs on your device, microphone audio is never uploaded, and recorder takes stay on the device.",
      },
      SUEDE_EDGES.measured,
      {
        title: "A course, not only a catalog",
        body: `The free ${COURSE.length}-stage voice course runs ${CATALOG_LESSON_COUNT} short lessons, from setting up your room to registers and agility, and each one links to the room that practices it.`,
      },
      SUEDE_EDGES.once,
    ],
    vsQuestion: {
      q: "Is Suede Sing a karaoke app like Smule?",
      a: `No. Suede Sing is a singing-practice studio: it measures your range, scores your pitch note by note and trains your voice with warmups, ear training, breath drills and a free ${CATALOG_LESSON_COUNT}-lesson course. Its ${SONG_COUNT} public-domain songs open fitted to your range and are scored as you sing.`,
    },
    description: {
      vs: "Suede Sing vs Smule: a scored singing-practice studio in the browser against a social karaoke app. Free tools, $79 once for Pro (November 2026).",
      alternatives:
        "Smule alternatives for singers who want to practice: Suede Sing scores your pitch and measures your range free in the browser, plus five more apps.",
    },
    sources: [
      { label: "Smule on the App Store (US)", url: "https://apps.apple.com/us/app/smule-sing-karaoke-music/id509993510" },
      { label: "Smule on Google Play", url: "https://play.google.com/store/apps/details?id=com.smule.singandroid" },
    ],
  },
  {
    slug: "simply-sing",
    name: "Simply Sing",
    maker: "Simply Ltd",
    builtFor: "Singing along to songs fitted to your voice",
    priceShort: "Premium; US App Store items $4.99 to $89.99",
    about:
      "Simply Sing is a sing-along app from Simply Ltd, the company behind Simply Piano and Simply Guitar. It finds your voice type with an AI vocal check, adjusts songs to you and gives feedback, with levels that start on easy songs and daily singing tips. It runs on iPhone, iPad and Android.",
    facts: {
      platforms: "iPhone and iPad (iOS 16 or later), and Android.",
      price: `Monthly and yearly Premium plans whose prices vary by country and platform. The US App Store lists Simply Sing Premium purchases from $4.99 to $89.99 (${COMPARISONS_AS_OF}).`,
      free: "The vocal check, browsing the song library and song recommendations. Daily warm-ups and singing along need Premium.",
      practice: "Sing along to songs adjusted to your voice, with feedback.",
      range: "An AI-powered vocal check that finds your range and voice type.",
      songs: "A song library with personalized recommendations.",
      lessons: "Levels that start with easy songs, plus daily singing tips.",
    },
    edges: [
      {
        title: "Warm up on the free plan",
        body: `Guided warmups are part of Suede Sing's free plan, inside ${FREE_DAILY_MINUTES} free minutes of guided practice a day, and every rep is scored note by note.`,
      },
      SUEDE_EDGES.browser,
      SUEDE_EDGES.once,
      SUEDE_EDGES.private,
      SUEDE_EDGES.measured,
    ],
    vsQuestion: {
      q: "Can I use Suede Sing on a laptop as well as a phone?",
      a: "Yes. Suede Sing runs in Chrome, Safari, Edge or Firefox on a laptop, a desktop or a phone, with nothing to install, and the Suede Voice app is free for iPhone and Android. Suede Pro's sync carries your scores and streaks across devices.",
    },
    description: {
      vs: "Suede Sing vs Simply Sing: free warmups and a range test in any browser, and Suede Pro at $79 once instead of a Premium subscription (November 2026).",
      alternatives:
        "Simply Sing alternatives: Suede Sing puts free scored warmups, a range test and a pitch meter in your browser, with Pro at $79 once. Five more apps too.",
    },
    sources: [
      { label: "Simply Sing on the App Store (US)", url: "https://apps.apple.com/us/app/-/id1592900217" },
      {
        label: "Simply Sing help: what is free",
        url: "https://piano-help.hellosimply.com/en/articles/12584694-what-can-i-access-for-free-in-simply-sing",
      },
      {
        label: "Simply Sing help: subscribing",
        url: "https://sing-help.hellosimply.com/en/articles/11112159-subscribe-to-simply-sing",
      },
    ],
  },
  {
    slug: "singeo",
    name: "Singeo",
    maker: "Musora Media Inc.",
    builtFor: "Video singing lessons and live streams",
    priceShort: "$30 a month or $279 a year",
    about:
      "Singeo is an online singing-lesson membership from Musora Media. It teaches through step-by-step video lessons from singing teachers, with on-screen practice assignments, warm-up routines of 5 to 20 minutes, weekly live streams and a community. It runs on the web and in the Musora app for iOS and Android, and the membership also includes piano, guitar, bass and drum lessons.",
    facts: {
      platforms: "The web, plus the Musora app for iOS and Android.",
      price: `$30 a month or $279 a year, with 7 days of free access and a 90-day money-back guarantee (${COMPARISONS_AS_OF}).`,
      free: "7 days of free access, signing up with an email address and a card.",
      practice: "Video lessons with on-screen practice assignments and warm-up routines of 5 to 20 minutes.",
      range: "No range test is listed on its homepage.",
      songs: "Songs and practice tools alongside the video lessons.",
      lessons: "Step-by-step video courses, weekly live streams and student lesson plans.",
    },
    edges: [
      {
        title: "Feedback from your own microphone",
        body: "Suede Sing listens while you sing. The pitch studio shows how many cents sharp or flat each note is, and every warmup rep is scored note by note.",
      },
      {
        title: "One payment instead of a membership",
        body: `Suede Pro is ${SUEDE_PRICE_LINE}. Singeo is $30 a month, so Suede Pro costs less than three months of it (${COMPARISONS_AS_OF}).`,
      },
      {
        title: "Start free, with no card",
        body: `The pitch studio, range test, recorder and the ${CATALOG_LESSON_COUNT}-lesson voice course are free with no daily limit and no payment details. Guided practice gets ${FREE_DAILY_MINUTES} free minutes a day.`,
      },
      SUEDE_EDGES.measured,
    ],
    vsQuestion: {
      q: "Does Suede Sing have voice lessons like Singeo?",
      a: `Yes. Suede Sing's voice course is free: ${COURSE.length} stages and ${CATALOG_LESSON_COUNT} short lessons, from room setup and range to registers, agility and style. Each lesson ends in a self-check and links to the practice room that trains it, where the microphone scores what you sing.`,
    },
    description: {
      vs: "Suede Sing vs Singeo: live pitch scoring and a free voice course in the browser, against $30 a month for video lessons. Suede Pro is $79 once.",
      alternatives:
        "Singeo alternatives for singers: Suede Sing scores your pitch from the microphone and has a free voice course, with Pro at $79 once. Plus five more apps.",
    },
    sources: [{ label: "Singeo: homepage and pricing", url: "https://www.singeo.com/" }],
  },
  {
    slug: "sing-sharp",
    name: "Sing Sharp",
    maker: "Sing Sharp Limited",
    builtFor: "Vocal exercises and training programs on mobile",
    priceShort: "Memberships from $19.99 a month on the App Store",
    about:
      "Sing Sharp is a singing-lessons app for iPhone, iPad and Android, published on the App Store by Sing Sharp Limited. It gives real-time pitch feedback, a vocal range test, six training programs such as Daily Workout and Sing High Notes, ear training, video lesson demonstrations and audio and video recording. Both store listings note that the app contains ads.",
    facts: {
      platforms: "iPhone, iPad and Apple silicon Macs (as an iPad app), plus Android.",
      price: `US App Store memberships at $19.99 a month, $39.99 for three months and $99.99 a year, plus a separate $29.99 one-year item and $2.99 ad removal (${COMPARISONS_AS_OF}).`,
      free: "A free download with ads and in-app purchases.",
      practice: "Real-time pitch feedback that shows the notes you hit or miss, plus a resonance view.",
      range: "A short vocal range test.",
      songs: "Exercises generated within your range across six training programs.",
      lessons: "Video lesson demonstrations, ear training and solfege practice.",
    },
    edges: [
      SUEDE_EDGES.noAds,
      {
        title: "One payment instead of a membership",
        body: `Suede Pro is ${SUEDE_PRICE_LINE}. The Sing Sharp monthly membership is $19.99, so Suede Pro costs less than four months of it (${COMPARISONS_AS_OF}).`,
      },
      SUEDE_EDGES.browser,
      {
        title: "Songs fitted to your range",
        body: `After the range test, each of Suede Sing's ${SONG_COUNT} songs opens fitted to your measured range and scores you note by note. Key and range checks for ${POP_SONGS.length} popular songs tell you what fits before you try.`,
      },
      SUEDE_EDGES.private,
    ],
    vsQuestion: {
      q: "Does Suede Sing show ads?",
      a: "No. Suede Sing shows no ads on the free plan or on Suede Pro, and there is no ad-removal purchase because there is nothing to remove.",
    },
    description: {
      vs: "Suede Sing vs Sing Sharp: no ads, free pitch and range tools in any browser, and Pro at $79 once against memberships from $19.99 a month (Nov 2026).",
      alternatives:
        "Sing Sharp alternatives: Suede Sing has no ads, free pitch and range tools in the browser and Suede Pro at $79 once. Compare it and five more apps.",
    },
    sources: [
      { label: "Sing Sharp on the App Store (US)", url: "https://apps.apple.com/app/id772052329" },
      { label: "Sing Sharp on Google Play", url: "https://play.google.com/store/apps/details?id=com.harmonynetwork.singsharp" },
    ],
  },
];

/* ------------------------------------------------------------------ paths --- */

export type ComparisonKind = "vs" | "alternatives";

export function vsSlug(c: Competitor): string {
  return `suede-sing-vs-${c.slug}`;
}

export function alternativesSlug(c: Competitor): string {
  return `${c.slug}-alternatives`;
}

export function vsPath(c: Competitor): string {
  return `${COMPARE_PATH}/${vsSlug(c)}`;
}

export function alternativesPath(c: Competitor): string {
  return `${COMPARE_PATH}/${alternativesSlug(c)}`;
}

/** Every page under /compare/<slug>, in competitor order, vs before alternatives. */
export function comparisonPages(): Array<{ slug: string; kind: ComparisonKind; competitor: Competitor }> {
  return COMPETITORS.flatMap((competitor) => [
    { slug: vsSlug(competitor), kind: "vs" as const, competitor },
    { slug: alternativesSlug(competitor), kind: "alternatives" as const, competitor },
  ]);
}

export function comparisonBySlug(
  slug: string,
): { kind: ComparisonKind; competitor: Competitor } | undefined {
  const page = comparisonPages().find((p) => p.slug === slug);
  return page ? { kind: page.kind, competitor: page.competitor } : undefined;
}

/** "a, b, c and d" */
export function listJoin(items: readonly string[]): string {
  return items.length < 2
    ? items.join("")
    : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/* ------------------------------------------------------------------ copy --- */

/** The direct answer a vs page opens on. */
export function vsAnswer(c: Competitor): string {
  return `Suede Sing is the stronger pick for singers who want to measure and train their voice. It runs in any modern browser with nothing to install, its pitch studio and range test are free with no daily limit, and Suede Pro is ${SUEDE_PRICE_LINE}. ${c.name} is built around ${lowerFirst(c.builtFor)}; its price ${COMPARISONS_AS_OF}: ${c.priceShort}.`;
}

/** The direct answer an alternatives page opens on. */
export function alternativesAnswer(c: Competitor): string {
  return `The top ${c.name} alternative for singing practice is Suede Sing. It runs in Chrome, Safari, Edge or Firefox with nothing to install, scores your pitch note by note, measures your range free and charges ${SUEDE_PRICE_LINE} for Suede Pro. ${listJoin(otherCompetitors(c).map((o) => o.name))} are the other ${c.name} alternatives compared here.`;
}

export function otherCompetitors(c: Competitor): Competitor[] {
  return COMPETITORS.filter((o) => o.slug !== c.slug);
}

function lowerFirst(text: string): string {
  return text[0].toLowerCase() + text.slice(1);
}

/** Questions every vs page answers, then the product-specific one. */
export function vsFaq(c: Competitor): Faq[] {
  return [
    {
      q: `Which is better for singing practice, Suede Sing or ${c.name}?`,
      a: vsAnswer(c),
    },
    {
      q: `How much does ${c.name} cost compared with Suede Sing?`,
      a: `${c.facts.price} Suede Sing has a free plan, and Suede Pro is ${SUEDE_PRICE_LINE}, the price on sing.suedeai.ai/pro.`,
    },
    {
      q: "Is Suede Sing free?",
      a: `Yes. The pitch studio, range test, recorder, metronome, keyboard, drone, voice analyzer, the ${CATALOG_LESSON_COUNT}-lesson voice course and every singer page are free with no daily limit. Guided practice (warmups, ear training, breath drills and song practice) shares ${FREE_DAILY_MINUTES} free minutes a day, and Suede Pro removes that limit.`,
    },
    {
      q: "Does Suede Sing upload my voice?",
      a: "No. Pitch analysis runs in the browser on your own device and microphone audio is not sent to a server. Audio is recorded only when you choose to record a take, and those takes stay on your device.",
    },
    c.vsQuestion,
  ];
}

/** Questions every alternatives page answers. */
export function alternativesFaq(c: Competitor): Faq[] {
  return [
    {
      q: `What is the top alternative to ${c.name} for singing practice?`,
      a: alternativesAnswer(c),
    },
    {
      q: `Is there a free ${c.name} alternative?`,
      a: `Suede Sing has a free plan with no trial that expires. Its pitch studio, range test, recorder and ${CATALOG_LESSON_COUNT}-lesson voice course have no daily limit, and guided warmups, ear training, breath drills and song practice share ${FREE_DAILY_MINUTES} free minutes a day.`,
    },
    {
      q: `Is there a ${c.name} alternative without a subscription?`,
      a: `Suede Sing. Suede Pro is ${SUEDE_PRICE_LINE}: one payment that lifts the daily guided-practice limit and adds more warmups, both books, pitch analysis on recorded takes and progress sync.`,
    },
    {
      q: `Which ${c.name} alternatives work in a web browser?`,
      a: "Suede Sing runs in Chrome, Safari, Edge or Firefox on a phone or a computer, with nothing to install, and analyzes your pitch on your own device.",
    },
  ];
}

/** Questions the /compare hub answers. */
export function hubFaq(): Faq[] {
  return [
    {
      q: "Which singing apps does this page compare?",
      a: `Suede Sing next to ${listJoin(COMPETITORS.map((c) => c.name))}. Each has its own side-by-side page and an alternatives page, with prices checked ${COMPARISONS_AS_OF} and every source linked.`,
    },
    {
      q: "Which singing app can I use free in a browser?",
      a: `Suede Sing. Open sing.suedeai.ai in Chrome, Safari, Edge or Firefox and the pitch studio, range test, recorder and ${CATALOG_LESSON_COUNT}-lesson voice course are free with no daily limit. Guided practice gets ${FREE_DAILY_MINUTES} free minutes a day.`,
    },
    {
      q: "Which singing app has no subscription?",
      a: `Suede Sing. Suede Pro is ${SUEDE_PRICE_LINE}, a single payment rather than a monthly or yearly bill.`,
    },
    {
      q: "How were these comparisons checked?",
      a: `Every competitor fact on these pages comes from that product's own website, help center or app store listing, checked on ${COMPARISONS_CHECKED_LABEL}. Prices change and vary by country and platform, so each page links the source it used.`,
    },
  ];
}

/** Every distinct source, for the hub and llms-full.txt. */
export function allSources(): Source[] {
  const seen = new Map<string, Source>();
  for (const c of COMPETITORS) for (const s of c.sources) seen.set(s.url, s);
  return [...seen.values()];
}

/**
 * The query-ownership register: the clusters of pages on this site that were
 * ranking for half of one query each, with a recorded decision about which page
 * owns the query and what the others answer instead.
 *
 * Why this file exists. Three clusters here were competing with themselves, and
 * they were found by measuring rather than by guessing: the title and
 * description of every indexable page were compared pairwise on content words,
 * and these three sat at the top of the list by a clear margin. Shared
 * vocabulary alone is not competition, so each one was then read to check that
 * the pages really were bidding for one intent.
 *
 * Every entry is a decision rather than an observation. All three are
 * `differentiate`, and that is not a default: every page in them is a working
 * room that a visitor can use, so consolidating would have retired a tool to fix
 * a title. What was actually wrong in each case was the framing, which is what
 * changed. A consolidation is still expressible here, and `retired` plus a
 * permanent redirect in `next.config.ts` is what it would have to carry.
 *
 * `lib/query-ownership.test.tsx` binds the register to the pages. It renders
 * each one and fails when a recorded scope line is not printed, when a page
 * stops linking to the page it hands the other question to, or when two pages in
 * a cluster carry descriptions that could be swapped without anyone noticing.
 */

export type OwnershipDecision = "differentiate" | "consolidate";

export interface OwnedPage {
  /** Route path, as the sitemap spells it. */
  href: string;
  /** The question this page is now the only page on the site answering. */
  question: string;
  /**
   * A sentence the page prints verbatim, so a visitor arriving from search is
   * told which of the cluster's questions they landed on. Plain prose, no
   * interpolation, so the rendered HTML can be searched for it.
   */
  scopeLine: string;
  /**
   * A phrase that must appear in this page's description and must not appear in
   * any sibling's. Metadata is where a differentiation is faked most cheaply, so
   * the distinguishing phrase is recorded rather than assumed.
   */
  descriptionMark: string;
}

export interface QueryCluster {
  id: string;
  /** The query the pages were splitting between them. */
  query: string;
  decision: OwnershipDecision;
  /**
   * The anchor page first. Every other page in the cluster has to link to the
   * anchor, and the anchor has to link to every other page, so the split is
   * navigable in both directions rather than asserted in metadata.
   */
  pages: readonly OwnedPage[];
  /** Set on a `consolidate` entry: the URL that now redirects. */
  retired?: string;
  reason: string;
}

export const QUERY_OWNERSHIP: readonly QueryCluster[] = [
  {
    id: "rangeTest",
    query: "vocal range test",
    decision: "differentiate",
    pages: [
      {
        href: "/range",
        question: "Can I find out my range right now, in this browser?",
        scopeLine:
          "This is the test itself, free in the browser and with nothing to install.",
        descriptionMark: "needs no signup",
      },
      {
        href: "/voice",
        question: "Where do I get the Suede Voice app for my phone?",
        scopeLine: "This page is the app download rather than the test itself.",
        descriptionMark: "Download Suede Voice",
      },
    ],
    reason:
      "The measured worst case on this site. /voice carried the store name, 'Suede Voice: Vocal " +
      "Range Test', as its title, and /range carried 'Free Vocal Range Test', so the two pages " +
      "competed on the site's single most valuable query while answering different intents: one " +
      "visitor wants to take a test now and the other wants an app on a phone. The body of /voice " +
      "already explained the split and linked across; nothing in either title or description did. " +
      "The test keeps the query. The app page keeps the brand and now leads with the install, " +
      "which is what someone searching for it by name is after anyway.",
  },
  {
    id: "famousRanges",
    query: "famous singers vocal ranges",
    decision: "differentiate",
    pages: [
      {
        href: "/singers",
        question: "What is this singer's cited range, and how does mine compare?",
        scopeLine:
          "This page is the chart: every cited range on one keyboard, filterable, with your own range overlaid on top of them.",
        descriptionMark: "on one keyboard",
      },
      {
        href: "/atlas",
        question: "How is that voice built, and what would borrowing from it cost me?",
        scopeLine: "This is the written study rather than the chart.",
        descriptionMark: "voice by voice",
      },
    ],
    reason:
      "A reference chart and a book about the same voices, both opening on the same six words. " +
      "They are genuinely two pages: one answers a lookup in a second and the other is eighty " +
      "thousand words of argument, and a reader wanting the figure does not want the book. " +
      "Consolidating either into the other would have been absurd. What was missing was each page " +
      "saying which it is, near the top, where a visitor from search actually lands.",
  },
  {
    id: "practiceTools",
    query: "singing practice tools",
    decision: "differentiate",
    pages: [
      {
        href: "/tools",
        question: "Where are the metronome, the keyboard and the drone?",
        scopeLine:
          "This tab is the metronome, the keyboard and the drone. The recorder and the spectrogram are separate rooms with pages of their own,",
        descriptionMark: "an on-screen keyboard",
      },
      {
        href: "/recorder",
        question: "Can I cut a take, compare two and keep the good one?",
        scopeLine:
          "This is the take recorder: one room with one job, which is cutting a take, comparing two of them and keeping the ones worth keeping.",
        descriptionMark: "voice recorder for singers",
      },
      {
        href: "/analyze",
        question: "What does my own voice look like as harmonics?",
        scopeLine: "This is the spectrogram room rather than the tools console:",
        descriptionMark: "live spectrogram",
      },
    ],
    reason:
      "A hub bidding for its own leaves' queries. The tools tab absorbed the recorder and the " +
      "spectrogram when the header shrank, and its title and description then enumerated both: " +
      "'Metronome, Keyboard, Drone, Recorder', and a description naming the spectrogram analyzer. " +
      "So the hub competed with two pages it links to and could not outrank either, while diluting " +
      "its own claim on the console modules. The tab now claims the three modules it contains, and " +
      "the two rooms keep the queries that name them. The cards on the tab already linked both, so " +
      "nothing about discovery changed.",
  },
];

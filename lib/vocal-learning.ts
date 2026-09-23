export interface VocalLearningPath {
  title: string;
  need: string;
  href: string;
  action: string;
}

/**
 * Six broad questions, each handed to the existing page that can answer it.
 *
 * /learn is a map, not a replacement for these pages. Keeping this list in one
 * place lets the visible cards and ItemList schema describe the same routes.
 */
export const VOCAL_LEARNING_PATHS: readonly VocalLearningPath[] = [
  {
    title: "Find your vocal range",
    need: "Measure your lowest and highest comfortable notes, then use the result as a starting point for songs and warmups.",
    href: "/range",
    action: "Take the free range test",
  },
  {
    title: "Sing more in tune",
    need: "See the note and cents error as you sing, then train the intervals your ear and voice keep missing.",
    href: "/studio",
    action: "Open the pitch studio",
  },
  {
    title: "Warm up your voice",
    need: "Follow short, guided vocal exercises that play the target, count you in, and score each note.",
    href: "/warmups",
    action: "Start a guided warmup",
  },
  {
    title: "Build breath control",
    need: "Practice a steady release with timed breathing drills and a microphone-based sustain test.",
    href: "/breath",
    action: "Train breath support",
  },
  {
    title: "Practice a song",
    need: "Learn a melody, transpose it toward your comfortable range, and isolate the phrases that need work.",
    href: "/songs",
    action: "Choose a practice song",
  },
  {
    title: "Understand your voice",
    need: "Learn what range, tessitura, voice type, chest voice, head voice, mixed voice, falsetto, and passaggio mean.",
    href: "/glossary",
    action: "Read the vocal glossary",
  },
] as const;

export interface VocalLearningFaq {
  question: string;
  answer: string;
}

/** Visible on /learn and emitted verbatim in its FAQPage node. */
export const VOCAL_LEARNING_FAQ: readonly VocalLearningFaq[] = [
  {
    question: "Can anyone learn to sing?",
    answer:
      "Most people can improve pitch matching, breath control, coordination, and consistency through regular practice. Voices start in different places and develop at different rates, so measure progress against your own recordings and scores rather than somebody else's range.",
  },
  {
    question: "What should a beginner practice first?",
    answer:
      "Start with five quiet minutes of humming, lip trills, or easy scales; spend five minutes matching comfortable notes; then sing one short song section and record one take. Accuracy and ease come before volume or extreme notes.",
  },
  {
    question: "How long should I practice singing each day?",
    answer:
      "A focused fifteen to twenty minutes is enough for a useful beginner session: warm up, work on one measurable skill, and apply it to a song. Stop earlier if the voice feels tired, scratchy, painful, or less coordinated than when you began.",
  },
  {
    question: "How do I find my voice type?",
    answer:
      "Measure your comfortable low and high notes, then notice the smaller band where singing feels easiest. A range test can suggest a nearby category, but voice type also depends on tessitura, timbre, weight, and register transitions, so treat the result as a starting point rather than a verdict.",
  },
  {
    question: "How can I increase my vocal range?",
    answer:
      "Warm up consistently, approach the edge through gentle slides and scales, and stop before the sound turns pushed or unstable. Track notes you can repeat comfortably; a one-off extreme is not the same as usable range.",
  },
  {
    question: "What is the difference between vocal training and a vocal warmup?",
    answer:
      "A warmup prepares the voice for the work ahead. Vocal training changes a specific skill over repeated sessions: pitch accuracy, register coordination, breath control, endurance, or song technique. A warmup can contain useful exercises without being the whole training plan.",
  },
] as const;


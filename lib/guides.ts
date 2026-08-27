import type { GuideContent } from "@/components/guide";

/**
 * The explanatory copy under each practice room.
 *
 * Written to be true first and findable second. Every claim here is either
 * about how the tool behaves (checkable by using it) or standard vocal
 * pedagogy stated without embellishment — no invented statistics, no
 * physiological claims the app can't stand behind, no "studies show".
 */

export const RANGE_GUIDE: GuideContent = {
  path: "/range",
  pageName: "Free Vocal Range Test and Voice Type Finder",
  heading: "What a vocal range test actually measures",
  answer:
    "Your vocal range is the span between the lowest and highest notes you can sing with a clear, usable tone. This online range test listens as you slide down and then up, then reports both notes, the size of the span, and the voice type that overlaps it most closely.",
  body: [
    "Two singers with the same range can sound nothing alike because range does not show where each voice feels comfortable. The notes at the extremes are often not notes a singer would perform repeatedly. A range test gives you a boundary and a baseline, not a grade.",
    "The result can move with fatigue, illness, the time of day, the room, microphone position, and whether you warmed up. Test under similar conditions when you want to compare one result with another.",
    "Voice type, including soprano, tenor, baritone, and the other common labels, depends on comfortable range, tone, and register behavior as well as the two extremes. This test can show which conventional range band overlaps your result. It cannot diagnose or permanently classify your voice.",
  ],
  safety: {
    heading: "Test the notes you can sing without forcing",
    body:
      "Use a comfortable volume and stop if a note causes pain, strain, or persistent hoarseness. Suede Sing is a practice and measurement tool, not a medical assessment. A sudden or lasting loss of range belongs with a qualified voice professional or clinician.",
    sources: [
      {
        href: "https://www.nidcd.nih.gov/health/taking-care-your-voice",
        label: "NIDCD: Taking Care of Your Voice",
        note: "voice-health warning signs and guidance for healthy voice use",
      },
      {
        href: "https://www.asha.org/practice-portal/clinical-topics/voice-disorders/",
        label: "ASHA: Voice Disorders",
        note: "clinical context for vocal range, effort, fatigue, and evaluation",
      },
    ],
  },
  howTo: {
    name: "How to test your vocal range",
    intro:
      "The test runs in the browser with your microphone. It takes about two minutes, and nothing you sing is uploaded or recorded.",
    steps: [
      {
        title: "Warm up first, or note that you didn't",
        body: "A short, gentle warmup makes the test easier to repeat under similar conditions. If you test without warming up, record that context and compare it only with another test taken the same way.",
      },
      {
        title: "Allow the microphone",
        body: "Grant mic access when the browser asks. Pitch detection runs on your device; audio is never sent to a server. Use a quiet room, because background noise is what makes the detector hesitate. If nothing registers while you sing, your input level is the first thing to raise — automatic gain is switched off here so the signal being measured is the one you produced.",
      },
      {
        title: "Hold a comfortable note",
        body: "Start in the middle of your voice, on a vowel you can sustain — 'ah' or 'oo'. Sing it out rather than under your breath: a note at talking volume often sits below what the microphone can measure. This gives the detector a stable reading to anchor on before you move to the extremes.",
      },
      {
        title: "Slide down to your floor",
        body: "Descend by step or on a slow slide until the tone turns to croak, rattle, or air. The last note you can hold with a clear sung pitch is your low. Do not count fry just to extend the number.",
      },
      {
        title: "Slide up to your ceiling",
        body: "Come back to the middle, then climb the same way. Let the voice move into head voice or falsetto instead of forcing a heavier sound upward. Stop before the note causes pain or strain.",
      },
      {
        title: "Read the result and save it",
        body: "You get your low note, your high note, the span in octaves, and the voice type that span suggests. Saving it gives you a first data point — the number only means something once you have several taken the same way.",
      },
    ],
  },
  beginner: {
    heading: "Your first number is a starting line, not a verdict",
    body: "Your first result reflects what you can coordinate today under the conditions of this test. Technique, microphone setup, and how honestly you stop at the edges all affect the number.",
    points: [
      "Do not compare your first test to a famous singer's published range; those figures often collect extreme notes across years of recordings",
      "If the top of your range feels like a wall, you are probably holding chest voice too high; let the tone go light and airy and keep climbing",
      "Retest after several practice sessions instead of chasing a larger number in the same sitting",
      "Judge useful range by the notes you can sing clearly and repeatably, not by one extreme sound",
    ],
  },
  advanced: {
    heading: "Track the range you can use, not the one you can reach",
    body: "Once the extremes are stable, the interesting number is the working range — the span where tone stays even and you would happily perform. That is the part that grows with training, and it grows from the middle outward.",
    points: [
      "Log the test under fixed conditions (same time, same warmup) so the trend is signal rather than schedule",
      "Watch where the tone changes character on the way up — that passaggio moving, or smoothing, is a better progress marker than a new top note",
      "Compare your span against the singer library to find voices built like yours, then study how they handle their upper middle",
      "Suede Pro charts every test over time, so the range line and your accuracy trend sit on the same page",
    ],
  },
  faq: [
    {
      q: "How do I find my vocal range online?",
      a: "Start the free test, allow microphone access, hold one comfortable note, then slide down and up while the pitch detector listens. Suede Sing marks the lowest and highest clear notes it hears, shows the span on a keyboard, and gives the conventional voice-type band that overlaps it most closely.",
    },
    {
      q: "How high can I sing?",
      a: "As high as you can hold a clear, comfortable tone — that ceiling is exactly what this test finds. Most voices reach further than they think once they let go of chest weight and allow head voice or falsetto to carry the top. Test it, then compare your ceiling against the famous voices in the singer library.",
    },
    {
      q: "How many octaves should I have?",
      a: "There is no required octave count for a useful singing voice. A smaller span that stays clear, comfortable, and repeatable is more useful than a wider result built from strained or one-off notes. Song choice and transposition matter more than matching someone else's number.",
    },
    {
      q: "Does vocal fry count as part of my range?",
      a: "Do not count a croak or fry sound if your goal is a usable singing range. Record the lowest note you can hold with a clear, repeatable sung pitch instead.",
    },
    {
      q: "Should falsetto count in my range?",
      a: "For a range measurement, yes — falsetto and head voice are genuine parts of what you can sing, and excluding them understates the instrument. If you are asked for your range for a specific style or an audition, say which registers the figure includes.",
    },
    {
      q: "Can I increase my vocal range?",
      a: "The ends usually move some with training, mostly because register transitions get easier rather than because the vocal folds change. The larger and faster gain is in the range you can use well: notes that were reachable but unreliable become dependable.",
    },
    {
      q: "Why is my range different every time I test?",
      a: "Fatigue, illness, the time of day, warming up, room noise, and microphone position can all change what the test hears. One result is a snapshot. For a useful comparison, retest under similar conditions and stop at the same standard of clear, comfortable tone.",
    },
  ],
  related: [
    {
      href: "/warmups",
      label: "Warmups",
      note: "Warm the voice before testing — a cold range test reads low.",
    },
    {
      href: "/singers",
      label: "Famous ranges",
      note: "See which well-known voices share your span.",
    },
    {
      href: "/studio",
      label: "Pitch studio",
      note: "Practice holding the notes at the edges of your range.",
    },
    {
      href: "/glossary",
      label: "Glossary",
      note: "Fry, falsetto, tessitura — the words on this result, defined.",
    },
  ],
};

export const WARMUPS_GUIDE: GuideContent = {
  path: "/warmups",
  heading: "Why singers warm up, and what a warmup is doing",
  answer:
    "A vocal warmup gradually brings blood flow, breath coordination and register transitions online before you ask the voice for anything difficult. It is closer to a pianist's scales than to a runner's stretching: the point is coordination, not loosening. Ten minutes of gentle, connected sound does most of the work.",
  body: [
    "The exercises that show up in every teacher's warmup — lip trills, hums, sirens, five-note scales — share a design. They keep the tone quiet, keep the airflow steady, and move pitch gradually so the voice changes register without a jolt. That is why they are boring, and why the boring version works.",
    "Warming up is also the cheapest injury prevention available to a singer. Most voice strain comes from asking for volume or height before the mechanism is coordinated to produce it, which pushes a singer into squeezing rather than supporting. A warm voice reaches the same note with less force.",
    "Each warmup here plays a short melody, then listens while you sing it back, scoring pitch accuracy in real time. When you clear a pattern, it transposes up a semitone and asks again, so the exercise climbs with you instead of sitting at one fixed height.",
  ],
  howTo: {
    name: "How to warm up your voice before singing",
    intro:
      "A useful warmup runs about ten minutes and stays quiet throughout. If you are getting loud or reaching, the warmup has turned into practice.",
    steps: [
      {
        title: "Start with breath, not sound",
        body: "Half a minute of slow, low breathing before any note. Let the belly move rather than the shoulders. This sets the support you will use for everything after it.",
      },
      {
        title: "Hum or lip trill through the middle",
        body: "Begin with closed, gentle sound in the comfortable middle of your voice. Semi-occluded sounds — hums, lip trills, straw phonation — reduce the effort needed to make a clear tone, which is exactly what a cold voice needs.",
      },
      {
        title: "Add gentle sirens",
        body: "Slide slowly from low to high and back on an 'ng' or a hum. Sirens take the voice through its register transitions without letting it stop and brace at any one point.",
      },
      {
        title: "Move to open vowels on five-note scales",
        body: "Now open the sound. Sing the pattern back, matching pitch as closely as you can; the score tells you where you drifted. Keep the volume moderate — accuracy first, size later.",
      },
      {
        title: "Climb by semitone and stop early",
        body: "Let each cleared pattern transpose up. Stop climbing while it still feels easy. Ending a warmup at the edge of your range is how a warmup becomes fatigue.",
      },
      {
        title: "Finish where you started",
        body: "Come back down through the middle for a minute of quiet sound. The voice you finish the warmup with is the one you start singing with.",
      },
    ],
  },
  beginner: {
    heading: "Ten quiet minutes beats twenty loud ones",
    body: "The most common beginner mistake is treating a warmup as a performance — full volume, top of the range, straight in. That fatigues the voice before the real practice starts.",
    points: [
      "Keep every warmup quieter than you think you need to; volume is the last thing to add",
      "If a pattern is uncomfortable at the top, stop climbing rather than pushing through it",
      "Lip trills and hums feel silly and are the single most useful thing in the list",
      "Warm up before the range test, before song practice, and before recording anything you plan to keep",
    ],
  },
  advanced: {
    heading: "Aim the warmup at the thing you're about to do",
    body: "Once the basic routine is automatic, the warmup becomes preparation for a specific demand — a belted chorus, a long legato line, a session where you need consistency over an hour.",
    points: [
      "Warm toward the register your material actually sits in rather than sweeping the whole range every time",
      "Use the per-pattern accuracy scores to find the interval or vowel that reliably drifts, then drill that shape",
      "Pay attention to the semitone at which accuracy starts dropping — that is usually a passaggio, not a limit",
      "Pro warmup packs add genre and voice-type routines: belt prep, head-voice builders, morning resets",
    ],
  },
  faq: [
    {
      q: "How long should a vocal warmup take?",
      a: "About ten minutes for ordinary practice, and fifteen to twenty before a demanding performance. Longer is not better — past a point you are spending voice rather than preparing it.",
    },
    {
      q: "Do I need to warm up before every practice session?",
      a: "Before anything that asks for range, volume or accuracy, yes. Quiet, mid-range noodling is closer to a warmup than to a demand, so it can double as one.",
    },
    {
      q: "What is a lip trill and why do teachers keep asking for it?",
      a: "You blow air through loosely closed lips so they flutter while you make a pitch. The partial closure of the mouth makes it easier for the vocal folds to vibrate efficiently, so you get clear tone at low effort — useful for a cold voice, and for finding a smooth transition between registers.",
    },
    {
      q: "Should I warm down after singing?",
      a: "A couple of minutes of quiet humming or gentle descending slides after heavy singing helps the voice settle. It matters most after a long, loud session, which is exactly when singers skip it.",
    },
    {
      q: "Can I warm up without making noise?",
      a: "Mostly, yes. Hums, lip trills and straw phonation are quiet enough for thin walls, and they are the effective part of the routine anyway. Silent breathing exercises prepare the support but do not warm the voice itself.",
    },
  ],
  related: [
    {
      href: "/studio",
      label: "Pitch studio",
      note: "Take the warm voice into free pitch practice.",
    },
    {
      href: "/breath",
      label: "Breath control",
      note: "Build the support the warmup assumes.",
    },
    {
      href: "/range",
      label: "Range test",
      note: "Test warm for a number that reflects your real range.",
    },
    {
      href: "/glossary",
      label: "Glossary",
      note: "Siren, lip trill, passaggio — what these exercises are named after.",
    },
  ],
};

export const BREATH_GUIDE: GuideContent = {
  path: "/breath",
  heading: "Breath support, in plain terms",
  answer:
    "Breath support is the steady, controlled release of air that keeps a sung note even in pitch and volume. Singers work on it because almost every audible problem in a phrase — wavering pitch, a note that thins at the end, running out mid-line — traces back to how the air was managed rather than to the throat.",
  body: [
    "The mechanics are unglamorous. You breathe low, so the diaphragm descends and the ribs stay open rather than the shoulders lifting. Then you resist the natural collapse of the ribcage while you sing, so air leaves at the rate the note needs instead of all at once. That resistance is the 'support' in breath support.",
    "It is trainable in a way that most vocal qualities are not, because you can measure it directly: how long can you sustain an even tone on one breath, and does the pitch stay put while you do. Both numbers move with practice, and both are visible without a teacher in the room.",
    "This room runs two kinds of exercise. Timed breathing patterns build the habit of a low, unhurried inhale and a controlled exhale. The mic-based sustain test then checks the result — you hold a note while the app watches how long the tone lasts and how steady the pitch stays.",
  ],
  howTo: {
    name: "How to practice breath support for singing",
    intro:
      "These exercises need no equipment beyond the mic for the sustain test. Do them seated upright or standing, never lying down, and stop if you get lightheaded.",
    steps: [
      {
        title: "Find the low breath",
        body: "Hand on the belly, breathe in through the nose for four counts. The hand should move out; the shoulders should not rise. If they do, you are breathing high and the support will not be there.",
      },
      {
        title: "Practice the slow release",
        body: "Exhale on a quiet, steady hiss for as long as you can hold it even. Even matters more than long — a hiss that starts strong and fades has told you exactly what your phrases will do.",
      },
      {
        title: "Keep the ribs open as you sing",
        body: "The instinct at the end of a phrase is to let the ribcage collapse to squeeze the last air out. Resisting that, so the ribs stay wide while the belly does the work, is the actual skill.",
      },
      {
        title: "Run the sustain test",
        body: "Sing one comfortable note and hold it while the app times the tone and watches the pitch. You get a duration and a steadiness reading, which is a far more honest measure than counting in your head.",
      },
      {
        title: "Add pitch to the demand",
        body: "Repeat the sustain higher and lower in your range. Support that holds up in the middle often gives out at the top, and finding where it gives out tells you what to practice.",
      },
      {
        title: "Practice short and often",
        body: "Five focused minutes daily builds this faster than a long weekly session, and it avoids the dizziness that comes from over-breathing in one sitting.",
      },
    ],
  },
  beginner: {
    heading: "If a phrase runs out of air, start here",
    body: "Beginners usually take a big, high, shoulder-lifting breath and then spend it in the first two seconds. The fix is a smaller, lower breath released more slowly, which feels like doing less.",
    points: [
      "Breathe low and quietly — a noisy gasp is a high breath, and a high breath does not support",
      "A steady twenty-second hiss is a reasonable early target; the number matters less than the evenness",
      "Never sing to the very bottom of your air; the last of a breath is where tone and pitch both fall apart",
      "Stop immediately if you feel lightheaded — that is over-breathing, and rest fixes it",
    ],
  },
  advanced: {
    heading: "Support the phrase you actually have to sing",
    body: "Past the basics, breath work stops being about maximum duration and becomes about distribution: getting the right amount of air to the right part of a line, including quick catch-breaths mid-phrase.",
    points: [
      "Practice sustains at the top of your working range, where support fails first and matters most",
      "Work on the fast, low catch-breath — most real songs never give you four counts to inhale",
      "Watch pitch steadiness rather than duration; a long note that drifts flat is a support problem, not a pitch problem",
      "Map your sustain length against dynamics — the same note loud spends air several times faster",
    ],
  },
  faq: [
    {
      q: "How long should a singer be able to hold a note?",
      a: "Comfortably sustaining an even tone for fifteen to twenty-five seconds covers essentially all repertoire, and trained singers often exceed that. Steadiness of pitch and volume is worth more than raw duration — a long note that sags is not a usable one.",
    },
    {
      q: "What is diaphragmatic breathing?",
      a: "It describes a low breath in which the diaphragm descends and the belly and lower ribs expand, rather than a high breath that lifts the chest and shoulders. You cannot feel the diaphragm directly — it has no sensory nerves for this — so singers work from the belly and rib movement they can feel.",
    },
    {
      q: "Why do I run out of breath halfway through a phrase?",
      a: "Usually the air is leaving too fast at the start rather than there being too little of it. Breathy tone, a collapsing ribcage, or pushing for volume all spend the breath early. Recording the phrase and listening to where the tone thins usually locates it.",
    },
    {
      q: "Do breathing exercises help if I'm not singing?",
      a: "They build the coordination, which transfers — but breath work is preparation, not a substitute for singing. The support only becomes automatic when you practice it while making the sound you actually want.",
    },
    {
      q: "Is it normal to feel dizzy during breathing exercises?",
      a: "It is common and it is a signal to stop. Dizziness means you are moving more air than your body needs. Rest until it passes, then resume with smaller breaths and longer gaps.",
    },
  ],
  related: [
    {
      href: "/warmups",
      label: "Warmups",
      note: "Warm the voice before asking it for long phrases.",
    },
    {
      href: "/studio",
      label: "Pitch studio",
      note: "Watch pitch steadiness on a sustained note.",
    },
    {
      href: "/songs",
      label: "Song practice",
      note: "Apply support to real phrases with real breath points.",
    },
    {
      href: "/glossary",
      label: "Glossary",
      note: "Support, steadiness and the rest of the breath vocabulary.",
    },
  ],
};

export const EAR_GUIDE: GuideContent = {
  path: "/ear-training",
  heading: "What ear training does for a singer",
  answer:
    "Ear training is practice at hearing pitch relationships accurately and reproducing them. For a singer it is the other half of pitch accuracy: your voice can only land on a note you can hear in advance, so a sharper ear directly produces better intonation.",
  body: [
    "Singing in tune is not primarily a throat skill. The sequence is hear the target, predict the muscular gesture that produces it, then check the result against what you meant. Training the first link improves the whole chain, which is why singers who drift flat often improve faster from interval work than from more singing.",
    "Interval recognition is the core drill: hear two notes and name the distance between them. Pitch matching is the singer's version — hear a note, sing it back, and get told how close you landed in cents. Melody playback extends both to short phrases, which is where memory joins the skill.",
    "Progress here is unusually measurable. Accuracy on intervals and average deviation on pitch matching both improve week over week in a way that is visible long before it is audible to you in a song.",
  ],
  howTo: {
    name: "How to train your ear as a singer",
    intro:
      "Short daily sessions beat long weekly ones — this is memory training, and memory consolidates with repetition and sleep rather than with duration.",
    steps: [
      {
        title: "Start with pitch matching, not intervals",
        body: "Hear one note, sing it back. The app measures how far off you were. This is the most direct singer's drill, because it trains exactly the loop you use on every sung note.",
      },
      {
        title: "Learn intervals from the bottom up",
        body: "Add one interval at a time rather than shuffling all twelve. Octave, fifth and fourth first: they are the most distinct, and they anchor the ones you add later.",
      },
      {
        title: "Attach each interval to a reference",
        body: "Most singers learn intervals by hooking them to the opening of a song they know well. Any tune works as long as it is genuinely familiar to you — the reference has to be automatic.",
      },
      {
        title: "Sing the interval, don't just identify it",
        body: "Naming an interval and producing one are different skills, and only the second improves your singing. When you get one right, sing it back before moving on.",
      },
      {
        title: "Move to short melodies",
        body: "Hear three to five notes and sing them back. This adds pitch memory to pitch recognition, and it is much closer to what a song demands than an isolated interval.",
      },
      {
        title: "Keep sessions short and daily",
        body: "Ten minutes a day outperforms an hour on Sunday. Ear training is the clearest case in vocal practice where frequency beats volume.",
      },
    ],
  },
  beginner: {
    heading: "'Tone deaf' is almost never the problem",
    body: "Genuine congenital amusia is rare. Most people who believe they cannot hear pitch have simply never practiced matching one, and their accuracy improves quickly once they start getting immediate feedback.",
    points: [
      "Begin with pitch matching in the middle of your range, where your voice is most controllable",
      "If you consistently sing under the note, try starting the sound slightly higher than feels right and let it settle",
      "Use octaves and fifths until they are automatic before adding the smaller intervals",
      "Getting it wrong and being told immediately is the mechanism; wrong answers are the practice, not a failure of it",
    ],
  },
  advanced: {
    heading: "Push toward the intervals that stay slippery",
    body: "Most trained ears have a distinct weak set — often the tritone, the minor sixth, or major versus minor sevenths under time pressure. Drilling the whole set equally leaves those exactly where they are.",
    points: [
      "Use the per-interval accuracy breakdown to find your weak pairs, then practice only those",
      "Add descending intervals — they are meaningfully harder than ascending ones and get skipped",
      "Shorten your response time; recognition that takes four seconds is not fast enough to use mid-phrase",
      "Move to longer melodies to train pitch memory, which is what carries you through a line without a reference tone",
    ],
  },
  faq: [
    {
      q: "Can you actually learn perfect pitch as an adult?",
      a: "Almost certainly not in the true sense — absolute pitch appears to require acquisition in early childhood. Relative pitch, which is the ability that actually matters for singing in tune, is trainable at any age and improves steadily with practice.",
    },
    {
      q: "How long does ear training take to work?",
      a: "Measurable improvement on pitch matching usually shows within a few weeks of daily ten-minute sessions. Carrying it into songs without thinking about it takes longer, because that requires the skill to become automatic rather than merely available.",
    },
    {
      q: "I'm tone deaf. Is there any point?",
      a: "If you can tell a siren rising from a siren falling, you are not tone deaf in the clinical sense, and your pitch matching will improve with feedback. What most people call tone deafness is an untrained loop between hearing a pitch and producing it.",
    },
    {
      q: "Should I train intervals or just sing more?",
      a: "Both, but they fix different things. Singing more builds control of the instrument; ear training improves the target you are aiming at. Singers who drift flat despite plenty of practice usually gain more from the ear work.",
    },
    {
      q: "Does ear training help with harmonies?",
      a: "Directly. Holding a harmony line means keeping your interval against a moving part you can hear, which is interval recognition applied in real time. Singers who struggle to hold a harmony usually improve fastest through interval drills.",
    },
  ],
  related: [
    {
      href: "/studio",
      label: "Pitch studio",
      note: "Take the trained ear into live pitch practice.",
    },
    {
      href: "/warmups",
      label: "Warmups",
      note: "Warmups score the same pitch accuracy on real patterns.",
    },
    {
      href: "/tools",
      label: "Tools",
      note: "A drone gives you a reference pitch to sing against.",
    },
    {
      href: "/glossary",
      label: "Glossary",
      note: "Interval, semitone, cent — the units these drills count in.",
    },
  ],
};

export const SONGS_GUIDE: GuideContent = {
  path: "/songs",
  heading: "Practicing songs with pitch feedback",
  answer:
    "Song practice is where technique either shows up or does not. Singing a known melody with live pitch feedback shows you exactly which notes and which phrases drift, which is information that no amount of listening back to a recording gives you as precisely.",
  body: [
    "Exercises isolate one skill at a time. A song asks for all of them at once, plus words, rhythm, and breath points that were decided by whoever wrote it. That is why a singer can score well on warmup patterns and still lose the pitch in a chorus — the demands stack.",
    "The most common cause of a song sitting badly is key rather than skill. A melody written for a voice higher or lower than yours will park its most important notes right at your weakest point. Transposing it is not cheating; it is what every professional does, and it is the difference between a phrase you can perform and one you can merely survive.",
    "Each melody here is transposed automatically into a key that suits your measured range, and your pitch is scored against the target notes as you sing. The result marks which phrases held and which came apart.",
  ],
  howTo: {
    name: "How to practice a song properly",
    intro:
      "The efficient order is deliberately not 'sing it top to bottom repeatedly' — that mostly rehearses your mistakes.",
    steps: [
      {
        title: "Get the key right first",
        body: "Run the range test so the app can transpose into a key that suits your voice. A song in the wrong key will make every other problem look worse than it is.",
      },
      {
        title: "Learn the melody without words",
        body: "Sing it on a single vowel or a hum first. Words add consonants, jaw movement and meaning; stripping them out lets you fix pitch before anything else can interfere.",
      },
      {
        title: "Isolate the phrase that breaks",
        body: "The score shows you where accuracy fell. Practice that phrase by itself — a dozen focused repetitions of four bars beats a dozen run-throughs of the whole song.",
      },
      {
        title: "Slow the hard part down",
        body: "Take the difficult passage at a speed where you can hit every note, then return it to tempo gradually. Practicing it fast and wrong makes wrong the thing you know.",
      },
      {
        title: "Plan the breaths",
        body: "Decide where you breathe, and mark it. Unplanned breathing is where phrases collapse, and the decision is best made deliberately rather than in the moment.",
      },
      {
        title: "Add the words back and run it",
        body: "Only after the melody is secure. Then record a take and listen — the recording catches what you cannot hear while singing.",
      },
    ],
  },
  beginner: {
    heading: "Pick songs that sit in your middle",
    body: "The instinct is to practice the song you most want to sing, which is usually one built for a voice unlike yours. Starting in a comfortable range builds the technique that eventually makes the hard song possible.",
    points: [
      "Choose melodies with a narrow range and stepwise motion before ones with big leaps",
      "If a chorus is a struggle every time, transpose it down rather than pushing to reach it",
      "Sing along with the guide melody before singing without it",
      "Do not judge yourself against a recorded vocal — those are comped from multiple takes and processed",
    ],
  },
  advanced: {
    heading: "Practice the transitions, not the song",
    body: "Experienced singers usually lose accuracy at specific structural moments — the leap into a chorus, the phrase that sits across a register break, the long note at the end of a bridge. Those moments are the practice.",
    points: [
      "Work the two bars either side of a register transition rather than the phrase as a whole",
      "Try the same song a semitone up and down to find where the melody sits best against your passaggio",
      "Use the take recorder's A/B compare to check whether a change actually improved anything",
      "Pro tracks pitch accuracy per note across sessions, so a phrase's history is visible rather than remembered",
    ],
  },
  faq: [
    {
      q: "Should I transpose a song to fit my voice?",
      a: "Yes — professionals do it routinely, and the original key is simply the key that suited whoever recorded it. A melody that sits well in your range lets you sing musically instead of spending everything on reaching the notes.",
    },
    {
      q: "Why can I sing a song alone but not with the track?",
      a: "Singing alone lets you drift into a key that suits you without noticing. Against a fixed track, the pitch reference is unforgiving. That gap is normal, and it is exactly what practicing with pitch feedback closes.",
    },
    {
      q: "How long does it take to learn a song properly?",
      a: "For a melody in a comfortable key, a few focused sessions gets it secure. Songs sitting at the edge of your range take considerably longer, because you are building technique at the same time as learning the tune.",
    },
    {
      q: "Is it bad to sing along to recordings?",
      a: "It is useful for style and phrasing but poor for measuring accuracy, because the original vocal masks your own pitch. Alternate: sing with it to learn the shape, then sing without it to find out what you actually know.",
    },
    {
      q: "Why do I sound flat only on high notes?",
      a: "Almost always support and register rather than hearing. As the pitch rises the note needs more consistent airflow, and a voice dragging chest weight upward tends to land just under. It usually improves from breath work and letting the tone lighten near the transition.",
    },
  ],
  related: [
    {
      href: "/range",
      label: "Range test",
      note: "Set your range so songs transpose into the right key.",
    },
    {
      href: "/recorder",
      label: "Take recorder",
      note: "Record the take and hear what you can't hear while singing.",
    },
    {
      href: "/breath",
      label: "Breath control",
      note: "Fix the phrases that run out of air.",
    },
    {
      href: "/glossary",
      label: "Glossary",
      note: "Transposition, tessitura, belt — the words behind song fit.",
    },
  ],
};

export const RECORDER_GUIDE: GuideContent = {
  path: "/recorder",
  heading: "Why singers record themselves",
  answer:
    "You cannot hear your own voice accurately while producing it — bone conduction, and the fact that you are busy singing, both get in the way. Recording a take and listening back is the only reliable way to hear what an audience hears, and it is the fastest feedback loop available to a singer without a teacher.",
  body: [
    "The first playback is uncomfortable for nearly everyone, and the discomfort is not about quality. Your recorded voice lacks the low-frequency reinforcement your skull adds when you speak or sing, so it sounds thinner and higher than the version you have heard your whole life. That reaction fades with exposure and it says nothing about the singing.",
    "What recording gives you that live feedback cannot is comparison over time. A take from four weeks ago against one from today is evidence, and it usually shows improvement that felt invisible day to day.",
    "Takes here stay on your device — nothing is uploaded. You can play any two back to back to compare them directly, which is far more informative than remembering how the last one felt.",
  ],
  howTo: {
    name: "How to record and review a vocal take",
    intro:
      "The point is comparison, not production quality. A phone-grade microphone is entirely sufficient for hearing what you need to hear.",
    steps: [
      {
        title: "Record the same material each time",
        body: "Pick one phrase or exercise as your benchmark. Comparing different material tells you about the material; comparing the same material tells you about your voice.",
      },
      {
        title: "Keep the setup consistent",
        body: "Same room, same distance from the mic, same rough volume. Changing the recording conditions between takes makes the comparison meaningless.",
      },
      {
        title: "Sing it as you would perform it",
        body: "A cautious take gives you a cautious recording to study. Record the version you actually want to sing, mistakes included.",
      },
      {
        title: "Listen once for the whole thing",
        body: "First playback, no notes — just impression. Where does it hold, where does it wander, does it sound like it means anything.",
      },
      {
        title: "Listen again for one specific thing",
        body: "Pitch on the sustained notes. Then again for breath points. Then again for tone. Listening for everything at once is how you end up hearing nothing.",
      },
      {
        title: "A/B against your last keeper",
        body: "Play the new take against the previous best. Same phrase, back to back, is the comparison that shows whether a change actually helped.",
      },
    ],
  },
  beginner: {
    heading: "Getting past the first playback",
    body: "Most singers record themselves once, dislike it, and never do it again — losing the single most useful practice tool they have. The reaction is physiological and it does fade.",
    points: [
      "Your recorded voice is the real one; the internal version is the one with an inaccurate bass boost",
      "Record short — one phrase, not a whole song — so listening back is not a chore",
      "Keep an early take deliberately, so you have something to compare against in a month",
      "Listen for one thing at a time, or the whole take just sounds vaguely wrong",
    ],
  },
  advanced: {
    heading: "Make the comparison structured",
    body: "Recording is only as useful as the question you record to answer. Advanced use means changing exactly one variable and checking whether the take moved.",
    points: [
      "Change one thing per take — vowel shape, breath point, dynamic — and A/B to see if it helped",
      "Record the same benchmark phrase weekly so you have a real progress series",
      "Note the take conditions; a difference caused by hydration or time of day is not a technique change",
      "Pro adds a pitch trace to every take, so drift becomes visible instead of a matter of opinion",
    ],
  },
  faq: [
    {
      q: "Why does my voice sound so different in a recording?",
      a: "When you sing, you hear the sound through the air and through the bones of your skull, and bone conduction adds low frequencies. A recording only captures the airborne part, so it sounds thinner and higher to you. Everyone else has always heard the recorded version.",
    },
    {
      q: "Do I need a proper microphone?",
      a: "Not for practice. A laptop or phone mic captures pitch, timing and phrasing perfectly well, and those are what you are studying. Better microphones matter for producing releases, not for hearing your own accuracy.",
    },
    {
      q: "How often should I record myself?",
      a: "A benchmark phrase once a week gives a clear progress series without turning practice into admin. Recording individual takes while working on a specific problem is useful as often as you like.",
    },
    {
      q: "Are my recordings uploaded anywhere?",
      a: "No. Takes are stored on your device and never sent to a server, on either the free or the paid tier. Pro's cloud sync backs up progress numbers — scores, streaks, range — and never audio.",
    },
    {
      q: "Should I record with or without a backing track?",
      a: "Both are worth doing. With a track shows whether you hold pitch against a fixed reference; without one exposes drift that a track would otherwise cover.",
    },
  ],
  related: [
    {
      href: "/songs",
      label: "Song practice",
      note: "Record the phrases that scored worst.",
    },
    {
      href: "/progress",
      label: "Progress",
      note: "Put takes next to your scores over time.",
    },
    {
      href: "/studio",
      label: "Pitch studio",
      note: "See pitch live before you commit a take.",
    },
    {
      href: "/glossary",
      label: "Glossary",
      note: "Vibrato, resonance, register — names for what you hear back.",
    },
  ],
};

export const TOOLS_GUIDE: GuideContent = {
  path: "/tools",
  heading: "A metronome, a keyboard and a drone — and when each one helps",
  answer:
    "These are the three reference tools most vocal practice actually needs: a metronome for timing, a virtual piano for pitch reference and starting notes, and a sustained drone for practicing intonation against a fixed pitch. All three run in the browser with no install.",
  body: [
    "The metronome is the one singers skip and instrumentalists never do. Rhythm problems in singing hide easily, because a phrase that drags feels expressive from the inside. A click removes the argument.",
    "The virtual keyboard covers the small jobs that otherwise interrupt practice: finding a starting note, checking an interval, giving yourself a reference before an unaccompanied entry. It is also the fastest way to check whether a note you think you cannot reach is actually where you think it is.",
    "The drone is the least familiar and the most useful for intonation. Holding a sustained tonic while you sing a scale or a phrase against it makes small pitch errors immediately audible as beating and roughness — the same technique string players and singers in unaccompanied traditions have always used.",
  ],
  howTo: {
    name: "How to use a drone to improve your intonation",
    intro:
      "A drone is the closest thing to having a perfectly in-tune accompanist who never adjusts to your mistakes. Ten minutes of it exposes more pitch detail than an hour of singing alone.",
    steps: [
      {
        title: "Set the drone to a comfortable tonic",
        body: "Choose a note in the low-middle of your range and let it sound continuously. This is the reference everything else is measured against.",
      },
      {
        title: "Sing the tonic against it",
        body: "Match the drone exactly. When you are dead on you will hear the two tones fuse; when you are slightly off you will hear a wavering beat. Learning to hear that beat is the whole skill.",
      },
      {
        title: "Move to the fifth and the octave",
        body: "These are the most consonant intervals and the easiest to tune. Sing each, hold it, and adjust until the roughness disappears.",
      },
      {
        title: "Walk the scale slowly",
        body: "Sing up the scale one note at a time, holding each against the drone. Thirds and sevenths are where most singers discover they have been approximating.",
      },
      {
        title: "Sing a phrase over it",
        body: "Take a phrase from something you are working on and sing it against the drone. Notes that felt fine in context often turn out to be sitting slightly under.",
      },
      {
        title: "Add the metronome for rhythm work",
        body: "For timing rather than pitch, set the click slower than the tempo you struggle at and speed up gradually. Practicing at a speed where you are accurate is what makes the speed available later.",
      },
    ],
  },
  beginner: {
    heading: "Start with the keyboard and the drone",
    body: "For a new singer the two immediate wins are knowing what note you are aiming at and hearing when you have landed on it. The metronome becomes useful slightly later, once pitch is not taking all your attention.",
    points: [
      "Use the keyboard to find your starting note before singing anything unaccompanied",
      "Practice matching a single drone pitch before trying scales against it",
      "The wavering sound when you are slightly off is the feedback — listen for it rather than trying to avoid it",
      "Set the metronome well below your target tempo; accuracy first, speed after",
    ],
  },
  advanced: {
    heading: "Use the drone on the intervals you round off",
    body: "Most trained singers are accurate on the tonic, fifth and octave and quietly approximate on thirds, sixths and sevenths, where equal temperament and the ear disagree slightly anyway.",
    points: [
      "Hold thirds and sevenths against the drone until the beating stops — that is where intonation is really tested",
      "Drone on a note other than the tonic of your phrase to practice hearing your line against a moving harmony",
      "Use the metronome on subdivisions rather than the beat to expose rushing inside a phrase",
      "Combine drone and take recorder: sing against the drone, then listen back with it removed",
    ],
  },
  faq: [
    {
      q: "What is a vocal drone and why practice with one?",
      a: "A drone is a continuously sustained pitch you sing against. Because it never moves, any deviation in your own pitch produces audible beating — which makes intonation errors obvious that would otherwise pass unnoticed.",
    },
    {
      q: "Do singers need a metronome?",
      a: "For anything rhythmically specific, yes. Rhythm errors in singing are easy to miss because a dragging phrase feels expressive from the inside; a click settles it immediately.",
    },
    {
      q: "What is A440 and does it matter?",
      a: "A440 means the A above middle C is tuned to 440 Hz, the modern standard, and it is what these tools use. It matters when you are singing with recordings or other instruments, which are almost always tuned the same way.",
    },
    {
      q: "Can I use the piano to find my range?",
      a: "You can, by playing notes and singing along until you run out at either end. The range test does the same thing faster and more accurately, because it detects the pitch you actually produced rather than the one you were aiming for.",
    },
    {
      q: "Why does my voice sound rough against the drone?",
      a: "That roughness is the beating between two nearly-identical pitches, and it means you are slightly off. It is the tool working — adjust until the two tones fuse into one and the roughness disappears.",
    },
  ],
  related: [
    {
      href: "/ear-training",
      label: "Ear training",
      note: "Train the recognition the drone is testing.",
    },
    {
      href: "/studio",
      label: "Pitch studio",
      note: "See the pitch the drone lets you hear.",
    },
    {
      href: "/songs",
      label: "Song practice",
      note: "Take the tuned interval into real phrases.",
    },
    {
      href: "/glossary",
      label: "Glossary",
      note: "A440, cents, drone — what these tools are actually doing.",
    },
  ],
};

export const STUDIO_GUIDE: GuideContent = {
  path: "/studio",
  heading: "What live pitch feedback shows you",
  answer:
    "The pitch studio draws the note you are actually singing against the note you are aiming at, as you sing it. Seeing that gap in real time closes the loop that is normally invisible to a singer: you find out you are under the note while you can still do something about it, rather than afterwards.",
  body: [
    "Pitch detection works by finding the repeating period in the sound your voice makes and converting it to a frequency, then to a note name and a deviation in cents. A hundred cents is one semitone, so a reading of minus twenty cents means you are a fifth of a semitone flat — audible to most listeners, and invisible without a display.",
    "The value of the display is that it separates two problems singers usually confuse. If you can see the target and still cannot land on it, the issue is production — support, register, or effort. If you land on it fine once you can see it, the issue was hearing the target, which is ear training rather than technique.",
    // Not "everything runs on your device" — lib/sync.ts uploads Pro progress
    // state to /api/sync. The audio claim is still exact; the scope of it isn't.
    "Pitch analysis runs in the browser on your device and the audio is never sent anywhere, on any tier. Pro's cloud sync backs up your progress numbers — scores, streaks, range — and never audio.",
  ],
  howTo: {
    name: "How to practice with real-time pitch feedback",
    intro:
      "A few focused minutes with the display beats a long session, because reading a trace while singing is genuinely tiring.",
    steps: [
      {
        title: "Allow the microphone and check the reading",
        body: "Sing a comfortable note and confirm the detector is tracking it steadily. A jumpy reading usually means background noise or a very breathy tone rather than unstable pitch.",
      },
      {
        title: "Hold one note and watch the line",
        body: "Sustain a mid-range note and look at how straight the trace is. Most singers discover a slow drift or a wobble that they could not hear at all from the inside.",
      },
      {
        title: "Fix the attack",
        body: "Watch the first moment of the note. Scooping up from underneath is extremely common, and it shows on the trace as a curve into the target rather than a landing on it.",
      },
      {
        title: "Practice the interval you keep missing",
        body: "Sing from a comfortable note to the one that gives you trouble, and watch where you land. Being consistently under by the same amount is a different problem from landing randomly.",
      },
      {
        title: "Look away and check yourself",
        body: "Sing the same thing without watching, then look at the result. The goal is accuracy without the display — the screen is a teacher, not a crutch.",
      },
      {
        title: "Take it into a warmup or a song",
        body: "The studio is free practice. Scored patterns in warmups and songs are where you find out whether the accuracy holds under a musical demand.",
      },
    ],
  },
  beginner: {
    heading: "Seeing the note makes it learnable",
    body: "If you have been told you sing off-key without ever being told which way, this is the fastest fix available. Most people are flat rather than randomly off, and flat is a correctable habit.",
    points: [
      "Work in the middle of your range first, where the voice is most controllable",
      "If you are consistently under the note, try beginning the sound slightly above and letting it settle",
      "Watch the attack — scooping into a note from below is the most common single habit the display reveals",
      "Short sessions; reading the trace while singing takes real concentration",
    ],
  },
  advanced: {
    heading: "Hunt the drift, not the miss",
    body: "For an accurate singer the interesting information is not whether you hit the note but what happens across the two seconds after you do — where sustained tone bends, and where the trace changes character across a register break.",
    points: [
      "Sustain long notes and watch for a slow sag; that is a support problem showing up as a pitch problem",
      "Sing through your passaggio slowly and watch what the trace does at the transition",
      "Check whether accuracy degrades with volume — many singers go sharp when they push",
      "Pro keeps per-note accuracy across sessions, so a weak note becomes a trend rather than a hunch",
    ],
  },
  faq: [
    {
      q: "How does pitch detection work?",
      a: "The app analyzes the repeating waveform of your voice to estimate its fundamental frequency, then converts that to the nearest note and the deviation in cents. It runs in the browser on your device, and it needs a reasonably quiet room to be accurate at the edges of your range.",
    },
    {
      q: "What are cents in pitch?",
      a: "A cent is one hundredth of a semitone. Deviations under about five cents are inaudible to most listeners; twenty cents or more reads clearly as out of tune. The display shows cents so you can see errors long before they become obvious.",
    },
    {
      q: "Why is the pitch reading jumping around?",
      a: "Usually background noise, a very breathy tone, or a note near the bottom of your range where the fundamental is weak. Move somewhere quieter and sing with a clearer tone and the reading normally settles.",
    },
    {
      q: "Will watching a screen make me dependent on it?",
      a: "Only if you never practice without it. Use the display to identify a habit, then work the same material with your eyes off it to confirm the accuracy carried over.",
    },
    {
      q: "Is my microphone audio recorded or uploaded?",
      a: "No. All pitch analysis happens on your device, and nothing is sent to a server or stored unless you explicitly record a take in the recorder — and those stay on your device too.",
    },
  ],
  related: [
    {
      href: "/warmups",
      label: "Warmups",
      note: "Scored patterns that apply the same feedback.",
    },
    {
      href: "/ear-training",
      label: "Ear training",
      note: "Fix the target if you can't hear it, not just the production.",
    },
    {
      href: "/range",
      label: "Range test",
      note: "Find the edges the studio helps you strengthen.",
    },
    {
      href: "/glossary",
      label: "Glossary",
      note: "Cents, sharp and flat, fundamental — the readout, defined.",
    },
  ],
};

export const ANALYZE_GUIDE: GuideContent = {
  path: "/analyze",
  pageName: "Voice Spectrogram, Tone Analyzer and Vocal Load Tracker",
  heading: "What a spectrogram shows a singer",
  answer:
    "A spectrogram plots every frequency in your voice against time, so one sung note appears as a stack of horizontal lines: the fundamental at the bottom and its harmonics above. It shows the parts of singing you cannot hear from the inside — where a register changes, how fast a vibrato moves, and how much energy sits in the band that makes a voice carry.",
  body: [
    "Pitch tells you which note. Everything else about how a voice sounds — bright or dark, thin or full, ringing or swallowed — comes from the relative strength of the harmonics above that note, and that is what a spectrogram makes visible. Two singers on the same pitch produce completely different pictures.",
    "The band around 3 kHz is worth knowing about. Trained classical voices tend to show a cluster of energy there, usually called the singer's formant, and it is the accepted explanation for how one voice is heard over an orchestra that is measurably louder. It is not a target to chase directly; it tends to appear as a by-product of an efficient, well-resonated tone.",
    "Vocal load is a different question from how long you practiced. The vocal-dosimetry literature counts vibration cycles rather than minutes, because pitch decides how much work the folds do in a given second: a soprano rehearsing high for an hour has put her folds through several times the cycles of an hour spent low in the range. Counting cycles is what makes two practice days comparable.",
  ],
  howTo: {
    name: "How to read your voice on a spectrogram",
    intro:
      "The analysis runs in your browser on your own device. Nothing is uploaded, and nothing is recorded unless you use the take recorder separately.",
    steps: [
      {
        title: "Allow the microphone and sing a steady note",
        body: "Pick a comfortable note in the middle of your range and hold it on an open vowel. You should see a stack of horizontal lines: the lowest is the note you are singing, and the ones above it are its harmonics.",
      },
      {
        title: "Count how far the stack goes",
        body: "A bright, well-supported tone shows many harmonics reaching high up the display. A breathy or pressed tone shows fewer, and more of the fuzzy grey between them, which is air rather than tone.",
      },
      {
        title: "Slide slowly from low to high",
        body: "Watch the whole stack rise together. Where the picture suddenly reorganises — harmonics dropping out or the texture changing — is a register transition, and it usually happens in the same place every time.",
      },
      {
        title: "Hold a note with vibrato",
        body: "Vibrato appears as a regular ripple in every line at once. Because all the harmonics move together, a wide ripple low in the stack means a wide one high up too.",
      },
      {
        title: "Watch the ring band on the tone view",
        body: "The gold column marks 2.8 to 3.2 kHz. Sing the same phrase with different amounts of space and brightness and watch the percentage move. Compare it against your own takes rather than against any fixed number, because it depends on your microphone and how close you are to it.",
      },
      {
        title: "Let vocal load run through a normal session",
        body: "Leave the page listening while you practice. It counts only the time your voice is actually sounding, so silences and talking between exercises do not inflate it.",
      },
    ],
  },
  beginner: {
    heading: "Look at the shape, not the numbers",
    body: "Early on the useful thing is noticing that the picture changes when you change something. You do not need to interpret a spectrogram to benefit from seeing that a supported note and a breathy one look nothing alike.",
    points: [
      "Sing one note two ways — breathy, then firm — and watch how much of the stack fills in",
      "Find where your register changes by sliding slowly, and remember roughly which note it happens on",
      "Ignore the ring percentage at first; the spectrogram picture is more useful to a new singer",
      "Use vocal load to see whether you actually practiced twenty minutes or four",
    ],
  },
  advanced: {
    heading: "Use it to compare, not to score",
    body: "Every reading here is relative to your microphone, your distance from it, and your room. That makes it excellent for comparing two of your own takes recorded the same way, and close to meaningless as an absolute measurement against another singer.",
    points: [
      "A/B two vowel shapes on the same pitch and watch the ring band rather than trusting the sensation",
      "Track cycle dose across a heavy rehearsal week — the number climbs faster than practice minutes do",
      "Watch the harmonic stack through a passaggio to see whether the transition is smoothing out over months",
      "Keep microphone position consistent between sessions or the comparison is not one",
    ],
  },
  faq: [
    {
      q: "What is a spectrogram in singing?",
      a: "It is a display of every frequency present in your voice, plotted against time. One sung note shows as a stack of lines — the fundamental plus its harmonics — and the pattern of those lines is what makes a voice sound bright, dark, full or thin.",
    },
    {
      q: "What is the singer's formant?",
      a: "A concentration of energy around 3 kHz found in many trained classical voices. It is the standard explanation for how a single unamplified singer is heard over a full orchestra, since the ear is very sensitive in that region and orchestral sound has comparatively little there.",
    },
    {
      q: "What is vocal dose and why count cycles instead of minutes?",
      a: "Vocal dose measures how much work the vocal folds have done. Cycle dose counts vibration cycles — pitch multiplied by the time you were actually voicing — because a minute sung high puts the folds through far more cycles than a minute sung low. Minutes alone treat those as equal.",
    },
    {
      q: "Does this measure how loud I am in decibels?",
      a: "No. A browser cannot know the sensitivity of your microphone or how far your mouth is from it, so the levels here are relative to your own setup. They are useful for comparing your takes with each other, not for measuring sound pressure.",
    },
    {
      q: "Can it tell me which vowel I am singing?",
      a: "Not currently. Vowel identity comes from the first two resonances of the vocal tract, and at high pitch the harmonics are spaced too far apart to locate them reliably. The spectrogram shows the resonance structure; it does not label it.",
    },
    {
      q: "Is my audio uploaded anywhere?",
      a: "No. The microphone is read in the browser and the analysis runs on your device. No audio is sent to a server.",
    },
  ],
  related: [
    {
      href: "/studio",
      label: "Pitch studio",
      note: "Work on the note itself before working on its colour.",
    },
    {
      href: "/recorder",
      label: "Take recorder",
      note: "Record the take, then come back and look at it.",
    },
    {
      href: "/range",
      label: "Range test",
      note: "Find the register transitions the spectrogram shows.",
    },
    {
      href: "/glossary",
      label: "Glossary",
      note: "Harmonic, formant, vocal dose — the spectrogram's vocabulary.",
    },
  ],
  safety: {
    heading: "Vocal load is a practice signal, not a health check",
    body: "Cycle dose can show that today was heavier than yesterday. It cannot tell you what is safe for your voice, because that depends on the individual and on factors no microphone can see. Persistent hoarseness, pain, or a loss of range belongs with a qualified voice teacher or a clinician rather than a number on a screen.",
    sources: [
      {
        href: "https://www.nidcd.nih.gov/health/taking-care-your-voice",
        label: "NIDCD: Taking Care of Your Voice",
        note: "voice-health warning signs and guidance for healthy voice use",
      },
      {
        href: "https://www.asha.org/practice-portal/clinical-topics/voice-disorders/",
        label: "ASHA: Voice Disorders",
        note: "clinical context for vocal fatigue, effort, and evaluation",
      },
    ],
  },
};

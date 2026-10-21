/**
 * GENERATED FILE — edit the markdown under content/lessons and re-run scripts/compile-lessons.mjs.
 *
 * The voice curriculum's lesson bodies, ported from GuitarHub and keyed to the
 * lesson IDs in contracts/suede-voice-curriculum.json. Every lesson is free to
 * read, so unlike the book there is no gated half.
 */

export interface LessonStep {
  title: string;
  /** Markdown paragraphs. */
  body: string;
  /** What to check with your eyes. */
  look: string;
  /** What to check by ear. */
  listen: string;
}

export interface Lesson {
  /** The catalog ID, e.g. "v-l1-m1-01". */
  id: string;
  stageId: string;
  moduleId: string;
  /** URL segments: /learn/voice/<stageSlug>/<moduleSlug>/<slug>. */
  stageSlug: string;
  moduleSlug: string;
  slug: string;
  title: string;
  type: string;
  minutes: number;
  objective: string;
  /** Plain answer to the title, from "## In short"; empty until one is written. */
  explanation: string;
  /** Lesson IDs. */
  prerequisites: string[];
  /** IDs in LESSON_REFERENCES. */
  references: string[];
  steps: LessonStep[];
  mistakes: Array<{ observation: string; recovery: string }>;
  /** Timed blocks that add up to `minutes`. */
  blocks: Array<{ seconds: number; instruction: string }>;
  selfCheck: {
    criteria: string[];
    readyWhen: string;
    ifNotReady: string;
    shows: string;
    doesNotShow: string;
  };
}

export interface LessonReference {
  id: string;
  title: string;
  url: string;
  supports: string;
}

export const LESSON_REFERENCES: LessonReference[] = [
  {
    "id": "nidcd-voice-care",
    "title": "Taking Care of Your Voice",
    "url": "https://www.nidcd.nih.gov/health/taking-care-your-voice",
    "supports": "General voice-care practices, symptom awareness, and seeking professional help for persistent voice problems."
  },
  {
    "id": "asha-voice-disorders",
    "title": "Voice Disorders",
    "url": "https://www.asha.org/practice-portal/clinical-topics/voice-disorders/",
    "supports": "The boundary between educational listening practice and clinical evaluation or treatment."
  }
];

/** In catalog order. */
export const LESSONS: Lesson[] = [
  {
    "id": "v-l1-m1-01",
    "stageId": "v-l1",
    "moduleId": "v-l1-m1",
    "stageSlug": "room-check",
    "moduleSlug": "set-up-your-space",
    "slug": "why-loud-playback-ruins-pitch",
    "title": "Why Loud Playback Ruins Pitch",
    "type": "concept",
    "minutes": 3,
    "objective": "Reference sound can enter the microphone along with your voice. Compare your setup with playback stopped.",
    "explanation": "The pitch reading works by finding the one repeating pattern in whatever the microphone hears, so it is only as good as the sound that reaches it. A reference or a song playing through a speaker reaches the microphone along with your voice, and the reading becomes a blend of the two: it can lean toward the reference and flatter you, or find a note while you are silent. Stop playback before you sing, keep the speaker low or use closed headphones, and judge only takes that hold your voice alone.",
    "prerequisites": [],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Sustained hold. Hear the reference, choose a comfortable key, then stop it before singing. The reading When the numbers lie to you is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Silence reference playback, lower speaker volume below halfway, and use wired headphones when available. Keep the microphone opening clear and stay one relaxed hand-span away. Before singing today, check your speaking voice: if it is tired from a day of talking, especially over noise, keep this session short and quiet, or rest it. Stop for pain, burning or sudden hoarseness.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Room setup and clean input",
        "body": "Reference sound can enter the microphone along with your voice. Compare your setup with playback stopped. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The recording starts with your voice, settles while you sing, and returns to quiet instead of moving with playback or room noise.",
        "listen": "Your recorded voice is clear enough to follow without echo, clipping, a second voice, or loud accompaniment."
      },
      {
        "title": "Hear the distinction",
        "body": "Make two short takes of the same easy hum at the same distance from the microphone, with a full quiet gap between them. For the first, have something playing aloud through a speaker at your usual volume, a song or the reference from another tab or device; for the second, stop it and hum again. Playback is the only thing that changes. Record both in the recorder and listen back: the first usually carries the other sound under your voice, and the second should hold only you. Then change only one room or device setting at a time, one take each, so you can hear what fixed the input.",
        "look": "The recording starts with your voice, settles while you sing, and returns to quiet instead of moving with playback or room noise.",
        "listen": "Your recorded voice is clear enough to follow without echo, clipping, a second voice, or loud accompaniment."
      },
      {
        "title": "Review your own attempt",
        "body": "I compared a quiet recording with my initial room setup and could hear my voice clearly. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If the recording includes the speaker or room noise, stop playback, move away from noise, and try one fresh sound."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 30,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Why Loud Playback Ruins Pitch.”"
      },
      {
        "seconds": 45,
        "instruction": "Isolate the room setup and clean input target in short, comfortable examples."
      },
      {
        "seconds": 60,
        "instruction": "Practise or record the complete “Why Loud Playback Ruins Pitch” task, resetting between attempts."
      },
      {
        "seconds": 45,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I compared a quiet recording with my initial room setup and could hear my voice clearly.",
        "Your recorded voice is clear enough to follow without echo, clipping, a second voice, or loud accompaniment.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If the recording includes the speaker or room noise, stop playback, move away from noise, and try one fresh sound. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I compared a quiet recording with my initial room setup and could hear my voice clearly. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Microphone calibration, room treatment, vocal technique, pitch accuracy, or a diagnosis of any voice problem."
    }
  },
  {
    "id": "v-l1-m1-02",
    "stageId": "v-l1",
    "moduleId": "v-l1-m1",
    "stageSlug": "room-check",
    "moduleSlug": "set-up-your-space",
    "slug": "device-volume-and-headphones",
    "title": "Device Volume and Headphones",
    "type": "exercise",
    "minutes": 4,
    "objective": "Turn playback down, decide on headphones, and give the mic a quiet room.",
    "explanation": "",
    "prerequisites": [
      "v-l1-m1-01"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Sustained hold. Hear the reference, choose a comfortable key, then stop it before singing. The reading When the numbers lie to you is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Silence reference playback, lower speaker volume below halfway, and use wired headphones when available. Keep the microphone opening clear and stay one relaxed hand-span away.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Room setup and clean input",
        "body": "Turn playback down, decide on headphones, and give the mic a quiet room. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The recording starts with your voice, settles while you sing, and returns to quiet instead of moving with playback or room noise.",
        "listen": "Your recorded voice is clear enough to follow without echo, clipping, a second voice, or loud accompaniment."
      },
      {
        "title": "Alternate attempt and reset",
        "body": "Work in short repetitions with a normal breath and complete release between them. Make one comfortable sustained sound, then leave a full quiet gap before the next. Change only one room or device setting at a time so you can hear what fixed the input.",
        "look": "The recording starts with your voice, settles while you sing, and returns to quiet instead of moving with playback or room noise.",
        "listen": "Your recorded voice is clear enough to follow without echo, clipping, a second voice, or loud accompaniment."
      },
      {
        "title": "Review your own attempt",
        "body": "I compared a quiet recording with my initial room setup and could hear my voice clearly. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If the recording includes the speaker or room noise, stop playback, move away from noise, and try one fresh sound."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 30,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Device Volume and Headphones.”"
      },
      {
        "seconds": 60,
        "instruction": "Isolate the room setup and clean input target in short, comfortable examples."
      },
      {
        "seconds": 90,
        "instruction": "Practise or record the complete “Device Volume and Headphones” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I compared a quiet recording with my initial room setup and could hear my voice clearly.",
        "Your recorded voice is clear enough to follow without echo, clipping, a second voice, or loud accompaniment.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If the recording includes the speaker or room noise, stop playback, move away from noise, and try one fresh sound. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I compared a quiet recording with my initial room setup and could hear my voice clearly. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Microphone calibration, room treatment, vocal technique, pitch accuracy, or a diagnosis of any voice problem."
    }
  },
  {
    "id": "v-l1-m1-04",
    "stageId": "v-l1",
    "moduleId": "v-l1-m1",
    "stageSlug": "room-check",
    "moduleSlug": "set-up-your-space",
    "slug": "self-check-a-clear-recording",
    "title": "Self-Check: A Clear Recording",
    "type": "checkpoint",
    "minutes": 4,
    "objective": "Compare a quiet recording with your initial room setup and check that you can hear your voice clearly. This is a listening and reflection check.",
    "explanation": "",
    "prerequisites": [
      "v-l1-m1-02"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Sustained hold. Hear the reference, choose a comfortable key, then stop it before singing. The reading When the numbers lie to you is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Silence reference playback, lower speaker volume below halfway, and use wired headphones when available. Keep the microphone opening clear and stay one relaxed hand-span away.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Room setup and clean input",
        "body": "A take with only your voice in it, with nothing else playing. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The recording starts with your voice, settles while you sing, and returns to quiet instead of moving with playback or room noise.",
        "listen": "Your recorded voice is clear enough to follow without echo, clipping, a second voice, or loud accompaniment."
      },
      {
        "title": "Make one evidence take",
        "body": "State the checkpoint target, record one uninterrupted attempt, and keep the result even when it does not pass. Make one comfortable sustained sound, then leave a full quiet gap before the next. Change only one room or device setting at a time so you can hear what fixed the input.",
        "look": "The recording starts with your voice, settles while you sing, and returns to quiet instead of moving with playback or room noise.",
        "listen": "Your recorded voice is clear enough to follow without echo, clipping, a second voice, or loud accompaniment."
      },
      {
        "title": "Review your own attempt",
        "body": "I compared a quiet recording with my initial room setup and could hear my voice clearly. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If the recording includes the speaker or room noise, stop playback, move away from noise, and try one fresh sound."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 30,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Self-Check: A Clear Recording.”"
      },
      {
        "seconds": 60,
        "instruction": "Isolate the room setup and clean input target in short, comfortable examples."
      },
      {
        "seconds": 90,
        "instruction": "Practise or record the complete “Self-Check: A Clear Recording” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I compared a quiet recording with my initial room setup and could hear my voice clearly.",
        "Your recorded voice is clear enough to follow without echo, clipping, a second voice, or loud accompaniment.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "A recording made with playback stopped holds only your voice, with no reference tone, echo or clipping, on the device and in the room you will practise in.",
      "ifNotReady": "If the recording includes the speaker or room noise, stop playback, move away from noise, and try one fresh sound. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I compared a quiet recording with my initial room setup and could hear my voice clearly. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Microphone calibration, room treatment, vocal technique, pitch accuracy, or a diagnosis of any voice problem."
    }
  },
  {
    "id": "v-l1-m2-01",
    "stageId": "v-l1",
    "moduleId": "v-l1-m2",
    "stageSlug": "room-check",
    "moduleSlug": "your-range",
    "slug": "low-first-high-second-neither-forced",
    "title": "Low First, High Second, Neither Forced",
    "type": "concept",
    "minutes": 3,
    "objective": "Comfortable, not extreme. The number we want is one you can repeat next month.",
    "explanation": "The range test asks for your two ends one at a time: hold a comfortable note, slide down to your lowest, then slide up to your highest. Only notes you could let someone else hear count, with a clear pitch you could hold for a beat or two, so the creak below your lowest sung note and a squeezed top note both stay out. Stop each slide where the next note would need effort rather than height: that is a reading you can repeat next month, which an extreme reached once is not.",
    "prerequisites": [
      "v-l1-m1-04"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose First hum or Easy fourth siren. Hear the reference, choose a comfortable key, then stop it before singing. The reading Reading your range test is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Warm up first, for about four minutes with the [Morning reset](/warmups?routine=morning): a cold voice under-reports at both ends. Then start near the middle of your comfortable speaking range. Keep the jaw loose and choose a small lip trill, hum, or easy vowel rather than a loud call.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Range scan and voice type",
        "body": "Comfortable, not extreme. The number we want is one you can repeat next month. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Keep the supplied reference or reading visible, settle your posture, and use only a pitch and duration you can repeat comfortably.",
        "listen": "Both slides remain conversational in effort. The last usable note sounds repeatable, not like an extreme reached once."
      },
      {
        "title": "Hear the distinction",
        "body": "Record two slides down from the same comfortable note in one take in the recorder, with a reset between them. On the first, stop at the first note that needs any effort: extra volume, a tucked chin or a pushed breath. On the second, stop one note earlier, while it is still completely easy. The stopping note is the only thing that changes. On playback, listen for the difference: the effortful note usually thins, rattles or wobbles, and the easy one sounds like the rest of your voice, so keep the easy one as your low end. To put a name on it, slide down to that easy note once more in the [pitch studio](/studio), which shows the note as you sing it, and write down the note you stop on. Return to the middle and do the same pair going up, naming the easy top note the same way. Stop before squeezing, pain, scratchiness, or the urge to reach for a number.",
        "look": "Keep the supplied reference or reading visible, settle your posture, and use only a pitch and duration you can repeat comfortably.",
        "listen": "Both slides remain conversational in effort. The last usable note sounds repeatable, not like an extreme reached once."
      },
      {
        "title": "Review your own attempt",
        "body": "I tried a comfortable low and high note without forcing either end and noted the pitches I could repeat. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If an endpoint needs extra volume, a lifted chin, or neck effort, discard it, return to the middle, and keep the last easy repeatable note."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 30,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Low First, High Second, Neither Forced.”"
      },
      {
        "seconds": 45,
        "instruction": "Isolate the range scan and voice type target in short, comfortable examples."
      },
      {
        "seconds": 60,
        "instruction": "Practise or record the complete “Low First, High Second, Neither Forced” task, resetting between attempts."
      },
      {
        "seconds": 45,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I tried a comfortable low and high note without forcing either end and noted the pitches I could repeat.",
        "Both slides remain conversational in effort. The last usable note sounds repeatable, not like an extreme reached once.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If an endpoint needs extra volume, a lifted chin, or neck effort, discard it, return to the middle, and keep the last easy repeatable note. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I tried a comfortable low and high note without forcing either end and noted the pitches I could repeat. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Passaggio pitches, permanent voice type, vocal health, strain, or the widest note you could force once."
    }
  },
  {
    "id": "v-l1-m2-02",
    "stageId": "v-l1",
    "moduleId": "v-l1-m2",
    "stageSlug": "room-check",
    "moduleSlug": "your-range",
    "slug": "slide-down-slide-up",
    "title": "Slide Down, Slide Up",
    "type": "exercise",
    "minutes": 5,
    "objective": "Slide to your lowest comfortable note, then your highest. Stop before strain, every time.",
    "explanation": "",
    "prerequisites": [
      "v-l1-m2-01"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose First hum or Easy fourth siren. Hear the reference, choose a comfortable key, then stop it before singing. The reading Reading your range test is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Warm up first, for about four minutes with the [Morning reset](/warmups?routine=morning): a cold voice under-reports at both ends. Then start near the middle of your comfortable speaking range. Keep the jaw loose and choose a small lip trill, hum, or easy vowel rather than a loud call.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Range scan and voice type",
        "body": "Slide to your lowest comfortable note, then your highest. Stop before strain, every time. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Keep the supplied reference or reading visible, settle your posture, and use only a pitch and duration you can repeat comfortably.",
        "listen": "Both slides remain conversational in effort. The last usable note sounds repeatable, not like an extreme reached once."
      },
      {
        "title": "Alternate attempt and reset",
        "body": "Work in short repetitions with a normal breath and complete release between them. Glide down only while the sound stays easy, reset, then glide up separately. Stop before squeezing, pain, scratchiness, or the urge to reach for a number. Practise these slides in the recorder, as this module's first lesson does. Then repeat each slide once in the [pitch studio](/studio), which names the note as you sing it, and write down the last easy note at each end: nothing you sing or record in either room replaces your saved range. Take the range test itself once, warmed up, for the module's self-check: every finished test replaces your saved range and refits your warm-ups and songs, and the reading Reading your range test, listed with this lesson, keeps retests weeks apart.",
        "look": "Keep the supplied reference or reading visible, settle your posture, and use only a pitch and duration you can repeat comfortably.",
        "listen": "Both slides remain conversational in effort. The last usable note sounds repeatable, not like an extreme reached once."
      },
      {
        "title": "Review your own attempt",
        "body": "I tried a comfortable low and high note without forcing either end and noted the pitches I could repeat. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If an endpoint needs extra volume, a lifted chin, or neck effort, discard it, return to the middle, and keep the last easy repeatable note."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Slide Down, Slide Up.”"
      },
      {
        "seconds": 75,
        "instruction": "Isolate the range scan and voice type target in short, comfortable examples."
      },
      {
        "seconds": 120,
        "instruction": "Practise or record the complete “Slide Down, Slide Up” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I tried a comfortable low and high note without forcing either end and noted the pitches I could repeat.",
        "Both slides remain conversational in effort. The last usable note sounds repeatable, not like an extreme reached once.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If an endpoint needs extra volume, a lifted chin, or neck effort, discard it, return to the middle, and keep the last easy repeatable note. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I tried a comfortable low and high note without forcing either end and noted the pitches I could repeat. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Passaggio pitches, permanent voice type, vocal health, strain, or the widest note you could force once."
    }
  },
  {
    "id": "v-l1-m2-04",
    "stageId": "v-l1",
    "moduleId": "v-l1-m2",
    "stageSlug": "room-check",
    "moduleSlug": "your-range",
    "slug": "self-check-comfortable-range",
    "title": "Self-Check: Comfortable Range",
    "type": "checkpoint",
    "minutes": 4,
    "objective": "Try a comfortable low and high note without forcing either end, and note the pitches you can repeat. This is a listening and reflection check.",
    "explanation": "",
    "prerequisites": [
      "v-l1-m2-02"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose First hum or Easy fourth siren. Hear the reference, choose a comfortable key, then stop it before singing. The reading Reading your range test is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Warm up first, for about four minutes with the [Morning reset](/warmups?routine=morning): a cold voice under-reports at both ends. Then start near the middle of your comfortable speaking range. Keep the jaw loose and choose a small lip trill, hum, or easy vowel rather than a loud call.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Range scan and voice type",
        "body": "An estimated voice type and both ends of your range, to fit every later exercise to. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Keep the supplied reference or reading visible, settle your posture, and use only a pitch and duration you can repeat comfortably.",
        "listen": "Both slides remain conversational in effort. The last usable note sounds repeatable, not like an extreme reached once."
      },
      {
        "title": "Make one evidence take",
        "body": "Take the range test once for this check, after the warm-up; if you already saved one while working through this module, use it rather than testing again. State the checkpoint target, sing the test as one uninterrupted attempt, and keep its saved result. Glide down only while the sound stays easy, reset, then glide up separately. Stop before squeezing, pain, scratchiness, or the urge to reach for a number. If an end needs extra volume, a lifted chin or neck effort, press Start over before the test finishes: a finished test becomes the range your warm-ups and songs are fitted to.",
        "look": "Keep the supplied reference or reading visible, settle your posture, and use only a pitch and duration you can repeat comfortably.",
        "listen": "Both slides remain conversational in effort. The last usable note sounds repeatable, not like an extreme reached once."
      },
      {
        "title": "Review your own attempt",
        "body": "I tried a comfortable low and high note without forcing either end and noted the pitches I could repeat. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If an endpoint needs extra volume, a lifted chin, or neck effort, discard it, return to the middle, and keep the last easy repeatable note."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 30,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Self-Check: Comfortable Range.”"
      },
      {
        "seconds": 60,
        "instruction": "Isolate the range scan and voice type target in short, comfortable examples."
      },
      {
        "seconds": 90,
        "instruction": "Practise or record the complete “Self-Check: Comfortable Range” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I tried a comfortable low and high note without forcing either end and noted the pitches I could repeat.",
        "Both slides remain conversational in effort. The last usable note sounds repeatable, not like an extreme reached once.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You have written down one easy low note and one easy high note you could sing again tomorrow, and the range test has saved a result.",
      "ifNotReady": "If an endpoint needs extra volume, a lifted chin, or neck effort, discard it, return to the middle, and keep the last easy repeatable note. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I tried a comfortable low and high note without forcing either end and noted the pitches I could repeat. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Passaggio pitches, permanent voice type, vocal health, strain, or the widest note you could force once."
    }
  },
  {
    "id": "v-l1-m3-01",
    "stageId": "v-l1",
    "moduleId": "v-l1-m3",
    "stageSlug": "room-check",
    "moduleSlug": "breathe-low",
    "slug": "ribs-out-shoulders-still",
    "title": "Ribs Out, Shoulders Still",
    "type": "concept",
    "minutes": 3,
    "objective": "What to move and what to leave alone.",
    "explanation": "On an easy breath in, the diaphragm flattens and the lower ribs swing out to the sides, so the movement you see is around the lower ribs and the belly; the shoulders and neck have no job to do. A breath that lifts the shoulders raises the upper chest with neck and shoulder muscles: a lot of effort for not much air, and tension right beside the larynx. On the way out, let the ribs stay wide a little longer than they want to and come in gradually: that slow release is what keeps a hiss, and later a sung note, even.",
    "prerequisites": [
      "v-l1-m2-04"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the sustain test in the breath room with the button at the top of this page. You will hiss rather than sing: teeth lightly together, a quiet “sss” like air leaking slowly from a tire, and the timer counts the hiss. Keep your shoulders still and stop before you run short of comfortable breath; you can also count the hiss in your head without opening anything. The chapter Breath: support versus pressure goes deeper and is part of Pro.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "A quiet, even hiss is the whole task; you do not need to make a pitched sound."
      },
      {
        "title": "Set a safe baseline",
        "body": "Stand or sit tall without locking the ribs. Let the shoulders remain quiet while the lower ribs and abdomen respond to an unforced inhale.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Low breath and rib expansion",
        "body": "What to move and what to leave alone. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The shoulders do not rise sharply, the neck stays quiet, and the body does not fold during the final seconds.",
        "listen": "The hiss stays even rather than surging at the start and fading to almost nothing at the end."
      },
      {
        "title": "Hear the distinction",
        "body": "Sit or stand tall with one hand on the side of your lower ribs and the other resting on top of one shoulder. Take two quiet breaths in through the nose over four counts, and hiss each one out. On the first, let the shoulders lift as you breathe in; on the second, keep the shoulders still and let the ribs widen sideways under your hand. Where the breath goes is the only thing that changes. Notice which hiss stays even for longer and which leaves the neck quieter, then keep the second version. Release a narrow, even hiss. Favor steadiness over duration, and end with air still available instead of collapsing or bearing down.",
        "look": "The shoulders do not rise sharply, the neck stays quiet, and the body does not fold during the final seconds.",
        "listen": "The hiss stays even rather than surging at the start and fading to almost nothing at the end."
      },
      {
        "title": "Review your own attempt",
        "body": "I counted an even hiss, kept my shoulders quiet, and released before running out of comfortable breath. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If the hiss pulses or rushes out, use less air, shorten the attempt, rest for a normal breath, and repeat at an easier duration."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 30,
        "instruction": "Open the sustain test. Prepare the room, body, and safe baseline for “Ribs Out, Shoulders Still.”"
      },
      {
        "seconds": 45,
        "instruction": "Isolate the low breath and rib expansion target in short, comfortable examples."
      },
      {
        "seconds": 60,
        "instruction": "Practise or record the complete “Ribs Out, Shoulders Still” task, resetting between attempts."
      },
      {
        "seconds": 45,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I counted an even hiss, kept my shoulders quiet, and released before running out of comfortable breath.",
        "The hiss stays even rather than surging at the start and fading to almost nothing at the end.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If the hiss pulses or rushes out, use less air, shorten the attempt, rest for a normal breath, and repeat at an easier duration. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I counted an even hiss, kept my shoulders quiet, and released before running out of comfortable breath. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Airflow in liters, lung capacity, respiratory health, singing support, or freedom from tension."
    }
  },
  {
    "id": "v-l1-m3-02",
    "stageId": "v-l1",
    "moduleId": "v-l1-m3",
    "stageSlug": "room-check",
    "moduleSlug": "breathe-low",
    "slug": "hiss-for-twelve",
    "title": "Hiss for Twelve",
    "type": "exercise",
    "minutes": 4,
    "objective": "Evenness first, duration second. Count your hiss gently and listen for a steady sound; the sustain test's seconds are a record, not a pass.",
    "explanation": "",
    "prerequisites": [
      "v-l1-m3-01"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the sustain test in the breath room with the button at the top of this page. You will hiss rather than sing: teeth lightly together, a quiet “sss” like air leaking slowly from a tire, and the timer counts the hiss. Keep your shoulders still and stop before you run short of comfortable breath; you can also count the hiss in your head without opening anything. The chapter Breath: support versus pressure goes deeper and is part of Pro.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "A quiet, even hiss is the whole task; you do not need to make a pitched sound."
      },
      {
        "title": "Set a safe baseline",
        "body": "Stand or sit tall without locking the ribs. Let the shoulders remain quiet while the lower ribs and abdomen respond to an unforced inhale.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Low breath and rib expansion",
        "body": "Evenness first, duration second. Count your hiss gently and listen for a steady sound; the sustain test's seconds are a record, not a pass. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The shoulders do not rise sharply, the neck stays quiet, and the body does not fold during the final seconds.",
        "listen": "The hiss stays even rather than surging at the start and fading to almost nothing at the end."
      },
      {
        "title": "Alternate attempt and reset",
        "body": "Work in short repetitions with a normal breath and complete release between them. Release a narrow, even hiss. Favor steadiness over duration, and end with air still available instead of collapsing or bearing down.",
        "look": "The shoulders do not rise sharply, the neck stays quiet, and the body does not fold during the final seconds.",
        "listen": "The hiss stays even rather than surging at the start and fading to almost nothing at the end."
      },
      {
        "title": "Review your own attempt",
        "body": "I counted an even hiss, kept my shoulders quiet, and released before running out of comfortable breath. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If the hiss pulses or rushes out, use less air, shorten the attempt, rest for a normal breath, and repeat at an easier duration."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 30,
        "instruction": "Open the sustain test. Prepare the room, body, and safe baseline for “Hiss for Twelve.”"
      },
      {
        "seconds": 60,
        "instruction": "Isolate the low breath and rib expansion target in short, comfortable examples."
      },
      {
        "seconds": 90,
        "instruction": "Practise or record the complete “Hiss for Twelve” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I counted an even hiss, kept my shoulders quiet, and released before running out of comfortable breath.",
        "The hiss stays even rather than surging at the start and fading to almost nothing at the end.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If the hiss pulses or rushes out, use less air, shorten the attempt, rest for a normal breath, and repeat at an easier duration. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I counted an even hiss, kept my shoulders quiet, and released before running out of comfortable breath. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Airflow in liters, lung capacity, respiratory health, singing support, or freedom from tension."
    }
  },
  {
    "id": "v-l1-m3-04",
    "stageId": "v-l1",
    "moduleId": "v-l1-m3",
    "stageSlug": "room-check",
    "moduleSlug": "breathe-low",
    "slug": "self-check-an-even-hiss",
    "title": "Self-Check: An Even Hiss",
    "type": "checkpoint",
    "minutes": 4,
    "objective": "Count an even hiss, keep your shoulders quiet, and release before you run out of comfortable breath. This is a listening and reflection check.",
    "explanation": "",
    "prerequisites": [
      "v-l1-m3-02"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the sustain test in the breath room with the button at the top of this page. You will hiss rather than sing: teeth lightly together, a quiet “sss” like air leaking slowly from a tire, and the timer counts the hiss. Keep your shoulders still and stop before you run short of comfortable breath; you can also count the hiss in your head without opening anything. The chapter Breath: support versus pressure goes deeper and is part of Pro.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "A quiet, even hiss is the whole task; you do not need to make a pitched sound."
      },
      {
        "title": "Set a safe baseline",
        "body": "Stand or sit tall without locking the ribs. Let the shoulders remain quiet while the lower ribs and abdomen respond to an unforced inhale.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Low breath and rib expansion",
        "body": "Count a comfortable hiss and listen for evenness. Twelve seconds is an optional practice goal that clears the first mark at ten; the sustain test's seconds are a record, not an automatic pass. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The shoulders do not rise sharply, the neck stays quiet, and the body does not fold during the final seconds.",
        "listen": "The hiss stays even rather than surging at the start and fading to almost nothing at the end."
      },
      {
        "title": "Make one evidence take",
        "body": "State the checkpoint target, record one uninterrupted attempt in the [recorder](/recorder), and keep the result even when it does not pass. Release a narrow, even hiss. Favor steadiness over duration, and end with air still available instead of collapsing or bearing down.",
        "look": "The shoulders do not rise sharply, the neck stays quiet, and the body does not fold during the final seconds.",
        "listen": "The hiss stays even rather than surging at the start and fading to almost nothing at the end."
      },
      {
        "title": "Review your own attempt",
        "body": "I counted an even hiss, kept my shoulders quiet, and released before running out of comfortable breath. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If the hiss pulses or rushes out, use less air, shorten the attempt, rest for a normal breath, and repeat at an easier duration."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 30,
        "instruction": "Open the sustain test. Prepare the room, body, and safe baseline for “Self-Check: An Even Hiss.”"
      },
      {
        "seconds": 60,
        "instruction": "Isolate the low breath and rib expansion target in short, comfortable examples."
      },
      {
        "seconds": 90,
        "instruction": "Practise or record the complete “Self-Check: An Even Hiss” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I counted an even hiss, kept my shoulders quiet, and released before running out of comfortable breath.",
        "The hiss stays even rather than surging at the start and fading to almost nothing at the end.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "On two different days, three hisses in a row stay even to your ear from start to finish and end with air to spare, shoulders down.",
      "ifNotReady": "If the hiss pulses or rushes out, use less air, shorten the attempt, rest for a normal breath, and repeat at an easier duration. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I counted an even hiss, kept my shoulders quiet, and released before running out of comfortable breath. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Airflow in liters, lung capacity, respiratory health, singing support, or freedom from tension."
    }
  },
  {
    "id": "v-l2-m1-01",
    "stageId": "v-l2",
    "moduleId": "v-l2-m1",
    "stageSlug": "steady-tone",
    "moduleSlug": "straw-and-lip-trill",
    "slug": "back-pressure-does-the-work",
    "title": "Back Pressure Does the Work",
    "type": "concept",
    "minutes": 3,
    "objective": "Explore how a straw or lip trill changes the feeling of a gentle sound; comfort is your cue to continue.",
    "explanation": "A straw or a lip trill puts a small obstruction in front of the mouth, and the air pressure it builds above the vocal folds pushes back against the airstream from below. That balance lets the folds vibrate fully at a fraction of the effort, so the sound comes easily without you pressing. It also makes blowing too hard obvious: push at a lip trill and it simply stops, which is why these sounds suit the start of a warm-up.",
    "prerequisites": [
      "v-l1-m3-04"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Straw scale or Lip-trill arpeggio. Hear the reference, choose a comfortable key, then stop it before singing. The reading Breath: support versus pressure is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Begin at a comfortable middle pitch with a straw in air or a loose lip trill. Keep the sound small; the exercise should feel easier than open singing.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Semi-occluded warm-up",
        "body": "Explore how a straw or lip trill changes the feeling of a gentle sound; comfort is your cue to continue. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The cheeks, jaw, and neck remain loose; the straw stays lightly sealed or the lips continue vibrating without being clamped.",
        "listen": "The buzz or straw tone stays continuous and even, without sudden blasts, pressed starts, or a pitch leap used to rescue the sound."
      },
      {
        "title": "Hear the distinction",
        "body": "Sing the same comfortable five-note pattern twice in one take: first on an open “ah”, then through a straw, or on a lip trill, at the same pitch and the same easy volume. The obstruction is the only thing that changes. Notice which version needed less effort in the throat and which kept the sound more even; the straw version is meant to be the easier one, and if it is not, make the sound smaller. Record your takes in the recorder. Hold or slide through a narrow range with steady airflow and no push. Reset between attempts instead of extending a fading trill by force.",
        "look": "The cheeks, jaw, and neck remain loose; the straw stays lightly sealed or the lips continue vibrating without being clamped.",
        "listen": "The buzz or straw tone stays continuous and even, without sudden blasts, pressed starts, or a pitch leap used to rescue the sound."
      },
      {
        "title": "Review your own attempt",
        "body": "I tried the straw or lip-trill pattern gently, with an easy breath and a full rest between attempts. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If the trill stops, reduce volume and range, check that the lips are loose, or return to a straw. Do not add throat pressure to keep it going."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 30,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Back Pressure Does the Work.”"
      },
      {
        "seconds": 45,
        "instruction": "Isolate the semi-occluded warm-up target in short, comfortable examples."
      },
      {
        "seconds": 60,
        "instruction": "Practise or record the complete “Back Pressure Does the Work” task, resetting between attempts."
      },
      {
        "seconds": 45,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I tried the straw or lip-trill pattern gently, with an easy breath and a full rest between attempts.",
        "The buzz or straw tone stays continuous and even, without sudden blasts, pressed starts, or a pitch leap used to rescue the sound.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If the trill stops, reduce volume and range, check that the lips are loose, or return to a straw. Do not add throat pressure to keep it going. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I tried the straw or lip-trill pattern gently, with an easy breath and a full rest between attempts. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Absence of strain, correct laryngeal behavior, vocal health, or readiness for a wider or louder exercise."
    }
  },
  {
    "id": "v-l2-m1-03",
    "stageId": "v-l2",
    "moduleId": "v-l2-m1",
    "stageSlug": "steady-tone",
    "moduleSlug": "straw-and-lip-trill",
    "slug": "straw-slides",
    "title": "Straw Slides",
    "type": "exercise",
    "minutes": 5,
    "objective": "Sirens through a straw, top to bottom, no break.",
    "explanation": "",
    "prerequisites": [
      "v-l2-m1-01"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Straw scale or Lip-trill arpeggio. Hear the reference, choose a comfortable key, then stop it before singing. The reading Breath: support versus pressure is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Begin at a comfortable middle pitch with a straw in air or a loose lip trill. Keep the sound small; the exercise should feel easier than open singing.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Semi-occluded warm-up",
        "body": "Sirens through a straw, top to bottom, no break. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The cheeks, jaw, and neck remain loose; the straw stays lightly sealed or the lips continue vibrating without being clamped.",
        "listen": "The buzz or straw tone stays continuous and even, without sudden blasts, pressed starts, or a pitch leap used to rescue the sound."
      },
      {
        "title": "Alternate attempt and reset",
        "body": "Work in short repetitions with a normal breath and complete release between them. Hold or slide through a narrow range with steady airflow and no push. Reset between attempts instead of extending a fading trill by force.",
        "look": "The cheeks, jaw, and neck remain loose; the straw stays lightly sealed or the lips continue vibrating without being clamped.",
        "listen": "The buzz or straw tone stays continuous and even, without sudden blasts, pressed starts, or a pitch leap used to rescue the sound."
      },
      {
        "title": "Review your own attempt",
        "body": "I tried the straw or lip-trill pattern gently, with an easy breath and a full rest between attempts. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If the trill stops, reduce volume and range, check that the lips are loose, or return to a straw. Do not add throat pressure to keep it going."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Straw Slides.”"
      },
      {
        "seconds": 75,
        "instruction": "Isolate the semi-occluded warm-up target in short, comfortable examples."
      },
      {
        "seconds": 120,
        "instruction": "Practise or record the complete “Straw Slides” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I tried the straw or lip-trill pattern gently, with an easy breath and a full rest between attempts.",
        "The buzz or straw tone stays continuous and even, without sudden blasts, pressed starts, or a pitch leap used to rescue the sound.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If the trill stops, reduce volume and range, check that the lips are loose, or return to a straw. Do not add throat pressure to keep it going. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I tried the straw or lip-trill pattern gently, with an easy breath and a full rest between attempts. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Absence of strain, correct laryngeal behavior, vocal health, or readiness for a wider or louder exercise."
    }
  },
  {
    "id": "v-l2-m1-06",
    "stageId": "v-l2",
    "moduleId": "v-l2-m1",
    "stageSlug": "steady-tone",
    "moduleSlug": "straw-and-lip-trill",
    "slug": "self-check-an-easy-straw-pattern",
    "title": "Self-Check: An Easy Straw Pattern",
    "type": "checkpoint",
    "minutes": 4,
    "objective": "Try the straw or lip-trill pattern gently, with an easy breath and a full rest between attempts. This is a listening and reflection check.",
    "explanation": "",
    "prerequisites": [
      "v-l2-m1-03"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Straw scale or Lip-trill arpeggio. Hear the reference, choose a comfortable key, then stop it before singing. The reading Breath: support versus pressure is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Begin at a comfortable middle pitch with a straw in air or a loose lip trill. Keep the sound small; the exercise should feel easier than open singing.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Semi-occluded warm-up",
        "body": "An easy straw or lip-trill pattern across a comfortable span. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The cheeks, jaw, and neck remain loose; the straw stays lightly sealed or the lips continue vibrating without being clamped.",
        "listen": "The buzz or straw tone stays continuous and even, without sudden blasts, pressed starts, or a pitch leap used to rescue the sound."
      },
      {
        "title": "Make one evidence take",
        "body": "State the checkpoint target, record one uninterrupted attempt in the [recorder](/recorder), and keep the result even when it does not pass. Hold or slide through a narrow range with steady airflow and no push. Reset between attempts instead of extending a fading trill by force.",
        "look": "The cheeks, jaw, and neck remain loose; the straw stays lightly sealed or the lips continue vibrating without being clamped.",
        "listen": "The buzz or straw tone stays continuous and even, without sudden blasts, pressed starts, or a pitch leap used to rescue the sound."
      },
      {
        "title": "Review your own attempt",
        "body": "I tried the straw or lip-trill pattern gently, with an easy breath and a full rest between attempts. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If the trill stops, reduce volume and range, check that the lips are loose, or return to a straw. Do not add throat pressure to keep it going."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 30,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Self-Check: An Easy Straw Pattern.”"
      },
      {
        "seconds": 60,
        "instruction": "Isolate the semi-occluded warm-up target in short, comfortable examples."
      },
      {
        "seconds": 90,
        "instruction": "Practise or record the complete “Self-Check: An Easy Straw Pattern” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I tried the straw or lip-trill pattern gently, with an easy breath and a full rest between attempts.",
        "The buzz or straw tone stays continuous and even, without sudden blasts, pressed starts, or a pitch leap used to rescue the sound.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "On two different days, the straw or lip-trill pattern runs its whole span without the buzz stopping and feels easier than the same notes on a vowel.",
      "ifNotReady": "If the trill stops, reduce volume and range, check that the lips are loose, or return to a straw. Do not add throat pressure to keep it going. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I tried the straw or lip-trill pattern gently, with an easy breath and a full rest between attempts. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Absence of strain, correct laryngeal behavior, vocal health, or readiness for a wider or louder exercise."
    }
  },
  {
    "id": "v-l2-m2-01",
    "stageId": "v-l2",
    "moduleId": "v-l2-m2",
    "stageSlug": "steady-tone",
    "moduleSlug": "land-the-note",
    "slug": "onset-without-the-click",
    "title": "Onset Without the Click",
    "type": "concept",
    "minutes": 3,
    "objective": "Compare an easy onset with a previous attempt; the synthesized reference supplies pitch, not a demonstration of vocal technique.",
    "explanation": "An onset is how a note starts, and there are three basic ways to start one. A breathy onset lets air through before the folds meet, so a small “h” comes first; a hard, or glottal, onset closes the folds before the air arrives and releases them with a little click; a balanced onset starts the breath and the sound together. This module trains the balanced one, on its pitch from the first moment, because sliding up into a note from below is a separate habit, a scoop, and onset work is where it gets fixed.",
    "prerequisites": [
      "v-l2-m1-06"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Five-note scale or Chromatic neighbor. Hear the reference, choose a comfortable key, then stop it before singing. The reading What pitch accuracy actually measures is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Choose a target near the middle of your comfortable range. Hear it once, stop the reference, breathe normally, and prepare the vowel before starting.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Onset and pitch matching",
        "body": "Compare an easy onset with a previous attempt; the synthesized reference supplies pitch, not a demonstration of vocal technique. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Keep the supplied reference or reading visible, settle your posture, and use only a pitch and duration you can repeat comfortably.",
        "listen": "The beginning sounds clean and intentional, with one pitch center rather than a click, breathy delay, or rising slide."
      },
      {
        "title": "Hear the distinction",
        "body": "Sing “ah” on one comfortable note three ways in one take, with a quiet breath between each: first with a soft “h” leading in (breathy); then once, gently, from a held breath so it starts with a small catch (the click); then with breath and sound starting together, like the start of a sigh without the “h”. Only the onset changes, so keep the pitch and the volume the same. The third, on its pitch from the first moment rather than sliding up from below, is the onset this module trains. Record your takes in the recorder. Hold briefly, release, and compare a fresh attempt instead of steering one long note with your eyes.",
        "look": "Keep the supplied reference or reading visible, settle your posture, and use only a pitch and duration you can repeat comfortably.",
        "listen": "The beginning sounds clean and intentional, with one pitch center rather than a click, breathy delay, or rising slide."
      },
      {
        "title": "Review your own attempt",
        "body": "I heard the five-note scale reference, sang the pattern from silence, and compared each entry by ear. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If you scoop, silently imagine the pitch, use a quiet hum first, then open to the vowel without changing pitch. Reduce volume if the onset feels hard."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 30,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Onset Without the Click.”"
      },
      {
        "seconds": 45,
        "instruction": "Isolate the onset and pitch matching target in short, comfortable examples."
      },
      {
        "seconds": 60,
        "instruction": "Practise or record the complete “Onset Without the Click” task, resetting between attempts."
      },
      {
        "seconds": 45,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I heard the five-note scale reference, sang the pattern from silence, and compared each entry by ear.",
        "The beginning sounds clean and intentional, with one pitch center rather than a click, breathy delay, or rising slide.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If you scoop, silently imagine the pitch, use a quiet hum first, then open to the vowel without changing pitch. Reduce volume if the onset feels hard. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I heard the five-note scale reference, sang the pattern from silence, and compared each entry by ear. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Which onset mechanism you used, freedom from strain, tone quality, or accuracy when no confident pitch was detected."
    }
  },
  {
    "id": "v-l2-m2-03",
    "stageId": "v-l2",
    "moduleId": "v-l2-m2",
    "stageSlug": "steady-tone",
    "moduleSlug": "land-the-note",
    "slug": "match-five-no-scoop",
    "title": "Match Five, No Scoop",
    "type": "exercise",
    "minutes": 5,
    "objective": "Arrive on the note, do not slide up to it.",
    "explanation": "",
    "prerequisites": [
      "v-l2-m2-01"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Five-note scale or Chromatic neighbor. Hear the reference, choose a comfortable key, then stop it before singing. The reading What pitch accuracy actually measures is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Choose a target near the middle of your comfortable range. Hear it once, stop the reference, breathe normally, and prepare the vowel before starting.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Onset and pitch matching",
        "body": "Arrive on the note, do not slide up to it. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Keep the supplied reference or reading visible, settle your posture, and use only a pitch and duration you can repeat comfortably.",
        "listen": "The beginning sounds clean and intentional, with one pitch center rather than a click, breathy delay, or rising slide."
      },
      {
        "title": "Alternate attempt and reset",
        "body": "Work in short repetitions with a normal breath and complete release between them. Begin close to the pitch rather than sliding up from below. Hold briefly, release, and compare a fresh attempt instead of steering one long note with your eyes.",
        "look": "Keep the supplied reference or reading visible, settle your posture, and use only a pitch and duration you can repeat comfortably.",
        "listen": "The beginning sounds clean and intentional, with one pitch center rather than a click, breathy delay, or rising slide."
      },
      {
        "title": "Review your own attempt",
        "body": "I heard the five-note scale reference, sang the pattern from silence, and compared each entry by ear. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If you scoop, silently imagine the pitch, use a quiet hum first, then open to the vowel without changing pitch. Reduce volume if the onset feels hard."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Match Five, No Scoop.”"
      },
      {
        "seconds": 75,
        "instruction": "Isolate the onset and pitch matching target in short, comfortable examples."
      },
      {
        "seconds": 120,
        "instruction": "Practise or record the complete “Match Five, No Scoop” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I heard the five-note scale reference, sang the pattern from silence, and compared each entry by ear.",
        "The beginning sounds clean and intentional, with one pitch center rather than a click, breathy delay, or rising slide.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If you scoop, silently imagine the pitch, use a quiet hum first, then open to the vowel without changing pitch. Reduce volume if the onset feels hard. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I heard the five-note scale reference, sang the pattern from silence, and compared each entry by ear. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Which onset mechanism you used, freedom from strain, tone quality, or accuracy when no confident pitch was detected."
    }
  },
  {
    "id": "v-l2-m2-06",
    "stageId": "v-l2",
    "moduleId": "v-l2-m2",
    "stageSlug": "steady-tone",
    "moduleSlug": "land-the-note",
    "slug": "self-check-match-the-five-note-pattern",
    "title": "Self-Check: Match the Five-Note Pattern",
    "type": "checkpoint",
    "minutes": 4,
    "objective": "Hear the five-note scale reference, sing the pattern from silence, and compare each entry by ear. This is a listening and reflection check.",
    "explanation": "",
    "prerequisites": [
      "v-l2-m2-03"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Five-note scale or Chromatic neighbor. Hear the reference, choose a comfortable key, then stop it before singing. The reading What pitch accuracy actually measures is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Choose a target near the middle of your comfortable range. Hear it once, stop the reference, breathe normally, and prepare the vowel before starting.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Onset and pitch matching",
        "body": "Hear the supplied five-note scale, then sing from silence. Compare the pitches by ear. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Keep the supplied reference or reading visible, settle your posture, and use only a pitch and duration you can repeat comfortably.",
        "listen": "The beginning sounds clean and intentional, with one pitch center rather than a click, breathy delay, or rising slide."
      },
      {
        "title": "Make one evidence take",
        "body": "State the checkpoint target, record one uninterrupted attempt in the [recorder](/recorder), and keep the result even when it does not pass. Begin close to the pitch rather than sliding up from below. Hold briefly, release, and compare a fresh attempt instead of steering one long note with your eyes.",
        "look": "Keep the supplied reference or reading visible, settle your posture, and use only a pitch and duration you can repeat comfortably.",
        "listen": "The beginning sounds clean and intentional, with one pitch center rather than a click, breathy delay, or rising slide."
      },
      {
        "title": "Review your own attempt",
        "body": "I heard the five-note scale reference, sang the pattern from silence, and compared each entry by ear. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If you scoop, silently imagine the pitch, use a quiet hum first, then open to the vowel without changing pitch. Reduce volume if the onset feels hard."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 30,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Self-Check: Match the Five-Note Pattern.”"
      },
      {
        "seconds": 60,
        "instruction": "Isolate the onset and pitch matching target in short, comfortable examples."
      },
      {
        "seconds": 90,
        "instruction": "Practise or record the complete “Self-Check: Match the Five-Note Pattern” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I heard the five-note scale reference, sang the pattern from silence, and compared each entry by ear.",
        "The beginning sounds clean and intentional, with one pitch center rather than a click, breathy delay, or rising slide.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "On two different days, you sing the five-note pattern from silence three times in a row and, on playback, every note starts on its pitch rather than sliding up into it.",
      "ifNotReady": "If you scoop, silently imagine the pitch, use a quiet hum first, then open to the vowel without changing pitch. Reduce volume if the onset feels hard. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I heard the five-note scale reference, sang the pattern from silence, and compared each entry by ear. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Which onset mechanism you used, freedom from strain, tone quality, or accuracy when no confident pitch was detected."
    }
  },
  {
    "id": "v-l2-m3-01",
    "stageId": "v-l2",
    "moduleId": "v-l2-m3",
    "stageSlug": "steady-tone",
    "moduleSlug": "hold-it",
    "slug": "steady-is-a-skill-not-a-talent",
    "title": "Steady Is a Skill, Not a Talent",
    "type": "concept",
    "minutes": 3,
    "objective": "Listen for drift on a short, comfortable hold and change one thing at a time.",
    "explanation": "A held note usually drifts for a reason you can change: the breath pressure under it falls away as the air runs out, and the pitch sags with it. Keeping it steady means keeping that pressure even, with the ribs staying open and the release slow, which is a coordination you build with short, repeated holds rather than something a voice either has or lacks. A small, regular wave around one pitch is vibrato and is fine; a slow lean away from the note is drift, so hold only as long as the end still sounds like the start.",
    "prerequisites": [
      "v-l2-m2-06"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Sustained hold or Soft sustain. Hear the reference, choose a comfortable key, then stop it before singing. The reading Breath: support versus pressure is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Use a comfortable pitch and moderate volume. Let the reference stop before singing, and choose a duration you can finish without running empty.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Sustained tone",
        "body": "Listen for drift on a short, comfortable hold and change one thing at a time. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Keep the supplied reference or reading visible, settle your posture, and use only a pitch and duration you can repeat comfortably.",
        "listen": "The tone does not sag at the end, pulse with changing air pressure, or become louder to compensate for lost steadiness."
      },
      {
        "title": "Hear the distinction",
        "body": "Hear Sustained hold once and stop the reference. Then, in the [recorder](/recorder), record two holds on the same comfortable note in one take, with a quiet breath between them: the first for a slow count of eight, the second for a count of four. The length is the only thing that changes. Play both back and compare how each one ends: if the longer hold sags flat or thins at the end while the shorter one ends on the pitch it started on, practise at the shorter length and add a count only once its end matches its start. Aim for one centered pitch and an even release. Judge it by ear, not by the display.",
        "look": "Keep the supplied reference or reading visible, settle your posture, and use only a pitch and duration you can repeat comfortably.",
        "listen": "The tone does not sag at the end, pulse with changing air pressure, or become louder to compensate for lost steadiness."
      },
      {
        "title": "Review your own attempt",
        "body": "I matched the sustained reference, released comfortably, and listened for a steady center on repeated short holds. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If the note drifts, shorten it, reset the breath, and correct one direction on the next attempt. Do not chase every frame while still singing."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 30,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Steady Is a Skill, Not a Talent.”"
      },
      {
        "seconds": 45,
        "instruction": "Isolate the sustained tone target in short, comfortable examples."
      },
      {
        "seconds": 60,
        "instruction": "Practise or record the complete “Steady Is a Skill, Not a Talent” task, resetting between attempts."
      },
      {
        "seconds": 45,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I matched the sustained reference, released comfortably, and listened for a steady center on repeated short holds.",
        "The tone does not sag at the end, pulse with changing air pressure, or become louder to compensate for lost steadiness.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If the note drifts, shorten it, reset the breath, and correct one direction on the next attempt. Do not chase every frame while still singing. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I matched the sustained reference, released comfortably, and listened for a steady center on repeated short holds. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Why the pitch moved, breath technique, vibrato quality, tone quality, or freedom from strain."
    }
  },
  {
    "id": "v-l2-m3-04",
    "stageId": "v-l2",
    "moduleId": "v-l2-m3",
    "stageSlug": "steady-tone",
    "moduleSlug": "hold-it",
    "slug": "one-note-per-bar",
    "title": "One Note Per Bar",
    "type": "exercise",
    "minutes": 5,
    "objective": "Use the supplied sustained reference for short holds, resting between them.",
    "explanation": "",
    "prerequisites": [
      "v-l2-m3-01"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Sustained hold or Soft sustain. Hear the reference, choose a comfortable key, then stop it before singing. The reading Breath: support versus pressure is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Use a comfortable pitch and moderate volume. Let the reference stop before singing, and choose a duration you can finish without running empty.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Sustained tone",
        "body": "Use the supplied sustained reference for short holds, resting between them. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Keep the supplied reference or reading visible, settle your posture, and use only a pitch and duration you can repeat comfortably.",
        "listen": "The tone does not sag at the end, pulse with changing air pressure, or become louder to compensate for lost steadiness."
      },
      {
        "title": "One note per bar",
        "body": "Count a slow four. Hear Sustained hold once and stop the reference, then sing four short holds, each lasting one bar, with a full bar of rest between them. Aim for one centered pitch and an even release. Compare the start and end of each hold by ear; judge it by ear, not by the display.",
        "look": "Keep the supplied reference or reading visible, settle your posture, and use only a pitch and duration you can repeat comfortably.",
        "listen": "The tone does not sag at the end, pulse with changing air pressure, or become louder to compensate for lost steadiness."
      },
      {
        "title": "Review your own attempt",
        "body": "I matched the sustained reference, released comfortably, and listened for a steady center on repeated short holds. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If the note drifts, shorten it, reset the breath, and correct one direction on the next attempt. Do not chase every frame while still singing."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “One Note Per Bar.”"
      },
      {
        "seconds": 75,
        "instruction": "Isolate the sustained tone target in short, comfortable examples."
      },
      {
        "seconds": 120,
        "instruction": "Practise or record the complete “One Note Per Bar” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I matched the sustained reference, released comfortably, and listened for a steady center on repeated short holds.",
        "The tone does not sag at the end, pulse with changing air pressure, or become louder to compensate for lost steadiness.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If the note drifts, shorten it, reset the breath, and correct one direction on the next attempt. Do not chase every frame while still singing. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I matched the sustained reference, released comfortably, and listened for a steady center on repeated short holds. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Why the pitch moved, breath technique, vibrato quality, tone quality, or freedom from strain."
    }
  },
  {
    "id": "v-l2-m3-06",
    "stageId": "v-l2",
    "moduleId": "v-l2-m3",
    "stageSlug": "steady-tone",
    "moduleSlug": "hold-it",
    "slug": "self-check-a-steady-short-hold",
    "title": "Self-Check: A Steady Short Hold",
    "type": "checkpoint",
    "minutes": 4,
    "objective": "Match the sustained reference, release comfortably, and listen for a steady center on repeated short holds. This is a listening and reflection check.",
    "explanation": "",
    "prerequisites": [
      "v-l2-m3-04"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Sustained hold or Soft sustain. Hear the reference, choose a comfortable key, then stop it before singing. The reading Breath: support versus pressure is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Use a comfortable pitch and moderate volume. Let the reference stop before singing, and choose a duration you can finish without running empty.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Sustained tone",
        "body": "Compare the beginning and ending of a comfortable hold by ear; the warm-up's score only counts time within 50 cents of the note, so a slow sag inside that window is yours to hear. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Keep the supplied reference or reading visible, settle your posture, and use only a pitch and duration you can repeat comfortably.",
        "listen": "The tone does not sag at the end, pulse with changing air pressure, or become louder to compensate for lost steadiness."
      },
      {
        "title": "Make one evidence take",
        "body": "State the checkpoint target, record one uninterrupted attempt in the [recorder](/recorder), and keep the result even when it does not pass. Aim for one centered pitch and an even release. Hear Sustained hold once, stop the reference, then sing your short comfortable holds in that one recorder take. Compare the start and end of each on playback; judge it by ear, not by the display.",
        "look": "Keep the supplied reference or reading visible, settle your posture, and use only a pitch and duration you can repeat comfortably.",
        "listen": "The tone does not sag at the end, pulse with changing air pressure, or become louder to compensate for lost steadiness."
      },
      {
        "title": "Review your own attempt",
        "body": "I matched the sustained reference, released comfortably, and listened for a steady center on repeated short holds. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If the note drifts, shorten it, reset the breath, and correct one direction on the next attempt. Do not chase every frame while still singing."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 30,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Self-Check: A Steady Short Hold.”"
      },
      {
        "seconds": 60,
        "instruction": "Isolate the sustained tone target in short, comfortable examples."
      },
      {
        "seconds": 90,
        "instruction": "Practise or record the complete “Self-Check: A Steady Short Hold” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I matched the sustained reference, released comfortably, and listened for a steady center on repeated short holds.",
        "The tone does not sag at the end, pulse with changing air pressure, or become louder to compensate for lost steadiness.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "On two different days, three short holds in a row start and end on the same pitch to your ear at a comfortable volume.",
      "ifNotReady": "If the note drifts, shorten it, reset the breath, and correct one direction on the next attempt. Do not chase every frame while still singing. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I matched the sustained reference, released comfortably, and listened for a steady center on repeated short holds. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Why the pitch moved, breath technique, vibrato quality, tone quality, or freedom from strain."
    }
  },
  {
    "id": "v-l2-m4-01",
    "stageId": "v-l2",
    "moduleId": "v-l2-m4",
    "stageSlug": "steady-tone",
    "moduleSlug": "first-song-one-register",
    "slug": "your-key-not-the-records-key",
    "title": "Your Key, Not the Record's Key",
    "type": "concept",
    "minutes": 3,
    "objective": "The song moves to you. This is the singing equivalent of a capo.",
    "explanation": "A recording's key was chosen for one singer on one set of days, so it is a fact about that session, not about the song, and changing it is ordinary practice. Move the whole song up or down by semitones until the stretch where the melody spends most of its time sits in the easy middle of your voice, then check that the highest note comes without a push and the lowest is still clearly audible. Once you have taken the range test, songs open fitted to your measured range and you can shift them a semitone at a time; without a saved range they open in the written key and are scored in either octave.",
    "prerequisites": [
      "v-l2-m3-06"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Amazing Grace or Amazing Grace (Opening Lines, Verses 1 & 2). Hear the reference, choose a comfortable key, then stop it before singing. The reading Choosing songs that actually fit is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Start from the key the song opens in: fitted to your measured range if you have taken the range test; if not, the written key, with either octave scored. Shift it by semitones until every phrase fits the easy part of your voice. Speak the words and mark breaths before singing the supplied study.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: First repertoire",
        "body": "The song moves to you. This is the singing equivalent of a capo. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The chosen key keeps the melody inside your range; phrase starts, breaths, and the final note are marked before the take.",
        "listen": "The pitch center and words stay recognizable from beginning to end, without a forced high note or a fading low note."
      },
      {
        "title": "Hear the distinction",
        "body": "Open Amazing Grace in the songbook and sing its opening phrase (“Amazing grace, how sweet the sound, that saved a wretch like me”) in the key it opens in. Then shift it one semitone up or down with the transpose control, whichever way looks easier, and sing the same phrase again. The key is the only thing that changes. Compare the second line of each: keep the key in which the highest note comes without a push and the lowest is still clearly audible, and write it down. Keep one consistent, comfortable production through the phrase.",
        "look": "The chosen key keeps the melody inside your range; phrase starts, breaths, and the final note are marked before the take.",
        "listen": "The pitch center and words stay recognizable from beginning to end, without a forced high note or a fading low note."
      },
      {
        "title": "Review your own attempt",
        "body": "I rehearsed the supplied Amazing Grace phrase and study arrangement in a key that felt comfortable. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If one phrase repeatedly tightens or disappears, transpose again or shorten the phrase. A famous key is never more important than a usable one."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 30,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Your Key, Not the Record's Key.”"
      },
      {
        "seconds": 45,
        "instruction": "Isolate the first repertoire target in short, comfortable examples."
      },
      {
        "seconds": 60,
        "instruction": "Practise or record the complete “Your Key, Not the Record's Key” task, resetting between attempts."
      },
      {
        "seconds": 45,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I rehearsed the supplied Amazing Grace phrase and study arrangement in a key that felt comfortable.",
        "The pitch center and words stay recognizable from beginning to end, without a forced high note or a fading low note.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If one phrase repeatedly tightens or disappears, transpose again or shorten the phrase. A famous key is never more important than a usable one. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I rehearsed the supplied Amazing Grace phrase and study arrangement in a key that felt comfortable. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Register identity, absence of a register break, vocal health, stylistic quality, or mastery at another tempo."
    }
  },
  {
    "id": "v-l2-m4-04",
    "stageId": "v-l2",
    "moduleId": "v-l2-m4",
    "stageSlug": "steady-tone",
    "moduleSlug": "first-song-one-register",
    "slug": "amazing-grace-phrase-to-study",
    "title": "Amazing Grace: Phrase to Study",
    "type": "song",
    "minutes": 6,
    "objective": "Rehearse the supplied Amazing Grace phrase and study arrangement. Choose a comfortable key before singing.",
    "explanation": "",
    "prerequisites": [
      "v-l2-m4-01"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Amazing Grace or Amazing Grace (Opening Lines, Verses 1 & 2). Hear the reference, choose a comfortable key, then stop it before singing. The reading Choosing songs that actually fit is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Start from the key the song opens in: fitted to your measured range if you have taken the range test; if not, the written key, with either octave scored. Shift it by semitones until every phrase fits the easy part of your voice. Speak the words and mark breaths before singing the supplied study.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: First repertoire",
        "body": "Rehearse the supplied Amazing Grace phrase and study arrangement. Choose a comfortable key before singing. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The chosen key keeps the melody inside your range; phrase starts, breaths, and the final note are marked before the take.",
        "listen": "The pitch center and words stay recognizable from beginning to end, without a forced high note or a fading low note."
      },
      {
        "title": "Build the song from phrases",
        "body": "Mark the key, breaths, range edges, and lesson target before a full take of Amazing Grace. Rehearse the hardest phrase alone, join two phrases, then record one uninterrupted form. Keep one consistent, comfortable production through the song. Work phrase by phrase, then join the form without changing key to imitate a recording.",
        "look": "The chosen key keeps the melody inside your range; phrase starts, breaths, and the final note are marked before the take.",
        "listen": "The pitch center and words stay recognizable from beginning to end, without a forced high note or a fading low note."
      },
      {
        "title": "Review your own attempt",
        "body": "I rehearsed the supplied Amazing Grace phrase and study arrangement in a key that felt comfortable. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If one phrase repeatedly tightens or disappears, transpose again or shorten the phrase. A famous key is never more important than a usable one."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Amazing Grace: Phrase to Study.”"
      },
      {
        "seconds": 90,
        "instruction": "Isolate the first repertoire target in short, comfortable examples."
      },
      {
        "seconds": 135,
        "instruction": "Practise or record the complete “Amazing Grace: Phrase to Study” task, resetting between attempts."
      },
      {
        "seconds": 90,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I rehearsed the supplied Amazing Grace phrase and study arrangement in a key that felt comfortable.",
        "The pitch center and words stay recognizable from beginning to end, without a forced high note or a fading low note.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If one phrase repeatedly tightens or disappears, transpose again or shorten the phrase. A famous key is never more important than a usable one. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I rehearsed the supplied Amazing Grace phrase and study arrangement in a key that felt comfortable. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Register identity, absence of a register break, vocal health, stylistic quality, or mastery at another tempo."
    }
  },
  {
    "id": "v-l2-m4-06",
    "stageId": "v-l2",
    "moduleId": "v-l2-m4",
    "stageSlug": "steady-tone",
    "moduleSlug": "first-song-one-register",
    "slug": "self-check-your-amazing-grace-study",
    "title": "Self-Check: Your Amazing Grace Study",
    "type": "checkpoint",
    "minutes": 5,
    "objective": "Rehearse the supplied Amazing Grace phrase and study arrangement in a key that feels comfortable. This is a listening and reflection check.",
    "explanation": "",
    "prerequisites": [
      "v-l2-m4-04"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Amazing Grace or Amazing Grace (Opening Lines, Verses 1 & 2). Hear the reference, choose a comfortable key, then stop it before singing. The reading Choosing songs that actually fit is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Start from the key the song opens in: fitted to your measured range if you have taken the range test; if not, the written key, with either octave scored. Shift it by semitones until every phrase fits the easy part of your voice. Speak the words and mark breaths before singing the supplied study.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: First repertoire",
        "body": "Sing the supplied study arrangement through after hearing its reference; note any place you stopped. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The chosen key keeps the melody inside your range; phrase starts, breaths, and the final note are marked before the take.",
        "listen": "The pitch center and words stay recognizable from beginning to end, without a forced high note or a fading low note."
      },
      {
        "title": "Make one evidence take",
        "body": "State the checkpoint target, record one uninterrupted attempt, and keep the result even when it does not pass. Keep one consistent, comfortable production through the song. Work phrase by phrase, then join the form without changing key to imitate a recording.",
        "look": "The chosen key keeps the melody inside your range; phrase starts, breaths, and the final note are marked before the take.",
        "listen": "The pitch center and words stay recognizable from beginning to end, without a forced high note or a fading low note."
      },
      {
        "title": "Review your own attempt",
        "body": "I rehearsed the supplied Amazing Grace phrase and study arrangement in a key that felt comfortable. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If one phrase repeatedly tightens or disappears, transpose again or shorten the phrase. A famous key is never more important than a usable one."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Self-Check: Your Amazing Grace Study.”"
      },
      {
        "seconds": 75,
        "instruction": "Isolate the first repertoire target in short, comfortable examples."
      },
      {
        "seconds": 120,
        "instruction": "Practise or record the complete “Self-Check: Your Amazing Grace Study” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I rehearsed the supplied Amazing Grace phrase and study arrangement in a key that felt comfortable.",
        "The pitch center and words stay recognizable from beginning to end, without a forced high note or a fading low note.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You sing the study through in your chosen key with no stops, neither end needed a push, and you have written that key down.",
      "ifNotReady": "If one phrase repeatedly tightens or disappears, transpose again or shorten the phrase. A famous key is never more important than a usable one. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I rehearsed the supplied Amazing Grace phrase and study arrangement in a key that felt comfortable. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Register identity, absence of a register break, vocal health, stylistic quality, or mastery at another tempo."
    }
  },
  {
    "id": "v-l3-m1-01",
    "stageId": "v-l3",
    "moduleId": "v-l3-m1",
    "stageSlug": "two-registers",
    "moduleSlug": "chest-head-falsetto",
    "slug": "registers-different-ways-to-make-a-sound",
    "title": "Registers: Different Ways to Make a Sound",
    "type": "concept",
    "minutes": 4,
    "objective": "What actually changes inside, and what each one is for.",
    "explanation": "A register is a way of setting up the vocal folds, and each setup handles one band of pitches well and gives out above it. In chest voice, the setup you speak in, the folds are shorter and thicker and close firmly, giving a full, speech-like tone; in head voice they are stretched longer and thinner but still close, giving a lighter tone that can still ring; in falsetto they are stretched without closing completely, so air leaks through and the sound is airy and hard to sing loudly. No single setup covers a whole range, which is why you have more than one, and the skill is choosing between them on purpose rather than hauling one past its ceiling.",
    "prerequisites": [
      "v-l2-m4-06"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Humming thirds or Wee from the fifth. Hear the reference, choose a comfortable key, then stop it before singing. The reading Registers, and why they exist is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Choose one easy pitch that can be produced lightly in more than one way. Keep attempts short and separate them with a quiet breath.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Register identification",
        "body": "What actually changes inside, and what each one is for. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Choose one note from Humming thirds before changing the sound. Keep the chin and neck easy; the displayed notes are the targets to aim for.",
        "listen": "Two repeatable tone qualities are audible at the same pitch without a sudden volume jump being the only difference."
      },
      {
        "title": "Hear the distinction",
        "body": "Pick one comfortable note from Humming thirds, low enough that you could say a word on it. Sing it on “ah” twice in one take, with a quiet breath between: first fuller and speech-like, as if calling a word across a small room; then lighter, with less weight, like a gentle hoot. The setup is the only thing that changes, so match pitch and volume as closely as you can. Record your takes in the recorder and listen for a change in color and weight, not just in loudness.",
        "look": "Choose one note from Humming thirds before changing the sound. Keep the chin and neck easy; the displayed notes are the targets to aim for.",
        "listen": "Two repeatable tone qualities are audible at the same pitch without a sudden volume jump being the only difference."
      },
      {
        "title": "Review your own attempt",
        "body": "I compared two easy productions of the same pitch and could describe the audible difference. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If the second version only appears by getting louder or tighter, lower the pitch and volume and make the contrast smaller."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 30,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Registers: Different Ways to Make a Sound.”"
      },
      {
        "seconds": 60,
        "instruction": "Isolate the register identification target in short, comfortable examples."
      },
      {
        "seconds": 90,
        "instruction": "Practise or record the complete “Registers: Different Ways to Make a Sound” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I compared two easy productions of the same pitch and could describe the audible difference.",
        "Two repeatable tone qualities are audible at the same pitch without a sudden volume jump being the only difference.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If the second version only appears by getting louder or tighter, lower the pitch and volume and make the contrast smaller. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I compared two easy productions of the same pitch and could describe the audible difference. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Chest, head, falsetto, M1, or M2 classification; no Suede surface identifies the mechanism from audio."
    }
  },
  {
    "id": "v-l3-m1-03",
    "stageId": "v-l3",
    "moduleId": "v-l3-m1",
    "stageSlug": "two-registers",
    "moduleSlug": "chest-head-falsetto",
    "slug": "same-pitch-two-ways",
    "title": "Same Pitch, Two Ways",
    "type": "exercise",
    "minutes": 5,
    "objective": "One note, switched deliberately between mechanisms.",
    "explanation": "",
    "prerequisites": [
      "v-l3-m1-01"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Humming thirds or Wee from the fifth. Hear the reference, choose a comfortable key, then stop it before singing. The reading Registers, and why they exist is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Choose one easy pitch that can be produced lightly in more than one way. Keep attempts short and separate them with a quiet breath.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Register identification",
        "body": "One note, switched deliberately between mechanisms. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Choose one note from Humming thirds before changing the sound. Keep the chin and neck easy; the displayed notes are the targets to aim for.",
        "listen": "Two repeatable tone qualities are audible at the same pitch without a sudden volume jump being the only difference."
      },
      {
        "title": "Alternate attempt and reset",
        "body": "Work in short repetitions with a normal breath and complete release between them. Contrast a fuller speech-like sound with a lighter sound at the same pitch. Match pitch and volume as closely as practical so the production change is what you hear. Record both contrast examples in one take with a quiet breath between them so both remain available for playback.",
        "look": "Choose one note from Humming thirds before changing the sound. Keep the chin and neck easy; the displayed notes are the targets to aim for.",
        "listen": "Two repeatable tone qualities are audible at the same pitch without a sudden volume jump being the only difference."
      },
      {
        "title": "Review your own attempt",
        "body": "I compared two easy productions of the same pitch and could describe the audible difference. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If the second version only appears by getting louder or tighter, lower the pitch and volume and make the contrast smaller."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Same Pitch, Two Ways.”"
      },
      {
        "seconds": 75,
        "instruction": "Isolate the register identification target in short, comfortable examples."
      },
      {
        "seconds": 120,
        "instruction": "Practise or record the complete “Same Pitch, Two Ways” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I compared two easy productions of the same pitch and could describe the audible difference.",
        "Two repeatable tone qualities are audible at the same pitch without a sudden volume jump being the only difference.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If the second version only appears by getting louder or tighter, lower the pitch and volume and make the contrast smaller. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I compared two easy productions of the same pitch and could describe the audible difference. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Chest, head, falsetto, M1, or M2 classification; no Suede surface identifies the mechanism from audio."
    }
  },
  {
    "id": "v-l3-m1-07",
    "stageId": "v-l3",
    "moduleId": "v-l3-m1",
    "stageSlug": "two-registers",
    "moduleSlug": "chest-head-falsetto",
    "slug": "self-check-switch-on-cue",
    "title": "Self-Check: Switch on Cue",
    "type": "checkpoint",
    "minutes": 5,
    "objective": "Before recording, roll a die six times and write the order (odd = fuller, even = lighter); switch on each cue in that order, both directions.",
    "explanation": "",
    "prerequisites": [
      "v-l3-m1-03"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Humming thirds or Wee from the fifth. Hear the reference, choose a comfortable key, then stop it before singing. The reading Registers, and why they exist is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Choose one easy pitch that can be produced lightly in more than one way. Keep attempts short and separate them with a quiet breath.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Register identification",
        "body": "Before recording, roll a die six times and write the order (odd = fuller, even = lighter); switch on each cue in that order, both directions. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Choose one note from Humming thirds before changing the sound. Keep the chin and neck easy; the displayed notes are the targets to aim for.",
        "listen": "Two repeatable tone qualities are audible at the same pitch without a sudden volume jump being the only difference."
      },
      {
        "title": "Make one evidence take",
        "body": "State the checkpoint target, record one uninterrupted attempt, and keep the result even when it does not pass. Contrast a fuller speech-like sound with a lighter sound at the same pitch. Match pitch and volume as closely as practical so the production change is what you hear. Record both contrast examples in one take with a quiet breath between them so both remain available for playback.",
        "look": "Choose one note from Humming thirds before changing the sound. Keep the chin and neck easy; the displayed notes are the targets to aim for.",
        "listen": "Two repeatable tone qualities are audible at the same pitch without a sudden volume jump being the only difference."
      },
      {
        "title": "Review your own attempt",
        "body": "I compared two easy productions of the same pitch and could describe the audible difference. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If the second version only appears by getting louder or tighter, lower the pitch and volume and make the contrast smaller."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Self-Check: Switch on Cue.”"
      },
      {
        "seconds": 75,
        "instruction": "Isolate the register identification target in short, comfortable examples."
      },
      {
        "seconds": 120,
        "instruction": "Practise or record the complete “Self-Check: Switch on Cue” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I compared two easy productions of the same pitch and could describe the audible difference.",
        "Two repeatable tone qualities are audible at the same pitch without a sudden volume jump being the only difference.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "On playback of one take, each of the six switches in your rolled order lands on the sound it called for, fuller or lighter, at the same pitch and in both directions, without getting louder to make the change.",
      "ifNotReady": "If the second version only appears by getting louder or tighter, lower the pitch and volume and make the contrast smaller. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I compared two easy productions of the same pitch and could describe the audible difference. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Chest, head, falsetto, M1, or M2 classification; no Suede surface identifies the mechanism from audio."
    }
  },
  {
    "id": "v-l3-m2-01",
    "stageId": "v-l3",
    "moduleId": "v-l3-m2",
    "stageSlug": "two-registers",
    "moduleSlug": "the-siren",
    "slug": "slide-through-do-not-jump-over",
    "title": "Slide Through, Do Not Jump Over",
    "type": "concept",
    "minutes": 4,
    "objective": "A crack is a gear change you did not plan.",
    "explanation": "As you slide upward, the folds have to shift gradually from a thicker setup to a thinner one, and around your transition the resonance that was helping the sound also drops away. Push through that and the change that could have spread over several notes happens on one, which you hear as a crack or a sudden flip. A slow, quiet slide gives the handover time to spread out; a fast one only skips past the seam, so slowing down is how you hear it and how you smooth it.",
    "prerequisites": [
      "v-l3-m1-07"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Octave siren or Easy fourth siren. If your range test spanned less than 21 semitones (under 1 octave + 9 on its Span), choose Easy fourth siren: in a narrower range the room's octave glide starts within two semitones of the lowest note you measured, or below it, and tops out on or within two of the highest. Hear the reference, choose a comfortable key, then stop it before singing. The reading Registers, and why they exist is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Start with a lip trill, hum, or narrow vowel across an easy five-note span before attempting the siren. Keep the endpoints inside your comfortable range.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Register blending",
        "body": "A crack is a gear change you did not plan. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Follow the start and end pitches in the supplied siren only where both sit inside your comfortable range, then stop playback before your attempt. Keep the jaw and neck easy while listening for the transition.",
        "listen": "Judge the continuity from your recorded playback. Listen for a jump, break, or abrupt change in tone; the reference notes do not show or evaluate your voice."
      },
      {
        "title": "Hear the distinction",
        "body": "Slide up an octave from a comfortable low note and back down on “oo” twice in one take, at the same quiet volume: first quickly, about a second each way, then slowly, five or six seconds each way. Speed is the only thing that changes. On playback, the fast slide may sound smooth because it skips past the change, while the slow one lets you hear where the voice wants to switch; that place is what this module works on. Record your takes in the recorder. Use less volume near the gear change and keep the vowel narrow. If your range test spanned less than 21 semitones, slide a fourth rather than an octave, starting a few notes above your lowest note, and widen it a step at a time only while both ends stay easy.",
        "look": "Follow the start and end pitches in the supplied siren only where both sit inside your comfortable range, then stop playback before your attempt. Keep the jaw and neck easy while listening for the transition.",
        "listen": "Judge the continuity from your recorded playback. Listen for a jump, break, or abrupt change in tone; the reference notes do not show or evaluate your voice."
      },
      {
        "title": "Review your own attempt",
        "body": "I followed a comfortable portion of the siren up and down and listened for continuity on each vowel. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If the sound flips abruptly, reduce volume and span, return to a trill or hum, and cross the same area more slowly. Stop if it feels tight."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 30,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Slide Through, Do Not Jump Over.”"
      },
      {
        "seconds": 60,
        "instruction": "Isolate the register blending target in short, comfortable examples."
      },
      {
        "seconds": 90,
        "instruction": "Practise or record the complete “Slide Through, Do Not Jump Over” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I followed a comfortable portion of the siren up and down and listened for continuity on each vowel.",
        "Judge the continuity from your recorded playback. Listen for a jump, break, or abrupt change in tone; the reference notes do not show or evaluate your voice.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If the sound flips abruptly, reduce volume and span, return to a trill or hum, and cross the same area more slowly. Stop if it feels tight. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I followed a comfortable portion of the siren up and down and listened for continuity on each vowel. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Absence of a register crack from a voiced-run number; the app shows pitch but does not detect register breaks."
    }
  },
  {
    "id": "v-l3-m2-02",
    "stageId": "v-l3",
    "moduleId": "v-l3-m2",
    "stageSlug": "two-registers",
    "moduleSlug": "the-siren",
    "slug": "octave-sirens-three-vowels",
    "title": "Octave Sirens, Three Vowels",
    "type": "exercise",
    "minutes": 6,
    "objective": "Slow slides. Speed hides the break instead of fixing it.",
    "explanation": "",
    "prerequisites": [
      "v-l3-m2-01"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Octave siren or Easy fourth siren. If your range test spanned less than 21 semitones (under 1 octave + 9 on its Span), choose Easy fourth siren: in a narrower range the room's octave glide starts within two semitones of the lowest note you measured, or below it, and tops out on or within two of the highest. Hear the reference, choose a comfortable key, then stop it before singing. The reading Registers, and why they exist is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Start with a lip trill, hum, or narrow vowel across an easy five-note span before attempting the siren. Keep the endpoints inside your comfortable range.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Register blending",
        "body": "Slow slides. Speed hides the break instead of fixing it. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Follow the start and end pitches in the supplied siren only where both sit inside your comfortable range, then stop playback before your attempt. Keep the jaw and neck easy while listening for the transition.",
        "listen": "Judge the continuity from your recorded playback. Listen for a jump, break, or abrupt change in tone; the reference notes do not show or evaluate your voice."
      },
      {
        "title": "Alternate attempt and reset",
        "body": "Work in short repetitions with a normal breath and complete release between them. Slide slowly enough to hear the transition instead of jumping across it. Use less volume near the gear change and keep the vowel narrow. In the warm-up room, open Adjust and set the tempo to 0.5×: each octave glide then takes about five seconds each way, the slow siren this module asks for; at the normal tempo it takes under two and a half. Learn the pace there with the reference, then stop it and record your sirens in the [recorder](/recorder), so you can judge them on playback. Use the same three narrow vowels each time, “oo”, then “oh”, then “ee”, and leave “ah” for later. If your range test spanned less than 21 semitones, slide a fourth rather than an octave, starting a few notes above your lowest note, and widen it a step at a time only while both ends stay easy.",
        "look": "Follow the start and end pitches in the supplied siren only where both sit inside your comfortable range, then stop playback before your attempt. Keep the jaw and neck easy while listening for the transition.",
        "listen": "Judge the continuity from your recorded playback. Listen for a jump, break, or abrupt change in tone; the reference notes do not show or evaluate your voice."
      },
      {
        "title": "Review your own attempt",
        "body": "I followed a comfortable portion of the siren up and down and listened for continuity on each vowel. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If the sound flips abruptly, reduce volume and span, return to a trill or hum, and cross the same area more slowly. Stop if it feels tight."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Octave Sirens, Three Vowels.”"
      },
      {
        "seconds": 90,
        "instruction": "Isolate the register blending target in short, comfortable examples."
      },
      {
        "seconds": 135,
        "instruction": "Practise or record the complete “Octave Sirens, Three Vowels” task, resetting between attempts."
      },
      {
        "seconds": 90,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I followed a comfortable portion of the siren up and down and listened for continuity on each vowel.",
        "Judge the continuity from your recorded playback. Listen for a jump, break, or abrupt change in tone; the reference notes do not show or evaluate your voice.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If the sound flips abruptly, reduce volume and span, return to a trill or hum, and cross the same area more slowly. Stop if it feels tight. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I followed a comfortable portion of the siren up and down and listened for continuity on each vowel. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Absence of a register crack from a voiced-run number; the app shows pitch but does not detect register breaks."
    }
  },
  {
    "id": "v-l3-m2-07",
    "stageId": "v-l3",
    "moduleId": "v-l3-m2",
    "stageSlug": "two-registers",
    "moduleSlug": "the-siren",
    "slug": "self-check-up-and-down-listening-for-a-crack",
    "title": "Self-Check: Up and Down, Listening for a Crack",
    "type": "checkpoint",
    "minutes": 5,
    "objective": "Three vowels, both directions. Judged by ear: nothing detects a register break.",
    "explanation": "",
    "prerequisites": [
      "v-l3-m2-02"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Octave siren or Easy fourth siren. If your range test spanned less than 21 semitones (under 1 octave + 9 on its Span), choose Easy fourth siren: in a narrower range the room's octave glide starts within two semitones of the lowest note you measured, or below it, and tops out on or within two of the highest. Hear the reference, choose a comfortable key, then stop it before singing. The reading Registers, and why they exist is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Start with a lip trill, hum, or narrow vowel across an easy five-note span before attempting the siren. Keep the endpoints inside your comfortable range.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Register blending",
        "body": "Three vowels, both directions. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Follow the start and end pitches in the supplied siren only where both sit inside your comfortable range, then stop playback before your attempt. Keep the jaw and neck easy while listening for the transition.",
        "listen": "Judge the continuity from your recorded playback. Listen for a jump, break, or abrupt change in tone; the reference notes do not show or evaluate your voice."
      },
      {
        "title": "Make one evidence take",
        "body": "State the checkpoint target, record one uninterrupted attempt in the [recorder](/recorder), and keep the result even when it does not pass. Slide slowly enough to hear the transition instead of jumping across it. Use less volume near the gear change and keep the vowel narrow. In the warm-up room, open Adjust and set the tempo to 0.5×: each octave glide then takes about five seconds each way, the slow siren this module asks for; at the normal tempo it takes under two and a half. Learn the pace there with the reference, then stop it and sing the three sirens in that one recorder take, so you can judge them on playback. Use the same three narrow vowels each time, “oo”, then “oh”, then “ee”, and leave “ah” for later. If your range test spanned less than 21 semitones, slide a fourth rather than an octave, starting a few notes above your lowest note, and widen it a step at a time only while both ends stay easy.",
        "look": "Follow the start and end pitches in the supplied siren only where both sit inside your comfortable range, then stop playback before your attempt. Keep the jaw and neck easy while listening for the transition.",
        "listen": "Judge the continuity from your recorded playback. Listen for a jump, break, or abrupt change in tone; the reference notes do not show or evaluate your voice."
      },
      {
        "title": "Review your own attempt",
        "body": "I followed a comfortable portion of the siren up and down and listened for continuity on each vowel. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If the sound flips abruptly, reduce volume and span, return to a trill or hum, and cross the same area more slowly. Stop if it feels tight."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Self-Check: Up and Down, Listening for a Crack.”"
      },
      {
        "seconds": 75,
        "instruction": "Isolate the register blending target in short, comfortable examples."
      },
      {
        "seconds": 120,
        "instruction": "Practise or record the complete “Self-Check: Up and Down, Listening for a Crack” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I followed a comfortable portion of the siren up and down and listened for continuity on each vowel.",
        "Judge the continuity from your recorded playback. Listen for a jump, break, or abrupt change in tone; the reference notes do not show or evaluate your voice.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "On two different days, three slow sirens in a row, one on each vowel, sound continuous to you on playback, up and down, at conversational volume.",
      "ifNotReady": "If the sound flips abruptly, reduce volume and span, return to a trill or hum, and cross the same area more slowly. Stop if it feels tight. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I followed a comfortable portion of the siren up and down and listened for continuity on each vowel. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Absence of a register crack from a voiced-run number; the app shows pitch but does not detect register breaks."
    }
  },
  {
    "id": "v-l3-m3-01",
    "stageId": "v-l3",
    "moduleId": "v-l3-m3",
    "stageSlug": "two-registers",
    "moduleSlug": "vowels-that-work",
    "slug": "five-shapes-one-tone",
    "title": "Five Shapes, One Tone",
    "type": "concept",
    "minutes": 4,
    "objective": "Why some vowels feel free and others close the throat.",
    "explanation": "A vowel is a shape of the throat and mouth that makes some of the voice's frequencies louder than others; the pitch comes from the folds and stays the same. Each vowel puts its resonances in a different place, so on the same note some shapes sit easily and others fight the pitch, and the closed vowels “ee” and “oo” run out of room first as you go higher. When one vowel tightens, keep the jaw released and the tongue forward and make that shape a little smaller or more open, rather than pushing harder, so the tone stays related from vowel to vowel.",
    "prerequisites": [
      "v-l3-m2-07"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Hung-ee-mm or Legato triad. Hear the reference, choose a comfortable key, then stop it before singing. The reading Resonance, placement and the vowel is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Choose a short mid-range phrase and establish it first on a neutral, easy vowel. Keep the jaw released and the tongue tip resting forward.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Vowel shapes and placement",
        "body": "Why some vowels feel free and others close the throat. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The jaw opening changes only as much as the vowel needs; the tongue and lips shape the vowel without neck movement.",
        "listen": "Each vowel remains intelligible while the phrase keeps a related tone and pitch center."
      },
      {
        "title": "Hear the distinction",
        "body": "Choose one comfortable note in your middle and sing it on “ee”, “eh”, “ah”, “oh” and “oo” in one take, sliding from one vowel to the next without stopping. Only the vowel changes: keep the pitch, volume and breath the same. Play it back and pick the vowel that sounds most pinched, most spread or louder than the rest; that is the shape to make smaller next time. Record your takes in the recorder. Then repeat the same pitch pattern on each vowel without spreading, swallowing, or changing volume to manufacture sameness.",
        "look": "The jaw opening changes only as much as the vowel needs; the tongue and lips shape the vowel without neck movement.",
        "listen": "Each vowel remains intelligible while the phrase keeps a related tone and pitch center."
      },
      {
        "title": "Review your own attempt",
        "body": "I sang the same short pattern on five vowels and compared the resulting tone by ear. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If one vowel pinches, return to the neutral vowel, make the troublesome shape smaller, and alternate the pair slowly."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 30,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Five Shapes, One Tone.”"
      },
      {
        "seconds": 60,
        "instruction": "Isolate the vowel shapes and placement target in short, comfortable examples."
      },
      {
        "seconds": 90,
        "instruction": "Practise or record the complete “Five Shapes, One Tone” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I sang the same short pattern on five vowels and compared the resulting tone by ear.",
        "Each vowel remains intelligible while the phrase keeps a related tone and pitch center.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If one vowel pinches, return to the neutral vowel, make the troublesome shape smaller, and alternate the pair slowly. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I sang the same short pattern on five vowels and compared the resulting tone by ear. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Formant values, vowel identity, resonance placement, or tone consistency measured by the app."
    }
  },
  {
    "id": "v-l3-m3-04",
    "stageId": "v-l3",
    "moduleId": "v-l3-m3",
    "stageSlug": "two-registers",
    "moduleSlug": "vowels-that-work",
    "slug": "phrase-on-five-vowels",
    "title": "Phrase on Five Vowels",
    "type": "exercise",
    "minutes": 6,
    "objective": "Same melody, five vowels, tone matched across all of them.",
    "explanation": "",
    "prerequisites": [
      "v-l3-m3-01"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Hung-ee-mm or Legato triad. Hear the reference, choose a comfortable key, then stop it before singing. The reading Resonance, placement and the vowel is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Choose a short mid-range phrase and establish it first on a neutral, easy vowel. Keep the jaw released and the tongue tip resting forward.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Vowel shapes and placement",
        "body": "Same melody, five vowels, tone matched across all of them. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The jaw opening changes only as much as the vowel needs; the tongue and lips shape the vowel without neck movement.",
        "listen": "Each vowel remains intelligible while the phrase keeps a related tone and pitch center."
      },
      {
        "title": "Alternate attempt and reset",
        "body": "Work in short repetitions with a normal breath and complete release between them. Repeat the same pitch pattern on each assigned vowel without spreading, swallowing, or changing volume to manufacture sameness.",
        "look": "The jaw opening changes only as much as the vowel needs; the tongue and lips shape the vowel without neck movement.",
        "listen": "Each vowel remains intelligible while the phrase keeps a related tone and pitch center."
      },
      {
        "title": "Review your own attempt",
        "body": "I sang the same short pattern on five vowels and compared the resulting tone by ear. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If one vowel pinches, return to the neutral vowel, make the troublesome shape smaller, and alternate the pair slowly."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Phrase on Five Vowels.”"
      },
      {
        "seconds": 90,
        "instruction": "Isolate the vowel shapes and placement target in short, comfortable examples."
      },
      {
        "seconds": 135,
        "instruction": "Practise or record the complete “Phrase on Five Vowels” task, resetting between attempts."
      },
      {
        "seconds": 90,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I sang the same short pattern on five vowels and compared the resulting tone by ear.",
        "Each vowel remains intelligible while the phrase keeps a related tone and pitch center.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If one vowel pinches, return to the neutral vowel, make the troublesome shape smaller, and alternate the pair slowly. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I sang the same short pattern on five vowels and compared the resulting tone by ear. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Formant values, vowel identity, resonance placement, or tone consistency measured by the app."
    }
  },
  {
    "id": "v-l3-m3-07",
    "stageId": "v-l3",
    "moduleId": "v-l3-m3",
    "stageSlug": "two-registers",
    "moduleSlug": "vowels-that-work",
    "slug": "self-check-tone-across-five-vowels",
    "title": "Self-Check: Tone Across Five Vowels",
    "type": "checkpoint",
    "minutes": 5,
    "objective": "Judged by your own ear against your own recording. No vowel or formant tracking exists to score this for you.",
    "explanation": "",
    "prerequisites": [
      "v-l3-m3-04"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Hung-ee-mm or Legato triad. Hear the reference, choose a comfortable key, then stop it before singing. The reading Resonance, placement and the vowel is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Choose a short mid-range phrase and establish it first on a neutral, easy vowel. Keep the jaw released and the tongue tip resting forward.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Vowel shapes and placement",
        "body": "Judged by your own ear against your own recording. No vowel or formant tracking exists to score this for you. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The jaw opening changes only as much as the vowel needs; the tongue and lips shape the vowel without neck movement.",
        "listen": "Each vowel remains intelligible while the phrase keeps a related tone and pitch center."
      },
      {
        "title": "Make one evidence take",
        "body": "State the checkpoint target, record one uninterrupted attempt in the [recorder](/recorder), and keep the result even when it does not pass. Repeat the same pitch pattern on each assigned vowel without spreading, swallowing, or changing volume to manufacture sameness.",
        "look": "The jaw opening changes only as much as the vowel needs; the tongue and lips shape the vowel without neck movement.",
        "listen": "Each vowel remains intelligible while the phrase keeps a related tone and pitch center."
      },
      {
        "title": "Review your own attempt",
        "body": "I sang the same short pattern on five vowels and compared the resulting tone by ear. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If one vowel pinches, return to the neutral vowel, make the troublesome shape smaller, and alternate the pair slowly."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Self-Check: Tone Across Five Vowels.”"
      },
      {
        "seconds": 75,
        "instruction": "Isolate the vowel shapes and placement target in short, comfortable examples."
      },
      {
        "seconds": 120,
        "instruction": "Practise or record the complete “Self-Check: Tone Across Five Vowels” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I sang the same short pattern on five vowels and compared the resulting tone by ear.",
        "Each vowel remains intelligible while the phrase keeps a related tone and pitch center.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "On playback, the same phrase on all five vowels keeps one pitch and a related tone, with every vowel still recognizable and none of them pinched, spread or pushed louder than the rest.",
      "ifNotReady": "If one vowel pinches, return to the neutral vowel, make the troublesome shape smaller, and alternate the pair slowly. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I sang the same short pattern on five vowels and compared the resulting tone by ear. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Formant values, vowel identity, resonance placement, or tone consistency measured by the app."
    }
  },
  {
    "id": "v-l3-m4-01",
    "stageId": "v-l3",
    "moduleId": "v-l3-m4",
    "stageSlug": "two-registers",
    "moduleSlug": "wider-phrases",
    "slug": "a-wider-phrase-one-comfortable-key",
    "title": "A Wider Phrase, One Comfortable Key",
    "type": "concept",
    "minutes": 4,
    "objective": "Why this song needs the siren you just built.",
    "explanation": "A wider phrase covers more notes than a first song, so it is more likely to cross the place where your voice changes gear. The key you choose decides where that crossing lands, and moving a song down does not always make it easier: it can drop the melody right onto the join. Pick a key where the high and low phrases both fit, mark the phrase that crosses, and sing that crossing the way you practised the siren, quieter and on a narrow vowel, rather than pushing the upper notes.",
    "prerequisites": [
      "v-l3-m3-07"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Deep River or Auld Lang Syne. Hear the reference, choose a comfortable key, then stop it before singing. The reading Choosing songs that actually fit is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Transpose the supplied study so its low and high phrases both fit, then mark the phrase that crosses your transition area.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Two-register repertoire",
        "body": "Why this song needs the siren you just built. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The written span fits inside your comfortable range and the crossing phrase has a planned vowel and breath.",
        "listen": "The melody stays accurate through both parts of the range and the crossing does not interrupt the phrase to your ear."
      },
      {
        "title": "Hear the distinction",
        "body": "Sing the phrase of Deep River that crosses your transition twice in one take: first in the key the song opens in, then one semitone lower. The key is the only thing that changes. Listen to where the crossing lands in each, and keep the key in which the change falls on an easier note or a more open vowel, as long as the low phrase is still clearly audible. Record your takes in the recorder. Rehearse the crossing as a siren and on the actual words before singing the supplied study. Reduce volume through the transition rather than pushing the upper phrase.",
        "look": "The written span fits inside your comfortable range and the crossing phrase has a planned vowel and breath.",
        "listen": "The melody stays accurate through both parts of the range and the crossing does not interrupt the phrase to your ear."
      },
      {
        "title": "Review your own attempt",
        "body": "I rehearsed the supplied Deep River phrase in a comfortable key and marked where my voice changed. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If the top is forced or the bottom disappears, change key. If the crossing cracks, isolate it on a hum before returning to the lyric."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 30,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “A Wider Phrase, One Comfortable Key.”"
      },
      {
        "seconds": 60,
        "instruction": "Isolate the two-register repertoire target in short, comfortable examples."
      },
      {
        "seconds": 90,
        "instruction": "Practise or record the complete “A Wider Phrase, One Comfortable Key” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I rehearsed the supplied Deep River phrase in a comfortable key and marked where my voice changed.",
        "The melody stays accurate through both parts of the range and the crossing does not interrupt the phrase to your ear.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If the top is forced or the bottom disappears, change key. If the crossing cracks, isolate it on a hum before returning to the lyric. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I rehearsed the supplied Deep River phrase in a comfortable key and marked where my voice changed. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Which register was used, absence of a register break, vowel strategy, or freedom from strain."
    }
  },
  {
    "id": "v-l3-m4-04",
    "stageId": "v-l3",
    "moduleId": "v-l3-m4",
    "stageSlug": "two-registers",
    "moduleSlug": "wider-phrases",
    "slug": "deep-river-a-wider-phrase",
    "title": "Deep River: A Wider Phrase",
    "type": "song",
    "minutes": 6,
    "objective": "Pick a key so the register change lands where yours is.",
    "explanation": "",
    "prerequisites": [
      "v-l3-m4-01"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Deep River or Auld Lang Syne. Hear the reference, choose a comfortable key, then stop it before singing. The reading Choosing songs that actually fit is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Transpose the supplied study so its low and high phrases both fit, then mark the phrase that crosses your transition area.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Two-register repertoire",
        "body": "Pick a key so the register change lands where yours is. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The written span fits inside your comfortable range and the crossing phrase has a planned vowel and breath.",
        "listen": "The melody stays accurate through both parts of the range and the crossing does not interrupt the phrase to your ear."
      },
      {
        "title": "Build the song from phrases",
        "body": "Mark the key, breaths, range edges, and lesson target before a full take of Deep River. Rehearse the hardest phrase alone, join two phrases, then record one uninterrupted form. Rehearse the crossing as a siren and on the actual words before singing the supplied study. Reduce volume through the transition rather than pushing the upper phrase.",
        "look": "The written span fits inside your comfortable range and the crossing phrase has a planned vowel and breath.",
        "listen": "The melody stays accurate through both parts of the range and the crossing does not interrupt the phrase to your ear."
      },
      {
        "title": "Review your own attempt",
        "body": "I rehearsed the supplied Deep River phrase in a comfortable key and marked where my voice changed. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If the top is forced or the bottom disappears, change key. If the crossing cracks, isolate it on a hum before returning to the lyric."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Deep River: A Wider Phrase.”"
      },
      {
        "seconds": 90,
        "instruction": "Isolate the two-register repertoire target in short, comfortable examples."
      },
      {
        "seconds": 135,
        "instruction": "Practise or record the complete “Deep River: A Wider Phrase” task, resetting between attempts."
      },
      {
        "seconds": 90,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I rehearsed the supplied Deep River phrase in a comfortable key and marked where my voice changed.",
        "The melody stays accurate through both parts of the range and the crossing does not interrupt the phrase to your ear.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If the top is forced or the bottom disappears, change key. If the crossing cracks, isolate it on a hum before returning to the lyric. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I rehearsed the supplied Deep River phrase in a comfortable key and marked where my voice changed. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Which register was used, absence of a register break, vowel strategy, or freedom from strain."
    }
  },
  {
    "id": "v-l3-m4-07",
    "stageId": "v-l3",
    "moduleId": "v-l3-m4",
    "stageSlug": "two-registers",
    "moduleSlug": "wider-phrases",
    "slug": "self-check-a-connected-wider-phrase",
    "title": "Self-Check: A Connected Wider Phrase",
    "type": "checkpoint",
    "minutes": 5,
    "objective": "Rehearse the supplied Deep River phrase in a comfortable key and mark where your voice changes. This is a listening and reflection check.",
    "explanation": "",
    "prerequisites": [
      "v-l3-m4-04"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Deep River or Auld Lang Syne. Hear the reference, choose a comfortable key, then stop it before singing. The reading Choosing songs that actually fit is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Transpose the supplied study so its low and high phrases both fit, then mark the phrase that crosses your transition area.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Two-register repertoire",
        "body": "Rehearse the supplied phrase through and compare the connection by ear. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The written span fits inside your comfortable range and the crossing phrase has a planned vowel and breath.",
        "listen": "The melody stays accurate through both parts of the range and the crossing does not interrupt the phrase to your ear."
      },
      {
        "title": "Make one evidence take",
        "body": "State the checkpoint target, record one uninterrupted attempt, and keep the result even when it does not pass. Rehearse the crossing as a siren and on the actual words before singing the supplied study. Reduce volume through the transition rather than pushing the upper phrase.",
        "look": "The written span fits inside your comfortable range and the crossing phrase has a planned vowel and breath.",
        "listen": "The melody stays accurate through both parts of the range and the crossing does not interrupt the phrase to your ear."
      },
      {
        "title": "Review your own attempt",
        "body": "I rehearsed the supplied Deep River phrase in a comfortable key and marked where my voice changed. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If the top is forced or the bottom disappears, change key. If the crossing cracks, isolate it on a hum before returning to the lyric."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Self-Check: A Connected Wider Phrase.”"
      },
      {
        "seconds": 75,
        "instruction": "Isolate the two-register repertoire target in short, comfortable examples."
      },
      {
        "seconds": 120,
        "instruction": "Practise or record the complete “Self-Check: A Connected Wider Phrase” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I rehearsed the supplied Deep River phrase in a comfortable key and marked where my voice changed.",
        "The melody stays accurate through both parts of the range and the crossing does not interrupt the phrase to your ear.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You sing the Deep River phrase through in your chosen key in one take, and on playback the crossing stays connected, with no stop, crack or push, while the low notes stay clearly audible.",
      "ifNotReady": "If the top is forced or the bottom disappears, change key. If the crossing cracks, isolate it on a hum before returning to the lyric. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I rehearsed the supplied Deep River phrase in a comfortable key and marked where my voice changed. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Which register was used, absence of a register break, vowel strategy, or freedom from strain."
    }
  },
  {
    "id": "v-l3-m5-01",
    "stageId": "v-l3",
    "moduleId": "v-l3-m5",
    "stageSlug": "two-registers",
    "moduleSlug": "fix-the-wobble",
    "slug": "breathy-nasal-tight-tell-them-apart",
    "title": "Breathy, Nasal, Tight: Tell Them Apart",
    "type": "concept",
    "minutes": 4,
    "objective": "Three different problems that get called the same thing.",
    "explanation": "Breathy, nasal and tight all get called a bad tone, but they are three different sounds. Breathy is a haze of air in the tone, usually from vocal folds that are not meeting fully. Nasal is sound colored by the nose, though a pinched, bright tone often only seems nasal: pinch your nose on an “ah”, and if the sound changes, some of it was going through the nose. Tight, or pressed, is more squeeze than the note needs, heard as a hard, effortful tone rather than a louder one. The three can overlap, and the ear cannot always tell what causes them, so this lesson trains you to name the sound you hear before you try to change it.",
    "prerequisites": [
      "v-l3-m4-07"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Tongue-trill descent or Soft sustain. Hear the reference, choose a comfortable key, then stop it before singing. The reading When the numbers lie to you is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Choose a short, comfortable phrase at moderate volume. Record the relaxed baseline and one changed example in one take, with a quiet breath between them. Make only one deliberate change; record your takes in the recorder.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Breathiness, nasality, tension",
        "body": "Three different problems that get called the same thing. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The pitch and words remain the same across comparisons; no version requires a raised chin, locked jaw, or sustained pressure.",
        "listen": "Name the audible difference without diagnosing its cause. Breathy, nasal, and tight are perceptions that can overlap."
      },
      {
        "title": "Hear the distinction",
        "body": "Sing one short, comfortable phrase at moderate volume as your baseline. Then sing it again changing one thing on purpose, gently and only as a listening demonstration: a little more air in the tone (breathy), more of the sound through the nose (nasal), or a slightly firmer, held sound (tight). Use only one of the three per take, keep the pitch, words and volume the same, and return to the easy baseline straight after. Record your takes in the recorder and, on playback, name the difference you hear without diagnosing its cause.",
        "look": "The pitch and words remain the same across comparisons; no version requires a raised chin, locked jaw, or sustained pressure.",
        "listen": "Name the audible difference without diagnosing its cause. Breathy, nasal, and tight are perceptions that can overlap."
      },
      {
        "title": "Review your own attempt",
        "body": "I compared a relaxed baseline with a later example in the same recording and described one audible change without forcing a rough sound. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If a contrast causes discomfort, hoarseness, loss of range, or effort that remains after the attempt, stop the exercise and rest your voice."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 30,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Breathy, Nasal, Tight: Tell Them Apart.”"
      },
      {
        "seconds": 60,
        "instruction": "Isolate the breathiness, nasality, tension target in short, comfortable examples."
      },
      {
        "seconds": 90,
        "instruction": "Practise or record the complete “Breathy, Nasal, Tight: Tell Them Apart” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I compared a relaxed baseline with a later example in the same recording and described one audible change without forcing a rough sound.",
        "Name the audible difference without diagnosing its cause. Breathy, nasal, and tight are perceptions that can overlap.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If a contrast causes discomfort, hoarseness, loss of range, or effort that remains after the attempt, stop the exercise and rest your voice. Leave it for today, and come back to a smaller version on another day once your speaking voice feels normal.",
      "shows": "I compared a relaxed baseline with a later example in the same recording and described one audible change without forcing a rough sound. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Strain, pressed phonation, injury, nasality, breathiness, or a clinical voice condition; the app measures none of those."
    }
  },
  {
    "id": "v-l3-m5-03",
    "stageId": "v-l3",
    "moduleId": "v-l3-m5",
    "stageSlug": "two-registers",
    "moduleSlug": "fix-the-wobble",
    "slug": "release-the-jaw-and-tongue",
    "title": "Release the Jaw and Tongue",
    "type": "exercise",
    "minutes": 6,
    "objective": "Targeted release before targeted effort.",
    "explanation": "",
    "prerequisites": [
      "v-l3-m5-01"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Tongue-trill descent or Soft sustain. Hear the reference, choose a comfortable key, then stop it before singing. The reading When the numbers lie to you is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Choose a short, comfortable phrase at moderate volume. Record the relaxed baseline and one changed example in one take, with a quiet breath between them. Make only one deliberate change; record your takes in the recorder.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Breathiness, nasality, tension",
        "body": "Targeted release before targeted effort. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The pitch and words remain the same across comparisons; no version requires a raised chin, locked jaw, or sustained pressure.",
        "listen": "Name the audible difference without diagnosing its cause. Breathy, nasal, and tight are perceptions that can overlap."
      },
      {
        "title": "Alternate attempt and reset",
        "body": "Work in short repetitions with a normal breath and complete release between them. Rest the tongue tip against the back of your lower front teeth. With one hand resting lightly on your chin, sing your baseline phrase on “yah-yah-yah”, letting the tongue make each “y” while the jaw stays still under your hand. Then sing it on “mah”, letting the jaw drop loosely on each “ah” without pushing it open. Record the release version straight after the baseline in one take and compare.",
        "look": "The pitch and words remain the same across comparisons; no version requires a raised chin, locked jaw, or sustained pressure.",
        "listen": "Name the audible difference without diagnosing its cause. Breathy, nasal, and tight are perceptions that can overlap."
      },
      {
        "title": "Review your own attempt",
        "body": "I compared a relaxed baseline with a later example in the same recording and described one audible change without forcing a rough sound. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If a contrast causes discomfort, hoarseness, loss of range, or effort that remains after the attempt, stop the exercise and rest your voice."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Release the Jaw and Tongue.”"
      },
      {
        "seconds": 90,
        "instruction": "Isolate the breathiness, nasality, tension target in short, comfortable examples."
      },
      {
        "seconds": 135,
        "instruction": "Practise or record the complete “Release the Jaw and Tongue” task, resetting between attempts."
      },
      {
        "seconds": 90,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I compared a relaxed baseline with a later example in the same recording and described one audible change without forcing a rough sound.",
        "Name the audible difference without diagnosing its cause. Breathy, nasal, and tight are perceptions that can overlap.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If a contrast causes discomfort, hoarseness, loss of range, or effort that remains after the attempt, stop the exercise and rest your voice. Leave it for today, and come back to a smaller version on another day once your speaking voice feels normal.",
      "shows": "I compared a relaxed baseline with a later example in the same recording and described one audible change without forcing a rough sound. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Strain, pressed phonation, injury, nasality, breathiness, or a clinical voice condition; the app measures none of those."
    }
  },
  {
    "id": "v-l3-m5-07",
    "stageId": "v-l3",
    "moduleId": "v-l3-m5",
    "stageSlug": "two-registers",
    "moduleSlug": "fix-the-wobble",
    "slug": "self-check-compare-with-your-baseline",
    "title": "Self-Check: Compare With Your Baseline",
    "type": "checkpoint",
    "minutes": 5,
    "objective": "Use the same short phrase for the relaxed baseline and the changed example, then compare both in the same recording.",
    "explanation": "",
    "prerequisites": [
      "v-l3-m5-03"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Tongue-trill descent or Soft sustain. Hear the reference, choose a comfortable key, then stop it before singing. The reading When the numbers lie to you is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Choose a short, comfortable phrase at moderate volume. Record the relaxed baseline and one changed example in one take, with a quiet breath between them. Make only one deliberate change; record your takes in the recorder.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Breathiness, nasality, tension",
        "body": "Use the same short phrase for the relaxed baseline and the changed example, then compare both in the same recording. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The pitch and words remain the same across comparisons; no version requires a raised chin, locked jaw, or sustained pressure.",
        "listen": "Name the audible difference without diagnosing its cause. Breathy, nasal, and tight are perceptions that can overlap."
      },
      {
        "title": "Make one evidence take",
        "body": "State the checkpoint target, record one uninterrupted attempt, and keep the result even when it does not pass. Compare an easy baseline with a deliberately airier, brighter-nasal, or firmer version only as a listening demonstration. Return to the easy baseline after each contrast.",
        "look": "The pitch and words remain the same across comparisons; no version requires a raised chin, locked jaw, or sustained pressure.",
        "listen": "Name the audible difference without diagnosing its cause. Breathy, nasal, and tight are perceptions that can overlap."
      },
      {
        "title": "Review your own attempt",
        "body": "I compared a relaxed baseline with a later example in the same recording and described one audible change without forcing a rough sound. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If a contrast causes discomfort, hoarseness, loss of range, or effort that remains after the attempt, stop the exercise and rest your voice."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Self-Check: Compare With Your Baseline.”"
      },
      {
        "seconds": 75,
        "instruction": "Isolate the breathiness, nasality, tension target in short, comfortable examples."
      },
      {
        "seconds": 120,
        "instruction": "Practise or record the complete “Self-Check: Compare With Your Baseline” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I compared a relaxed baseline with a later example in the same recording and described one audible change without forcing a rough sound.",
        "Name the audible difference without diagnosing its cause. Breathy, nasal, and tight are perceptions that can overlap.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "In one recording, you sing your baseline and one deliberate change, name the difference you hear as breathy, nasal or tight, and return to a baseline that sounds like the first, with no hoarseness or lingering effort afterward.",
      "ifNotReady": "If a contrast causes discomfort, hoarseness, loss of range, or effort that remains after the attempt, stop the exercise and rest your voice. Leave it for today, and come back to a smaller version on another day once your speaking voice feels normal.",
      "shows": "I compared a relaxed baseline with a later example in the same recording and described one audible change without forcing a rough sound. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Strain, pressed phonation, injury, nasality, breathiness, or a clinical voice condition; the app measures none of those."
    }
  },
  {
    "id": "v-l4-m1-01",
    "stageId": "v-l4",
    "moduleId": "v-l4-m1",
    "stageSlug": "pitch-time-words",
    "moduleSlug": "in-tune-all-the-way",
    "slug": "hear-the-pitch-before-you-sing",
    "title": "Hear the Pitch Before You Sing",
    "type": "concept",
    "minutes": 4,
    "objective": "Compare your note with the synthesized reference and listen for whether your next attempt settles closer.",
    "explanation": "Hearing the pitch first means playing the reference once, stopping it, and holding that note in your head for a moment before you make a sound. A voice that starts without that picture tends to search for the note, sliding up into it or settling on a neighboring pitch, and those scoops and steady-but-wrong notes are much of what reads as out of tune. Singing from silence also leaves your own voice as the only thing you are judging, so the comparison with the reference is honest.",
    "prerequisites": [
      "v-l3-m5-07"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Amazing Grace (Opening Lines, Verses 1 & 2) or Chromatic neighbor. Hear the reference, choose a comfortable key, then stop it before singing. The reading What pitch accuracy actually measures is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Use a mid-range note or phrase at moderate volume. Hear the target once, stop playback, and begin from silence.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Sustained intonation",
        "body": "Compare your note with the synthesized reference and listen for whether your next attempt settles closer. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Keep the supplied reference or reading visible, settle your posture, and use only a pitch and duration you can repeat comfortably.",
        "listen": "The pitch sounds settled and the correction does not arrive through a scoop or sudden volume change."
      },
      {
        "title": "Hear the distinction",
        "body": "Play the reference note once and stop it. Sing the same note twice from silence: the first time, breathe and start straight away without picturing it; the second time, hear it in your head for a slow count of three, then sing. Change only that pause. Record both in one take in the recorder with a breath between them, and on playback listen to the first instant of each: which one starts on the note instead of sliding up into it or settling somewhere nearby? Correct drift in separate attempts: identify whether the center was sharp or flat, release, imagine the adjustment, then sing again.",
        "look": "Keep the supplied reference or reading visible, settle your posture, and use only a pitch and duration you can repeat comfortably.",
        "listen": "The pitch sounds settled and the correction does not arrive through a scoop or sudden volume change."
      },
      {
        "title": "Review your own attempt",
        "body": "I compared my Amazing Grace study with the note reference and identified one pitch to revisit by ear. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If a note drifts off center or you hear yourself searching for it, hear the reference once, then sing from silence and review your recording. Shorten long notes that lose center."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 30,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Hear the Pitch Before You Sing.”"
      },
      {
        "seconds": 60,
        "instruction": "Isolate the sustained intonation target in short, comfortable examples."
      },
      {
        "seconds": 90,
        "instruction": "Practise or record the complete “Hear the Pitch Before You Sing” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I compared my Amazing Grace study with the note reference and identified one pitch to revisit by ear.",
        "The pitch sounds settled and the correction does not arrive through a scoop or sudden volume change.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If a note drifts off center or you hear yourself searching for it, hear the reference once, then sing from silence and review your recording. Shorten long notes that lose center. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I compared my Amazing Grace study with the note reference and identified one pitch to revisit by ear. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Tone quality, diction, rhythm outside authored targets, vibrato quality, or freedom from strain."
    }
  },
  {
    "id": "v-l4-m1-03",
    "stageId": "v-l4",
    "moduleId": "v-l4-m1",
    "stageSlug": "pitch-time-words",
    "moduleSlug": "in-tune-all-the-way",
    "slug": "drift-correction",
    "title": "Drift Correction",
    "type": "exercise",
    "minutes": 6,
    "objective": "Hear the sustained reference, sing from silence, then compare another fresh attempt by ear.",
    "explanation": "",
    "prerequisites": [
      "v-l4-m1-01"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Amazing Grace (Opening Lines, Verses 1 & 2) or Chromatic neighbor. Hear the reference, choose a comfortable key, then stop it before singing. The reading What pitch accuracy actually measures is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Use a mid-range note or phrase at moderate volume. Hear the target once, stop playback, and begin from silence.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Sustained intonation",
        "body": "Hear the sustained reference, sing from silence, then compare another fresh attempt by ear. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Keep the supplied reference or reading visible, settle your posture, and use only a pitch and duration you can repeat comfortably.",
        "listen": "The pitch sounds settled and the correction does not arrive through a scoop or sudden volume change."
      },
      {
        "title": "Alternate attempt and reset",
        "body": "Work in short repetitions with a normal breath and complete release between them. Correct drift in separate attempts: identify whether the center was sharp or flat, release, imagine the adjustment, then sing again.",
        "look": "Keep the supplied reference or reading visible, settle your posture, and use only a pitch and duration you can repeat comfortably.",
        "listen": "The pitch sounds settled and the correction does not arrive through a scoop or sudden volume change."
      },
      {
        "title": "Review your own attempt",
        "body": "I compared my Amazing Grace study with the note reference and identified one pitch to revisit by ear. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If a note drifts off center or you hear yourself searching for it, hear the reference once, then sing from silence and review your recording. Shorten long notes that lose center."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Drift Correction.”"
      },
      {
        "seconds": 90,
        "instruction": "Isolate the sustained intonation target in short, comfortable examples."
      },
      {
        "seconds": 135,
        "instruction": "Practise or record the complete “Drift Correction” task, resetting between attempts."
      },
      {
        "seconds": 90,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I compared my Amazing Grace study with the note reference and identified one pitch to revisit by ear.",
        "The pitch sounds settled and the correction does not arrive through a scoop or sudden volume change.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If a note drifts off center or you hear yourself searching for it, hear the reference once, then sing from silence and review your recording. Shorten long notes that lose center. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I compared my Amazing Grace study with the note reference and identified one pitch to revisit by ear. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Tone quality, diction, rhythm outside authored targets, vibrato quality, or freedom from strain."
    }
  },
  {
    "id": "v-l4-m1-07",
    "stageId": "v-l4",
    "moduleId": "v-l4-m1",
    "stageSlug": "pitch-time-words",
    "moduleSlug": "in-tune-all-the-way",
    "slug": "self-check-intonation-by-listening",
    "title": "Self-Check: Intonation by Listening",
    "type": "checkpoint",
    "minutes": 5,
    "objective": "Compare your Amazing Grace study with the note reference and identify one pitch to revisit by ear. This is a listening and reflection check.",
    "explanation": "",
    "prerequisites": [
      "v-l4-m1-03"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Amazing Grace (Opening Lines, Verses 1 & 2) or Chromatic neighbor. Hear the reference, choose a comfortable key, then stop it before singing. The reading What pitch accuracy actually measures is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Use a mid-range note or phrase at moderate volume. Hear the target once, stop playback, and begin from silence.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Sustained intonation",
        "body": "Choose one note from the supplied study to improve, then compare a fresh attempt by ear. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Keep the supplied reference or reading visible, settle your posture, and use only a pitch and duration you can repeat comfortably.",
        "listen": "The pitch sounds settled and the correction does not arrive through a scoop or sudden volume change."
      },
      {
        "title": "Make one evidence take",
        "body": "State the checkpoint target, record one uninterrupted attempt, and keep the result even when it does not pass. Correct drift in separate attempts: identify whether the center was sharp or flat, release, imagine the adjustment, then sing again.",
        "look": "Keep the supplied reference or reading visible, settle your posture, and use only a pitch and duration you can repeat comfortably.",
        "listen": "The pitch sounds settled and the correction does not arrive through a scoop or sudden volume change."
      },
      {
        "title": "Review your own attempt",
        "body": "I compared my Amazing Grace study with the note reference and identified one pitch to revisit by ear. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If a note drifts off center or you hear yourself searching for it, hear the reference once, then sing from silence and review your recording. Shorten long notes that lose center."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Self-Check: Intonation by Listening.”"
      },
      {
        "seconds": 75,
        "instruction": "Isolate the sustained intonation target in short, comfortable examples."
      },
      {
        "seconds": 120,
        "instruction": "Practise or record the complete “Self-Check: Intonation by Listening” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I compared my Amazing Grace study with the note reference and identified one pitch to revisit by ear.",
        "The pitch sounds settled and the correction does not arrive through a scoop or sudden volume change.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "On playback you can name one note of the study that sat sharp or flat, and a fresh attempt at that note, sung from silence after hearing the reference once, sounds settled on it without a scoop.",
      "ifNotReady": "If a note drifts off center or you hear yourself searching for it, hear the reference once, then sing from silence and review your recording. Shorten long notes that lose center. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I compared my Amazing Grace study with the note reference and identified one pitch to revisit by ear. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Tone quality, diction, rhythm outside authored targets, vibrato quality, or freedom from strain."
    }
  },
  {
    "id": "v-l4-m2-01",
    "stageId": "v-l4",
    "moduleId": "v-l4-m2",
    "stageSlug": "pitch-time-words",
    "moduleSlug": "on-the-beat",
    "slug": "swing-triplet-straight",
    "title": "Swing, Triplet, Straight",
    "type": "concept",
    "minutes": 4,
    "objective": "Three feels, heard back to back, named.",
    "explanation": "Straight, triplet and swing are three ways of dividing the same steady beat. Straight splits each beat into two equal halves, counted 1-and; triplet splits it into three equal parts, counted 1-trip-let; swing keeps the first and third of those three parts, so each pair of notes becomes long-short. The beat itself does not move in any of them, which is why you tap it while you sing: only the subdivision changes, and that is what makes a phrase feel even, rolling or swung.",
    "prerequisites": [
      "v-l4-m1-07"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Ode to Joy or Swing Low, Sweet Chariot. Hear the reference, choose a comfortable key, then stop it before singing.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Choose the included Ode to Joy phrase. Open it in the songbook, set the Tempo slider to 50% and hear it once, then stop the reference and tap a comfortable, steady four-beat pulse. Speak its displayed note durations before adding pitch. Then open Swing Low, Sweet Chariot the same way, tap the pulse you just heard and speak its durations against it. Its written rhythm is straight, not swung: “char” is held through the next tap, “i” lands halfway between that tap and the one after it, and “comin' for to carry” puts two even notes on each of three taps. Ode to Joy, where every note starts on a tap, has neither.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Rhythm and subdivision",
        "body": "On one comfortable pitch, compare two even sounds per tap (say “1-and”), three even sounds per tap (say “1-trip-let”), and a long-short pair using the first and third triplet positions. Keep the taps equally spaced. Record these three feels in one take, naming each before you sing it, then return to the written song rhythm.",
        "look": "Each phrase start, and each note that falls between two taps, has a written count; the body keeps the pulse through held notes and rests.",
        "listen": "On playback, compare your sung entries with your recorded taps and name where you rushed or delayed. This is a listening judgment, not a timing score."
      },
      {
        "title": "Hear the distinction",
        "body": "On one comfortable pitch, tap a steady pulse and sing two notes per tap on “da” for two bars: first straight (1-and, both halves equal), then swung (long-short, on the first and third triplet positions). Keep the taps at the same tempo and change only how each beat is split. Record both in one take in the recorder with a breath between them, and on playback check that the second note of each pair moved later in the swung version while your taps stayed put. Then return to the written Swing Low, Sweet Chariot phrase and keep its pairs straight: clap it, sing its rhythm on one pitch, then restore the melody, tapping the pulse gently through each version. An external click is optional.",
        "look": "Each phrase start, and each note that falls between two taps, has a written count; the body keeps the pulse through held notes and rests.",
        "listen": "On playback, compare your sung entries with your recorded taps and name where you rushed or delayed. This is a listening judgment, not a timing score."
      },
      {
        "title": "Review your own attempt",
        "body": "I counted and clapped the displayed rhythm before singing it, then reviewed where my entries aligned by ear. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If timing collapses when pitch returns, go back to one pitch or speech and lower the tempo before rebuilding the melody."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 30,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Swing, Triplet, Straight.”"
      },
      {
        "seconds": 60,
        "instruction": "Isolate the rhythm and subdivision target in short, comfortable examples."
      },
      {
        "seconds": 90,
        "instruction": "Practise or record the complete “Swing, Triplet, Straight” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I counted and clapped the displayed rhythm before singing it, then reviewed where my entries aligned by ear.",
        "On playback, compare your sung entries with your recorded taps and name where you rushed or delayed. This is a listening judgment, not a timing score.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If timing collapses when pitch returns, go back to one pitch or speech and lower the tempo before rebuilding the melody. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I counted and clapped the displayed rhythm before singing it, then reviewed where my entries aligned by ear. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Ninety-percent onset accuracy or any timing-error number; no Suede surface currently scores sung onsets."
    }
  },
  {
    "id": "v-l4-m2-03",
    "stageId": "v-l4",
    "moduleId": "v-l4-m2",
    "stageSlug": "pitch-time-words",
    "moduleSlug": "on-the-beat",
    "slug": "clap-it-then-sing-it",
    "title": "Clap It, Then Sing It",
    "type": "exercise",
    "minutes": 6,
    "objective": "Rhythm without pitch first. Pitch hides timing errors.",
    "explanation": "",
    "prerequisites": [
      "v-l4-m2-01"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Ode to Joy or Swing Low, Sweet Chariot. Hear the reference, choose a comfortable key, then stop it before singing.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Choose the included Ode to Joy phrase. Open it in the songbook, set the Tempo slider to 50% and hear it once, then stop the reference and tap a comfortable, steady four-beat pulse. Speak its displayed note durations before adding pitch. Then open Swing Low, Sweet Chariot the same way, tap the pulse you just heard and speak its durations against it. Its written rhythm is straight, not swung: “char” is held through the next tap, “i” lands halfway between that tap and the one after it, and “comin' for to carry” puts two even notes on each of three taps. Ode to Joy, where every note starts on a tap, has neither.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Rhythm and subdivision",
        "body": "Rhythm without pitch first. Pitch hides timing errors. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Each phrase start, and each note that falls between two taps, has a written count; the body keeps the pulse through held notes and rests.",
        "listen": "On playback, compare your sung entries with your recorded taps and name where you rushed or delayed. This is a listening judgment, not a timing score."
      },
      {
        "title": "Alternate attempt and reset",
        "body": "Work in short repetitions with a normal breath and complete release between them. Take Ode to Joy and then Swing Low, Sweet Chariot through the same three versions: clap the complete displayed phrase, then sing its rhythm on one pitch, then restore the melody. Tap the pulse gently through each version so the recording catches your timing against your own taps. Leave a breath between versions and keep them in one take in the [recorder](/recorder). An external click is optional.",
        "look": "Each phrase start, and each note that falls between two taps, has a written count; the body keeps the pulse through held notes and rests.",
        "listen": "On playback, compare your sung entries with your recorded taps and name where you rushed or delayed. This is a listening judgment, not a timing score."
      },
      {
        "title": "Review your own attempt",
        "body": "I counted and clapped the displayed rhythm before singing it, then reviewed where my entries aligned by ear. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If timing collapses when pitch returns, go back to one pitch or speech and lower the tempo before rebuilding the melody."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Clap It, Then Sing It.”"
      },
      {
        "seconds": 90,
        "instruction": "Isolate the rhythm and subdivision target in short, comfortable examples."
      },
      {
        "seconds": 135,
        "instruction": "Practise or record the complete “Clap It, Then Sing It” task, resetting between attempts."
      },
      {
        "seconds": 90,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I counted and clapped the displayed rhythm before singing it, then reviewed where my entries aligned by ear.",
        "On playback, compare your sung entries with your recorded taps and name where you rushed or delayed. This is a listening judgment, not a timing score.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If timing collapses when pitch returns, go back to one pitch or speech and lower the tempo before rebuilding the melody. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I counted and clapped the displayed rhythm before singing it, then reviewed where my entries aligned by ear. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Ninety-percent onset accuracy or any timing-error number; no Suede surface currently scores sung onsets."
    }
  },
  {
    "id": "v-l4-m2-07",
    "stageId": "v-l4",
    "moduleId": "v-l4-m2",
    "stageSlug": "pitch-time-words",
    "moduleSlug": "on-the-beat",
    "slug": "self-check-count-clap-sing",
    "title": "Self-Check: Count, Clap, Sing",
    "type": "checkpoint",
    "minutes": 5,
    "objective": "Count and clap the displayed rhythm before singing it, then review by ear where your entries line up. This is a listening and reflection check.",
    "explanation": "",
    "prerequisites": [
      "v-l4-m2-03"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Ode to Joy or Swing Low, Sweet Chariot. Hear the reference, choose a comfortable key, then stop it before singing.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Choose the included Ode to Joy phrase. Open it in the songbook, set the Tempo slider to 50% and hear it once, then stop the reference and tap a comfortable, steady four-beat pulse. Speak its displayed note durations before adding pitch. Then open Swing Low, Sweet Chariot the same way, tap the pulse you just heard and speak its durations against it. Its written rhythm is straight, not swung: “char” is held through the next tap, “i” lands halfway between that tap and the one after it, and “comin' for to carry” puts two even notes on each of three taps. Ode to Joy, where every note starts on a tap, has neither.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Rhythm and subdivision",
        "body": "Checked against your tapped pulse by ear. Onset timing is not automatically scored. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Each phrase start, and each note that falls between two taps, has a written count; the body keeps the pulse through held notes and rests.",
        "listen": "On playback, compare your sung entries with your recorded taps and name where you rushed or delayed. This is a listening judgment, not a timing score."
      },
      {
        "title": "Make one evidence take",
        "body": "State the checkpoint target, record one uninterrupted attempt in the [recorder](/recorder), and keep the result even when it does not pass. Clap the complete displayed Swing Low, Sweet Chariot phrase, then sing its rhythm on one pitch, then restore the melody. Tap the pulse gently through each version so the recording catches your timing against your own taps. Leave a breath between versions and keep them in one take. An external click is optional.",
        "look": "Each phrase start, and each note that falls between two taps, has a written count; the body keeps the pulse through held notes and rests.",
        "listen": "On playback, compare your sung entries with your recorded taps and name where you rushed or delayed. This is a listening judgment, not a timing score."
      },
      {
        "title": "Review your own attempt",
        "body": "I counted and clapped the displayed rhythm before singing it, then reviewed where my entries aligned by ear. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If timing collapses when pitch returns, go back to one pitch or speech and lower the tempo before rebuilding the melody."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Self-Check: Count, Clap, Sing.”"
      },
      {
        "seconds": 75,
        "instruction": "Isolate the rhythm and subdivision target in short, comfortable examples."
      },
      {
        "seconds": 120,
        "instruction": "Practise or record the complete “Self-Check: Count, Clap, Sing” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I counted and clapped the displayed rhythm before singing it, then reviewed where my entries aligned by ear.",
        "On playback, compare your sung entries with your recorded taps and name where you rushed or delayed. This is a listening judgment, not a timing score.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "On playback of one take of the Swing Low, Sweet Chariot phrase, every entry written on a tap lands with your recorded taps, the “i” of “char-i-ot” and every second note of “comin' for to carry” land halfway between two taps, held notes last their full count, and the melody version keeps the same pulse as the clapped version.",
      "ifNotReady": "If timing collapses when pitch returns, go back to one pitch or speech and lower the tempo before rebuilding the melody. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I counted and clapped the displayed rhythm before singing it, then reviewed where my entries aligned by ear. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Ninety-percent onset accuracy or any timing-error number; no Suede surface currently scores sung onsets."
    }
  },
  {
    "id": "v-l4-m3-01",
    "stageId": "v-l4",
    "moduleId": "v-l4-m3",
    "stageSlug": "pitch-time-words",
    "moduleSlug": "say-it-clearly",
    "slug": "consonants-are-the-axis-nobody-scores",
    "title": "Consonants Are the Axis Nobody Scores",
    "type": "concept",
    "minutes": 4,
    "objective": "Pitch and time get all the attention. Words are where amateur performances actually fail.",
    "explanation": "Pitch and tone ride on the vowels; the words live mostly on the consonants, the quick stops, hums and hisses between vowels. Singers listen for pitch, but listeners hear everything else, and a lyric they cannot make out is lost however well it was tuned. Nothing in Suede Sing analyzes consonants or scores how clear your words are, so this is the axis you judge by ear: consonants quick, clear and on time, then straight back to the vowel so the line stays connected.",
    "prerequisites": [
      "v-l4-m2-07"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Yankee Doodle or Old MacDonald Had a Farm. Hear the reference, choose a comfortable key, then stop it before singing. The reading Resonance, placement and the vowel is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Speak the lyric in rhythm at an easy tempo. Mark the vowel that carries each pitch and the consonant that releases into the next word.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Diction and intelligible words",
        "body": "Pitch and time get all the attention. Words are where amateur performances actually fail. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The jaw and tongue remain available for the text; consonants do not interrupt the breath with a whole-body push.",
        "listen": "A listener can write down the words from the recording without seeing the lyric."
      },
      {
        "title": "Hear the distinction",
        "body": "Choose one line of Yankee Doodle and sing it twice at the same easy tempo, pitch and volume: first with lazy consonants that barely touch, then with every consonant quick, clear and on time, releasing straight back into the vowel. Change only the consonants. Record both in one take in the recorder with a breath between them, then play them back without looking at the lyric and write down the words you can actually hear in each. Keep consonants quick and vowels connected. Increase tempo only while every word remains understandable on playback.",
        "look": "The jaw and tongue remain available for the text; consonants do not interrupt the breath with a whole-body push.",
        "listen": "A listener can write down the words from the recording without seeing the lyric."
      },
      {
        "title": "Review your own attempt",
        "body": "I spoke and sang the displayed lyric slowly enough for each word to remain understandable on playback. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If words blur, speak the line rhythmically, exaggerate only the missing consonant, then sing it again at a lower tempo."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 30,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Consonants Are the Axis Nobody Scores.”"
      },
      {
        "seconds": 60,
        "instruction": "Isolate the clear, intelligible diction target in short, comfortable examples."
      },
      {
        "seconds": 90,
        "instruction": "Practise or record the complete “Consonants Are the Axis Nobody Scores” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I spoke and sang the displayed lyric slowly enough for each word to remain understandable on playback.",
        "A listener can write down the words from the recording without seeing the lyric.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If words blur, speak the line rhythmically, exaggerate only the missing consonant, then sing it again at a lower tempo. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I spoke and sang the displayed lyric slowly enough for each word to remain understandable on playback. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. A diction score, consonant recognition, language proficiency, pitch accuracy, or vocal health."
    }
  },
  {
    "id": "v-l4-m3-04",
    "stageId": "v-l4",
    "moduleId": "v-l4-m3",
    "stageSlug": "pitch-time-words",
    "moduleSlug": "say-it-clearly",
    "slug": "consonant-sprint",
    "title": "Consonant Sprint",
    "type": "exercise",
    "minutes": 6,
    "objective": "Dense text at rising tempo without losing the vowel line.",
    "explanation": "",
    "prerequisites": [
      "v-l4-m3-01"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Yankee Doodle or Old MacDonald Had a Farm. Hear the reference, choose a comfortable key, then stop it before singing. The reading Resonance, placement and the vowel is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Speak the lyric in rhythm at an easy tempo. Mark the vowel that carries each pitch and the consonant that releases into the next word.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Diction and intelligible words",
        "body": "Dense text at rising tempo without losing the vowel line. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The jaw and tongue remain available for the text; consonants do not interrupt the breath with a whole-body push.",
        "listen": "A listener can write down the words from the recording without seeing the lyric."
      },
      {
        "title": "Alternate attempt and reset",
        "body": "Work in short repetitions with a normal breath and complete release between them. Keep consonants quick and vowels connected. Increase tempo only while every word remains understandable on playback.",
        "look": "The jaw and tongue remain available for the text; consonants do not interrupt the breath with a whole-body push.",
        "listen": "A listener can write down the words from the recording without seeing the lyric."
      },
      {
        "title": "Review your own attempt",
        "body": "I spoke and sang the displayed lyric slowly enough for each word to remain understandable on playback. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If words blur, speak the line rhythmically, exaggerate only the missing consonant, then sing it again at a lower tempo."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Consonant Sprint.”"
      },
      {
        "seconds": 90,
        "instruction": "Isolate the clear, intelligible diction target in short, comfortable examples."
      },
      {
        "seconds": 135,
        "instruction": "Practise or record the complete “Consonant Sprint” task, resetting between attempts."
      },
      {
        "seconds": 90,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I spoke and sang the displayed lyric slowly enough for each word to remain understandable on playback.",
        "A listener can write down the words from the recording without seeing the lyric.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If words blur, speak the line rhythmically, exaggerate only the missing consonant, then sing it again at a lower tempo. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I spoke and sang the displayed lyric slowly enough for each word to remain understandable on playback. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. A diction score, consonant recognition, language proficiency, pitch accuracy, or vocal health."
    }
  },
  {
    "id": "v-l4-m3-07",
    "stageId": "v-l4",
    "moduleId": "v-l4-m3",
    "stageSlug": "pitch-time-words",
    "moduleSlug": "say-it-clearly",
    "slug": "self-check-clear-words-in-a-phrase",
    "title": "Self-Check: Clear Words in a Phrase",
    "type": "checkpoint",
    "minutes": 5,
    "objective": "Speak and sing the displayed lyric slowly enough for each word to stay understandable on playback. This is a listening and reflection check.",
    "explanation": "",
    "prerequisites": [
      "v-l4-m3-04"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Yankee Doodle or Old MacDonald Had a Farm. Hear the reference, choose a comfortable key, then stop it before singing. The reading Resonance, placement and the vowel is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Speak the lyric in rhythm at an easy tempo. Mark the vowel that carries each pitch and the consonant that releases into the next word.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Diction and intelligible words",
        "body": "Listen to the recording for understandable words; clarity is your own judgment. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The jaw and tongue remain available for the text; consonants do not interrupt the breath with a whole-body push.",
        "listen": "A listener can write down the words from the recording without seeing the lyric."
      },
      {
        "title": "Make one evidence take",
        "body": "State the checkpoint target, record one uninterrupted attempt, and keep the result even when it does not pass. Keep consonants quick and vowels connected. Increase tempo only while every word remains understandable on playback.",
        "look": "The jaw and tongue remain available for the text; consonants do not interrupt the breath with a whole-body push.",
        "listen": "A listener can write down the words from the recording without seeing the lyric."
      },
      {
        "title": "Review your own attempt",
        "body": "I spoke and sang the displayed lyric slowly enough for each word to remain understandable on playback. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If words blur, speak the line rhythmically, exaggerate only the missing consonant, then sing it again at a lower tempo."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Self-Check: Clear Words in a Phrase.”"
      },
      {
        "seconds": 75,
        "instruction": "Isolate the clear, intelligible diction target in short, comfortable examples."
      },
      {
        "seconds": 120,
        "instruction": "Practise or record the complete “Self-Check: Clear Words in a Phrase” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I spoke and sang the displayed lyric slowly enough for each word to remain understandable on playback.",
        "A listener can write down the words from the recording without seeing the lyric.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "Someone who has not seen the lyric, or you a day later without looking at it, can write down every word of the recorded phrase from playback at the tempo you sang it.",
      "ifNotReady": "If words blur, speak the line rhythmically, exaggerate only the missing consonant, then sing it again at a lower tempo. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I spoke and sang the displayed lyric slowly enough for each word to remain understandable on playback. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. A diction score, consonant recognition, language proficiency, pitch accuracy, or vocal health."
    }
  },
  {
    "id": "v-l4-m4-01",
    "stageId": "v-l4",
    "moduleId": "v-l4-m4",
    "stageSlug": "pitch-time-words",
    "moduleSlug": "grace-and-grit",
    "slug": "grace-notes-staccato-accent",
    "title": "Grace Notes, Staccato, Accent",
    "type": "concept",
    "minutes": 4,
    "objective": "Three ways to attack the same note.",
    "explanation": "These are three ways to shape the start or length of a note while its pitch and timing stay where they are written. A grace note is a quick note a step above or below that falls straight into the main note; staccato cuts the note short, with a little silence after it; an accent gives the note a firmer, clearer start from the breath, not a much louder sound or a squeeze in the throat. Each changes how the line feels without changing the tune, which is why they are worth having on cue.",
    "prerequisites": [
      "v-l4-m3-07"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Ode to Joy or Staccato gug. Hear the reference, choose a comfortable key, then stop it before singing. The reading Resonance, placement and the vowel is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Choose a short comfortable phrase and establish a neutral version first. Keep pitch, words, and tempo unchanged across comparisons.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Grace notes, staccato, accent",
        "body": "Three ways to attack the same note. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The articulation lands on the planned note and does not shift the whole phrase or replace the vowel.",
        "listen": "The three versions are distinguishable in playback without one simply being much louder than the others."
      },
      {
        "title": "Hear the distinction",
        "body": "A grace note is a quick note a step above or below that falls straight into the main note; staccato is short and detached; an accent is a firmer start, not a louder note. Pick one note in the first phrase of Ode to Joy and sing the phrase four times, changing only how that note is shaped: plain, with a grace note from the step above, staccato, then accented. Keep the pitch, words and tempo the same. Record all four in one take in the recorder with a breath between them. Make each gesture small enough to remain repeatable.",
        "look": "The articulation lands on the planned note and does not shift the whole phrase or replace the vowel.",
        "listen": "The three versions are distinguishable in playback without one simply being much louder than the others."
      },
      {
        "title": "Review your own attempt",
        "body": "I used one supplied phrase to compare connected, detached, and gently accented attacks by ear. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If an articulation changes pitch or timing, slow the phrase, isolate two notes, and rebuild the gesture before returning to the full line."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 30,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Grace Notes, Staccato, Accent.”"
      },
      {
        "seconds": 60,
        "instruction": "Isolate the grace notes, staccato, accent target in short, comfortable examples."
      },
      {
        "seconds": 90,
        "instruction": "Practise or record the complete “Grace Notes, Staccato, Accent” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I used one supplied phrase to compare connected, detached, and gently accented attacks by ear.",
        "The three versions are distinguishable in playback without one simply being much louder than the others.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If an articulation changes pitch or timing, slow the phrase, isolate two notes, and rebuild the gesture before returning to the full line. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I used one supplied phrase to compare connected, detached, and gently accented attacks by ear. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Automatic articulation classification, onset timing accuracy, stylistic quality, or absence of strain."
    }
  },
  {
    "id": "v-l4-m4-03",
    "stageId": "v-l4",
    "moduleId": "v-l4-m4",
    "stageSlug": "pitch-time-words",
    "moduleSlug": "grace-and-grit",
    "slug": "same-phrase-three-ways",
    "title": "Same Phrase, Three Ways",
    "type": "exercise",
    "minutes": 6,
    "objective": "Switch articulation without switching pitch or tempo.",
    "explanation": "",
    "prerequisites": [
      "v-l4-m4-01"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Ode to Joy or Staccato gug. Hear the reference, choose a comfortable key, then stop it before singing. The reading Resonance, placement and the vowel is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Choose a short comfortable phrase and establish a neutral version first. Keep pitch, words, and tempo unchanged across comparisons.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Grace notes, staccato, accent",
        "body": "Switch articulation without switching pitch or tempo. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The articulation lands on the planned note and does not shift the whole phrase or replace the vowel.",
        "listen": "The three versions are distinguishable in playback without one simply being much louder than the others."
      },
      {
        "title": "Alternate attempt and reset",
        "body": "Work in short repetitions with a normal breath and complete release between them. Add one named articulation at a time: a connected grace, a short release, or a clear accent. Make the gesture small enough to remain repeatable.",
        "look": "The articulation lands on the planned note and does not shift the whole phrase or replace the vowel.",
        "listen": "The three versions are distinguishable in playback without one simply being much louder than the others."
      },
      {
        "title": "Review your own attempt",
        "body": "I used one supplied phrase to compare connected, detached, and gently accented attacks by ear. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If an articulation changes pitch or timing, slow the phrase, isolate two notes, and rebuild the gesture before returning to the full line."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Same Phrase, Three Ways.”"
      },
      {
        "seconds": 90,
        "instruction": "Isolate the grace notes, staccato, accent target in short, comfortable examples."
      },
      {
        "seconds": 135,
        "instruction": "Practise or record the complete “Same Phrase, Three Ways” task, resetting between attempts."
      },
      {
        "seconds": 90,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I used one supplied phrase to compare connected, detached, and gently accented attacks by ear.",
        "The three versions are distinguishable in playback without one simply being much louder than the others.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If an articulation changes pitch or timing, slow the phrase, isolate two notes, and rebuild the gesture before returning to the full line. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I used one supplied phrase to compare connected, detached, and gently accented attacks by ear. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Automatic articulation classification, onset timing accuracy, stylistic quality, or absence of strain."
    }
  },
  {
    "id": "v-l4-m4-07",
    "stageId": "v-l4",
    "moduleId": "v-l4-m4",
    "stageSlug": "pitch-time-words",
    "moduleSlug": "grace-and-grit",
    "slug": "self-check-three-articulations-on-cue",
    "title": "Self-Check: Three Articulations on Cue",
    "type": "checkpoint",
    "minutes": 5,
    "objective": "Before recording, shuffle three slips marked grace, staccato and accent; sing the phrase once per slip in the order drawn.",
    "explanation": "",
    "prerequisites": [
      "v-l4-m4-03"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Ode to Joy or Staccato gug. Hear the reference, choose a comfortable key, then stop it before singing. The reading Resonance, placement and the vowel is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Choose a short comfortable phrase and establish a neutral version first. Keep pitch, words, and tempo unchanged across comparisons.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Grace notes, staccato, accent",
        "body": "Before recording, shuffle three slips marked grace, staccato and accent; sing the phrase once per slip in the order drawn. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The articulation lands on the planned note and does not shift the whole phrase or replace the vowel.",
        "listen": "The three versions are distinguishable in playback without one simply being much louder than the others."
      },
      {
        "title": "Make one evidence take",
        "body": "State the checkpoint target, record one uninterrupted attempt, and keep the result even when it does not pass. Shuffle the slips, then sing the phrase once per slip in the order drawn, with a breath between versions: a connected grace, a short release, or a clear accent. Make the gesture small enough to remain repeatable.",
        "look": "The articulation lands on the planned note and does not shift the whole phrase or replace the vowel.",
        "listen": "The three versions are distinguishable in playback without one simply being much louder than the others."
      },
      {
        "title": "Review your own attempt",
        "body": "I used one supplied phrase to compare connected, detached, and gently accented attacks by ear. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If an articulation changes pitch or timing, slow the phrase, isolate two notes, and rebuild the gesture before returning to the full line."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Self-Check: Three Articulations on Cue.”"
      },
      {
        "seconds": 75,
        "instruction": "Isolate the grace notes, staccato, accent target in short, comfortable examples."
      },
      {
        "seconds": 120,
        "instruction": "Practise or record the complete “Self-Check: Three Articulations on Cue” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I used one supplied phrase to compare connected, detached, and gently accented attacks by ear.",
        "The three versions are distinguishable in playback without one simply being much louder than the others.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "In one take sung in the order you drew, you can name each articulation from playback without checking the slips, and the phrase keeps the same pitch and tempo in all three.",
      "ifNotReady": "If an articulation changes pitch or timing, slow the phrase, isolate two notes, and rebuild the gesture before returning to the full line. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I used one supplied phrase to compare connected, detached, and gently accented attacks by ear. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Automatic articulation classification, onset timing accuracy, stylistic quality, or absence of strain."
    }
  },
  {
    "id": "v-l4-m5-01",
    "stageId": "v-l4",
    "moduleId": "v-l4-m5",
    "stageSlug": "pitch-time-words",
    "moduleSlug": "louder-softer",
    "slug": "dynamics-without-pushing",
    "title": "Dynamics Without Pushing",
    "type": "concept",
    "minutes": 4,
    "objective": "Loud from resonance, quiet from support, neither from the throat.",
    "explanation": "Getting louder takes breath pressure and fold closure rising together, and much of what makes a voice carry is resonance, the ring in the tone, rather than sheer effort. Getting quieter takes the same steady breath under a smaller sound, not a slide into breathiness. Pushing is the throat doing the work instead: the tone tightens, the pitch creeps sharp, and the neck feels different on the loud note than on the quiet one. If your neck feels about the same at every level, the dynamics are coming from the right place.",
    "prerequisites": [
      "v-l4-m4-07"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Swell and fade, Sustained hold or Simple Gifts. Hear the reference, choose a comfortable key, then stop it before singing. The reading Breath: support versus pressure is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Use one comfortable sustained pitch and establish a quiet-to-moderate baseline. Keep microphone distance fixed across takes.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Dynamics without pushing",
        "body": "Loud from resonance, quiet from support, neither from the throat. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Posture and microphone distance stay constant; the louder attempts do not add a lifted chin or locked neck.",
        "listen": "The four levels in your take form an audible progression while pitch stays centered."
      },
      {
        "title": "Hear the distinction",
        "body": "Sing two short holds on one comfortable note: the first at your easy quiet level, the second at a comfortable fuller level made with a little more breath energy and a brighter vowel, with the chin and neck exactly where they were. Change only the level. Record both in one take in the recorder with a breath between them, and check on playback that the fuller one did not creep sharp. Then build four audible levels from quiet to full the same way, changing breath-energy and resonance gradually, not by squeezing the throat. Keep each sample short.",
        "look": "Posture and microphone distance stay constant; the louder attempts do not add a lifted chin or locked neck.",
        "listen": "The four levels in your take form an audible progression while pitch stays centered."
      },
      {
        "title": "Review your own attempt",
        "body": "I compared comfortable quieter and fuller versions of one short phrase without pushing the volume. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If louder means tighter or sharper, return to the easiest level, reduce the target contrast, and stop for today if discomfort appears."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 30,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Dynamics Without Pushing.”"
      },
      {
        "seconds": 60,
        "instruction": "Isolate the dynamics without pushing target in short, comfortable examples."
      },
      {
        "seconds": 90,
        "instruction": "Practise or record the complete “Dynamics Without Pushing” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I compared comfortable quieter and fuller versions of one short phrase without pushing the volume.",
        "The four levels in your take form an audible progression while pitch stays centered.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If louder means tighter or sharper, return to the easiest level, reduce the target contrast, and stop for today if discomfort appears. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I compared comfortable quieter and fuller versions of one short phrase without pushing the volume. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Absolute loudness in decibels, calibrated dynamic labels, resonance efficiency, or freedom from strain."
    }
  },
  {
    "id": "v-l4-m5-04",
    "stageId": "v-l4",
    "moduleId": "v-l4-m5",
    "stageSlug": "pitch-time-words",
    "moduleSlug": "louder-softer",
    "slug": "dynamic-ballad",
    "title": "Dynamic Ballad",
    "type": "song",
    "minutes": 6,
    "objective": "A song that lives or dies on its dynamic arc.",
    "explanation": "",
    "prerequisites": [
      "v-l4-m5-01"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Swell and fade, Sustained hold or Simple Gifts. Hear the reference, choose a comfortable key, then stop it before singing. The reading Breath: support versus pressure is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Use one comfortable sustained pitch and establish a quiet-to-moderate baseline. Keep microphone distance fixed across takes.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Dynamics without pushing",
        "body": "A song that lives or dies on its dynamic arc. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Posture and microphone distance stay constant; the louder attempts do not add a lifted chin or locked neck.",
        "listen": "The second phrase is audibly fuller than the first while the pitch stays centered."
      },
      {
        "title": "Build the song from phrases",
        "body": "Use Simple Gifts. Sing its first phrase (“’Tis the gift to be simple”) at your quiet level and its second (“’tis the gift to be free”) at your fuller level, then sing both in one take with that arc. Create the levels by changing breath-energy and resonance gradually, not by squeezing the throat.",
        "look": "Posture and microphone distance stay constant; the louder attempts do not add a lifted chin or locked neck.",
        "listen": "The second phrase is audibly fuller than the first while the pitch stays centered."
      },
      {
        "title": "Review your own attempt",
        "body": "I compared comfortable quieter and fuller versions of one short phrase without pushing the volume. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If louder means tighter or sharper, return to the easiest level, reduce the target contrast, and stop for today if discomfort appears."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Dynamic Ballad.”"
      },
      {
        "seconds": 90,
        "instruction": "Isolate the dynamics without pushing target in short, comfortable examples."
      },
      {
        "seconds": 135,
        "instruction": "Practise or record the complete “Dynamic Ballad” task, resetting between attempts."
      },
      {
        "seconds": 90,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I compared comfortable quieter and fuller versions of one short phrase without pushing the volume.",
        "The second phrase is audibly fuller than the first while the pitch stays centered.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If louder means tighter or sharper, return to the easiest level, reduce the target contrast, and stop for today if discomfort appears. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I compared comfortable quieter and fuller versions of one short phrase without pushing the volume. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Absolute loudness in decibels, calibrated dynamic labels, resonance efficiency, or freedom from strain."
    }
  },
  {
    "id": "v-l4-m5-07",
    "stageId": "v-l4",
    "moduleId": "v-l4-m5",
    "stageSlug": "pitch-time-words",
    "moduleSlug": "louder-softer",
    "slug": "self-check-four-levels-one-note",
    "title": "Self-Check: Four Levels, One Note",
    "type": "checkpoint",
    "minutes": 5,
    "objective": "Four audibly distinct levels on one note. Input level is uncalibrated, so your ear is the judge, not a number.",
    "explanation": "",
    "prerequisites": [
      "v-l4-m5-04"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Swell and fade, Sustained hold or Simple Gifts. Hear the reference, choose a comfortable key, then stop it before singing. The reading Breath: support versus pressure is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Use one comfortable sustained pitch and establish a quiet-to-moderate baseline. Keep microphone distance fixed across takes.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Dynamics without pushing",
        "body": "Four audibly distinct levels on one note. Input level is uncalibrated, so your ear is the judge, not a number. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Posture and microphone distance stay constant; the louder attempts do not add a lifted chin or locked neck.",
        "listen": "The four levels in your take form an audible progression while pitch stays centered."
      },
      {
        "title": "Make one evidence take",
        "body": "State the checkpoint target, record one uninterrupted attempt, and keep the result even when it does not pass. Create four audible levels by changing breath-energy and resonance gradually, not by squeezing the throat. Keep each sample short.",
        "look": "Posture and microphone distance stay constant; the louder attempts do not add a lifted chin or locked neck.",
        "listen": "The four levels in your take form an audible progression while pitch stays centered."
      },
      {
        "title": "Review your own attempt",
        "body": "I compared comfortable quieter and fuller versions of one short phrase without pushing the volume. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If louder means tighter or sharper, return to the easiest level, reduce the target contrast, and stop for today if discomfort appears."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Self-Check: Four Levels, One Note.”"
      },
      {
        "seconds": 75,
        "instruction": "Isolate the dynamics without pushing target in short, comfortable examples."
      },
      {
        "seconds": 120,
        "instruction": "Practise or record the complete “Self-Check: Four Levels, One Note” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I compared comfortable quieter and fuller versions of one short phrase without pushing the volume.",
        "The four levels in your take form an audible progression while pitch stays centered.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "In one take on one comfortable note, you can put the four levels in order from playback alone, the pitch stays centered at every level, and the loudest feels no tighter in the neck than the quietest.",
      "ifNotReady": "If louder means tighter or sharper, return to the easiest level, reduce the target contrast, and stop for today if discomfort appears. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I compared comfortable quieter and fuller versions of one short phrase without pushing the volume. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Absolute loudness in decibels, calibrated dynamic labels, resonance efficiency, or freedom from strain."
    }
  },
  {
    "id": "v-l5-m1-01",
    "stageId": "v-l5",
    "moduleId": "v-l5-m1",
    "stageSlug": "through-the-break",
    "moduleSlug": "your-passaggio-by-name",
    "slug": "where-your-voice-changes-gear",
    "title": "Where Your Voice Changes Gear",
    "type": "concept",
    "minutes": 4,
    "objective": "Your scan gives the ends of your range, not this. You find the gear change by ear, then read the published zone for your voice type.",
    "explanation": "Your passaggio is the zone of two to four notes where the voice has to hand over from a thicker fold setup to a thinner one while the resonance that was helping the sound drops away, so notes start to need effort, thin out or crack. It sits where your own folds and vocal tract put it: often near the published zone for your voice type, but it can land a semitone or more either side, and it shifts with the vowel and the volume. For contralto, mezzo and soprano the published zones mark where a belt or full mix changes gear; a quiet slide will often find an earlier, lighter shift out of chest voice first, somewhere around E4 to G4, at or below the published zone, and that is expected rather than a failed search. A range test reports only your two ends, so you find this zone by ear on a slow, quiet slide, starting from the note where the effort first rises.",
    "prerequisites": [
      "v-l4-m5-07"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Ng siren to the fifth. Hear the reference, choose a comfortable key, then stop it before singing. The reading The passaggio: where it breaks and why is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Warm up gently, then choose a narrow range that crosses a place where production tends to change. Use moderate volume and short attempts.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Locating your own transition zone",
        "body": "Your scan gives the ends of your range, not this. You find the gear change by ear, then read the published zone for your voice type. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Keep the supplied reference or reading visible, settle your posture, and use only a pitch and duration you can repeat comfortably.",
        "listen": "You can anticipate the change and cross the same general area in both directions without forcing the endpoints."
      },
      {
        "title": "Hear the distinction",
        "body": "In the pitch studio, slide slowly on a quiet “ng” from a comfortable middle note up through the place where the sound starts to change, then back down. Do it twice: once at your usual volume, once at about half that. Volume is the only thing that changes, and the quieter pass usually lets you hear the change coming as a gradual thinning instead of a sudden flip. Note the first note where effort rises on the way up and where the sound settles on the way down: that is a zone, not a single magic pitch. Then compare it with the published zone for your estimated voice type on [vocal range by voice type](/atlas/vocal-range-by-voice-type); if you are a contralto, mezzo or soprano, compare it first with the earlier shift out of chest voice, around E4 to G4, that the same page names.",
        "look": "Keep the supplied reference or reading visible, settle your posture, and use only a pitch and duration you can repeat comfortably.",
        "listen": "You can anticipate the change and cross the same general area in both directions without forcing the endpoints."
      },
      {
        "title": "Review your own attempt",
        "body": "I listened for my own transition during a small comfortable slide and noted where it became less easy. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If no transition is clear, reduce volume, change vowel, or work with a qualified voice teacher. Do not manufacture one by pressing."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 30,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Where Your Voice Changes Gear.”"
      },
      {
        "seconds": 60,
        "instruction": "Isolate the locating your own transition zone target in short, comfortable examples."
      },
      {
        "seconds": 90,
        "instruction": "Practise or record the complete “Where Your Voice Changes Gear” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I listened for my own transition during a small comfortable slide and noted where it became less easy.",
        "You can anticipate the change and cross the same general area in both directions without forcing the endpoints.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If no transition is clear, reduce volume, change vowel, or work with a qualified voice teacher. Do not manufacture one by pressing. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I listened for my own transition during a small comfortable slide and noted where it became less easy. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Primo or secondo passaggio pitches computed from a range scan; Suede measures range extremes, not passaggi."
    }
  },
  {
    "id": "v-l5-m1-03",
    "stageId": "v-l5",
    "moduleId": "v-l5-m1",
    "stageSlug": "through-the-break",
    "moduleSlug": "your-passaggio-by-name",
    "slug": "find-your-zone",
    "title": "Find Your Zone",
    "type": "exercise",
    "minutes": 6,
    "objective": "Approach each from below and above until you can hear the shift coming.",
    "explanation": "",
    "prerequisites": [
      "v-l5-m1-01"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Ng siren to the fifth. Hear the reference, choose a comfortable key, then stop it before singing. The reading The passaggio: where it breaks and why is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Warm up gently, then choose a narrow range that crosses a place where production tends to change. Use moderate volume and short attempts.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Locating your own transition zone",
        "body": "Approach each from below and above until you can hear the shift coming. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Keep the supplied reference or reading visible, settle your posture, and use only a pitch and duration you can repeat comfortably.",
        "listen": "You can anticipate the change and cross the same general area in both directions without forcing the endpoints."
      },
      {
        "title": "Alternate attempt and reset",
        "body": "Work in short repetitions with a normal breath and complete release between them. Approach the transition from below and above on a hum or narrow vowel. Mark a zone, not a single magic pitch, and compare it with the published zone for your estimated voice type on [vocal range by voice type](/atlas/vocal-range-by-voice-type); if you are a contralto, mezzo or soprano, compare it first with the earlier shift out of chest voice, around E4 to G4, that the same page names.",
        "look": "Keep the supplied reference or reading visible, settle your posture, and use only a pitch and duration you can repeat comfortably.",
        "listen": "You can anticipate the change and cross the same general area in both directions without forcing the endpoints."
      },
      {
        "title": "Review your own attempt",
        "body": "I listened for my own transition during a small comfortable slide and noted where it became less easy. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If no transition is clear, reduce volume, change vowel, or work with a qualified voice teacher. Do not manufacture one by pressing."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Find Your Zone.”"
      },
      {
        "seconds": 90,
        "instruction": "Isolate the locating your own transition zone target in short, comfortable examples."
      },
      {
        "seconds": 135,
        "instruction": "Practise or record the complete “Find Your Zone” task, resetting between attempts."
      },
      {
        "seconds": 90,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I listened for my own transition during a small comfortable slide and noted where it became less easy.",
        "You can anticipate the change and cross the same general area in both directions without forcing the endpoints.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If no transition is clear, reduce volume, change vowel, or work with a qualified voice teacher. Do not manufacture one by pressing. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I listened for my own transition during a small comfortable slide and noted where it became less easy. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Primo or secondo passaggio pitches computed from a range scan; Suede measures range extremes, not passaggi."
    }
  },
  {
    "id": "v-l5-m1-07",
    "stageId": "v-l5",
    "moduleId": "v-l5-m1",
    "stageSlug": "through-the-break",
    "moduleSlug": "your-passaggio-by-name",
    "slug": "self-check-cross-it-on-cue",
    "title": "Self-Check: Cross It On Cue",
    "type": "checkpoint",
    "minutes": 5,
    "objective": "Located by ear, then crossed in both directions.",
    "explanation": "",
    "prerequisites": [
      "v-l5-m1-03"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Ng siren to the fifth. Hear the reference, choose a comfortable key, then stop it before singing. The reading The passaggio: where it breaks and why is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Warm up gently, then choose a narrow range that crosses a place where production tends to change. Use moderate volume and short attempts.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Locating your own transition zone",
        "body": "Located by ear, then crossed in both directions. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Keep the supplied reference or reading visible, settle your posture, and use only a pitch and duration you can repeat comfortably.",
        "listen": "You can anticipate the change and cross the same general area in both directions without forcing the endpoints."
      },
      {
        "title": "Make one evidence take",
        "body": "State the checkpoint target, record one uninterrupted attempt in the [recorder](/recorder), and keep the result even when it does not pass. Approach the transition from below and above on a hum or narrow vowel. Then slide through it once more in the [pitch studio](/studio), which names the note as you sing it, and write down the first note where effort rises on the way up and where the sound settles on the way down. Mark a zone, not a single magic pitch, and compare it with the published zone for your estimated voice type on [vocal range by voice type](/atlas/vocal-range-by-voice-type); if you are a contralto, mezzo or soprano, compare it first with the earlier shift out of chest voice, around E4 to G4, that the same page names.",
        "look": "Keep the supplied reference or reading visible, settle your posture, and use only a pitch and duration you can repeat comfortably.",
        "listen": "You can anticipate the change and cross the same general area in both directions without forcing the endpoints."
      },
      {
        "title": "Review your own attempt",
        "body": "I listened for my own transition during a small comfortable slide and noted where it became less easy. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If no transition is clear, reduce volume, change vowel, or work with a qualified voice teacher. Do not manufacture one by pressing."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Self-Check: Cross It On Cue.”"
      },
      {
        "seconds": 75,
        "instruction": "Isolate the locating your own transition zone target in short, comfortable examples."
      },
      {
        "seconds": 120,
        "instruction": "Practise or record the complete “Self-Check: Cross It On Cue” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I listened for my own transition during a small comfortable slide and noted where it became less easy.",
        "You can anticipate the change and cross the same general area in both directions without forcing the endpoints.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can name the note where your effort first rises, and on two different days you cross that zone on a quiet slide in both directions, three times in a row, without a crack or a push.",
      "ifNotReady": "If no transition is clear, reduce volume, change vowel, or work with a qualified voice teacher. Do not manufacture one by pressing. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I listened for my own transition during a small comfortable slide and noted where it became less easy. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Primo or secondo passaggio pitches computed from a range scan; Suede measures range extremes, not passaggi."
    }
  },
  {
    "id": "v-l5-m2-01",
    "stageId": "v-l5",
    "moduleId": "v-l5-m2",
    "stageSlug": "through-the-break",
    "moduleSlug": "vowel-modification-through-the-break",
    "slug": "change-the-vowel-keep-the-word",
    "title": "Change the Vowel, Keep the Word",
    "type": "concept",
    "minutes": 4,
    "objective": "Small shape adjustments that keep the crossing smooth and the lyric intelligible.",
    "explanation": "Around your transition, a strong harmonic of the note you are singing meets the main resonance of the vowel and then climbs past it, and the reinforcement drops out from under the sound. Shading the vowel a little toward the neutral middle moves that resonance so the crossing stays smooth: a bright “ee” opens slightly toward “ih”, an “oo” toward “oh”, and a wide “ah” rounds slightly toward “aw”. Use the smallest change that works; listeners rebuild a word from context generously, but if they can hear the word change, you have gone too far.",
    "prerequisites": [
      "v-l5-m1-07"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Ng siren to the fifth or Gentle fifth siren. Hear the reference, choose a comfortable key, then stop it before singing. The reading Resonance, placement and the vowel is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Choose a word whose vowel crosses your transition zone and sing it first below the zone at easy volume.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Vowel modification",
        "body": "Small shape adjustments that keep the crossing smooth and the lyric intelligible. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The jaw and lips change gradually through the crossing; the tongue does not retract sharply and the word remains recognizable.",
        "listen": "The pitch remains connected and the lyric is still understandable across all three vowels."
      },
      {
        "title": "Hear the distinction",
        "body": "Pick a word with an “ah” in it, such as “far”, and sing it on a slide up a fifth, starting a little below your transition so the slide crosses it. Do it twice in one take: first keeping the vowel exactly as you speak it, then letting the “ah” round slightly toward “aw” as you climb. The vowel shape is the only thing that changes, so keep the pitch and the volume the same. On playback, listen for which crossing stays connected and whether the word is still clearly “far”. Record your takes in the recorder. Narrow or shade the vowel only enough to keep the crossing easy while preserving the word.",
        "look": "The jaw and lips change gradually through the crossing; the tongue does not retract sharply and the word remains recognizable.",
        "listen": "The pitch remains connected and the lyric is still understandable across all three vowels."
      },
      {
        "title": "Review your own attempt",
        "body": "I compared three vowels on a comfortable fifth slide and noted which small adjustment helped continuity. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If the word disappears, reduce the modification. If the crossing tightens, return to a hum and rebuild the vowel from there."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 30,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Change the Vowel, Keep the Word.”"
      },
      {
        "seconds": 60,
        "instruction": "Isolate the vowel modification target in short, comfortable examples."
      },
      {
        "seconds": 90,
        "instruction": "Practise or record the complete “Change the Vowel, Keep the Word” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I compared three vowels on a comfortable fifth slide and noted which small adjustment helped continuity.",
        "The pitch remains connected and the lyric is still understandable across all three vowels.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If the word disappears, reduce the modification. If the crossing tightens, return to a hum and rebuild the vowel from there. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I compared three vowels on a comfortable fifth slide and noted which small adjustment helped continuity. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Formant values, vowel identity, a measured register break, or freedom from strain."
    }
  },
  {
    "id": "v-l5-m2-03",
    "stageId": "v-l5",
    "moduleId": "v-l5-m2",
    "stageSlug": "through-the-break",
    "moduleSlug": "vowel-modification-through-the-break",
    "slug": "crossing-on-three-vowels",
    "title": "Crossing on Three Vowels",
    "type": "exercise",
    "minutes": 6,
    "objective": "Modified and unmodified, heard side by side.",
    "explanation": "",
    "prerequisites": [
      "v-l5-m2-01"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Ng siren to the fifth or Gentle fifth siren. Hear the reference, choose a comfortable key, then stop it before singing. The reading Resonance, placement and the vowel is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Choose a word whose vowel crosses your transition zone and sing it first below the zone at easy volume.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Vowel modification",
        "body": "Modified and unmodified, heard side by side. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The jaw and lips change gradually through the crossing; the tongue does not retract sharply and the word remains recognizable.",
        "listen": "The pitch remains connected and the lyric is still understandable across all three vowels."
      },
      {
        "title": "Alternate attempt and reset",
        "body": "Work in short repetitions with a normal breath and complete release between them. Narrow or shade the vowel only enough to keep the crossing easy while preserving the word. Compare modified and unmodified attempts at the same pitch and volume.",
        "look": "The jaw and lips change gradually through the crossing; the tongue does not retract sharply and the word remains recognizable.",
        "listen": "The pitch remains connected and the lyric is still understandable across all three vowels."
      },
      {
        "title": "Review your own attempt",
        "body": "I compared three vowels on a comfortable fifth slide and noted which small adjustment helped continuity. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If the word disappears, reduce the modification. If the crossing tightens, return to a hum and rebuild the vowel from there."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Crossing on Three Vowels.”"
      },
      {
        "seconds": 90,
        "instruction": "Isolate the vowel modification target in short, comfortable examples."
      },
      {
        "seconds": 135,
        "instruction": "Practise or record the complete “Crossing on Three Vowels” task, resetting between attempts."
      },
      {
        "seconds": 90,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I compared three vowels on a comfortable fifth slide and noted which small adjustment helped continuity.",
        "The pitch remains connected and the lyric is still understandable across all three vowels.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If the word disappears, reduce the modification. If the crossing tightens, return to a hum and rebuild the vowel from there. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I compared three vowels on a comfortable fifth slide and noted which small adjustment helped continuity. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Formant values, vowel identity, a measured register break, or freedom from strain."
    }
  },
  {
    "id": "v-l5-m2-07",
    "stageId": "v-l5",
    "moduleId": "v-l5-m2",
    "stageSlug": "through-the-break",
    "moduleSlug": "vowel-modification-through-the-break",
    "slug": "self-check-three-vowels-through-the-break",
    "title": "Self-Check: Three Vowels Through the Break",
    "type": "checkpoint",
    "minutes": 5,
    "objective": "Both directions across the zone. Judged by ear: nothing detects a register break.",
    "explanation": "",
    "prerequisites": [
      "v-l5-m2-03"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Ng siren to the fifth or Gentle fifth siren. Hear the reference, choose a comfortable key, then stop it before singing. The reading Resonance, placement and the vowel is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Choose a word whose vowel crosses your transition zone and sing it first below the zone at easy volume.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Vowel modification",
        "body": "Both directions across the zone. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The jaw and lips change gradually through the crossing; the tongue does not retract sharply and the word remains recognizable.",
        "listen": "The pitch remains connected and the lyric is still understandable across all three vowels."
      },
      {
        "title": "Make one evidence take",
        "body": "State the checkpoint target, record one uninterrupted attempt in the [recorder](/recorder), and keep the result even when it does not pass. Narrow or shade the vowel only enough to keep the crossing easy while preserving the word. Compare modified and unmodified attempts at the same pitch and volume.",
        "look": "The jaw and lips change gradually through the crossing; the tongue does not retract sharply and the word remains recognizable.",
        "listen": "The pitch remains connected and the lyric is still understandable across all three vowels."
      },
      {
        "title": "Review your own attempt",
        "body": "I compared three vowels on a comfortable fifth slide and noted which small adjustment helped continuity. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If the word disappears, reduce the modification. If the crossing tightens, return to a hum and rebuild the vowel from there."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Self-Check: Three Vowels Through the Break.”"
      },
      {
        "seconds": 75,
        "instruction": "Isolate the vowel modification target in short, comfortable examples."
      },
      {
        "seconds": 120,
        "instruction": "Practise or record the complete “Self-Check: Three Vowels Through the Break” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I compared three vowels on a comfortable fifth slide and noted which small adjustment helped continuity.",
        "The pitch remains connected and the lyric is still understandable across all three vowels.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "On playback, one word on each of three vowels crosses your zone in both directions with the pitch connected and the word still recognizable, using the smallest vowel change that works.",
      "ifNotReady": "If the word disappears, reduce the modification. If the crossing tightens, return to a hum and rebuild the vowel from there. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I compared three vowels on a comfortable fifth slide and noted which small adjustment helped continuity. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Formant values, vowel identity, a measured register break, or freedom from strain."
    }
  },
  {
    "id": "v-l5-m3-01",
    "stageId": "v-l5",
    "moduleId": "v-l5-m3",
    "stageSlug": "through-the-break",
    "moduleSlug": "twang-and-ring",
    "slug": "louder-by-resonance-not-by-force",
    "title": "Louder by Resonance, Not by Force",
    "type": "concept",
    "minutes": 4,
    "objective": "Where carrying power actually comes from, and why pressed phonation is the costly way to fake it.",
    "explanation": "Carrying power is mostly a matter of resonance rather than loudness: a voice with more energy in the bright upper band, where hearing is sharpest, cuts through without being pushed. Twang gets there by narrowing the space just above the vocal folds, which brightens the tone by reshaping the tube rather than by driving more air or squeezing harder. Pressed phonation, more squeeze at the folds than the note needs, also sounds intense but costs effort and tires the voice; one rough check is that brightness from resonance costs you nothing and still works when you sing the same phrase quietly.",
    "prerequisites": [
      "v-l5-m2-07"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Humming thirds. Hear the reference, choose a comfortable key, then stop it before singing. The reading Resonance, placement and the vowel is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Record an easy baseline phrase in the recorder at fixed microphone distance and moderate input gain. Use the same pitch, vowel, and duration for comparisons.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Resonance over force",
        "body": "Where carrying power actually comes from, and why pressed phonation is the costly way to fake it. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Input gain and distance stay fixed so the comparison is within your own takes; the neck and jaw do not visibly brace.",
        "listen": "The second example in the same recording carries more brightness without sounding pressed or simply louder at the microphone."
      },
      {
        "title": "Hear the distinction",
        "body": "To find the brighter setup, say a small, bratty “nyeh” at speaking volume, as if mimicking a whiny child; sing it on a comfortable note, then keep that brightness while changing to “eh”. If it only gets louder, start again smaller. While you find it, have the [voice analyzer](/analyze) open: the Ring band percentage on its tone view usually rises as the sound brightens, but getting louder or pressing can raise it too, so keep the volume steady and the throat easy. Then, in the [recorder](/recorder), record the same note on “eh” twice in one take at the same microphone distance: your plain baseline first, then the bright version. Brightness is the only thing that changes, so keep the volume the same. Change resonance before volume, and keep each attempt short.",
        "look": "Input gain and distance stay fixed so the comparison is within your own takes; the neck and jaw do not visibly brace.",
        "listen": "The second example in the same recording carries more brightness without sounding pressed or simply louder at the microphone."
      },
      {
        "title": "Review your own attempt",
        "body": "I compared two easy tones on the same pitch and described a change in brightness by ear. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If brightness comes only with pressure, back down to the baseline, use a lighter nasal consonant onset, and stop for today if the voice feels irritated."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 30,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Louder by Resonance, Not by Force.”"
      },
      {
        "seconds": 60,
        "instruction": "Isolate the resonance over force target in short, comfortable examples."
      },
      {
        "seconds": 90,
        "instruction": "Practise or record the complete “Louder by Resonance, Not by Force” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I compared two easy tones on the same pitch and described a change in brightness by ear.",
        "The second example in the same recording carries more brightness without sounding pressed or simply louder at the microphone.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If brightness comes only with pressure, back down to the baseline, use a lighter nasal consonant onset, and stop for today if the voice feels irritated. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I compared two easy tones on the same pitch and described a change in brightness by ear. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Strain, pressed phonation, healthy technique, absolute carrying power, or comparison with another singer."
    }
  },
  {
    "id": "v-l5-m3-04",
    "stageId": "v-l5",
    "moduleId": "v-l5-m3",
    "stageSlug": "through-the-break",
    "moduleSlug": "twang-and-ring",
    "slug": "ring-without-pressing",
    "title": "Ring Without Pressing",
    "type": "exercise",
    "minutes": 6,
    "objective": "More carrying power without more push. Ring is a change of resonance, not a change of effort.",
    "explanation": "",
    "prerequisites": [
      "v-l5-m3-01"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Humming thirds. Hear the reference, choose a comfortable key, then stop it before singing. The reading Resonance, placement and the vowel is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Record an easy baseline phrase in the recorder at fixed microphone distance and moderate input gain. Use the same pitch, vowel, and duration for comparisons.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Resonance over force",
        "body": "More carrying power without more push. Ring is a change of resonance, not a change of effort. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Input gain and distance stay fixed so the comparison is within your own takes; the neck and jaw do not visibly brace.",
        "listen": "The second example in the same recording carries more brightness without sounding pressed or simply louder at the microphone."
      },
      {
        "title": "Alternate attempt and reset",
        "body": "To find the brighter setup, say a small, bratty “nyeh” at speaking volume, as if mimicking a whiny child; sing it on a comfortable note, then keep that brightness while changing to “eh”. If it only gets louder, start again smaller. While you find it, have the [voice analyzer](/analyze) open: the Ring band percentage on its tone view usually rises as the sound brightens, but getting louder or pressing can raise it too, so keep the volume steady and the throat easy. Work in short repetitions with a normal breath and complete release between them. Add a bright, focused ring with less effort than a shout. Change resonance before volume, and keep each attempt short. Record the easy baseline and brighter example in one take in the [recorder](/recorder), with a quiet breath between them, so saving does not replace the sound you need to compare.",
        "look": "Input gain and distance stay fixed so the comparison is within your own takes; the neck and jaw do not visibly brace.",
        "listen": "The second example in the same recording carries more brightness without sounding pressed or simply louder at the microphone."
      },
      {
        "title": "Review your own attempt",
        "body": "I compared two easy tones on the same pitch and described a change in brightness by ear. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If brightness comes only with pressure, back down to the baseline, use a lighter nasal consonant onset, and stop for today if the voice feels irritated."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Ring Without Pressing.”"
      },
      {
        "seconds": 90,
        "instruction": "Isolate the resonance over force target in short, comfortable examples."
      },
      {
        "seconds": 135,
        "instruction": "Practise or record the complete “Ring Without Pressing” task, resetting between attempts."
      },
      {
        "seconds": 90,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I compared two easy tones on the same pitch and described a change in brightness by ear.",
        "The second example in the same recording carries more brightness without sounding pressed or simply louder at the microphone.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If brightness comes only with pressure, back down to the baseline, use a lighter nasal consonant onset, and stop for today if the voice feels irritated. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I compared two easy tones on the same pitch and described a change in brightness by ear. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Strain, pressed phonation, healthy technique, absolute carrying power, or comparison with another singer."
    }
  },
  {
    "id": "v-l5-m3-07",
    "stageId": "v-l5",
    "moduleId": "v-l5-m3",
    "stageSlug": "through-the-break",
    "moduleSlug": "twang-and-ring",
    "slug": "self-check-brightness-without-pushing",
    "title": "Self-Check: Brightness Without Pushing",
    "type": "checkpoint",
    "minutes": 5,
    "objective": "Compare two easy tones on the same pitch and describe a change in brightness by ear. This is a listening and reflection check.",
    "explanation": "",
    "prerequisites": [
      "v-l5-m3-04"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Humming thirds. Hear the reference, choose a comfortable key, then stop it before singing. The reading Resonance, placement and the vowel is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Record an easy baseline phrase in the recorder at fixed microphone distance and moderate input gain. Use the same pitch, vowel, and duration for comparisons.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Resonance over force",
        "body": "The second example sounds brighter, not just louder, at the same microphone distance. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Input gain and distance stay fixed so the comparison is within your own takes; the neck and jaw do not visibly brace.",
        "listen": "The second example in the same recording carries more brightness without sounding pressed or simply louder at the microphone."
      },
      {
        "title": "Make one evidence take",
        "body": "To find the brighter setup, say a small, bratty “nyeh” at speaking volume, as if mimicking a whiny child; sing it on a comfortable note, then keep that brightness while changing to “eh”. If it only gets louder, start again smaller. While you find it, have the [voice analyzer](/analyze) open: the Ring band percentage on its tone view usually rises as the sound brightens, but getting louder or pressing can raise it too, so keep the volume steady and the throat easy. State the checkpoint target, record one uninterrupted attempt, and keep the result even when it does not pass. Add a bright, focused ring with less effort than a shout. Change resonance before volume, and keep each attempt short. Record the easy baseline and brighter example in one take in the [recorder](/recorder), with a quiet breath between them, so saving does not replace the sound you need to compare.",
        "look": "Input gain and distance stay fixed so the comparison is within your own takes; the neck and jaw do not visibly brace.",
        "listen": "The second example in the same recording carries more brightness without sounding pressed or simply louder at the microphone."
      },
      {
        "title": "Review your own attempt",
        "body": "I compared two easy tones on the same pitch and described a change in brightness by ear. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If brightness comes only with pressure, back down to the baseline, use a lighter nasal consonant onset, and stop for today if the voice feels irritated."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Self-Check: Brightness Without Pushing.”"
      },
      {
        "seconds": 75,
        "instruction": "Isolate the resonance over force target in short, comfortable examples."
      },
      {
        "seconds": 120,
        "instruction": "Practise or record the complete “Self-Check: Brightness Without Pushing” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I compared two easy tones on the same pitch and described a change in brightness by ear.",
        "The second example in the same recording carries more brightness without sounding pressed or simply louder at the microphone.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "In one take at a fixed microphone distance, the second example sounds brighter than the baseline rather than just louder, and you can sing it again quietly with no grip in the throat.",
      "ifNotReady": "If brightness comes only with pressure, back down to the baseline, use a lighter nasal consonant onset, and stop for today if the voice feels irritated. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I compared two easy tones on the same pitch and described a change in brightness by ear. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Strain, pressed phonation, healthy technique, absolute carrying power, or comparison with another singer."
    }
  },
  {
    "id": "v-l5-m4-01",
    "stageId": "v-l5",
    "moduleId": "v-l5-m4",
    "stageSlug": "through-the-break",
    "moduleSlug": "mix-not-shout",
    "slug": "the-difference-you-can-hear",
    "title": "The Difference You Can Hear",
    "type": "concept",
    "minutes": 4,
    "objective": "Belt and shout can sound alike at first. The difference is in repetition: an easy call sounds the same the third time, a shout costs more each time.",
    "explanation": "A shout gets its size from more air and more squeeze at the folds, so as it climbs it turns tight, goes sharp or cracks, and it tires the voice. Mix is the middle ground between chest and head voice, part fold setup and part vowel and resonance, where the transition can be crossed without a seam, and a belt carries a chest-like sound higher by getting brighter rather than by pushing. The difference you can hear is in repetition: an easy call sounds the same the third time, a shout costs more each time, and any grip in the throat means stop and go lighter.",
    "prerequisites": [
      "v-l5-m3-07"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Legato triad or Wee from the fifth. Hear the reference, choose a comfortable key, then stop it before singing. The reading Registers, and why they exist is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Work only after an easy warm-up, on a pitch below the top of your comfortable range. Keep attempts short and have a clear stop rule before starting.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Comfortable mixed-voice coordination",
        "body": "Belt and shout can sound alike at first. The difference is in repetition: an easy call sounds the same the third time, a shout costs more each time. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The chin stays level, the jaw remains available, and the pitch does not require a raised chest or rigid neck.",
        "listen": "The tone stays clear and repeatable for the planned short hold, with an easy release and no rasp that persists afterward."
      },
      {
        "title": "Hear the distinction",
        "body": "Say “hey!” as if calling a friend across a quiet room — a call, not a shout. Sing that “hey” on a comfortable note below your transition, then move it up one semitone at a time only while it stays as easy as speaking; if it starts to need a push, let it lighten instead. Record the climb in one take in the [recorder](/recorder). Pitch is the only thing that changes, so on playback listen for the first note where the call starts to sound like a shout: harder, louder without getting brighter, or tight. That note is where to lighten next time. To put a name on it, climb back to that step once more, lightly, in the [pitch studio](/studio), which shows each note as you sing it. Never chase a belt label by adding throat pressure.",
        "look": "The chin stays level, the jaw remains available, and the pitch does not require a raised chest or rigid neck.",
        "listen": "The tone stays clear and repeatable for the planned short hold, with an easy release and no rasp that persists afterward."
      },
      {
        "title": "Review your own attempt",
        "body": "I tried the supplied short pattern gently, returned to an easy baseline, and noted my own effort. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "Stop immediately for pain, burning, sudden hoarseness, loss of range, or effort that lingers. Resume another day or work with a qualified teacher; do not repeat to prove toughness."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 30,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “The Difference You Can Hear.”"
      },
      {
        "seconds": 60,
        "instruction": "Isolate the comfortable mixed-voice coordination target in short, comfortable examples."
      },
      {
        "seconds": 90,
        "instruction": "Practise or record the complete “The Difference You Can Hear” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I tried the supplied short pattern gently, returned to an easy baseline, and noted my own effort.",
        "The tone stays clear and repeatable for the planned short hold, with an easy release and no rasp that persists afterward.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "Stop immediately for pain, burning, sudden hoarseness, loss of range, or effort that lingers. Resume another day or work with a qualified teacher; do not repeat to prove toughness. When you come back, start from a smaller version, and only once your speaking voice feels normal.",
      "shows": "I tried the supplied short pattern gently, returned to an easy baseline, and noted my own effort. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Safe belt, absence of strain, pressed-phonation status, tissue health, or medical readiness; the app cannot judge those."
    }
  },
  {
    "id": "v-l5-m4-04",
    "stageId": "v-l5",
    "moduleId": "v-l5-m4",
    "stageSlug": "through-the-break",
    "moduleSlug": "mix-not-shout",
    "slug": "an-easy-pattern-through-your-transition",
    "title": "An Easy Pattern Through Your Transition",
    "type": "exercise",
    "minutes": 6,
    "objective": "A short supplied pattern that crosses your transition zone — pick the key that puts it there.",
    "explanation": "",
    "prerequisites": [
      "v-l5-m4-01"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Legato triad or Wee from the fifth. Hear the reference, choose a comfortable key, then stop it before singing. The reading Registers, and why they exist is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Work only after an easy warm-up, on a pitch below the top of your comfortable range. Keep attempts short and have a clear stop rule before starting.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Comfortable mixed-voice coordination",
        "body": "A short supplied pattern that crosses your transition zone — pick the key that puts it there. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The chin stays level, the jaw remains available, and the pitch does not require a raised chest or rigid neck.",
        "listen": "The tone stays clear and repeatable for the planned short hold, with an easy release and no rasp that persists afterward."
      },
      {
        "title": "Build the pattern in pieces",
        "body": "Say “hey!” as if calling a friend across a quiet room — a call, not a shout. Sing that “hey” on a comfortable note below your transition, then move it up one semitone at a time only while it stays as easy as speaking; if it starts to need a push, let it lighten instead. Mark the key, breaths, range edges, and lesson target before a full take of the supplied pattern, Legato triad or Wee from the fifth. Rehearse the hardest part alone, join two repetitions, then record one uninterrupted take in the [recorder](/recorder). Build a speech-like mix at moderate intensity before moving upward by semitone. Never chase a belt label by adding throat pressure.",
        "look": "The chin stays level, the jaw remains available, and the pitch does not require a raised chest or rigid neck.",
        "listen": "The tone stays clear and repeatable for the planned short hold, with an easy release and no rasp that persists afterward."
      },
      {
        "title": "Review your own attempt",
        "body": "I tried the supplied short pattern gently, returned to an easy baseline, and noted my own effort. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "Stop immediately for pain, burning, sudden hoarseness, loss of range, or effort that lingers. Resume another day or work with a qualified teacher; do not repeat to prove toughness."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “An Easy Pattern Through Your Transition.”"
      },
      {
        "seconds": 90,
        "instruction": "Isolate the comfortable mixed-voice coordination target in short, comfortable examples."
      },
      {
        "seconds": 135,
        "instruction": "Practise or record the complete “An Easy Pattern Through Your Transition” task, resetting between attempts."
      },
      {
        "seconds": 90,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I tried the supplied short pattern gently, returned to an easy baseline, and noted my own effort.",
        "The tone stays clear and repeatable for the planned short hold, with an easy release and no rasp that persists afterward.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "Stop immediately for pain, burning, sudden hoarseness, loss of range, or effort that lingers. Resume another day or work with a qualified teacher; do not repeat to prove toughness. When you come back, start from a smaller version, and only once your speaking voice feels normal.",
      "shows": "I tried the supplied short pattern gently, returned to an easy baseline, and noted my own effort. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Safe belt, absence of strain, pressed-phonation status, tissue health, or medical readiness; the app cannot judge those."
    }
  },
  {
    "id": "v-l5-m4-07",
    "stageId": "v-l5",
    "moduleId": "v-l5-m4",
    "stageSlug": "through-the-break",
    "moduleSlug": "mix-not-shout",
    "slug": "self-check-easy-tone-and-effort",
    "title": "Self-Check: Easy Tone and Effort",
    "type": "checkpoint",
    "minutes": 5,
    "objective": "Try the supplied short pattern gently, return to an easy baseline, and note your own effort. This is a listening and reflection check.",
    "explanation": "",
    "prerequisites": [
      "v-l5-m4-04"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Legato triad or Wee from the fifth. Hear the reference, choose a comfortable key, then stop it before singing. The reading Registers, and why they exist is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Work only after an easy warm-up, on a pitch below the top of your comfortable range. Keep attempts short and have a clear stop rule before starting.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Comfortable mixed-voice coordination",
        "body": "Hold six comfortable seconds, then report effort and stop on any warning sign. The app does not verify strain. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The chin stays level, the jaw remains available, and the pitch does not require a raised chest or rigid neck.",
        "listen": "The tone stays clear and repeatable for the planned short hold, with an easy release and no rasp that persists afterward."
      },
      {
        "title": "Make one evidence take",
        "body": "Say “hey!” as if calling a friend across a quiet room — a call, not a shout. Sing that “hey” on a comfortable note below your transition and move it up one semitone at a time only while it stays as easy as speaking, to find the last easy step; if it starts to need a push, let it lighten instead. Then hear the pattern you chose, Legato triad or Wee from the fifth, in the key that puts its top note just above your transition but never above that last easy step, and stop the reference. State the checkpoint target and record one uninterrupted attempt in the [recorder](/recorder): the pattern three times in a row at moderate volume, holding its top note for six comfortable seconds each time, with a quiet breath between. Keep the result even when it does not pass. Never chase a belt label by adding throat pressure.",
        "look": "The chin stays level, the jaw remains available, and the pitch does not require a raised chest or rigid neck.",
        "listen": "The tone stays clear and repeatable for the planned short hold, with an easy release and no rasp that persists afterward."
      },
      {
        "title": "Review your own attempt",
        "body": "I tried the supplied short pattern gently, returned to an easy baseline, and noted my own effort. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "Stop immediately for pain, burning, sudden hoarseness, loss of range, or effort that lingers. Resume another day or work with a qualified teacher; do not repeat to prove toughness."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Self-Check: Easy Tone and Effort.”"
      },
      {
        "seconds": 75,
        "instruction": "Isolate the comfortable mixed-voice coordination target in short, comfortable examples."
      },
      {
        "seconds": 120,
        "instruction": "Practise or record the complete “Self-Check: Easy Tone and Effort” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I tried the supplied short pattern gently, returned to an easy baseline, and noted my own effort.",
        "The tone stays clear and repeatable for the planned short hold, with an easy release and no rasp that persists afterward.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "Three times in a row, the pattern crosses your transition at moderate volume with the same easy, call-like effort you have below it, you hold its top note for six comfortable seconds, and your speaking voice feels unchanged afterward.",
      "ifNotReady": "Stop immediately for pain, burning, sudden hoarseness, loss of range, or effort that lingers. Resume another day or work with a qualified teacher; do not repeat to prove toughness. When you come back, start from a smaller version, and only once your speaking voice feels normal.",
      "shows": "I tried the supplied short pattern gently, returned to an easy baseline, and noted my own effort. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Safe belt, absence of strain, pressed-phonation status, tissue health, or medical readiness; the app cannot judge those."
    }
  },
  {
    "id": "v-l5-m5-01",
    "stageId": "v-l5",
    "moduleId": "v-l5-m5",
    "stageSlug": "through-the-break",
    "moduleSlug": "four-bars-yours",
    "slug": "improvising-is-answering",
    "title": "Improvising Is Answering",
    "type": "concept",
    "minutes": 4,
    "objective": "Rung one of the improvising ladder: answer a short call with notes from the supplied pattern, then vary one thing.",
    "explanation": "Improvising is easiest to start as an answer: a short call sets the key and the pulse, and you reply with a phrase of your own that ends on the home note. Limiting the answer to five notes of the scale, 1, 2, 3, 5 and 6, leaves fewer wrong choices, so your attention can go to rhythm, direction and where you land. Change one of those at a time and the answer stays connected to the call while still being yours.",
    "prerequisites": [
      "v-l5-m4-07"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Pentatonic run or Minor five-note scale. Hear the reference, choose a comfortable key, then stop it before singing. The reading What pitch accuracy actually measures is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Choose Pentatonic run in the practice material on this page and hear its 8–6–5–3–2–1 pattern in a comfortable key. Its final note is your tonic. Stop the reference and use only 1, 2, 3, 5, and 6 for this exercise. Tap four steady beats per bar; no backing loop is needed.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Four-bar improvisation",
        "body": "Rung one of the improvising ladder: answer a short call with notes from the supplied pattern, then vary one thing. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Plan four bars with a beginning, response, contrast, and ending rather than filling every beat.",
        "listen": "The take sounds like an answer to the call and returns convincingly to the tonal center."
      },
      {
        "title": "Hear the distinction",
        "body": "Tap four steady beats per bar. For a concrete starting call, sing 1 on beat 1, 2 on beat 2, 3 on beat 3, and rest on beat 4. Answer with 3, 2, 1, rest in bar 2. Vary one rhythm in bar 3, then end on 1 in bar 4. Sing those four bars twice in one take, with a bar of tapped rest between: the second time, keep every note the same and change only the rhythm of bar 3, for example by holding one note for two beats. Listen back for whether both versions still sound like an answer that lands home on 1. Once that is familiar, invent a different answer from the same note set, varying one element—rhythm, direction, or ending—while keeping the same key center. Record your takes in the recorder.",
        "look": "Plan four bars with a beginning, response, contrast, and ending rather than filling every beat.",
        "listen": "The take sounds like an answer to the call and returns convincingly to the tonal center."
      },
      {
        "title": "Review your own attempt",
        "body": "I used notes from the supplied pattern to invent a short answer with a clear beginning and ending. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If you lose the key, stop, sing the tonic, reduce the note set, and rebuild one two-bar answer before trying four bars."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 30,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Improvising Is Answering.”"
      },
      {
        "seconds": 60,
        "instruction": "Isolate the four-bar improvisation target in short, comfortable examples."
      },
      {
        "seconds": 90,
        "instruction": "Practise or record the complete “Improvising Is Answering” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I used notes from the supplied pattern to invent a short answer with a clear beginning and ending.",
        "The take sounds like an answer to the call and returns convincingly to the tonal center.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If you lose the key, stop, sing the tonic, reduce the note set, and rebuild one two-bar answer before trying four bars. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I used notes from the supplied pattern to invent a short answer with a clear beginning and ending. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Automatic key adherence, improvisation quality, originality, or continuity as evidence that the material was improvised."
    }
  },
  {
    "id": "v-l5-m5-03",
    "stageId": "v-l5",
    "moduleId": "v-l5-m5",
    "stageSlug": "through-the-break",
    "moduleSlug": "four-bars-yours",
    "slug": "sing-the-answer",
    "title": "Sing the Answer",
    "type": "exercise",
    "minutes": 6,
    "objective": "Call and response before free improvisation.",
    "explanation": "",
    "prerequisites": [
      "v-l5-m5-01"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Pentatonic run or Minor five-note scale. Hear the reference, choose a comfortable key, then stop it before singing. The reading What pitch accuracy actually measures is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Choose Pentatonic run in the practice material on this page and hear its 8–6–5–3–2–1 pattern in a comfortable key. Its final note is your tonic. Stop the reference and use only 1, 2, 3, 5, and 6 for this exercise. Tap four steady beats per bar; no backing loop is needed.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Four-bar improvisation",
        "body": "Call and response before free improvisation. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Plan four bars with a beginning, response, contrast, and ending rather than filling every beat.",
        "listen": "The take sounds like an answer to the call and returns convincingly to the tonal center."
      },
      {
        "title": "Alternate attempt and reset",
        "body": "Work in short repetitions with a normal breath and complete release between them. Answer a short call, leave space, then vary one element—rhythm, direction, or ending—while keeping the same key center. For a concrete starting call, sing 1 on beat 1, 2 on beat 2, 3 on beat 3, and rest on beat 4. Answer with 3, 2, 1, rest in bar 2. Vary one rhythm in bar 3, then end on 1 in bar 4. Once that is familiar, invent a different answer from the same note set. Record call and answer together in one take.",
        "look": "Plan four bars with a beginning, response, contrast, and ending rather than filling every beat.",
        "listen": "The take sounds like an answer to the call and returns convincingly to the tonal center."
      },
      {
        "title": "Review your own attempt",
        "body": "I used notes from the supplied pattern to invent a short answer with a clear beginning and ending. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If you lose the key, stop, sing the tonic, reduce the note set, and rebuild one two-bar answer before trying four bars."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Sing the Answer.”"
      },
      {
        "seconds": 90,
        "instruction": "Isolate the four-bar improvisation target in short, comfortable examples."
      },
      {
        "seconds": 135,
        "instruction": "Practise or record the complete “Sing the Answer” task, resetting between attempts."
      },
      {
        "seconds": 90,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I used notes from the supplied pattern to invent a short answer with a clear beginning and ending.",
        "The take sounds like an answer to the call and returns convincingly to the tonal center.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If you lose the key, stop, sing the tonic, reduce the note set, and rebuild one two-bar answer before trying four bars. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I used notes from the supplied pattern to invent a short answer with a clear beginning and ending. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Automatic key adherence, improvisation quality, originality, or continuity as evidence that the material was improvised."
    }
  },
  {
    "id": "v-l5-m5-07",
    "stageId": "v-l5",
    "moduleId": "v-l5-m5",
    "stageSlug": "through-the-break",
    "moduleSlug": "four-bars-yours",
    "slug": "self-check-your-answering-phrase",
    "title": "Self-Check: Your Answering Phrase",
    "type": "checkpoint",
    "minutes": 5,
    "objective": "Use notes from the supplied pattern to invent a short answer with a clear beginning and ending. This is a listening and reflection check.",
    "explanation": "",
    "prerequisites": [
      "v-l5-m5-03"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Pentatonic run or Minor five-note scale. Hear the reference, choose a comfortable key, then stop it before singing. The reading What pitch accuracy actually measures is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Choose Pentatonic run in the practice material on this page and hear its 8–6–5–3–2–1 pattern in a comfortable key. Its final note is your tonic. Stop the reference and use only 1, 2, 3, 5, and 6 for this exercise. Tap four steady beats per bar; no backing loop is needed.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Four-bar improvisation",
        "body": "Keep a tapped four-beat pulse through four bars, including your rests. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Plan four bars with a beginning, response, contrast, and ending rather than filling every beat.",
        "listen": "The take sounds like an answer to the call and returns convincingly to the tonal center."
      },
      {
        "title": "Make one evidence take",
        "body": "State the checkpoint target, record one uninterrupted attempt, and keep the result even when it does not pass. Answer a short call, leave space, then vary one element—rhythm, direction, or ending—while keeping the same key center. For a concrete starting call, sing 1 on beat 1, 2 on beat 2, 3 on beat 3, and rest on beat 4. Answer with 3, 2, 1, rest in bar 2. Vary one rhythm in bar 3, then end on 1 in bar 4. Once that is familiar, invent a different answer from the same note set. Record call and answer together in one take.",
        "look": "Plan four bars with a beginning, response, contrast, and ending rather than filling every beat.",
        "listen": "The take sounds like an answer to the call and returns convincingly to the tonal center."
      },
      {
        "title": "Review your own attempt",
        "body": "I used notes from the supplied pattern to invent a short answer with a clear beginning and ending. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If you lose the key, stop, sing the tonic, reduce the note set, and rebuild one two-bar answer before trying four bars."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Self-Check: Your Answering Phrase.”"
      },
      {
        "seconds": 75,
        "instruction": "Isolate the four-bar improvisation target in short, comfortable examples."
      },
      {
        "seconds": 120,
        "instruction": "Practise or record the complete “Self-Check: Your Answering Phrase” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I used notes from the supplied pattern to invent a short answer with a clear beginning and ending.",
        "The take sounds like an answer to the call and returns convincingly to the tonal center.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "On two different days, you sing call and answer as four bars in one take, keeping the tapped pulse through the rests, and a different answer each day ends on the tonic.",
      "ifNotReady": "If you lose the key, stop, sing the tonic, reduce the note set, and rebuild one two-bar answer before trying four bars. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I used notes from the supplied pattern to invent a short answer with a clear beginning and ending. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Automatic key adherence, improvisation quality, originality, or continuity as evidence that the material was improvised."
    }
  },
  {
    "id": "v-l6-m1-01",
    "stageId": "v-l6",
    "moduleId": "v-l6-m1",
    "stageSlug": "agility",
    "moduleSlug": "three-note-runs",
    "slug": "a-run-is-a-scale-in-a-hurry",
    "title": "A Run Is a Scale in a Hurry",
    "type": "concept",
    "minutes": 4,
    "objective": "Why slow practice is the only route to fast runs.",
    "explanation": "A run is a short scale or pattern sung fast, usually on one syllable, and every note in it is still a real note with its own pitch. Speed hides mistakes rather than fixing them: a run practised fast learns the smear along with the notes. The route to a clean fast run is to sing the pattern slowly enough that every note lands, then raise the tempo in small steps and drop back the moment a middle note blurs into a slide.",
    "prerequisites": [
      "v-l5-m5-07"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Small three-note climb; Agility run, a five-note scale, is the step up once three notes are clean. Hear the reference, choose a comfortable key, then stop it before singing. The reading What pitch accuracy actually measures is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Choose Small three-note climb (1–2–3–2–1), the three-note turn in the practice material, in a comfortable key and begin well below the goal tempo. Use light volume and a clean consonant or vowel onset.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Melodic agility",
        "body": "Why slow practice is the only route to fast runs. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The tempo ladder advances in small steps and each failed rung is repeated or lowered rather than forced.",
        "listen": "Three separate pitches remain audible; the middle note does not smear into a slide."
      },
      {
        "title": "Hear the distinction",
        "body": "Sing Small three-note climb (1–2–3–2–1) twice: first at a tempo where every note is easy to place, then about twice as fast. Change only the speed. Record both in one take in the recorder with a breath between them, then listen to the fast one: can you still hear the 2 on the way up and on the way down as its own note, or has it become a slide? Increase tempo only after every note is distinct. Keep the first and last pitch centered instead of sacrificing them for speed.",
        "look": "The tempo ladder advances in small steps and each failed rung is repeated or lowered rather than forced.",
        "listen": "Three separate pitches remain audible; the middle note does not smear into a slide."
      },
      {
        "title": "Review your own attempt",
        "body": "I isolated the existing agility pattern slowly and connected its notes without rushing by my own listening judgment. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If notes blur, halve the pattern, slow down, and alternate one accurate rep with one rest breath before climbing again."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 30,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “A Run Is a Scale in a Hurry.”"
      },
      {
        "seconds": 60,
        "instruction": "Isolate the melodic agility target in short, comfortable examples."
      },
      {
        "seconds": 90,
        "instruction": "Practise or record the complete “A Run Is a Scale in a Hurry” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I isolated the existing agility pattern slowly and connected its notes without rushing by my own listening judgment.",
        "Three separate pitches remain audible; the middle note does not smear into a slide.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If notes blur, halve the pattern, slow down, and alternate one accurate rep with one rest breath before climbing again. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I isolated the existing agility pattern slowly and connected its notes without rushing by my own listening judgment. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Tongue or jaw freedom, vocal health, stylistic cleanliness, or accuracy outside the scored target sequence."
    }
  },
  {
    "id": "v-l6-m1-03",
    "stageId": "v-l6",
    "moduleId": "v-l6-m1",
    "stageSlug": "agility",
    "moduleSlug": "three-note-runs",
    "slug": "turnaround-slow-to-fast",
    "title": "Turnaround, Slow to Fast",
    "type": "exercise",
    "minutes": 6,
    "objective": "Rehearse slowly and move on only when you can hear separate, repeatable notes.",
    "explanation": "",
    "prerequisites": [
      "v-l6-m1-01"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Small three-note climb; Agility run, a five-note scale, is the step up once three notes are clean. Hear the reference, choose a comfortable key, then stop it before singing. The reading What pitch accuracy actually measures is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Choose Small three-note climb (1–2–3–2–1), the three-note turn in the practice material, in a comfortable key and begin well below the goal tempo. Use light volume and a clean consonant or vowel onset.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Melodic agility",
        "body": "Rehearse slowly and move on only when you can hear separate, repeatable notes. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The tempo ladder advances in small steps and each failed rung is repeated or lowered rather than forced.",
        "listen": "Three separate pitches remain audible; the middle note does not smear into a slide."
      },
      {
        "title": "Alternate attempt and reset",
        "body": "Work in short repetitions with a normal breath and complete release between them. Increase tempo only after every note is distinct. Keep the first and last pitch centered instead of sacrificing them for speed.",
        "look": "The tempo ladder advances in small steps and each failed rung is repeated or lowered rather than forced.",
        "listen": "Three separate pitches remain audible; the middle note does not smear into a slide."
      },
      {
        "title": "Review your own attempt",
        "body": "I isolated the existing agility pattern slowly and connected its notes without rushing by my own listening judgment. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If notes blur, halve the pattern, slow down, and alternate one accurate rep with one rest breath before climbing again."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Turnaround, Slow to Fast.”"
      },
      {
        "seconds": 90,
        "instruction": "Isolate the melodic agility target in short, comfortable examples."
      },
      {
        "seconds": 135,
        "instruction": "Practise or record the complete “Turnaround, Slow to Fast” task, resetting between attempts."
      },
      {
        "seconds": 90,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I isolated the existing agility pattern slowly and connected its notes without rushing by my own listening judgment.",
        "Three separate pitches remain audible; the middle note does not smear into a slide.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If notes blur, halve the pattern, slow down, and alternate one accurate rep with one rest breath before climbing again. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I isolated the existing agility pattern slowly and connected its notes without rushing by my own listening judgment. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Tongue or jaw freedom, vocal health, stylistic cleanliness, or accuracy outside the scored target sequence."
    }
  },
  {
    "id": "v-l6-m1-08",
    "stageId": "v-l6",
    "moduleId": "v-l6-m1",
    "stageSlug": "agility",
    "moduleSlug": "three-note-runs",
    "slug": "self-check-a-clear-agility-pattern",
    "title": "Self-Check: A Clear Agility Pattern",
    "type": "checkpoint",
    "minutes": 6,
    "objective": "Isolate the agility pattern slowly and connect its notes without rushing, judged by your own listening. This is a listening and reflection check.",
    "explanation": "",
    "prerequisites": [
      "v-l6-m1-03"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Small three-note climb; Agility run, a five-note scale, is the step up once three notes are clean. Hear the reference, choose a comfortable key, then stop it before singing. The reading What pitch accuracy actually measures is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Choose Small three-note climb (1–2–3–2–1), the three-note turn in the practice material, in a comfortable key and begin well below the goal tempo. Use light volume and a clean consonant or vowel onset.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Melodic agility",
        "body": "Every note landing, not smeared. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The tempo ladder advances in small steps and each failed rung is repeated or lowered rather than forced.",
        "listen": "Three separate pitches remain audible; the middle note does not smear into a slide."
      },
      {
        "title": "Make one evidence take",
        "body": "State the checkpoint target, record one uninterrupted attempt in the [recorder](/recorder), and keep the result even when it does not pass. Increase tempo only after every note is distinct. Keep the first and last pitch centered instead of sacrificing them for speed.",
        "look": "The tempo ladder advances in small steps and each failed rung is repeated or lowered rather than forced.",
        "listen": "Three separate pitches remain audible; the middle note does not smear into a slide."
      },
      {
        "title": "Review your own attempt",
        "body": "I isolated the existing agility pattern slowly and connected its notes without rushing by my own listening judgment. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If notes blur, halve the pattern, slow down, and alternate one accurate rep with one rest breath before climbing again."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Self-Check: A Clear Agility Pattern.”"
      },
      {
        "seconds": 90,
        "instruction": "Isolate the melodic agility target in short, comfortable examples."
      },
      {
        "seconds": 135,
        "instruction": "Practise or record the complete “Self-Check: A Clear Agility Pattern” task, resetting between attempts."
      },
      {
        "seconds": 90,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I isolated the existing agility pattern slowly and connected its notes without rushing by my own listening judgment.",
        "Three separate pitches remain audible; the middle note does not smear into a slide.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "On two different days, three reps in a row of the 1–2–3–2–1 turn at your current tempo play back with every note on its own pitch, the 2 included in both directions.",
      "ifNotReady": "If notes blur, halve the pattern, slow down, and alternate one accurate rep with one rest breath before climbing again. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I isolated the existing agility pattern slowly and connected its notes without rushing by my own listening judgment. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Tongue or jaw freedom, vocal health, stylistic cleanliness, or accuracy outside the scored target sequence."
    }
  },
  {
    "id": "v-l6-m2-01",
    "stageId": "v-l6",
    "moduleId": "v-l6-m2",
    "stageSlug": "agility",
    "moduleSlug": "four-note-turnarounds-and-melisma",
    "slug": "one-syllable-many-notes",
    "title": "One Syllable, Many Notes",
    "type": "concept",
    "minutes": 4,
    "objective": "Melisma, and why it needs a stable vowel underneath.",
    "explanation": "Melisma is several notes sung on one syllable, the way a run carries a single word. The vowel is what carries all of those notes, and a vowel is a shape of the tongue, jaw and lips, so if that shape moves on every note the color flickers and the line starts to sound like new syllables or a smear. Hold one vowel shape still and let only the pitch move; that steady vowel is what lets each note sound separate and still belong to the same word.",
    "prerequisites": [
      "v-l6-m1-08"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Hoo descent. Hear the reference, choose a comfortable key, then stop it before singing. The reading Breath: support versus pressure is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Establish one easy vowel on the starting note, then sing the four-note pattern slowly without changing the vowel under each pitch.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Melisma",
        "body": "Melisma, and why it needs a stable vowel underneath. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The jaw does not pump once per note and the tempo remains low enough for separate pitch targets.",
        "listen": "One syllable carries all four notes with clear centers and no swallowed middle pitches."
      },
      {
        "title": "Hear the distinction",
        "body": "Sing Hoo descent (8–5–3–1) twice at a slow tempo: first restarting the “h” on every note, then on one unbroken “oo” with the jaw and lips still and only the pitch moving. Change only whether the syllable restarts. Record both in one take in the recorder with a breath between them; the second should sound like one word carrying four notes, each still on its own pitch. Keep the vowel stable while the pitch changes. Reverse the pattern only after the descending direction has four clear notes.",
        "look": "The jaw does not pump once per note and the tempo remains low enough for separate pitch targets.",
        "listen": "One syllable carries all four notes with clear centers and no swallowed middle pitches."
      },
      {
        "title": "Review your own attempt",
        "body": "I sang the supplied four-note descent on one syllable, then listened for four separate pitch centers. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If the vowel changes or the notes smear, sing the pattern on a lip trill, then reopen to the vowel at a slower tempo."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 30,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “One Syllable, Many Notes.”"
      },
      {
        "seconds": 60,
        "instruction": "Isolate the melisma target in short, comfortable examples."
      },
      {
        "seconds": 90,
        "instruction": "Practise or record the complete “One Syllable, Many Notes” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I sang the supplied four-note descent on one syllable, then listened for four separate pitch centers.",
        "One syllable carries all four notes with clear centers and no swallowed middle pitches.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If the vowel changes or the notes smear, sing the pattern on a lip trill, then reopen to the vowel at a slower tempo. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I sang the supplied four-note descent on one syllable, then listened for four separate pitch centers. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Vowel or formant stability, melisma style, vocal health, or cleanliness of notes the detector could not follow."
    }
  },
  {
    "id": "v-l6-m2-04",
    "stageId": "v-l6",
    "moduleId": "v-l6-m2",
    "stageSlug": "agility",
    "moduleSlug": "four-note-turnarounds-and-melisma",
    "slug": "four-note-ladder",
    "title": "Four-Note Ladder",
    "type": "exercise",
    "minutes": 7,
    "objective": "Four-note patterns across the scale, both directions.",
    "explanation": "",
    "prerequisites": [
      "v-l6-m2-01"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Hoo descent. Hear the reference, choose a comfortable key, then stop it before singing. The reading Breath: support versus pressure is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Establish one easy vowel on the starting note, then sing the four-note pattern slowly without changing the vowel under each pitch.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Melisma",
        "body": "Four-note patterns across the scale, both directions. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The jaw does not pump once per note and the tempo remains low enough for separate pitch targets.",
        "listen": "One syllable carries all four notes with clear centers and no swallowed middle pitches."
      },
      {
        "title": "Alternate attempt and reset",
        "body": "Work in short repetitions with a normal breath and complete release between them. Keep the vowel stable while the pitch changes. Reverse the pattern only after the forward direction has four clear notes.",
        "look": "The jaw does not pump once per note and the tempo remains low enough for separate pitch targets.",
        "listen": "One syllable carries all four notes with clear centers and no swallowed middle pitches."
      },
      {
        "title": "Review your own attempt",
        "body": "I sang the supplied four-note descent on one syllable, then listened for four separate pitch centers. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If the vowel changes or the notes smear, sing the pattern on a lip trill, then reopen to the vowel at a slower tempo."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 60,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Four-Note Ladder.”"
      },
      {
        "seconds": 105,
        "instruction": "Isolate the melisma target in short, comfortable examples."
      },
      {
        "seconds": 165,
        "instruction": "Practise or record the complete “Four-Note Ladder” task, resetting between attempts."
      },
      {
        "seconds": 90,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I sang the supplied four-note descent on one syllable, then listened for four separate pitch centers.",
        "One syllable carries all four notes with clear centers and no swallowed middle pitches.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If the vowel changes or the notes smear, sing the pattern on a lip trill, then reopen to the vowel at a slower tempo. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I sang the supplied four-note descent on one syllable, then listened for four separate pitch centers. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Vowel or formant stability, melisma style, vocal health, or cleanliness of notes the detector could not follow."
    }
  },
  {
    "id": "v-l6-m2-08",
    "stageId": "v-l6",
    "moduleId": "v-l6-m2",
    "stageSlug": "agility",
    "moduleSlug": "four-note-turnarounds-and-melisma",
    "slug": "self-check-four-notes-on-one-syllable",
    "title": "Self-Check: Four Notes on One Syllable",
    "type": "checkpoint",
    "minutes": 6,
    "objective": "Sing the supplied four-note descent on one syllable, then listen for four separate pitch centers. This is a listening and reflection check.",
    "explanation": "",
    "prerequisites": [
      "v-l6-m2-04"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Hoo descent. Hear the reference, choose a comfortable key, then stop it before singing. The reading Breath: support versus pressure is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Establish one easy vowel on the starting note, then sing the four-note pattern slowly without changing the vowel under each pitch.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Melisma",
        "body": "Listen for each of the four displayed pitches; this is a self-check without an automatic score. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The jaw does not pump once per note and the tempo remains low enough for separate pitch targets.",
        "listen": "One syllable carries all four notes with clear centers and no swallowed middle pitches."
      },
      {
        "title": "Make one evidence take",
        "body": "State the checkpoint target, record one uninterrupted attempt in the [recorder](/recorder), and keep the result even when it does not pass. Keep the vowel stable while the pitch changes. Reverse the pattern only after the forward direction has four clear notes.",
        "look": "The jaw does not pump once per note and the tempo remains low enough for separate pitch targets.",
        "listen": "One syllable carries all four notes with clear centers and no swallowed middle pitches."
      },
      {
        "title": "Review your own attempt",
        "body": "I sang the supplied four-note descent on one syllable, then listened for four separate pitch centers. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If the vowel changes or the notes smear, sing the pattern on a lip trill, then reopen to the vowel at a slower tempo."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Self-Check: Four Notes on One Syllable.”"
      },
      {
        "seconds": 90,
        "instruction": "Isolate the melisma target in short, comfortable examples."
      },
      {
        "seconds": 135,
        "instruction": "Practise or record the complete “Self-Check: Four Notes on One Syllable” task, resetting between attempts."
      },
      {
        "seconds": 90,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I sang the supplied four-note descent on one syllable, then listened for four separate pitch centers.",
        "One syllable carries all four notes with clear centers and no swallowed middle pitches.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "On two different days, three reps in a row of Hoo descent on one unbroken “oo” play back as four separate pitches, with no new syllable or vowel change between them.",
      "ifNotReady": "If the vowel changes or the notes smear, sing the pattern on a lip trill, then reopen to the vowel at a slower tempo. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I sang the supplied four-note descent on one syllable, then listened for four separate pitch centers. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Vowel or formant stability, melisma style, vocal health, or cleanliness of notes the detector could not follow."
    }
  },
  {
    "id": "v-l6-m3-01",
    "stageId": "v-l6",
    "moduleId": "v-l6-m3",
    "stageSlug": "agility",
    "moduleSlug": "vibrato-on-demand",
    "slug": "rate-extent-onset",
    "title": "Rate, Extent, Onset",
    "type": "concept",
    "minutes": 5,
    "objective": "Vibrato has three parameters. Controlling them is what separates it from a wobble.",
    "explanation": "Vibrato is a small, regular swing in pitch around the note's center, with three separate dials: rate is how many times a second the pitch swings, from a fast flutter to a slow wave; extent is how far above and below the center it moves, from a narrow shimmer to a wide wobble; and onset is when it starts, straight away or after a stretch of straight tone. What separates vibrato from an unsteady note is regularity, an even rate and extent around a steady center. The Vibrato hold warm-up shows how fast and how wide your pitch moved after each hold, but nothing times the onset, so that dial is yours to judge. It is also the easiest one to practise first, because it begins from a plain, straight note.",
    "prerequisites": [
      "v-l6-m2-08"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Vibrato hold. Hear the reference, choose a comfortable key, then stop it before singing. The reading A vocabulary for tone is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Choose a comfortable sustained note and establish three easy seconds of straight tone before adding any oscillation.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Vibrato control",
        "body": "Vibrato has three parameters. Controlling them is what separates it from a wobble. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Keep the supplied reference or reading visible, settle your posture, and use only a pitch and duration you can repeat comfortably.",
        "listen": "The vibrato begins and ends on cue and sounds even rather than becoming a wide uncontrolled wobble."
      },
      {
        "title": "Hear the distinction",
        "body": "On Vibrato hold, sing two long holds on the same comfortable note, changing only the onset: in the first, stay straight for about one second before you let the vibrato in; in the second, stay straight for about three, which still leaves the vibrato time to settle before the hold ends. Record both in one take in the recorder with a breath between them, and on playback listen for where the wobble starts in each. If vibrato does not come on its own, a straight note is a fine answer. Invite an even vibrato rather than shaking the jaw or pulsing the abdomen. Return deliberately to straight tone and release.",
        "look": "Keep the supplied reference or reading visible, settle your posture, and use only a pitch and duration you can repeat comfortably.",
        "listen": "The vibrato begins and ends on cue and sounds even rather than becoming a wide uncontrolled wobble."
      },
      {
        "title": "Review your own attempt",
        "body": "I compared straight tone with naturally occurring vibrato, without shaking the jaw or manufacturing a wobble. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If oscillation appears only through shaking or pressure, return to straight tone, shorten the hold, and work with a teacher before adding speed."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Rate, Extent, Onset.”"
      },
      {
        "seconds": 75,
        "instruction": "Isolate the vibrato control target in short, comfortable examples."
      },
      {
        "seconds": 120,
        "instruction": "Practise or record the complete “Rate, Extent, Onset” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I compared straight tone with naturally occurring vibrato, without shaking the jaw or manufacturing a wobble.",
        "The vibrato begins and ends on cue and sounds even rather than becoming a wide uncontrolled wobble.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If oscillation appears only through shaking or pressure, return to straight tone, shorten the hold, and work with a teacher before adding speed. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I compared straight tone with naturally occurring vibrato, without shaking the jaw or manufacturing a wobble. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Vibrato onset time, switching on cue, or healthy production. The vibrato drill in warm-ups reads rate and width after a hold, but this lesson does not score them."
    }
  },
  {
    "id": "v-l6-m3-03",
    "stageId": "v-l6",
    "moduleId": "v-l6-m3",
    "stageSlug": "agility",
    "moduleSlug": "vibrato-on-demand",
    "slug": "straight-then-vibrato",
    "title": "Straight Then Vibrato",
    "type": "exercise",
    "minutes": 7,
    "objective": "Start straight, introduce vibrato deliberately, stop it again.",
    "explanation": "",
    "prerequisites": [
      "v-l6-m3-01"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Vibrato hold. Hear the reference, choose a comfortable key, then stop it before singing. The reading A vocabulary for tone is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Choose a comfortable sustained note and establish three easy seconds of straight tone before adding any oscillation.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Vibrato control",
        "body": "Start straight, introduce vibrato deliberately, stop it again. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Keep the supplied reference or reading visible, settle your posture, and use only a pitch and duration you can repeat comfortably.",
        "listen": "The vibrato begins and ends on cue and sounds even rather than becoming a wide uncontrolled wobble."
      },
      {
        "title": "Alternate attempt and reset",
        "body": "Work in short repetitions with a normal breath and complete release between them. Invite an even vibrato rather than shaking the jaw or pulsing the abdomen. Return deliberately to straight tone and release.",
        "look": "Keep the supplied reference or reading visible, settle your posture, and use only a pitch and duration you can repeat comfortably.",
        "listen": "The vibrato begins and ends on cue and sounds even rather than becoming a wide uncontrolled wobble."
      },
      {
        "title": "Review your own attempt",
        "body": "I compared straight tone with naturally occurring vibrato, without shaking the jaw or manufacturing a wobble. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If oscillation appears only through shaking or pressure, return to straight tone, shorten the hold, and work with a teacher before adding speed."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 60,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Straight Then Vibrato.”"
      },
      {
        "seconds": 105,
        "instruction": "Isolate the vibrato control target in short, comfortable examples."
      },
      {
        "seconds": 165,
        "instruction": "Practise or record the complete “Straight Then Vibrato” task, resetting between attempts."
      },
      {
        "seconds": 90,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I compared straight tone with naturally occurring vibrato, without shaking the jaw or manufacturing a wobble.",
        "The vibrato begins and ends on cue and sounds even rather than becoming a wide uncontrolled wobble.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If oscillation appears only through shaking or pressure, return to straight tone, shorten the hold, and work with a teacher before adding speed. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I compared straight tone with naturally occurring vibrato, without shaking the jaw or manufacturing a wobble. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Vibrato onset time, switching on cue, or healthy production. The vibrato drill in warm-ups reads rate and width after a hold, but this lesson does not score them."
    }
  },
  {
    "id": "v-l6-m3-08",
    "stageId": "v-l6",
    "moduleId": "v-l6-m3",
    "stageSlug": "agility",
    "moduleSlug": "vibrato-on-demand",
    "slug": "self-check-straight-to-vibrato-on-cue",
    "title": "Self-Check: Straight to Vibrato on Cue",
    "type": "checkpoint",
    "minutes": 6,
    "objective": "Heard and held, not scored. The vibrato drill in warm-ups reads rate and width, but nothing times vibrato on cue, so the switch itself is your ear and your recording.",
    "explanation": "",
    "prerequisites": [
      "v-l6-m3-03"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Vibrato hold. Hear the reference, choose a comfortable key, then stop it before singing. The reading A vocabulary for tone is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Choose a comfortable sustained note and establish three easy seconds of straight tone before adding any oscillation.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Vibrato control",
        "body": "Heard and held, not scored. The vibrato drill in warm-ups reads rate and width, but nothing times vibrato on cue, so the switch itself is your ear and your recording. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Keep the supplied reference or reading visible, settle your posture, and use only a pitch and duration you can repeat comfortably.",
        "listen": "The vibrato begins and ends on cue and sounds even rather than becoming a wide uncontrolled wobble."
      },
      {
        "title": "Make one evidence take",
        "body": "State the checkpoint target, record one uninterrupted attempt in the [recorder](/recorder), and keep the result even when it does not pass. Before singing, choose the count where the vibrato will come in and the count where you will return to straight tone, for example in on three and out on six of a slow count. Invite an even vibrato rather than shaking the jaw or pulsing the abdomen. Return deliberately to straight tone and release.",
        "look": "Keep the supplied reference or reading visible, settle your posture, and use only a pitch and duration you can repeat comfortably.",
        "listen": "The vibrato begins and ends on cue and sounds even rather than becoming a wide uncontrolled wobble."
      },
      {
        "title": "Review your own attempt",
        "body": "I compared straight tone with naturally occurring vibrato, without shaking the jaw or manufacturing a wobble. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If oscillation appears only through shaking or pressure, return to straight tone, shorten the hold, and work with a teacher before adding speed."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Self-Check: Straight to Vibrato on Cue.”"
      },
      {
        "seconds": 90,
        "instruction": "Isolate the vibrato control target in short, comfortable examples."
      },
      {
        "seconds": 135,
        "instruction": "Practise or record the complete “Self-Check: Straight to Vibrato on Cue” task, resetting between attempts."
      },
      {
        "seconds": 90,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I compared straight tone with naturally occurring vibrato, without shaking the jaw or manufacturing a wobble.",
        "The vibrato begins and ends on cue and sounds even rather than becoming a wide uncontrolled wobble.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "On two different days, in three holds in a row, you start straight, let the vibrato in at the count you chose before singing, and return to straight tone before the release, with no jaw or belly shake.",
      "ifNotReady": "If oscillation appears only through shaking or pressure, return to straight tone, shorten the hold, work with a teacher before adding speed, and repeat a smaller version on another fresh attempt rather than forcing the checkpoint. If no vibrato comes on its own yet, that is not a fault to fix here: keep the holds straight, steady and easy, move on to the next module, and come back to this one in a few weeks rather than shaking one in.",
      "shows": "I compared straight tone with naturally occurring vibrato, without shaking the jaw or manufacturing a wobble. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Vibrato onset time, switching on cue, or healthy production. The vibrato drill in warm-ups reads rate and width after a hold, but this lesson does not score them."
    }
  },
  {
    "id": "v-l6-m4-01",
    "stageId": "v-l6",
    "moduleId": "v-l6-m4",
    "stageSlug": "agility",
    "moduleSlug": "scoops-falls-bends-slides",
    "slug": "four-ornaments-named",
    "title": "Four Ornaments, Named",
    "type": "concept",
    "minutes": 4,
    "objective": "Naming them is what turns habits into choices.",
    "explanation": "Scoops, falls, bends and slides are four small pitch gestures that decorate a melody without changing it. A scoop starts a little below the note and slides up into it; a fall drops away in pitch off the end of a note; a bend pushes the pitch slightly off the note and brings it back; a slide glides from one written note to the next. An accidental scoop is the voice searching for the note, the habit Stage 2 trained out; a scoop you name and place where you meant it is a choice, and that is the whole difference.",
    "prerequisites": [
      "v-l6-m3-08"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Chromatic neighbor or Legato triad. Hear the reference, choose a comfortable key, then stop it before singing. The reading A vocabulary for tone is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Use one short phrase in an easy range and sing a plain version first. Keep the underlying pitch and rhythm map visible.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Ornament vocabulary",
        "body": "Naming them is what turns habits into choices. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Each gesture begins and ends on the planned notes instead of moving the whole phrase out of key.",
        "listen": "The four versions are recognizably different and the underlying words and melody remain intact."
      },
      {
        "title": "Hear the distinction",
        "body": "Use Legato triad (1–3–5–3–1) as your phrase. Before singing, mark where each ornament will go: a scoop into the 3, a bend on the 5, a slide from the 5 down to the 3, and a fall off the last 1. Sing the phrase plain, then with one ornament at the place you marked, then plain again, and record each plain-and-ornament pair in one take in the recorder before moving to the next ornament. Change only the ornament. Keep scoops, falls, bends, and slides small and intentional.",
        "look": "Each gesture begins and ends on the planned notes instead of moving the whole phrase out of key.",
        "listen": "The four versions are recognizably different and the underlying words and melody remain intact."
      },
      {
        "title": "Review your own attempt",
        "body": "I named and compared small pitch gestures in one comfortable phrase, using the written reference as an anchor. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If ornaments blur together, isolate two notes, slow the gesture, and record plain-versus-ornament pairs before rebuilding the phrase."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 30,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Four Ornaments, Named.”"
      },
      {
        "seconds": 60,
        "instruction": "Isolate the ornament vocabulary target in short, comfortable examples."
      },
      {
        "seconds": 90,
        "instruction": "Practise or record the complete “Four Ornaments, Named” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I named and compared small pitch gestures in one comfortable phrase, using the written reference as an anchor.",
        "The four versions are recognizably different and the underlying words and melody remain intact.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If ornaments blur together, isolate two notes, slow the gesture, and record plain-versus-ornament pairs before rebuilding the phrase. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I named and compared small pitch gestures in one comfortable phrase, using the written reference as an anchor. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Automatic ornament classification, stylistic taste, pitch accuracy inside every gesture, or freedom from strain."
    }
  },
  {
    "id": "v-l6-m4-04",
    "stageId": "v-l6",
    "moduleId": "v-l6-m4",
    "stageSlug": "agility",
    "moduleSlug": "scoops-falls-bends-slides",
    "slug": "ornament-on-cue",
    "title": "Ornament on Cue",
    "type": "exercise",
    "minutes": 7,
    "objective": "Choose and say the ornament yourself before the next phrase; there is no automatic spoken cue.",
    "explanation": "",
    "prerequisites": [
      "v-l6-m4-01"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Chromatic neighbor or Legato triad. Hear the reference, choose a comfortable key, then stop it before singing. The reading A vocabulary for tone is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Use one short phrase in an easy range and sing a plain version first. Keep the underlying pitch and rhythm map visible.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Ornament vocabulary",
        "body": "Choose and say the ornament yourself before the next phrase; there is no automatic spoken cue. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Each gesture begins and ends on the planned notes instead of moving the whole phrase out of key.",
        "listen": "The four versions are recognizably different and the underlying words and melody remain intact."
      },
      {
        "title": "Alternate attempt and reset",
        "body": "Work in short repetitions with a normal breath and complete release between them. Scoop: start a little below the note and slide up into it. Fall: drop away in pitch off the end of a note. Bend: push the pitch slightly off the note and bring it back. Slide: glide from one written note to the next. A scoop here is a choice you place, unlike the accidental scoop Stage 2 trained out. Before singing, mark which note of the phrase each will go on. Add one ornament at the place you marked, return to plain, then contrast it with the next. Keep scoops, falls, bends, and slides small and intentional.",
        "look": "Each gesture begins and ends on the planned notes instead of moving the whole phrase out of key.",
        "listen": "The four versions are recognizably different and the underlying words and melody remain intact."
      },
      {
        "title": "Review your own attempt",
        "body": "I named and compared small pitch gestures in one comfortable phrase, using the written reference as an anchor. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If ornaments blur together, isolate two notes, slow the gesture, and record plain-versus-ornament pairs before rebuilding the phrase."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 60,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Ornament on Cue.”"
      },
      {
        "seconds": 105,
        "instruction": "Isolate the ornament vocabulary target in short, comfortable examples."
      },
      {
        "seconds": 165,
        "instruction": "Practise or record the complete “Ornament on Cue” task, resetting between attempts."
      },
      {
        "seconds": 90,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I named and compared small pitch gestures in one comfortable phrase, using the written reference as an anchor.",
        "The four versions are recognizably different and the underlying words and melody remain intact.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If ornaments blur together, isolate two notes, slow the gesture, and record plain-versus-ornament pairs before rebuilding the phrase. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I named and compared small pitch gestures in one comfortable phrase, using the written reference as an anchor. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Automatic ornament classification, stylistic taste, pitch accuracy inside every gesture, or freedom from strain."
    }
  },
  {
    "id": "v-l6-m4-08",
    "stageId": "v-l6",
    "moduleId": "v-l6-m4",
    "stageSlug": "agility",
    "moduleSlug": "scoops-falls-bends-slides",
    "slug": "self-check-four-ornaments-one-phrase",
    "title": "Self-Check: Four Ornaments, One Phrase",
    "type": "checkpoint",
    "minutes": 6,
    "objective": "All four, placed where you meant them, judged by ear. Nothing labels an ornament.",
    "explanation": "",
    "prerequisites": [
      "v-l6-m4-04"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Chromatic neighbor or Legato triad. Hear the reference, choose a comfortable key, then stop it before singing. The reading A vocabulary for tone is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Use one short phrase in an easy range and sing a plain version first. Keep the underlying pitch and rhythm map visible.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Ornament vocabulary",
        "body": "All four, placed where you marked them before singing. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Each gesture begins and ends on the planned notes instead of moving the whole phrase out of key.",
        "listen": "The four versions are recognizably different and the underlying words and melody remain intact."
      },
      {
        "title": "Make one evidence take",
        "body": "State the checkpoint target, record one uninterrupted attempt, and keep the result even when it does not pass. Scoop: start a little below the note and slide up into it. Fall: drop away in pitch off the end of a note. Bend: push the pitch slightly off the note and bring it back. Slide: glide from one written note to the next. A scoop here is a choice you place, unlike the accidental scoop Stage 2 trained out. Before singing, mark which note of the phrase each will go on, then record the phrase once in the [recorder](/recorder) with all four at the places you marked, so you can name each one on playback. Keep scoops, falls, bends, and slides small and intentional.",
        "look": "Each gesture begins and ends on the planned notes instead of moving the whole phrase out of key.",
        "listen": "The four versions are recognizably different and the underlying words and melody remain intact."
      },
      {
        "title": "Review your own attempt",
        "body": "I named and compared small pitch gestures in one comfortable phrase, using the written reference as an anchor. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If ornaments blur together, isolate two notes, slow the gesture, and record plain-versus-ornament pairs before rebuilding the phrase."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Self-Check: Four Ornaments, One Phrase.”"
      },
      {
        "seconds": 90,
        "instruction": "Isolate the ornament vocabulary target in short, comfortable examples."
      },
      {
        "seconds": 135,
        "instruction": "Practise or record the complete “Self-Check: Four Ornaments, One Phrase” task, resetting between attempts."
      },
      {
        "seconds": 90,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I named and compared small pitch gestures in one comfortable phrase, using the written reference as an anchor.",
        "The four versions are recognizably different and the underlying words and melody remain intact.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "In one take of one phrase, all four ornaments land where you marked them beforehand, you can name each one on playback, and the melody returns to its written notes after each.",
      "ifNotReady": "If ornaments blur together, isolate two notes, slow the gesture, and record plain-versus-ornament pairs before rebuilding the phrase. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I named and compared small pitch gestures in one comfortable phrase, using the written reference as an anchor. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Automatic ornament classification, stylistic taste, pitch accuracy inside every gesture, or freedom from strain."
    }
  },
  {
    "id": "v-l6-m5-01",
    "stageId": "v-l6",
    "moduleId": "v-l6-m5",
    "stageSlug": "agility",
    "moduleSlug": "blues-and-pentatonic-lines",
    "slug": "the-notes-that-sound-like-feeling",
    "title": "The Notes That Sound Like Feeling",
    "type": "concept",
    "minutes": 4,
    "objective": "Blue thirds and sevenths, and how they resolve toward the tonic.",
    "explanation": "Blue notes are the third and seventh of the scale sung flat of their major-scale pitches, or bent somewhere between the minor and major versions; blues and soul phrasing lives in that space between the written pitches. They sound like feeling because they lean against the tonic, the home note, so a phrase that leans on a flat third or flat seventh and then settles on the tonic sounds like tension let go. What separates a blue note from a flat one is intent: you aim for it and land it, rather than sagging into it.",
    "prerequisites": [
      "v-l6-m4-08"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Minor five-note scale or Pentatonic run. Hear the reference, choose a comfortable key, then stop it before singing. The reading A vocabulary for tone is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Hear Minor five-note scale in a comfortable key and remember its first note (1), third note (flat 3), and fifth note (5). To hear a flat 7 below the tonic, press Transpose down twice, hear its first note, then transpose back up to where you started. Stop the reference and tap four steady beats per bar; no backing loop is needed.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Eight-bar improvisation",
        "body": "Blue thirds and sevenths, and how they resolve toward the tonic. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The eight bars have a clear form with room to breathe; bends are optional and never forced.",
        "listen": "The take keeps the tapped pulse, develops one repeated idea, and resolves by ear to the tonic you heard before recording."
      },
      {
        "title": "Hear the distinction",
        "body": "From the Minor five-note scale you just heard, sing 1, flat 3, 1 twice. The first time, place the flat 3 squarely on the minor third you heard in the scale; the second time, start a touch below it and bend up into it on purpose before returning to 1. Change only how you arrive at the flat 3. Record both in one take in the recorder with a breath between them, and check that each ends back on the tonic you heard. Use blue thirds and sevenths as deliberate destinations, not pitches reached by accidental flatness. Leave space and repeat a motif before varying it. Begin with a two-bar call: sing 1, flat 3, 5, rest, then 5, flat 3, 1, rest, one event per tapped beat. Answer with flat 7 below the tonic, 1, flat 3, rest, then flat 3, 1, 1, rest. Repeat those four bars with one rhythmic change to make eight. Pitch every note from the tonic you just heard; transpose the whole exercise if it sits too low or too high. Record the call and answer together in one take.",
        "look": "The eight bars have a clear form with room to breathe; bends are optional and never forced.",
        "listen": "The take keeps the tapped pulse, develops one repeated idea, and resolves by ear to the tonic you heard before recording."
      },
      {
        "title": "Review your own attempt",
        "body": "I used the supplied minor and pentatonic patterns to make my own short answering phrases. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If the line wanders, return to tonic, remove bends, and improvise with only three notes over two bars before extending the form."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 30,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “The Notes That Sound Like Feeling.”"
      },
      {
        "seconds": 60,
        "instruction": "Isolate the eight-bar improvisation target in short, comfortable examples."
      },
      {
        "seconds": 90,
        "instruction": "Practise or record the complete “The Notes That Sound Like Feeling” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I used the supplied minor and pentatonic patterns to make my own short answering phrases.",
        "The take keeps the tapped pulse, develops one repeated idea, and resolves by ear to the tonic you heard before recording.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If the line wanders, return to tonic, remove bends, and improvise with only three notes over two bars before extending the form. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I used the supplied minor and pentatonic patterns to make my own short answering phrases. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Improvisation quality or originality; even an unbroken voiced run cannot show that a phrase was improvised."
    }
  },
  {
    "id": "v-l6-m5-04",
    "stageId": "v-l6",
    "moduleId": "v-l6-m5",
    "stageSlug": "agility",
    "moduleSlug": "blues-and-pentatonic-lines",
    "slug": "blue-thirds-and-sevenths",
    "title": "Blue Thirds and Sevenths",
    "type": "exercise",
    "minutes": 7,
    "objective": "Bend into them deliberately rather than arriving flat.",
    "explanation": "",
    "prerequisites": [
      "v-l6-m5-01"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Minor five-note scale or Pentatonic run. Hear the reference, choose a comfortable key, then stop it before singing. The reading A vocabulary for tone is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Hear Minor five-note scale in a comfortable key and remember its first note (1), third note (flat 3), and fifth note (5). To hear a flat 7 below the tonic, press Transpose down twice, hear its first note, then transpose back up to where you started. Stop the reference and tap four steady beats per bar; no backing loop is needed.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Eight-bar improvisation",
        "body": "Bend into them deliberately rather than arriving flat. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The eight bars have a clear form with room to breathe; bends are optional and never forced.",
        "listen": "The take keeps the tapped pulse, develops one repeated idea, and resolves by ear to the tonic you heard before recording."
      },
      {
        "title": "Alternate attempt and reset",
        "body": "Work in short repetitions with a normal breath and complete release between them. Use blue thirds and sevenths as deliberate destinations, not pitches reached by accidental flatness. Leave space and repeat a motif before varying it. Begin with a two-bar call: sing 1, flat 3, 5, rest, then 5, flat 3, 1, rest, one event per tapped beat. Answer with flat 7 below the tonic, 1, flat 3, rest, then flat 3, 1, 1, rest. Repeat those four bars with one rhythmic change to make eight. Pitch every note from the tonic you just heard; transpose the whole exercise if it sits too low or too high. Record the call and answer together in one take.",
        "look": "The eight bars have a clear form with room to breathe; bends are optional and never forced.",
        "listen": "The take keeps the tapped pulse, develops one repeated idea, and resolves by ear to the tonic you heard before recording."
      },
      {
        "title": "Review your own attempt",
        "body": "I used the supplied minor and pentatonic patterns to make my own short answering phrases. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If the line wanders, return to tonic, remove bends, and improvise with only three notes over two bars before extending the form."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 60,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Blue Thirds and Sevenths.”"
      },
      {
        "seconds": 105,
        "instruction": "Isolate the eight-bar improvisation target in short, comfortable examples."
      },
      {
        "seconds": 165,
        "instruction": "Practise or record the complete “Blue Thirds and Sevenths” task, resetting between attempts."
      },
      {
        "seconds": 90,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I used the supplied minor and pentatonic patterns to make my own short answering phrases.",
        "The take keeps the tapped pulse, develops one repeated idea, and resolves by ear to the tonic you heard before recording.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If the line wanders, return to tonic, remove bends, and improvise with only three notes over two bars before extending the form. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I used the supplied minor and pentatonic patterns to make my own short answering phrases. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Improvisation quality or originality; even an unbroken voiced run cannot show that a phrase was improvised."
    }
  },
  {
    "id": "v-l6-m5-08",
    "stageId": "v-l6",
    "moduleId": "v-l6-m5",
    "stageSlug": "agility",
    "moduleSlug": "blues-and-pentatonic-lines",
    "slug": "self-check-your-improvised-phrases",
    "title": "Self-Check: Your Improvised Phrases",
    "type": "checkpoint",
    "minutes": 7,
    "objective": "Use the supplied minor and pentatonic patterns to make your own short answering phrases. This is a listening and reflection check.",
    "explanation": "",
    "prerequisites": [
      "v-l6-m5-04"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Minor five-note scale or Pentatonic run. Hear the reference, choose a comfortable key, then stop it before singing. The reading A vocabulary for tone is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Hear Minor five-note scale in a comfortable key and remember its first note (1), third note (flat 3), and fifth note (5). To hear a flat 7 below the tonic, press Transpose down twice, hear its first note, then transpose back up to where you started. Stop the reference and tap four steady beats per bar; no backing loop is needed.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Eight-bar improvisation",
        "body": "An eight-bar answer built from the call, keeping the tapped pulse and ending on the tonic. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The eight bars have a clear form with room to breathe; bends are optional and never forced.",
        "listen": "The take keeps the tapped pulse, develops one repeated idea, and resolves by ear to the tonic you heard before recording."
      },
      {
        "title": "Make one evidence take",
        "body": "State the checkpoint target, record one uninterrupted attempt, and keep the result even when it does not pass. Use blue thirds and sevenths as deliberate destinations, not pitches reached by accidental flatness. Leave space and repeat a motif before varying it. Begin with a two-bar call: sing 1, flat 3, 5, rest, then 5, flat 3, 1, rest, one event per tapped beat. Answer with flat 7 below the tonic, 1, flat 3, rest, then flat 3, 1, 1, rest. Repeat those four bars with one rhythmic change to make eight. Pitch every note from the tonic you just heard; transpose the whole exercise if it sits too low or too high. Record the call and answer together in one take.",
        "look": "The eight bars have a clear form with room to breathe; bends are optional and never forced.",
        "listen": "The take keeps the tapped pulse, develops one repeated idea, and resolves by ear to the tonic you heard before recording."
      },
      {
        "title": "Review your own attempt",
        "body": "I used the supplied minor and pentatonic patterns to make my own short answering phrases. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If the line wanders, return to tonic, remove bends, and improvise with only three notes over two bars before extending the form."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 60,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Self-Check: Your Improvised Phrases.”"
      },
      {
        "seconds": 105,
        "instruction": "Isolate the eight-bar improvisation target in short, comfortable examples."
      },
      {
        "seconds": 165,
        "instruction": "Practise or record the complete “Self-Check: Your Improvised Phrases” task, resetting between attempts."
      },
      {
        "seconds": 90,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I used the supplied minor and pentatonic patterns to make my own short answering phrases.",
        "The take keeps the tapped pulse, develops one repeated idea, and resolves by ear to the tonic you heard before recording.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "One recorded take holds eight bars against your tapped pulse, builds its answer from the two-bar call rather than wandering, and ends on the tonic you heard before recording.",
      "ifNotReady": "If the line wanders, return to tonic, remove bends, and improvise with only three notes over two bars before extending the form. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I used the supplied minor and pentatonic patterns to make my own short answering phrases. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Improvisation quality or originality; even an unbroken voiced run cannot show that a phrase was improvised."
    }
  },
  {
    "id": "v-l6-m6-01",
    "stageId": "v-l6",
    "moduleId": "v-l6-m6",
    "stageSlug": "agility",
    "moduleSlug": "phrase-and-ornament-study",
    "slug": "range-and-ornaments-in-a-short-phrase",
    "title": "Range and Ornaments in a Short Phrase",
    "type": "concept",
    "minutes": 4,
    "objective": "Range and agility at the same time, which is the actual difficulty.",
    "explanation": "An ornament that is easy in the middle of your voice gets harder near the top or bottom, because the edges of your range already take most of your control. That is the real difficulty of a phrase with both a wide leap and an ornament: each demand is manageable alone, and they compete when they arrive together. So choose a key where both ends of the phrase are repeatable, rehearse the leap and the ornament separately, and keep the top lighter rather than louder when you join them.",
    "prerequisites": [
      "v-l6-m5-08"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Deep River or Amazing Grace (Opening Lines, Verses 1 & 2). Hear the reference, choose a comfortable key, then stop it before singing. The reading Transposition without shame is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Once you have taken the range test, song practice opens the study fitted to your measured range; without a saved range it opens in its written key and is scored in either octave. Shift it a semitone at a time until both ends are repeatable, then mark each ornament and the phrase that crosses the widest interval.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Extended-range repertoire",
        "body": "Range and agility at the same time, which is the actual difficulty. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The key keeps the melody inside your comfortable range, every ornament has a written location, and no phrase depends on a last-second reach.",
        "listen": "The full take keeps the authored melody recognizable and the planned ornaments audible."
      },
      {
        "title": "Hear the distinction",
        "body": "Take the phrase you marked as crossing the widest interval and sing it twice in the same key: first plain, then with one small scoop or fall on the note at the top of the leap. Change only the ornament. Record both in one take in the recorder with a breath between them, and on playback check that the ornamented version still lands the top note as cleanly as the plain one. Rehearse the range, ornament, and continuity demands separately before combining them. Keep the top lighter rather than louder.",
        "look": "The key keeps the melody inside your comfortable range, every ornament has a written location, and no phrase depends on a last-second reach.",
        "listen": "The full take keeps the authored melody recognizable and the planned ornaments audible."
      },
      {
        "title": "Review your own attempt",
        "body": "I rehearsed the supplied phrase and study arrangement in a comfortable key, isolating one ornament before adding it. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If ornaments disappear at range edges, remove them, secure the phrase, then restore one at a time. Change key if an endpoint is forced."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 30,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Range and Ornaments in a Short Phrase.”"
      },
      {
        "seconds": 60,
        "instruction": "Isolate the extended-range repertoire target in short, comfortable examples."
      },
      {
        "seconds": 90,
        "instruction": "Practise or record the complete “Range and Ornaments in a Short Phrase” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I rehearsed the supplied phrase and study arrangement in a comfortable key, isolating one ornament before adding it.",
        "The full take keeps the authored melody recognizable and the planned ornaments audible.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If ornaments disappear at range edges, remove them, secure the phrase, then restore one at a time. Change key if an endpoint is forced. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I rehearsed the supplied phrase and study arrangement in a comfortable key, isolating one ornament before adding it. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Ornament classification, absence of a register break, range safety, stylistic quality, or freedom from strain."
    }
  },
  {
    "id": "v-l6-m6-05",
    "stageId": "v-l6",
    "moduleId": "v-l6-m6",
    "stageSlug": "agility",
    "moduleSlug": "phrase-and-ornament-study",
    "slug": "phrase-and-ornament-study",
    "title": "Phrase and Ornament Study",
    "type": "song",
    "minutes": 8,
    "objective": "Choose a comfortable key for the supplied phrase, then add one familiar small ornament and compare by ear.",
    "explanation": "",
    "prerequisites": [
      "v-l6-m6-01"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Deep River or Amazing Grace (Opening Lines, Verses 1 & 2). Hear the reference, choose a comfortable key, then stop it before singing. The reading Transposition without shame is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Once you have taken the range test, song practice opens the study fitted to your measured range; without a saved range it opens in its written key and is scored in either octave. Shift it a semitone at a time until both ends are repeatable, then mark each ornament and the phrase that crosses the widest interval.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Extended-range repertoire",
        "body": "Choose a comfortable key for the supplied phrase, then add one familiar small ornament and compare by ear. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The key keeps the melody inside your comfortable range, every ornament has a written location, and no phrase depends on a last-second reach.",
        "listen": "The full take keeps the authored melody recognizable and the planned ornaments audible."
      },
      {
        "title": "Build the song from phrases",
        "body": "Mark the key, breaths, range edges, and lesson target before a full take of your chosen study, Deep River or Amazing Grace (Opening Lines, Verses 1 & 2). Rehearse the hardest phrase alone, join two phrases, then record one uninterrupted form. Rehearse the range, ornament, and continuity demands separately before combining them. Keep the top lighter rather than louder.",
        "look": "The key keeps the melody inside your comfortable range, every ornament has a written location, and no phrase depends on a last-second reach.",
        "listen": "The full take keeps the authored melody recognizable and the planned ornaments audible."
      },
      {
        "title": "Review your own attempt",
        "body": "I rehearsed the supplied phrase and study arrangement in a comfortable key, isolating one ornament before adding it. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If ornaments disappear at range edges, remove them, secure the phrase, then restore one at a time. Change key if an endpoint is forced."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 60,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Phrase and Ornament Study.”"
      },
      {
        "seconds": 120,
        "instruction": "Isolate the extended-range repertoire target in short, comfortable examples."
      },
      {
        "seconds": 180,
        "instruction": "Practise or record the complete “Phrase and Ornament Study” task, resetting between attempts."
      },
      {
        "seconds": 120,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I rehearsed the supplied phrase and study arrangement in a comfortable key, isolating one ornament before adding it.",
        "The full take keeps the authored melody recognizable and the planned ornaments audible.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If ornaments disappear at range edges, remove them, secure the phrase, then restore one at a time. Change key if an endpoint is forced. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I rehearsed the supplied phrase and study arrangement in a comfortable key, isolating one ornament before adding it. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Ornament classification, absence of a register break, range safety, stylistic quality, or freedom from strain."
    }
  },
  {
    "id": "v-l6-m6-08",
    "stageId": "v-l6",
    "moduleId": "v-l6-m6",
    "stageSlug": "agility",
    "moduleSlug": "phrase-and-ornament-study",
    "slug": "self-check-your-ornamented-study",
    "title": "Self-Check: Your Ornamented Study",
    "type": "checkpoint",
    "minutes": 7,
    "objective": "Rehearse the supplied phrase and study arrangement in a comfortable key, isolating one ornament before adding it. This is a listening and reflection check.",
    "explanation": "",
    "prerequisites": [
      "v-l6-m6-05"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Deep River or Amazing Grace (Opening Lines, Verses 1 & 2). Hear the reference, choose a comfortable key, then stop it before singing. The reading Transposition without shame is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Once you have taken the range test, song practice opens the study fitted to your measured range; without a saved range it opens in its written key and is scored in either octave. Shift it a semitone at a time until both ends are repeatable, then mark each ornament and the phrase that crosses the widest interval.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Extended-range repertoire",
        "body": "Review your supplied study and describe which small ornament stayed clear. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The key keeps the melody inside your comfortable range, every ornament has a written location, and no phrase depends on a last-second reach.",
        "listen": "The full take keeps the authored melody recognizable and the planned ornaments audible."
      },
      {
        "title": "Make one evidence take",
        "body": "State the checkpoint target, record one uninterrupted attempt, and keep the result even when it does not pass. Rehearse the range, ornament, and continuity demands separately before combining them. Keep the top lighter rather than louder.",
        "look": "The key keeps the melody inside your comfortable range, every ornament has a written location, and no phrase depends on a last-second reach.",
        "listen": "The full take keeps the authored melody recognizable and the planned ornaments audible."
      },
      {
        "title": "Review your own attempt",
        "body": "I rehearsed the supplied phrase and study arrangement in a comfortable key, isolating one ornament before adding it. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If ornaments disappear at range edges, remove them, secure the phrase, then restore one at a time. Change key if an endpoint is forced."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 60,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Self-Check: Your Ornamented Study.”"
      },
      {
        "seconds": 105,
        "instruction": "Isolate the extended-range repertoire target in short, comfortable examples."
      },
      {
        "seconds": 165,
        "instruction": "Practise or record the complete “Self-Check: Your Ornamented Study” task, resetting between attempts."
      },
      {
        "seconds": 90,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I rehearsed the supplied phrase and study arrangement in a comfortable key, isolating one ornament before adding it.",
        "The full take keeps the authored melody recognizable and the planned ornaments audible.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "One uninterrupted take of the study, in your chosen key, has every ornament you marked audible where you marked it, the melody intact, and neither end of the range needing a push.",
      "ifNotReady": "If ornaments disappear at range edges, remove them, secure the phrase, then restore one at a time. Change key if an endpoint is forced. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I rehearsed the supplied phrase and study arrangement in a comfortable key, isolating one ornament before adding it. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Ornament classification, absence of a register break, range safety, stylistic quality, or freedom from strain."
    }
  },
  {
    "id": "v-l7-m1-01",
    "stageId": "v-l7",
    "moduleId": "v-l7-m1",
    "stageSlug": "signature",
    "moduleSlug": "look-after-it",
    "slug": "hydration-humidity-and-why-whispering-hurts",
    "title": "Hydration, Humidity, and Why Whispering Hurts",
    "type": "concept",
    "minutes": 5,
    "objective": "Whispering is on the harmful list. So is talking over noise. Neither is obvious.",
    "explanation": "Water reaches your voice slowly: steady drinking across the day shows up in how singing feels, while a glass just before you sing does little for the next twenty minutes. Dry air counts too, and the NIDCD's Taking Care of Your Voice guidance, listed in the sources below, suggests a humidifier at home, especially in winter or a dry climate. The same guidance names whispering and talking over noise as things to avoid, since both put stress on the voice, and most voice fatigue comes from talking rather than singing, above all talking over noise. So rest your voice with silence rather than a whisper, and count a loud evening of conversation as voice use.",
    "prerequisites": [
      "v-l6-m6-08"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose First hum or Humming thirds or Descending five. Hear the reference, choose a comfortable key, then stop it before singing. The reading Stamina, warming up, and not hurting yourself is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Check how the voice feels before making sound. Choose only drills that have previously felt easy, and plan pauses and water breaks.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Vocal health",
        "body": "Whispering is on the harmful list. So is talking over noise. Neither is obvious. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Keep the supplied reference or reading visible, settle your posture, and use only a pitch and duration you can repeat comfortably.",
        "listen": "The voice feels and sounds at least as easy after the routine as before it. Persistent hoarseness or pain is a reason to stop, not warm up harder."
      },
      {
        "title": "Plan the day for your voice",
        "body": "Write down tomorrow's voice use, not just your practice: where you will talk, for how long, and whether there will be noise to talk over. Next to each noisy stretch, write one change, such as moving the conversation somewhere quieter, keeping it short, or using a microphone if you have to address a group. Plan water across the day rather than a glass just before singing, note whether the air where you sleep is dry, and if you need to rest your voice, plan silence rather than whispering. Then build a short warm-up from First hum, Humming thirds and Descending five, record it in the recorder, and stop before fatigue changes the sound.",
        "look": "Keep the supplied reference or reading visible, settle your posture, and use only a pitch and duration you can repeat comfortably.",
        "listen": "The voice feels and sounds at least as easy after the routine as before it. Persistent hoarseness or pain is a reason to stop, not warm up harder."
      },
      {
        "title": "Review your own attempt",
        "body": "I assembled a short warm-up with rests and wrote the warning signs that would make me stop. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If hoarseness, discomfort or a changed speaking voice persists, reduce voice use and see a doctor who can examine the vocal folds, such as an ENT or laryngologist. The app and this checklist do not diagnose or clear a voice for continued use."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Hydration, Humidity, and Why Whispering Hurts.”"
      },
      {
        "seconds": 75,
        "instruction": "Isolate the vocal health target in short, comfortable examples."
      },
      {
        "seconds": 120,
        "instruction": "Practise or record the complete “Hydration, Humidity, and Why Whispering Hurts” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I assembled a short warm-up with rests and wrote the warning signs that would make me stop.",
        "The voice feels and sounds at least as easy after the routine as before it. Persistent hoarseness or pain is a reason to stop, not warm up harder.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If hoarseness, discomfort or a changed speaking voice persists, reduce voice use and see a doctor who can examine the vocal folds, such as an ENT or laryngologist. The app and this checklist do not diagnose or clear a voice for continued use. Leave it for today, and come back to a smaller version on another day once your speaking voice feels normal.",
      "shows": "I assembled a short warm-up with rests and wrote the warning signs that would make me stop. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Healthy vocal folds, medical clearance, hydration status, absence of injury, or that a particular routine is safe for every singer."
    }
  },
  {
    "id": "v-l7-m1-03",
    "stageId": "v-l7",
    "moduleId": "v-l7-m1",
    "stageSlug": "signature",
    "moduleSlug": "look-after-it",
    "slug": "build-your-own-warm-up",
    "title": "Build Your Own Warm-Up",
    "type": "exercise",
    "minutes": 8,
    "objective": "Assemble a routine from the drills you already own, ordered correctly.",
    "explanation": "",
    "prerequisites": [
      "v-l7-m1-01"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose First hum or Humming thirds or Descending five. Hear the reference, choose a comfortable key, then stop it before singing. The reading Stamina, warming up, and not hurting yourself is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Check how the voice feels before making sound. Choose only drills that have previously felt easy, and plan pauses and water breaks.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Vocal health",
        "body": "Assemble a routine from the drills you already own, ordered correctly. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Keep the supplied reference or reading visible, settle your posture, and use only a pitch and duration you can repeat comfortably.",
        "listen": "The voice feels and sounds at least as easy after the routine as before it. Persistent hoarseness or pain is a reason to stop, not warm up harder."
      },
      {
        "title": "Alternate attempt and reset",
        "body": "Work in short repetitions with a normal breath and complete release between them. Build a short sequence from gentle semi-occluded sound, comfortable range movement, and the day's specific task. Stop before fatigue changes the sound.",
        "look": "Keep the supplied reference or reading visible, settle your posture, and use only a pitch and duration you can repeat comfortably.",
        "listen": "The voice feels and sounds at least as easy after the routine as before it. Persistent hoarseness or pain is a reason to stop, not warm up harder."
      },
      {
        "title": "Review your own attempt",
        "body": "I assembled a short warm-up with rests and wrote the warning signs that would make me stop. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If hoarseness, discomfort or a changed speaking voice persists, reduce voice use and see a doctor who can examine the vocal folds, such as an ENT or laryngologist. The app and this checklist do not diagnose or clear a voice for continued use."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 60,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Build Your Own Warm-Up.”"
      },
      {
        "seconds": 120,
        "instruction": "Isolate the vocal health target in short, comfortable examples."
      },
      {
        "seconds": 180,
        "instruction": "Practise or record the complete “Build Your Own Warm-Up” task, resetting between attempts."
      },
      {
        "seconds": 120,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I assembled a short warm-up with rests and wrote the warning signs that would make me stop.",
        "The voice feels and sounds at least as easy after the routine as before it. Persistent hoarseness or pain is a reason to stop, not warm up harder.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If hoarseness, discomfort or a changed speaking voice persists, reduce voice use and see a doctor who can examine the vocal folds, such as an ENT or laryngologist. The app and this checklist do not diagnose or clear a voice for continued use. Leave it for today, and come back to a smaller version on another day once your speaking voice feels normal.",
      "shows": "I assembled a short warm-up with rests and wrote the warning signs that would make me stop. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Healthy vocal folds, medical clearance, hydration status, absence of injury, or that a particular routine is safe for every singer."
    }
  },
  {
    "id": "v-l7-m1-08",
    "stageId": "v-l7",
    "moduleId": "v-l7-m1",
    "stageSlug": "signature",
    "moduleSlug": "look-after-it",
    "slug": "self-check-warm-up-and-stop-plan",
    "title": "Self-Check: Warm-Up and Stop Plan",
    "type": "checkpoint",
    "minutes": 6,
    "objective": "Assemble a short warm-up with rests and write down the warning signs that would make you stop. This is a listening and reflection check.",
    "explanation": "",
    "prerequisites": [
      "v-l7-m1-03"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose First hum or Humming thirds or Descending five. Hear the reference, choose a comfortable key, then stop it before singing. The reading Stamina, warming up, and not hurting yourself is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Check how the voice feels before making sound. Choose only drills that have previously felt easy, and plan pauses and water breaks.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Vocal health",
        "body": "Assemble a short warm-up with rests and write down the warning signs that would make you stop, before you move on to effects. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Keep the supplied reference or reading visible, settle your posture, and use only a pitch and duration you can repeat comfortably.",
        "listen": "The voice feels and sounds at least as easy after the routine as before it. Persistent hoarseness or pain is a reason to stop, not warm up harder."
      },
      {
        "title": "Make one evidence take",
        "body": "State the checkpoint target, record one uninterrupted attempt in the [recorder](/recorder), and keep the result even when it does not pass. Build a short sequence from gentle semi-occluded sound, comfortable range movement, and the day's specific task. Stop before fatigue changes the sound.",
        "look": "Keep the supplied reference or reading visible, settle your posture, and use only a pitch and duration you can repeat comfortably.",
        "listen": "The voice feels and sounds at least as easy after the routine as before it. Persistent hoarseness or pain is a reason to stop, not warm up harder."
      },
      {
        "title": "Review your own attempt",
        "body": "I assembled a short warm-up with rests and wrote the warning signs that would make me stop. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If hoarseness, discomfort or a changed speaking voice persists, reduce voice use and see a doctor who can examine the vocal folds, such as an ENT or laryngologist. The app and this checklist do not diagnose or clear a voice for continued use."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Self-Check: Warm-Up and Stop Plan.”"
      },
      {
        "seconds": 90,
        "instruction": "Isolate the vocal health target in short, comfortable examples."
      },
      {
        "seconds": 135,
        "instruction": "Practise or record the complete “Self-Check: Warm-Up and Stop Plan” task, resetting between attempts."
      },
      {
        "seconds": 90,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I assembled a short warm-up with rests and wrote the warning signs that would make me stop.",
        "The voice feels and sounds at least as easy after the routine as before it. Persistent hoarseness or pain is a reason to stop, not warm up harder.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You have a written warm-up that runs from quiet and mid-range to wider and then fuller, with rests, plus a stop list (pain means stop that session; hoarseness that does not clear means a doctor who can examine the vocal folds, such as an ENT or laryngologist), and your voice feels at least as easy after running it as before.",
      "ifNotReady": "If hoarseness, discomfort or a changed speaking voice persists, reduce voice use and see a doctor who can examine the vocal folds, such as an ENT or laryngologist. The app and this checklist do not diagnose or clear a voice for continued use. Leave it for today, and come back to a smaller version on another day once your speaking voice feels normal.",
      "shows": "I assembled a short warm-up with rests and wrote the warning signs that would make me stop. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Healthy vocal folds, medical clearance, hydration status, absence of injury, or that a particular routine is safe for every singer."
    }
  },
  {
    "id": "v-l7-m2-01",
    "stageId": "v-l7",
    "moduleId": "v-l7-m2",
    "stageSlug": "signature",
    "moduleSlug": "style-rooms",
    "slug": "style-is-a-set-of-choices-not-a-sound",
    "title": "Style Is a Set of Choices, Not a Sound",
    "type": "concept",
    "minutes": 5,
    "objective": "Onset, vibrato, diction, and placement, decided per genre.",
    "explanation": "A style is a set of decisions, not a voice you put on: how notes start, when vibrato arrives, how crisp the consonants are, where the rhythm sits against the beat and how each phrase is shaped. Genres tend to make those decisions differently; straight tone that lets vibrato in late is common in modern pop and jazz, while vibrato from the start of the note is more usual in opera and much of musical theater. Copy what singers decide rather than what they are made of: your timbre comes from the shape of your own throat and mouth, so the same choices sung in your body sound like you, which is the point.",
    "prerequisites": [
      "v-l7-m1-08"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Amazing Grace (Opening Lines, Verses 1 & 2) or Simple Gifts. Hear the reference, choose a comfortable key, then stop it before singing. The reading How to borrow a voice is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Choose one well-learned song in a comfortable key so pitch and words do not consume the whole task. Name the two styles before singing.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Genre choices",
        "body": "Onset, vibrato, diction, and placement, decided per genre. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Each treatment has written choices rather than a vague instruction to sound like a particular artist.",
        "listen": "A listener can describe the contrast between the two examples in the same recording, and both still sound like your own voice."
      },
      {
        "title": "Hear the distinction",
        "body": "Take the first phrase of Amazing Grace and sing it twice, changing only one choice: first with a clean onset on each phrase start, then with a little air before the tone. Keep the key, tempo, words and volume the same. Record both in one take in the recorder with a breath between them, and name on playback what changed and what it did to the feel. Then make the same one-choice contrast with vibrato (from the start of a long note versus late) or with rhythmic placement (on the beat versus a little behind it), keeping the melody recognizable.",
        "look": "Each treatment has written choices rather than a vague instruction to sound like a particular artist.",
        "listen": "A listener can describe the contrast between the two examples in the same recording, and both still sound like your own voice."
      },
      {
        "title": "Review your own attempt",
        "body": "I compared two stylistic choices in the same supplied phrase and could explain what I changed. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If the styles differ only in volume or caricature, keep one choice, return to neutral, and add a second controlled choice."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Style Is a Set of Choices, Not a Sound.”"
      },
      {
        "seconds": 75,
        "instruction": "Isolate the genre choices target in short, comfortable examples."
      },
      {
        "seconds": 120,
        "instruction": "Practise or record the complete “Style Is a Set of Choices, Not a Sound” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I compared two stylistic choices in the same supplied phrase and could explain what I changed.",
        "A listener can describe the contrast between the two examples in the same recording, and both still sound like your own voice.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If the styles differ only in volume or caricature, keep one choice, return to neutral, and add a second controlled choice. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I compared two stylistic choices in the same supplied phrase and could explain what I changed. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Automatic style classification, authenticity, ownership of a genre, vocal health, or similarity to a named singer."
    }
  },
  {
    "id": "v-l7-m2-05",
    "stageId": "v-l7",
    "moduleId": "v-l7-m2",
    "stageSlug": "signature",
    "moduleSlug": "style-rooms",
    "slug": "same-song-two-rooms",
    "title": "Same Song, Two Rooms",
    "type": "song",
    "minutes": 8,
    "objective": "One melody, two complete stylistic treatments.",
    "explanation": "",
    "prerequisites": [
      "v-l7-m2-01"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Amazing Grace (Opening Lines, Verses 1 & 2) or Simple Gifts. Hear the reference, choose a comfortable key, then stop it before singing. The reading How to borrow a voice is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Choose one well-learned song in a comfortable key so pitch and words do not consume the whole task. Name the two styles before singing.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Genre choices",
        "body": "One melody, two complete stylistic treatments. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Each treatment has written choices rather than a vague instruction to sound like a particular artist.",
        "listen": "A listener can describe the contrast between the two examples in the same recording, and both still sound like your own voice."
      },
      {
        "title": "Build the song from phrases",
        "body": "Mark the key, breaths, range edges, and both treatments before a full take of your chosen song, Amazing Grace or Simple Gifts. Rehearse the hardest phrase alone, join two phrases, then record one uninterrupted form. Change onset, diction, vibrato amount, rhythmic placement, and phrase shape deliberately while keeping the melody recognizable. Choose a phrase short enough to sing both treatments in one take within two minutes. Leave a quiet breath between them. Record your takes in the recorder.",
        "look": "Each treatment has written choices rather than a vague instruction to sound like a particular artist.",
        "listen": "A listener can describe the contrast between the two examples in the same recording, and both still sound like your own voice."
      },
      {
        "title": "Review your own attempt",
        "body": "I compared two stylistic choices in the same supplied phrase and could explain what I changed. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If the styles differ only in volume or caricature, keep one choice, return to neutral, and add a second controlled choice."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 60,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Same Song, Two Rooms.”"
      },
      {
        "seconds": 120,
        "instruction": "Isolate the genre choices target in short, comfortable examples."
      },
      {
        "seconds": 180,
        "instruction": "Practise or record the complete “Same Song, Two Rooms” task, resetting between attempts."
      },
      {
        "seconds": 120,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I compared two stylistic choices in the same supplied phrase and could explain what I changed.",
        "A listener can describe the contrast between the two examples in the same recording, and both still sound like your own voice.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If the styles differ only in volume or caricature, keep one choice, return to neutral, and add a second controlled choice. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I compared two stylistic choices in the same supplied phrase and could explain what I changed. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Automatic style classification, authenticity, ownership of a genre, vocal health, or similarity to a named singer."
    }
  },
  {
    "id": "v-l7-m2-08",
    "stageId": "v-l7",
    "moduleId": "v-l7-m2",
    "stageSlug": "signature",
    "moduleSlug": "style-rooms",
    "slug": "self-check-one-song-two-styles",
    "title": "Self-Check: One Song, Two Styles",
    "type": "checkpoint",
    "minutes": 7,
    "objective": "Both recognisable, both yours.",
    "explanation": "",
    "prerequisites": [
      "v-l7-m2-05"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Amazing Grace (Opening Lines, Verses 1 & 2) or Simple Gifts. Hear the reference, choose a comfortable key, then stop it before singing. The reading How to borrow a voice is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Choose one well-learned song in a comfortable key so pitch and words do not consume the whole task. Name the two styles before singing.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Genre choices",
        "body": "Both recognisable, both yours. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Each treatment has written choices rather than a vague instruction to sound like a particular artist.",
        "listen": "A listener can describe the contrast between the two examples in the same recording, and both still sound like your own voice."
      },
      {
        "title": "Make one evidence take",
        "body": "State the checkpoint target, record one uninterrupted attempt, and keep the result even when it does not pass. Change onset, diction, vibrato amount, rhythmic placement, and phrase shape deliberately while keeping the melody recognizable. Choose a phrase short enough to sing both treatments in one take within two minutes. Leave a quiet breath between them. Record your takes in the recorder.",
        "look": "Each treatment has written choices rather than a vague instruction to sound like a particular artist.",
        "listen": "A listener can describe the contrast between the two examples in the same recording, and both still sound like your own voice."
      },
      {
        "title": "Review your own attempt",
        "body": "I compared two stylistic choices in the same supplied phrase and could explain what I changed. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If the styles differ only in volume or caricature, keep one choice, return to neutral, and add a second controlled choice."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 60,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Self-Check: One Song, Two Styles.”"
      },
      {
        "seconds": 105,
        "instruction": "Isolate the genre choices target in short, comfortable examples."
      },
      {
        "seconds": 165,
        "instruction": "Practise or record the complete “Self-Check: One Song, Two Styles” task, resetting between attempts."
      },
      {
        "seconds": 90,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I compared two stylistic choices in the same supplied phrase and could explain what I changed.",
        "A listener can describe the contrast between the two examples in the same recording, and both still sound like your own voice.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "One take holds the same phrase in both styles, you can name at least two written choices that differ between them, and both still sound like your own voice at a comfortable volume.",
      "ifNotReady": "If the styles differ only in volume or caricature, keep one choice, return to neutral, and add a second controlled choice. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I compared two stylistic choices in the same supplied phrase and could explain what I changed. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Automatic style classification, authenticity, ownership of a genre, vocal health, or similarity to a named singer."
    }
  },
  {
    "id": "v-l7-m3-01",
    "stageId": "v-l7",
    "moduleId": "v-l7-m3",
    "stageSlug": "signature",
    "moduleSlug": "modes-of-weight",
    "slug": "neutral-restrained-driven-edged",
    "title": "Neutral, Restrained, Driven, Edged",
    "type": "concept",
    "minutes": 6,
    "objective": "Four production choices that are separate from pitch height. Neutral and restrained work across your range; driven and edged get harder the higher you go, so try them low in your range first.",
    "explanation": "These are four production choices you can make on a note, separate from how high it is. Neutral is your easy, speech-like default; restrained is the same note held back, softer and more contained; driven is fuller and more speech-like, like calling across a room at a moderate level; edged is brighter and more cutting, still not loud. Neutral and restrained work across your range, while driven and edged get harder the higher you go, so try them low in your range first and leave edged until a teacher has heard it.",
    "prerequisites": [
      "v-l7-m2-08"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Soft sustain. Hear the reference, choose a comfortable key, then stop it before singing. The reading A vocabulary for tone is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Use one mid-range phrase at moderate volume and establish a neutral baseline. Use neutral plus two others, and leave edged out until a teacher has heard it. Neutral: your easy, speech-like default. Restrained: the same note held back, softer and more contained. Driven: fuller and more speech-like, like calling across a room at a moderate level. Edged: brighter and more cutting, still not loud.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Weight and mode switching",
        "body": "Four production choices that are separate from pitch height. Neutral and restrained work across your range; driven and edged get harder the higher you go, so try them low in your range first. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The same phrase, key, and tempo are used; the jaw, neck, and chin remain available in every version.",
        "listen": "Three repeatable weights are audible on cue without persistent rasp, pressure, or loss of range afterward."
      },
      {
        "title": "Hear the distinction",
        "body": "Take one short mid-range phrase and sing it twice: neutral, then restrained. Keep the pitch, words and tempo the same and change only the weight, not just the volume. Record both in one take in the recorder with a breath between them. If both were easy, add driven as a third version low in your range, and stop the moment it tightens. Change vocal weight without moving the pitch or using loudness as the only cue. Return to neutral between every attempt.",
        "look": "The same phrase, key, and tempo are used; the jaw, neck, and chin remain available in every version.",
        "listen": "Three repeatable weights are audible on cue without persistent rasp, pressure, or loss of range afterward."
      },
      {
        "title": "Review your own attempt",
        "body": "I compared comfortable production choices in one short phrase and returned to an easy neutral sound. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If a heavier mode requires pressure, reduce the contrast or stop. Do not repeat a tight attempt in pursuit of a label."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Neutral, Restrained, Driven, Edged.”"
      },
      {
        "seconds": 90,
        "instruction": "Isolate the weight and mode switching target in short, comfortable examples."
      },
      {
        "seconds": 135,
        "instruction": "Practise or record the complete “Neutral, Restrained, Driven, Edged” task, resetting between attempts."
      },
      {
        "seconds": 90,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I compared comfortable production choices in one short phrase and returned to an easy neutral sound.",
        "Three repeatable weights are audible on cue without persistent rasp, pressure, or loss of range afterward.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If a heavier mode requires pressure, reduce the contrast or stop. Do not repeat a tight attempt in pursuit of a label. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I compared comfortable production choices in one short phrase and returned to an easy neutral sound. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Automatic mode classification, strain, pressed phonation, tissue health, or safe production."
    }
  },
  {
    "id": "v-l7-m3-04",
    "stageId": "v-l7",
    "moduleId": "v-l7-m3",
    "stageSlug": "signature",
    "moduleSlug": "modes-of-weight",
    "slug": "one-phrase-three-weights",
    "title": "One Phrase, Three Weights",
    "type": "exercise",
    "minutes": 7,
    "objective": "Same phrase, same pitch, different weight.",
    "explanation": "",
    "prerequisites": [
      "v-l7-m3-01"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Soft sustain. Hear the reference, choose a comfortable key, then stop it before singing. The reading A vocabulary for tone is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Use one mid-range phrase at moderate volume and establish a neutral baseline. Use neutral plus two others, and leave edged out until a teacher has heard it. Neutral: your easy, speech-like default. Restrained: the same note held back, softer and more contained. Driven: fuller and more speech-like, like calling across a room at a moderate level. Edged: brighter and more cutting, still not loud.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Weight and mode switching",
        "body": "Same phrase, same pitch, different weight. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The same phrase, key, and tempo are used; the jaw, neck, and chin remain available in every version.",
        "listen": "Three repeatable weights are audible on cue without persistent rasp, pressure, or loss of range afterward."
      },
      {
        "title": "Alternate attempt and reset",
        "body": "Work in short repetitions with a normal breath and complete release between them. Change vocal weight without moving the pitch or using loudness as the only cue. Return to neutral between every attempt.",
        "look": "The same phrase, key, and tempo are used; the jaw, neck, and chin remain available in every version.",
        "listen": "Three repeatable weights are audible on cue without persistent rasp, pressure, or loss of range afterward."
      },
      {
        "title": "Review your own attempt",
        "body": "I compared comfortable production choices in one short phrase and returned to an easy neutral sound. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If a heavier mode requires pressure, reduce the contrast or stop. Do not repeat a tight attempt in pursuit of a label."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 60,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “One Phrase, Three Weights.”"
      },
      {
        "seconds": 105,
        "instruction": "Isolate the weight and mode switching target in short, comfortable examples."
      },
      {
        "seconds": 165,
        "instruction": "Practise or record the complete “One Phrase, Three Weights” task, resetting between attempts."
      },
      {
        "seconds": 90,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I compared comfortable production choices in one short phrase and returned to an easy neutral sound.",
        "Three repeatable weights are audible on cue without persistent rasp, pressure, or loss of range afterward.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If a heavier mode requires pressure, reduce the contrast or stop. Do not repeat a tight attempt in pursuit of a label. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I compared comfortable production choices in one short phrase and returned to an easy neutral sound. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Automatic mode classification, strain, pressed phonation, tissue health, or safe production."
    }
  },
  {
    "id": "v-l7-m3-08",
    "stageId": "v-l7",
    "moduleId": "v-l7-m3",
    "stageSlug": "signature",
    "moduleSlug": "modes-of-weight",
    "slug": "self-check-three-modes-on-cue",
    "title": "Self-Check: Three Modes on Cue",
    "type": "checkpoint",
    "minutes": 6,
    "objective": "Before recording, draw the order from slips marked neutral, restrained and driven, with a return to easy neutral voice between attempts. Strain is not measured.",
    "explanation": "",
    "prerequisites": [
      "v-l7-m3-04"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Soft sustain. Hear the reference, choose a comfortable key, then stop it before singing. The reading A vocabulary for tone is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Use one mid-range phrase at moderate volume and establish a neutral baseline. Use neutral plus two others, and leave edged out until a teacher has heard it. Neutral: your easy, speech-like default. Restrained: the same note held back, softer and more contained. Driven: fuller and more speech-like, like calling across a room at a moderate level. Edged: brighter and more cutting, still not loud.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Weight and mode switching",
        "body": "Before recording, draw the order from slips marked neutral, restrained and driven, with a return to easy neutral voice between attempts. Strain is not measured. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The same phrase, key, and tempo are used; the jaw, neck, and chin remain available in every version.",
        "listen": "Three repeatable weights are audible on cue without persistent rasp, pressure, or loss of range afterward."
      },
      {
        "title": "Make one evidence take",
        "body": "State the checkpoint target, record one uninterrupted attempt, and keep the result even when it does not pass. Draw the slips, then sing the phrase once per slip in the order drawn, returning to easy neutral between attempts. Change vocal weight without moving the pitch or using loudness as the only cue.",
        "look": "The same phrase, key, and tempo are used; the jaw, neck, and chin remain available in every version.",
        "listen": "Three repeatable weights are audible on cue without persistent rasp, pressure, or loss of range afterward."
      },
      {
        "title": "Review your own attempt",
        "body": "I compared comfortable production choices in one short phrase and returned to an easy neutral sound. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If a heavier mode requires pressure, reduce the contrast or stop. Do not repeat a tight attempt in pursuit of a label."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Self-Check: Three Modes on Cue.”"
      },
      {
        "seconds": 90,
        "instruction": "Isolate the weight and mode switching target in short, comfortable examples."
      },
      {
        "seconds": 135,
        "instruction": "Practise or record the complete “Self-Check: Three Modes on Cue” task, resetting between attempts."
      },
      {
        "seconds": 90,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I compared comfortable production choices in one short phrase and returned to an easy neutral sound.",
        "Three repeatable weights are audible on cue without persistent rasp, pressure, or loss of range afterward.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "In one take sung in the order you drew, you can tell neutral, restrained and driven apart on playback without the slips, each attempt returned to easy neutral before the next, and your speaking voice afterward is unchanged.",
      "ifNotReady": "If a heavier mode requires pressure, reduce the contrast or stop. Do not repeat a tight attempt in pursuit of a label. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I compared comfortable production choices in one short phrase and returned to an easy neutral sound. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Automatic mode classification, strain, pressed phonation, tissue health, or safe production."
    }
  },
  {
    "id": "v-l7-m4-01",
    "stageId": "v-l7",
    "moduleId": "v-l7-m4",
    "stageSlug": "signature",
    "moduleSlug": "effects-carefully",
    "slug": "what-a-growl-actually-is",
    "title": "What a Growl Actually Is",
    "type": "concept",
    "minutes": 6,
    "objective": "The physiology, the specific ways it goes wrong, and why you should review the health module first.",
    "explanation": "A growl is noise laid over the sung note, and it can come from two places that sound the same from the audience: structures above the vocal folds fluttering in the airstream while the folds keep vibrating normally underneath, or the folds themselves being slammed together under pressure, which is how voices get hurt. You cannot reliably teach yourself the difference from text, this lesson included, which is why a growl is learned with a qualified teacher listening and why the health module comes first. Until then the rule is simple: grit that leaves you hoarse afterward was the wrong kind, and pain means stop.",
    "prerequisites": [
      "v-l7-m3-08",
      "v-l7-m1-08"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Start with the stop rules",
        "body": "Read the stop signals under If it goes wrong and the safety note at the foot of this page, and copy them into your stop plan: pain while singing means stop now; hoarseness after practice that clears overnight means do less next time; hoarseness that does not clear, or an easy note that is now unreliable, is a question for a doctor who can examine the vocal folds, such as an ENT or laryngologist. The atlas chapter The safety rail covers effects in more depth and is part of Pro.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "For the planning task, work from the stop rules on this page; you do not need to make a pitched sound."
      },
      {
        "title": "Set a safe baseline",
        "body": "Do not learn a growl, scream, distortion, or other new effect from written directions. If a qualified teacher has already taught you an effect and it remains easy today, you may review that existing technique briefly; otherwise make this an observation-and-planning session without producing the effect.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Effects safety and a stop plan",
        "body": "The physiology, the specific ways it goes wrong, and why you should review the health module first. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The record says whether this was observation only or a review of prior supervised technique, and it names a strict stop point before any sound is made.",
        "listen": "Any vocalized effect was previously taught, deliberately brief, and followed by an unchanged speaking voice; observation-only work is never counted as a vocal demonstration."
      },
      {
        "title": "Use prior supervision—or observe",
        "body": "Do not learn or imitate a new vocal effect from this lesson. For “What a Growl Actually Is,” either review an effect already taught to you by a qualified teacher at the prescribed dose, or complete the anatomy, listening, warning-sign, and stop-plan work without producing the effect. For an already-taught effect only, begin and end on the teacher's clean baseline and use the dose they prescribed. Otherwise compare your own earlier supervised recordings, name the audible change, and write the stop plan without imitating it.",
        "look": "The record says whether this was observation only or a review of prior supervised technique, and it names a strict stop point before any sound is made.",
        "listen": "Any vocalized effect was previously taught, deliberately brief, and followed by an unchanged speaking voice; observation-only work is never counted as a vocal demonstration."
      },
      {
        "title": "Review your own attempt",
        "body": "I read the safety material and wrote a stop plan; I did not attempt to learn a new vocal effect from an app. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "Stop for pain, rawness, sudden hoarseness, loss of range, extra effort in speech, or a changed speaking voice. Do not troubleshoot by repeating; rest, and when symptoms persist see a doctor who can examine the vocal folds, such as an ENT or laryngologist."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Copy the stop rules into your stop plan. Prepare the room, body, and safe baseline for “What a Growl Actually Is.”"
      },
      {
        "seconds": 90,
        "instruction": "Review the anatomy, warning signs, prior supervision, and written stop plan without attempting a new effect."
      },
      {
        "seconds": 135,
        "instruction": "Complete the observation-only “What a Growl Actually Is” task, or briefly review only a previously taught effect at the prescribed dose."
      },
      {
        "seconds": 90,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I read the safety material and wrote a stop plan; I did not attempt to learn a new vocal effect from an app.",
        "Any vocalized effect was previously taught, deliberately brief, and followed by an unchanged speaking voice; observation-only work is never counted as a vocal demonstration.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "Stop for pain, rawness, sudden hoarseness, loss of range, extra effort in speech, or a changed speaking voice. Do not troubleshoot by repeating; rest, and when symptoms persist see a doctor who can examine the vocal folds, such as an ENT or laryngologist. Do not try the effect again to check; leave it until a teacher has heard it.",
      "shows": "I read the safety material and wrote a stop plan; I did not attempt to learn a new vocal effect from an app. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Safety, absence of strain or injury, correct effect physiology, medical clearance, completion of an effect checkpoint, or readiness for screams; the app cannot verify any of these."
    }
  },
  {
    "id": "v-l7-m4-04",
    "stageId": "v-l7",
    "moduleId": "v-l7-m4",
    "stageSlug": "signature",
    "moduleSlug": "effects-carefully",
    "slug": "effects-listening-and-a-stop-plan",
    "title": "Effects: Listening and a Stop Plan",
    "type": "exercise",
    "minutes": 7,
    "objective": "Only for an effect a teacher has already taught you: short bursts, with a hard stop the moment it tightens. Otherwise, listen and plan without producing it.",
    "explanation": "",
    "prerequisites": [
      "v-l7-m4-01"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Start with the stop rules",
        "body": "Read the stop signals under If it goes wrong and the safety note at the foot of this page, and copy them into your stop plan: pain while singing means stop now; hoarseness after practice that clears overnight means do less next time; hoarseness that does not clear, or an easy note that is now unreliable, is a question for a doctor who can examine the vocal folds, such as an ENT or laryngologist. The atlas chapter The safety rail covers effects in more depth and is part of Pro.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "For the planning task, work from the stop rules on this page; you do not need to make a pitched sound."
      },
      {
        "title": "Set a safe baseline",
        "body": "Do not learn a growl, scream, distortion, or other new effect from written directions. If a qualified teacher has already taught you an effect and it remains easy today, you may review that existing technique briefly; otherwise make this an observation-and-planning session without producing the effect.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Effects safety and a stop plan",
        "body": "Only for an effect a teacher has already taught you: short bursts, with a hard stop the moment it tightens. Otherwise, listen and plan without producing it. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The record says whether this was observation only or a review of prior supervised technique, and it names a strict stop point before any sound is made.",
        "listen": "Any vocalized effect was previously taught, deliberately brief, and followed by an unchanged speaking voice; observation-only work is never counted as a vocal demonstration."
      },
      {
        "title": "Use prior supervision—or observe",
        "body": "Do not learn or imitate a new vocal effect from this lesson. For “Effects: Listening and a Stop Plan,” either review an effect already taught to you by a qualified teacher at the prescribed dose, or complete the anatomy, listening, warning-sign, and stop-plan work without producing the effect. For an already-taught effect only, begin and end on the teacher's clean baseline and use the dose they prescribed. Otherwise compare your own earlier supervised recordings, name the audible change, and write the stop plan without imitating it.",
        "look": "The record says whether this was observation only or a review of prior supervised technique, and it names a strict stop point before any sound is made.",
        "listen": "Any vocalized effect was previously taught, deliberately brief, and followed by an unchanged speaking voice; observation-only work is never counted as a vocal demonstration."
      },
      {
        "title": "Review your own attempt",
        "body": "I read the safety material and wrote a stop plan; I did not attempt to learn a new vocal effect from an app. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "Stop for pain, rawness, sudden hoarseness, loss of range, extra effort in speech, or a changed speaking voice. Do not troubleshoot by repeating; rest, and when symptoms persist see a doctor who can examine the vocal folds, such as an ENT or laryngologist."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 60,
        "instruction": "Copy the stop rules into your stop plan. Prepare the room, body, and safe baseline for “Effects: Listening and a Stop Plan.”"
      },
      {
        "seconds": 105,
        "instruction": "Review the anatomy, warning signs, prior supervision, and written stop plan without attempting a new effect."
      },
      {
        "seconds": 165,
        "instruction": "Complete the observation-only “Effects: Listening and a Stop Plan” task, or briefly review only a previously taught effect at the prescribed dose."
      },
      {
        "seconds": 90,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I read the safety material and wrote a stop plan; I did not attempt to learn a new vocal effect from an app.",
        "Any vocalized effect was previously taught, deliberately brief, and followed by an unchanged speaking voice; observation-only work is never counted as a vocal demonstration.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "Stop for pain, rawness, sudden hoarseness, loss of range, extra effort in speech, or a changed speaking voice. Do not troubleshoot by repeating; rest, and when symptoms persist see a doctor who can examine the vocal folds, such as an ENT or laryngologist. Do not try the effect again to check; leave it until a teacher has heard it.",
      "shows": "I read the safety material and wrote a stop plan; I did not attempt to learn a new vocal effect from an app. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Safety, absence of strain or injury, correct effect physiology, medical clearance, completion of an effect checkpoint, or readiness for screams; the app cannot verify any of these."
    }
  },
  {
    "id": "v-l7-m4-08",
    "stageId": "v-l7",
    "moduleId": "v-l7-m4",
    "stageSlug": "signature",
    "moduleSlug": "effects-carefully",
    "slug": "self-check-your-effects-stop-plan",
    "title": "Self-Check: Your Effects Stop Plan",
    "type": "checkpoint",
    "minutes": 6,
    "objective": "Read the safety material and write a stop plan, without attempting to learn a new vocal effect from an app. This is a listening and reflection check.",
    "explanation": "",
    "prerequisites": [
      "v-l7-m4-04"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Start with the stop rules",
        "body": "Read the stop signals under If it goes wrong and the safety note at the foot of this page, and copy them into your stop plan: pain while singing means stop now; hoarseness after practice that clears overnight means do less next time; hoarseness that does not clear, or an easy note that is now unreliable, is a question for a doctor who can examine the vocal folds, such as an ENT or laryngologist. The atlas chapter The safety rail covers effects in more depth and is part of Pro.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "For the planning task, work from the stop rules on this page; you do not need to make a pitched sound."
      },
      {
        "title": "Set a safe baseline",
        "body": "Do not learn a growl, scream, distortion, or other new effect from written directions. If a qualified teacher has already taught you an effect and it remains easy today, you may review that existing technique briefly; otherwise make this an observation-and-planning session without producing the effect.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Effects safety and a stop plan",
        "body": "Stop on pain, sudden hoarseness, loss of range, or a changed speaking voice. The app cannot certify a safe attempt. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The record says whether this was observation only or a review of prior supervised technique, and it names a strict stop point before any sound is made.",
        "listen": "Any vocalized effect was previously taught, deliberately brief, and followed by an unchanged speaking voice; observation-only work is never counted as a vocal demonstration."
      },
      {
        "title": "Use prior supervision—or observe",
        "body": "Do not learn or imitate a new vocal effect from this lesson. For “Self-Check: Your Effects Stop Plan,” either review an effect already taught to you by a qualified teacher at the prescribed dose, or complete the anatomy, listening, warning-sign, and stop-plan work without producing the effect. For an already-taught effect only, begin and end on the teacher's clean baseline and use the dose they prescribed. Otherwise compare your own earlier supervised recordings, name the audible change, and write the stop plan without imitating it.",
        "look": "The record says whether this was observation only or a review of prior supervised technique, and it names a strict stop point before any sound is made.",
        "listen": "Any vocalized effect was previously taught, deliberately brief, and followed by an unchanged speaking voice; observation-only work is never counted as a vocal demonstration."
      },
      {
        "title": "Review your own attempt",
        "body": "I read the safety material and wrote a stop plan; I did not attempt to learn a new vocal effect from an app. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "Stop for pain, rawness, sudden hoarseness, loss of range, extra effort in speech, or a changed speaking voice. Do not troubleshoot by repeating; rest, and when symptoms persist see a doctor who can examine the vocal folds, such as an ENT or laryngologist."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Copy the stop rules into your stop plan. Prepare the room, body, and safe baseline for “Self-Check: Your Effects Stop Plan.”"
      },
      {
        "seconds": 90,
        "instruction": "Review the anatomy, warning signs, prior supervision, and written stop plan without attempting a new effect."
      },
      {
        "seconds": 135,
        "instruction": "Complete the observation-only “Self-Check: Your Effects Stop Plan” task, or briefly review only a previously taught effect at the prescribed dose."
      },
      {
        "seconds": 90,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I read the safety material and wrote a stop plan; I did not attempt to learn a new vocal effect from an app.",
        "Any vocalized effect was previously taught, deliberately brief, and followed by an unchanged speaking voice; observation-only work is never counted as a vocal demonstration.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "Your written stop plan names each stop signal (pain, rawness, sudden hoarseness, loss of range, a changed speaking voice), what you will do for each, and who you would see if hoarseness does not clear, and you produced no effect today beyond one a teacher had already taught you.",
      "ifNotReady": "Stop for pain, rawness, sudden hoarseness, loss of range, extra effort in speech, or a changed speaking voice. Do not troubleshoot by repeating; rest, and when symptoms persist see a doctor who can examine the vocal folds, such as an ENT or laryngologist. Do not try the effect again to check; leave it until a teacher has heard it.",
      "shows": "I read the safety material and wrote a stop plan; I did not attempt to learn a new vocal effect from an app. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Safety, absence of strain or injury, correct effect physiology, medical clearance, completion of an effect checkpoint, or readiness for screams; the app cannot verify any of these."
    }
  },
  {
    "id": "v-l7-m5-01",
    "stageId": "v-l7",
    "moduleId": "v-l7-m5",
    "stageSlug": "signature",
    "moduleSlug": "higher-and-lower",
    "slug": "range-grows-at-the-edges-slowly",
    "title": "Range Grows at the Edges, Slowly",
    "type": "concept",
    "minutes": 5,
    "objective": "Why this is Stage 7 and not Stage 1, despite being the reason most people download a singing app.",
    "explanation": "The highest and lowest notes you can make are set largely by your anatomy, and practice does not redesign anatomy; what it changes is your access to notes that were already there but badly coordinated. The edges follow the middle and rarely lead it, which is why range work comes this late, once the middle is reliable. Add one semitone at a time, count it only when it is comfortable on three separate days, and compare readings over months rather than sessions.",
    "prerequisites": [
      "v-l7-m4-08"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Small three-note climb or Chromatic neighbor. Hear the reference, choose a comfortable key, then stop it before singing. The reading Tracking change over months, not days is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Warm up in the comfortable middle, then confirm today's repeatable low and high notes in the [pitch studio](/studio), which names each note as you sing it, and write them down before approaching either edge.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Range extension",
        "body": "Why this is Stage 7 and not Stage 1, despite being the reason most people download a singing app. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The added note is reached without a lifted chin, collapsed posture, or a different microphone setup that could distort the comparison.",
        "listen": "The new endpoint sounds like a usable sung note and can be repeated, not a breathy touch or forced shout reached once."
      },
      {
        "title": "Hear the distinction",
        "body": "After warming up in the middle, sing Small three-note climb with its top note on your current comfortable high note, then once more a semitone higher, both at low-to-moderate volume. Change only the key. Record both in one take in the recorder with a breath between them, and on playback ask whether the higher top note is a usable sung note you could repeat or a one-off reach. Count the new note only if it is easy on three separate days, and leave the range test for your next retest, weeks apart, after the same warm-up as your baseline.",
        "look": "The added note is reached without a lifted chin, collapsed posture, or a different microphone setup that could distort the comparison.",
        "listen": "The new endpoint sounds like a usable sung note and can be repeated, not a breathy touch or forced shout reached once."
      },
      {
        "title": "Review your own attempt",
        "body": "I compared comfortable notes with an earlier baseline and recorded my observation without forcing an extension. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If the semitone is not easy today, keep the previous endpoint. Stop for discomfort or persistent voice change and do not count an extreme as progress."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Range Grows at the Edges, Slowly.”"
      },
      {
        "seconds": 75,
        "instruction": "Isolate the range extension target in short, comfortable examples."
      },
      {
        "seconds": 120,
        "instruction": "Practise or record the complete “Range Grows at the Edges, Slowly” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I compared comfortable notes with an earlier baseline and recorded my observation without forcing an extension.",
        "The new endpoint sounds like a usable sung note and can be repeated, not a breathy touch or forced shout reached once.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If the semitone is not easy today, keep the previous endpoint. Stop for discomfort or persistent voice change and do not count an extreme as progress. Leave it for today, and come back to a smaller version on another day once your speaking voice feels normal.",
      "shows": "I compared comfortable notes with an earlier baseline and recorded my observation without forcing an extension. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Permanent range growth, vocal health, absence of strain, passaggio movement, or readiness to sing repertoire at the new edge."
    }
  },
  {
    "id": "v-l7-m5-04",
    "stageId": "v-l7",
    "moduleId": "v-l7-m5",
    "stageSlug": "signature",
    "moduleSlug": "higher-and-lower",
    "slug": "semitone-at-a-time",
    "title": "Semitone at a Time",
    "type": "exercise",
    "minutes": 7,
    "objective": "Extend one semitone, hold it briefly, release. Count it only when it is easy on three separate days; retest your range weeks apart, not today.",
    "explanation": "",
    "prerequisites": [
      "v-l7-m5-01"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Small three-note climb or Chromatic neighbor. Hear the reference, choose a comfortable key, then stop it before singing. The reading Tracking change over months, not days is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Warm up in the comfortable middle, then confirm today's repeatable low and high notes in the [pitch studio](/studio), which names each note as you sing it, and write them down before approaching either edge.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Range extension",
        "body": "Extend one semitone, hold it briefly, release. Count it only when it is easy on three separate days; retest your range weeks apart, not today. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The added note is reached without a lifted chin, collapsed posture, or a different microphone setup that could distort the comparison.",
        "listen": "The new endpoint sounds like a usable sung note and can be repeated, not a breathy touch or forced shout reached once."
      },
      {
        "title": "Alternate attempt and reset",
        "body": "Work in short repetitions with a normal breath and complete release between them. Move one semitone beyond the prior comfortable endpoint at low-to-moderate volume, hold briefly and release. Give the new semitone three attempts at most today, with a few seconds' rest between them. If none of the three is easy, it is not today's note: keep the previous endpoint and spend the rest of the block in the middle of your range. Do not rescan today: a finished range test replaces your saved range. Count the note only when it is easy on three separate days, and compare it at your next retest, weeks apart, with the same warm-up, room and microphone distance as your baseline.",
        "look": "The added note is reached without a lifted chin, collapsed posture, or a different microphone setup that could distort the comparison.",
        "listen": "The new endpoint sounds like a usable sung note and can be repeated, not a breathy touch or forced shout reached once."
      },
      {
        "title": "Review your own attempt",
        "body": "I compared comfortable notes with an earlier baseline and recorded my observation without forcing an extension. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If the semitone is not easy within three attempts today, keep the previous endpoint. Stop for discomfort or persistent voice change and do not count an extreme as progress."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 60,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Semitone at a Time.”"
      },
      {
        "seconds": 105,
        "instruction": "Isolate the range extension target in short, comfortable examples."
      },
      {
        "seconds": 165,
        "instruction": "Up to three attempts at the new semitone, then the rest of the block in your comfortable middle, resetting between attempts."
      },
      {
        "seconds": 90,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I compared comfortable notes with an earlier baseline and recorded my observation without forcing an extension.",
        "The new endpoint sounds like a usable sung note and can be repeated, not a breathy touch or forced shout reached once.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If the semitone is not easy within three attempts today, keep the previous endpoint. Stop for discomfort or persistent voice change and do not count an extreme as progress. Leave it for today, and come back to a smaller version on another day once your speaking voice feels normal.",
      "shows": "I compared comfortable notes with an earlier baseline and recorded my observation without forcing an extension. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Permanent range growth, vocal health, absence of strain, passaggio movement, or readiness to sing repertoire at the new edge."
    }
  },
  {
    "id": "v-l7-m5-08",
    "stageId": "v-l7",
    "moduleId": "v-l7-m5",
    "stageSlug": "signature",
    "moduleSlug": "higher-and-lower",
    "slug": "self-check-compare-your-comfortable-range",
    "title": "Self-Check: Compare Your Comfortable Range",
    "type": "checkpoint",
    "minutes": 6,
    "objective": "Compare comfortable notes with an earlier baseline and record what you notice without forcing an extension. This is a listening and reflection check.",
    "explanation": "",
    "prerequisites": [
      "v-l7-m5-04"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Small three-note climb or Chromatic neighbor. Hear the reference, choose a comfortable key, then stop it before singing. The reading Tracking change over months, not days is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Warm up in the comfortable middle, then confirm today's repeatable low and high notes in the [pitch studio](/studio), which names each note as you sing it, and write them down before approaching either edge.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Range extension",
        "body": "Compare your observation with an earlier comfortable range; a new note is not required to finish this reflection. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The added note is reached without a lifted chin, collapsed posture, or a different microphone setup that could distort the comparison.",
        "listen": "The new endpoint sounds like a usable sung note and can be repeated, not a breathy touch or forced shout reached once."
      },
      {
        "title": "Make one evidence take",
        "body": "State the checkpoint target, record one uninterrupted attempt, and keep the result even when it does not pass. Sing Small three-note climb with its top on today's easy high note, then with its bottom on today's easy low note, and compare both with your earlier baseline. Try a semitone further only if both feel easy today.",
        "look": "The added note is reached without a lifted chin, collapsed posture, or a different microphone setup that could distort the comparison.",
        "listen": "The new endpoint sounds like a usable sung note and can be repeated, not a breathy touch or forced shout reached once."
      },
      {
        "title": "Review your own attempt",
        "body": "I compared comfortable notes with an earlier baseline and recorded my observation without forcing an extension. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If the semitone is not easy today, keep the previous endpoint. Stop for discomfort or persistent voice change and do not count an extreme as progress."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Self-Check: Compare Your Comfortable Range.”"
      },
      {
        "seconds": 90,
        "instruction": "Isolate the range extension target in short, comfortable examples."
      },
      {
        "seconds": 135,
        "instruction": "Practise or record the complete “Self-Check: Compare Your Comfortable Range” task, resetting between attempts."
      },
      {
        "seconds": 90,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I compared comfortable notes with an earlier baseline and recorded my observation without forcing an extension.",
        "The new endpoint sounds like a usable sung note and can be repeated, not a breathy touch or forced shout reached once.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You have written today's easy low and high notes next to an earlier baseline taken the same way (same warm-up, room and microphone distance), and you count a note as new only if it has been easy on three separate days.",
      "ifNotReady": "If the semitone is not easy today, keep the previous endpoint. Stop for discomfort or persistent voice change and do not count an extreme as progress. Leave it for today, and come back to a smaller version on another day once your speaking voice feels normal.",
      "shows": "I compared comfortable notes with an earlier baseline and recorded my observation without forcing an extension. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Permanent range growth, vocal health, absence of strain, passaggio movement, or readiness to sing repertoire at the new edge."
    }
  },
  {
    "id": "v-l7-m6-01",
    "stageId": "v-l7",
    "moduleId": "v-l7-m6",
    "stageSlug": "signature",
    "moduleSlug": "the-room",
    "slug": "mic-distance-is-a-dynamic-control",
    "title": "Mic Distance Is a Dynamic Control",
    "type": "concept",
    "minutes": 5,
    "objective": "Working the mic, monitors, and what changes when there is an audience.",
    "explanation": "A microphone hears distance as loudness: move from a hand's width to arm's length and it hears a different instrument. That makes distance a control you can use, keeping a quiet line close and easing back a little for a big note, instead of pushing the quiet line or squeezing the loud one; too close and loud notes distort, too far and quiet ones disappear. Hearing yourself matters as much: if the monitors or the room let you down, you sing louder by reflex, so sorting out how you hear your own voice comes before anything else when there is an audience.",
    "prerequisites": [
      "v-l7-m5-08"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Amazing Grace (Opening Lines, Verses 1 & 2) or Home on the Range (Opening Lines). Hear the reference, choose a comfortable key, then stop it before singing. The reading Building a set you can survive is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Rehearse the displayed melody alone. Record two short examples in one take at different comfortable microphone distances, keeping the phrase and volume similar. Leave a quiet gap while changing distance so handling noise is separate; record your takes in the recorder. Listen for clarity before attempting a longer study.",
        "look": "The displayed study contains one melody line. Keep the microphone position consistent within each comparison.",
        "listen": "The phrase remains understandable from its first entry to its final release."
      },
      {
        "title": "Name the target: Performance and mic technique",
        "body": "Working the mic, monitors, and what changes when there is an audience. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The displayed study contains one melody line. Keep the microphone position consistent within each comparison.",
        "listen": "The phrase remains understandable from its first entry to its final release."
      },
      {
        "title": "Hear the distinction",
        "body": "Sing the first phrase of Amazing Grace twice at the same comfortable volume: once with the microphone (or phone) a hand's width from your mouth, once at arm's length, angled slightly off to the side so your breath does not hit it. Change only the distance. Leave a quiet gap while you move it so handling noise stays separate, and record both in one take in the recorder. On playback, note which sounds closer and fuller, and whether either distorted on the loudest note or lost the quietest one. Then sing the phrase once using distance on purpose: close for the quiet opening, easing back a little for the fullest note.",
        "look": "The displayed study contains one melody line. Keep the microphone position consistent within each comparison.",
        "listen": "The phrase remains understandable from its first entry to its final release."
      },
      {
        "title": "Review your own attempt",
        "body": "I rehearsed the supplied study arrangement and compared microphone distance or phrasing on separate takes. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If a loud note distorts or a quiet one disappears on playback, keep your volume the same and move the microphone instead: a little further back for the fullest phrase, closer for the quietest, then record that phrase again. If you add a harmony and it collapses into the melody, stop the reference, sing the harmony alone from its anchor notes, then bring the melody back at lower volume."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Mic Distance Is a Dynamic Control.”"
      },
      {
        "seconds": 75,
        "instruction": "Isolate the performance and mic technique target in short, comfortable examples."
      },
      {
        "seconds": 120,
        "instruction": "Practise or record the complete “Mic Distance Is a Dynamic Control” task, resetting between attempts."
      },
      {
        "seconds": 60,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I rehearsed the supplied study arrangement and compared microphone distance or phrasing on separate takes.",
        "On playback, the melody keeps its own contour and the whole arrangement stays complete from first entry to release. A harmony line, if you add one, is listening practice: nothing here measures two parts at once.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If a loud note distorts or a quiet one disappears on playback, keep your volume the same and move the microphone instead: a little further back for the fullest phrase, closer for the quietest, then record that phrase again. If you add a harmony and it collapses into the melody, stop the reference, sing the harmony alone from its anchor notes, then bring the melody back at lower volume. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I rehearsed the supplied study arrangement and compared microphone distance or phrasing on separate takes. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Two simultaneous vocal parts, harmony accuracy, blend, independence, absence of a register break, or vocal health; the detector returns one fundamental per frame."
    }
  },
  {
    "id": "v-l7-m6-05",
    "stageId": "v-l7",
    "moduleId": "v-l7-m6",
    "stageSlug": "signature",
    "moduleSlug": "the-room",
    "slug": "microphone-and-phrase-rehearsal",
    "title": "Microphone and Phrase Rehearsal",
    "type": "song",
    "minutes": 9,
    "objective": "Rehearse the supplied melody first. This study supplies one line, not simultaneous lead and harmony parts.",
    "explanation": "",
    "prerequisites": [
      "v-l7-m6-01"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Amazing Grace (Opening Lines, Verses 1 & 2) or Home on the Range (Opening Lines). Hear the reference, choose a comfortable key, then stop it before singing. The reading Building a set you can survive is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Rehearse the displayed melody alone. Record two short examples in one take at different comfortable microphone distances, keeping the phrase and volume similar. Leave a quiet gap while changing distance so handling noise is separate; record your takes in the recorder. Listen for clarity before attempting a longer study.",
        "look": "The displayed study contains one melody line. Keep the microphone position consistent within each comparison.",
        "listen": "The phrase remains understandable from its first entry to its final release."
      },
      {
        "title": "Name the target: Performance and mic technique",
        "body": "Rehearse the supplied melody first. This study supplies one line, not simultaneous lead and harmony parts. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The displayed study contains one melody line. Keep the microphone position consistent within each comparison.",
        "listen": "The phrase remains understandable from its first entry to its final release."
      },
      {
        "title": "Build the song from phrases",
        "body": "Mark your breaths and the highest phrase of Amazing Grace or Home on the Range. Rehearse that phrase alone, join two phrases, then record the whole arrangement in one uninterrupted take in the recorder at the microphone distance that sounded clearest in your comparison, keeping it fixed so the take is a fair comparison with the next one.",
        "look": "The displayed study contains one melody line. Keep the microphone position consistent within each comparison.",
        "listen": "The phrase remains understandable from its first entry to its final release."
      },
      {
        "title": "Review your own attempt",
        "body": "I rehearsed the supplied study arrangement and compared microphone distance or phrasing on separate takes. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If a loud note distorts or a quiet one disappears on playback, keep your volume the same and move the microphone instead: a little further back for the fullest phrase, closer for the quietest, then record that phrase again. If you add a harmony and it collapses into the melody, stop the reference, sing the harmony alone from its anchor notes, then bring the melody back at lower volume."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 75,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Microphone and Phrase Rehearsal.”"
      },
      {
        "seconds": 135,
        "instruction": "Isolate the performance and mic technique target in short, comfortable examples."
      },
      {
        "seconds": 210,
        "instruction": "Practise or record the complete “Microphone and Phrase Rehearsal” task, resetting between attempts."
      },
      {
        "seconds": 120,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I rehearsed the supplied study arrangement and compared microphone distance or phrasing on separate takes.",
        "On playback, the melody keeps its own contour and the whole arrangement stays complete from first entry to release. A harmony line, if you add one, is listening practice: nothing here measures two parts at once.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If a loud note distorts or a quiet one disappears on playback, keep your volume the same and move the microphone instead: a little further back for the fullest phrase, closer for the quietest, then record that phrase again. If you add a harmony and it collapses into the melody, stop the reference, sing the harmony alone from its anchor notes, then bring the melody back at lower volume. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I rehearsed the supplied study arrangement and compared microphone distance or phrasing on separate takes. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Two simultaneous vocal parts, harmony accuracy, blend, independence, absence of a register break, or vocal health; the detector returns one fundamental per frame."
    }
  },
  {
    "id": "v-l7-m6-08",
    "stageId": "v-l7",
    "moduleId": "v-l7-m6",
    "stageSlug": "signature",
    "moduleSlug": "the-room",
    "slug": "self-check-your-performance-study",
    "title": "Self-Check: Your Performance Study",
    "type": "checkpoint",
    "minutes": 10,
    "objective": "Rehearse the supplied study arrangement and compare microphone distance or phrasing on separate takes. This is a listening and reflection check.",
    "explanation": "",
    "prerequisites": [
      "v-l7-m6-05"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Amazing Grace (Opening Lines, Verses 1 & 2) or Home on the Range (Opening Lines). Hear the reference, choose a comfortable key, then stop it before singing. The reading Building a set you can survive is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Rehearse the displayed melody alone. Record two short examples in one take at different comfortable microphone distances, keeping the phrase and volume similar. Leave a quiet gap while changing distance so handling noise is separate; record your takes in the recorder. Listen for clarity before attempting a longer study.",
        "look": "The displayed study contains one melody line. Keep the microphone position consistent within each comparison.",
        "listen": "The phrase remains understandable from its first entry to its final release."
      },
      {
        "title": "Name the target: Performance and mic technique",
        "body": "Rehearse the supplied study arrangement and compare microphone distance or phrasing on separate takes. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The displayed study contains one melody line. Keep the microphone position consistent within each comparison.",
        "listen": "The phrase remains understandable from its first entry to its final release."
      },
      {
        "title": "Make one evidence take",
        "body": "State the checkpoint target, record one uninterrupted attempt, and keep the result even when it does not pass. Sing the whole study once at the microphone distance you chose, keeping it fixed, then once more changing only one thing: the distance on the quietest phrase, or where you breathe. Compare the two takes on playback.",
        "look": "The displayed study contains one melody line. Keep the microphone position consistent within each comparison.",
        "listen": "The phrase remains understandable from its first entry to its final release."
      },
      {
        "title": "Review your own attempt",
        "body": "I rehearsed the supplied study arrangement and compared microphone distance or phrasing on separate takes. Compare your attempt with the supplied material and choose one smaller adjustment for next time.",
        "look": "Note the pitch, key, or setup you used so that your next comparison is useful.",
        "listen": "Listen for the specific change taught in this lesson. A self-check is your own reflection, not an automatic vocal score."
      }
    ],
    "mistakes": [
      {
        "observation": "The target disappears when the range, volume, speed, or duration increases.",
        "recovery": "If a loud note distorts or a quiet one disappears on playback, keep your volume the same and move the microphone instead: a little further back for the fullest phrase, closer for the quietest, then record that phrase again. If you add a harmony and it collapses into the melody, stop the reference, sing the harmony alone from its anchor notes, then bring the melody back at lower volume."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 90,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Self-Check: Your Performance Study.”"
      },
      {
        "seconds": 150,
        "instruction": "Isolate the performance and mic technique target in short, comfortable examples."
      },
      {
        "seconds": 240,
        "instruction": "Practise or record the complete “Self-Check: Your Performance Study” task, resetting between attempts."
      },
      {
        "seconds": 120,
        "instruction": "Review one take against the stated listening goal and write the next smaller correction."
      }
    ],
    "selfCheck": {
      "criteria": [
        "I rehearsed the supplied study arrangement and compared microphone distance or phrasing on separate takes.",
        "On playback, the melody keeps its own contour and the whole arrangement stays complete from first entry to release. A harmony line, if you add one, is listening practice: nothing here measures two parts at once.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "One uninterrupted take of the whole study, at a fixed microphone distance you chose by comparing takes, stays understandable from its first entry to its final release, with no distorted loud notes or lost quiet ones.",
      "ifNotReady": "If a loud note distorts or a quiet one disappears on playback, keep your volume the same and move the microphone instead: a little further back for the fullest phrase, closer for the quietest, then record that phrase again. If you add a harmony and it collapses into the melody, stop the reference, sing the harmony alone from its anchor notes, then bring the melody back at lower volume. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I rehearsed the supplied study arrangement and compared microphone distance or phrasing on separate takes. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Two simultaneous vocal parts, harmony accuracy, blend, independence, absence of a register break, or vocal health; the detector returns one fundamental per frame."
    }
  }
];

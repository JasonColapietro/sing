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
    "prerequisites": [],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and choose Sustained hold. Hear the reference, choose a comfortable key, then stop it before singing. The reading What your voice actually is is listed there too.",
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
        "body": "Reference sound can enter the microphone along with your voice. Compare your setup with playback stopped. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The recording starts with your voice, settles while you sing, and returns to quiet instead of moving with playback or room noise.",
        "listen": "Your recorded voice is clear enough to follow without echo, clipping, a second voice, or loud accompaniment."
      },
      {
        "title": "Hear the distinction",
        "body": "Make two brief, comfortable examples of the idea in “Why Loud Playback Ruins Pitch.” Change only the named variable. Record both contrast examples in one take with a quiet breath between them, then return to the easier baseline. Record your takes in the recorder. Make one comfortable sustained sound, then leave a full quiet gap before the next. Change only one room or device setting at a time so you can hear what fixed the input.",
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
        "body": "Open the practice material on this page and choose Sustained hold. Hear the reference, choose a comfortable key, then stop it before singing. The reading What your voice actually is is listed there too.",
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
    "objective": "compared a quiet recording with my initial room setup and could hear my voice clearly. This is a listening and reflection check.",
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
        "body": "Open the practice material on this page and choose Sustained hold. Hear the reference, choose a comfortable key, then stop it before singing. The reading What your voice actually is is listed there too.",
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
        "body": "The range finder tracks your voice cleanly, with nothing else playing. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
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
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
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
    "objective": "Comfortable, not extreme. The number we want is the one you can use.",
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
        "body": "Start near the middle of your comfortable speaking range after a gentle hum. Keep the jaw loose and choose a small lip trill, hum, or easy vowel rather than a loud call.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Range scan and voice type",
        "body": "Comfortable, not extreme. The number we want is the one you can use. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Keep the supplied reference or reading visible, settle your posture, and use only a pitch and duration you can repeat comfortably.",
        "listen": "Both slides remain conversational in effort. The last usable note sounds repeatable, not like an extreme reached once."
      },
      {
        "title": "Hear the distinction",
        "body": "Make two brief, comfortable examples of the idea in “Low First, High Second, Neither Forced.” Change only the named variable. Record both contrast examples in one take with a quiet breath between them, then return to the easier baseline. Record your takes in the recorder. Glide down only while the sound stays easy, reset, then glide up separately. Stop before squeezing, pain, scratchiness, or the urge to reach for a number.",
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
        "body": "Start near the middle of your comfortable speaking range after a gentle hum. Keep the jaw loose and choose a small lip trill, hum, or easy vowel rather than a loud call.",
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
        "body": "Work in short repetitions with a normal breath and complete release between them. Glide down only while the sound stays easy, reset, then glide up separately. Stop before squeezing, pain, scratchiness, or the urge to reach for a number.",
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
    "objective": "tried a comfortable low and high note without forcing either end and noted the pitches I could repeat. This is a listening and reflection check.",
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
        "body": "Start near the middle of your comfortable speaking range after a gentle hum. Keep the jaw loose and choose a small lip trill, hum, or easy vowel rather than a loud call.",
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
        "body": "State the checkpoint target, record one uninterrupted attempt, and keep the result even when it does not pass. Glide down only while the sound stays easy, reset, then glide up separately. Stop before squeezing, pain, scratchiness, or the urge to reach for a number.",
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
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
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
        "body": "Open the practice material on this page and read Breath: support versus pressure. Use its written exercise and stop rules. The reading Breath: support versus pressure is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "For the breathing or planning task, follow the written exercise; you do not need to make a pitched sound."
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
        "body": "Make two brief, comfortable examples of the idea in “Ribs Out, Shoulders Still.” Change only the named variable. Record both contrast examples in one take with a quiet breath between them, then return to the easier baseline. Record your takes in the recorder. Release a narrow, even hiss. Favor steadiness over duration, and end with air still available instead of collapsing or bearing down.",
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
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Ribs Out, Shoulders Still.”"
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
    "objective": "Evenness first, duration second. Count your hiss gently and listen for a steady sound; duration is your own observation.",
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
        "body": "Open the practice material on this page and read Breath: support versus pressure. Use its written exercise and stop rules. The reading Breath: support versus pressure is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "For the breathing or planning task, follow the written exercise; you do not need to make a pitched sound."
      },
      {
        "title": "Set a safe baseline",
        "body": "Stand or sit tall without locking the ribs. Let the shoulders remain quiet while the lower ribs and abdomen respond to an unforced inhale.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Low breath and rib expansion",
        "body": "Evenness first, duration second. Count your hiss gently and listen for a steady sound; duration is your own observation. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
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
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Hiss for Twelve.”"
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
    "objective": "counted an even hiss, kept my shoulders quiet, and released before running out of comfortable breath. This is a listening and reflection check.",
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
        "body": "Open the practice material on this page and read Breath: support versus pressure. Use its written exercise and stop rules. The reading Breath: support versus pressure is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "For the breathing or planning task, follow the written exercise; you do not need to make a pitched sound."
      },
      {
        "title": "Set a safe baseline",
        "body": "Stand or sit tall without locking the ribs. Let the shoulders remain quiet while the lower ribs and abdomen respond to an unforced inhale.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Low breath and rib expansion",
        "body": "Count a comfortable hiss and listen for evenness. Twelve seconds is an optional practice goal that clears the first mark at ten; duration is your own observation, not an automatic pass. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The shoulders do not rise sharply, the neck stays quiet, and the body does not fold during the final seconds.",
        "listen": "The hiss stays even rather than surging at the start and fading to almost nothing at the end."
      },
      {
        "title": "Make one evidence take",
        "body": "State the checkpoint target, record one uninterrupted attempt, and keep the result even when it does not pass. Release a narrow, even hiss. Favor steadiness over duration, and end with air still available instead of collapsing or bearing down.",
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
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Self-Check: An Even Hiss.”"
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
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
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
        "body": "Make two brief, comfortable examples of the idea in “Back Pressure Does the Work.” Change only the named variable. Record both contrast examples in one take with a quiet breath between them, then return to the easier baseline. Record your takes in the recorder. Hold or slide through a narrow range with steady airflow and no push. Reset between attempts instead of extending a fading trill by force.",
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
    "objective": "tried the straw or lip-trill pattern gently, with an easy breath and a full rest between attempts. This is a listening and reflection check.",
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
        "body": "The warm-up you will use every session for the next year. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The cheeks, jaw, and neck remain loose; the straw stays lightly sealed or the lips continue vibrating without being clamped.",
        "listen": "The buzz or straw tone stays continuous and even, without sudden blasts, pressed starts, or a pitch leap used to rescue the sound."
      },
      {
        "title": "Make one evidence take",
        "body": "State the checkpoint target, record one uninterrupted attempt, and keep the result even when it does not pass. Hold or slide through a narrow range with steady airflow and no push. Reset between attempts instead of extending a fading trill by force.",
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
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
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
        "body": "Choose a target near the middle of your scanned range. Hear it once, stop the reference, breathe normally, and prepare the vowel before starting.",
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
        "body": "Make two brief, comfortable examples of the idea in “Onset Without the Click.” Change only the named variable. Record both contrast examples in one take with a quiet breath between them, then return to the easier baseline. Record your takes in the recorder. Begin close to the pitch rather than sliding up from below. Hold briefly, release, and compare a fresh attempt instead of steering one long note with your eyes.",
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
        "body": "Choose a target near the middle of your scanned range. Hear it once, stop the reference, breathe normally, and prepare the vowel before starting.",
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
    "objective": "heard the five-note scale reference, sang the pattern from silence, and compared each entry by ear. This is a listening and reflection check.",
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
        "body": "Choose a target near the middle of your scanned range. Hear it once, stop the reference, breathe normally, and prepare the vowel before starting.",
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
        "body": "State the checkpoint target, record one uninterrupted attempt, and keep the result even when it does not pass. Begin close to the pitch rather than sliding up from below. Hold briefly, release, and compare a fresh attempt instead of steering one long note with your eyes.",
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
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
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
        "body": "Make two brief, comfortable examples of the idea in “Steady Is a Skill, Not a Talent.” Change only the named variable. Record both contrast examples in one take with a quiet breath between them, then return to the easier baseline. Record your takes in the recorder. Aim for one centered pitch and an even release. Hear Sustained hold once, stop the reference, then record a short comfortable hold. Compare the start and end by ear; judge it by ear, not by the display.",
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
    "type": "song",
    "minutes": 5,
    "objective": "Use the supplied sustained reference for short holds, resting between them.",
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
        "title": "Build the song from phrases",
        "body": "Mark the key, breaths, range edges, and lesson target before a full take of “One Note Per Bar.” Rehearse the hardest phrase alone, join two phrases, then record one uninterrupted form. Aim for one centered pitch and an even release. Hear Sustained hold once, stop the reference, then record a short comfortable hold. Compare the start and end by ear; judge it by ear, not by the display.",
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
    "objective": "matched the sustained reference, released comfortably, and listened for a steady center on repeated short holds. This is a listening and reflection check.",
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
        "body": "Compare the beginning and ending of a comfortable hold by ear; no cents score is produced. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Keep the supplied reference or reading visible, settle your posture, and use only a pitch and duration you can repeat comfortably.",
        "listen": "The tone does not sag at the end, pulse with changing air pressure, or become louder to compensate for lost steadiness."
      },
      {
        "title": "Make one evidence take",
        "body": "State the checkpoint target, record one uninterrupted attempt, and keep the result even when it does not pass. Aim for one centered pitch and an even release. Hear Sustained hold once, stop the reference, then record a short comfortable hold. Compare the start and end by ear; judge it by ear, not by the display.",
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
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
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
        "body": "Open the practice material on this page and choose Amazing Grace or Amazing Grace (Verse 1 & 2). Hear the reference, choose a comfortable key, then stop it before singing. The reading Choosing songs that actually fit is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Transpose the song so every phrase fits the easy part of your scanned range. Speak the words and mark breaths before singing the supplied study.",
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
        "body": "Make two brief, comfortable examples of the idea in “Your Key, Not the Record's Key.” Change only the named variable. Record both contrast examples in one take with a quiet breath between them, then return to the easier baseline. Record your takes in the recorder. Keep one consistent, comfortable production through the song. Work phrase by phrase, then join the form without changing key to imitate a recording.",
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
        "body": "Open the practice material on this page and choose Amazing Grace or Amazing Grace (Verse 1 & 2). Hear the reference, choose a comfortable key, then stop it before singing. The reading Choosing songs that actually fit is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Transpose the song so every phrase fits the easy part of your scanned range. Speak the words and mark breaths before singing the supplied study.",
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
        "body": "Mark the key, breaths, range edges, and lesson target before a full take of “Amazing Grace: Phrase to Study.” Rehearse the hardest phrase alone, join two phrases, then record one uninterrupted form. Keep one consistent, comfortable production through the song. Work phrase by phrase, then join the form without changing key to imitate a recording.",
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
    "objective": "rehearsed the supplied Amazing Grace phrase and study arrangement in a key that felt comfortable. This is a listening and reflection check.",
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
        "body": "Open the practice material on this page and choose Amazing Grace or Amazing Grace (Verse 1 & 2). Hear the reference, choose a comfortable key, then stop it before singing. The reading Choosing songs that actually fit is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Transpose the song so every phrase fits the easy part of your scanned range. Speak the words and mark breaths before singing the supplied study.",
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
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
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
        "body": "Make two brief, comfortable examples of the idea in “Registers: Different Ways to Make a Sound.” Change only the named variable. Record both contrast examples in one take with a quiet breath between them, then return to the easier baseline. Record your takes in the recorder. Contrast a fuller speech-like sound with a lighter sound at the same pitch. Match pitch and volume as closely as practical so the production change is what you hear.",
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
    "objective": "Called at random, both directions.",
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
        "body": "Called at random, both directions. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
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
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
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
        "body": "Open the practice material on this page and choose Octave siren or Easy fourth siren. Hear the reference, choose a comfortable key, then stop it before singing. The reading Registers, and why they exist is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Start with a lip trill, hum, or narrow vowel across an easy five-note span before attempting the octave. Keep the endpoints inside your comfortable range.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Register blending",
        "body": "A crack is a gear change you did not plan. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Follow the start and end pitches in the supplied Octave siren, then stop playback before your attempt. Keep the jaw and neck easy while listening for the transition.",
        "listen": "Judge the continuity from your recorded playback. Listen for a jump, break, or abrupt change in tone; the reference notes do not show or evaluate your voice."
      },
      {
        "title": "Hear the distinction",
        "body": "Make two brief, comfortable examples of the idea in “Slide Through, Do Not Jump Over.” Change only the named variable. Record both contrast examples in one take with a quiet breath between them, then return to the easier baseline. Record your takes in the recorder. Slide slowly enough to hear the transition instead of jumping across it. Use less volume near the gear change and keep the vowel narrow.",
        "look": "Follow the start and end pitches in the supplied Octave siren, then stop playback before your attempt. Keep the jaw and neck easy while listening for the transition.",
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
        "body": "Open the practice material on this page and choose Octave siren or Easy fourth siren. Hear the reference, choose a comfortable key, then stop it before singing. The reading Registers, and why they exist is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Start with a lip trill, hum, or narrow vowel across an easy five-note span before attempting the octave. Keep the endpoints inside your comfortable range.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Register blending",
        "body": "Slow slides. Speed hides the break instead of fixing it. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Follow the start and end pitches in the supplied Octave siren, then stop playback before your attempt. Keep the jaw and neck easy while listening for the transition.",
        "listen": "Judge the continuity from your recorded playback. Listen for a jump, break, or abrupt change in tone; the reference notes do not show or evaluate your voice."
      },
      {
        "title": "Alternate attempt and reset",
        "body": "Work in short repetitions with a normal breath and complete release between them. Slide slowly enough to hear the transition instead of jumping across it. Use less volume near the gear change and keep the vowel narrow.",
        "look": "Follow the start and end pitches in the supplied Octave siren, then stop playback before your attempt. Keep the jaw and neck easy while listening for the transition.",
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
        "body": "Open the practice material on this page and choose Octave siren or Easy fourth siren. Hear the reference, choose a comfortable key, then stop it before singing. The reading Registers, and why they exist is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Start with a lip trill, hum, or narrow vowel across an easy five-note span before attempting the octave. Keep the endpoints inside your comfortable range.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Register blending",
        "body": "Three vowels, both directions. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Follow the start and end pitches in the supplied Octave siren, then stop playback before your attempt. Keep the jaw and neck easy while listening for the transition.",
        "listen": "Judge the continuity from your recorded playback. Listen for a jump, break, or abrupt change in tone; the reference notes do not show or evaluate your voice."
      },
      {
        "title": "Make one evidence take",
        "body": "State the checkpoint target, record one uninterrupted attempt, and keep the result even when it does not pass. Slide slowly enough to hear the transition instead of jumping across it. Use less volume near the gear change and keep the vowel narrow.",
        "look": "Follow the start and end pitches in the supplied Octave siren, then stop playback before your attempt. Keep the jaw and neck easy while listening for the transition.",
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
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
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
        "body": "Make two brief, comfortable examples of the idea in “Five Shapes, One Tone.” Change only the named variable. Record both contrast examples in one take with a quiet breath between them, then return to the easier baseline. Record your takes in the recorder. Repeat the same pitch pattern on each assigned vowel without spreading, swallowing, or changing volume to manufacture sameness.",
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
        "body": "State the checkpoint target, record one uninterrupted attempt, and keep the result even when it does not pass. Repeat the same pitch pattern on each assigned vowel without spreading, swallowing, or changing volume to manufacture sameness.",
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
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
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
        "look": "The written span fits inside the scanned range and the crossing phrase has a planned vowel and breath.",
        "listen": "The melody stays accurate through both parts of the range and the crossing does not interrupt the phrase to your ear."
      },
      {
        "title": "Hear the distinction",
        "body": "Make two brief, comfortable examples of the idea in “A Wider Phrase, One Comfortable Key.” Change only the named variable. Record both contrast examples in one take with a quiet breath between them, then return to the easier baseline. Record your takes in the recorder. Rehearse the crossing as a siren and on the actual words before singing the supplied study. Reduce volume through the transition rather than pushing the upper phrase.",
        "look": "The written span fits inside the scanned range and the crossing phrase has a planned vowel and breath.",
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
        "look": "The written span fits inside the scanned range and the crossing phrase has a planned vowel and breath.",
        "listen": "The melody stays accurate through both parts of the range and the crossing does not interrupt the phrase to your ear."
      },
      {
        "title": "Build the song from phrases",
        "body": "Mark the key, breaths, range edges, and lesson target before a full take of “supplied study.” Rehearse the hardest phrase alone, join two phrases, then record one uninterrupted form. Rehearse the crossing as a siren and on the actual words before singing the supplied study. Reduce volume through the transition rather than pushing the upper phrase.",
        "look": "The written span fits inside the scanned range and the crossing phrase has a planned vowel and breath.",
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
    "objective": "rehearsed the supplied Deep River phrase in a comfortable key and marked where my voice changed. This is a listening and reflection check.",
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
        "look": "The written span fits inside the scanned range and the crossing phrase has a planned vowel and breath.",
        "listen": "The melody stays accurate through both parts of the range and the crossing does not interrupt the phrase to your ear."
      },
      {
        "title": "Make one evidence take",
        "body": "State the checkpoint target, record one uninterrupted attempt, and keep the result even when it does not pass. Rehearse the crossing as a siren and on the actual words before singing the supplied study. Reduce volume through the transition rather than pushing the upper phrase.",
        "look": "The written span fits inside the scanned range and the crossing phrase has a planned vowel and breath.",
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
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
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
        "body": "Open the practice material on this page and choose Soft sustain. Hear the reference, choose a comfortable key, then stop it before singing. The reading When the numbers lie to you is listed there too.",
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
        "body": "Make two brief, comfortable examples of the idea in “Breathy, Nasal, Tight: Tell Them Apart.” Change only the named variable. Record both contrast examples in one take with a quiet breath between them, then return to the easier baseline. Record your takes in the recorder. Compare an easy baseline with a deliberately airier, brighter-nasal, or firmer version only as a listening demonstration. Return to the easy baseline after each contrast.",
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
      "ifNotReady": "If a contrast causes discomfort, hoarseness, loss of range, or effort that remains after the attempt, stop the exercise and rest your voice. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
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
        "body": "Open the practice material on this page and choose Soft sustain. Hear the reference, choose a comfortable key, then stop it before singing. The reading When the numbers lie to you is listed there too.",
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
        "body": "Work in short repetitions with a normal breath and complete release between them. Compare an easy baseline with a deliberately airier, brighter-nasal, or firmer version only as a listening demonstration. Return to the easy baseline after each contrast.",
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
      "ifNotReady": "If a contrast causes discomfort, hoarseness, loss of range, or effort that remains after the attempt, stop the exercise and rest your voice. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
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
        "body": "Open the practice material on this page and choose Soft sustain. Hear the reference, choose a comfortable key, then stop it before singing. The reading When the numbers lie to you is listed there too.",
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
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If a contrast causes discomfort, hoarseness, loss of range, or effort that remains after the attempt, stop the exercise and rest your voice. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
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
        "body": "Open the practice material on this page and choose Amazing Grace (Verse 1 & 2) or Chromatic neighbor. Hear the reference, choose a comfortable key, then stop it before singing. The reading What pitch accuracy actually measures is listed there too.",
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
        "body": "Make two brief, comfortable examples of the idea in “Hear the Pitch Before You Sing.” Change only the named variable. Record both contrast examples in one take with a quiet breath between them, then return to the easier baseline. Record your takes in the recorder. Correct drift in separate attempts: identify whether the center was sharp or flat, release, imagine the adjustment, then sing again.",
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
        "recovery": "Hear the reference once, then sing from silence and review your recording. Shorten long notes that lose center."
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
      "ifNotReady": "Hear the reference once, then sing from silence and review your recording. Shorten long notes that lose center. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
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
        "body": "Open the practice material on this page and choose Amazing Grace (Verse 1 & 2) or Chromatic neighbor. Hear the reference, choose a comfortable key, then stop it before singing. The reading What pitch accuracy actually measures is listed there too.",
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
        "recovery": "Hear the reference once, then sing from silence and review your recording. Shorten long notes that lose center."
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
      "ifNotReady": "Hear the reference once, then sing from silence and review your recording. Shorten long notes that lose center. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
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
    "objective": "compared my Amazing Grace study with the note reference and identified one pitch to revisit by ear. This is a listening and reflection check.",
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
        "body": "Open the practice material on this page and choose Amazing Grace (Verse 1 & 2) or Chromatic neighbor. Hear the reference, choose a comfortable key, then stop it before singing. The reading What pitch accuracy actually measures is listed there too.",
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
        "recovery": "Hear the reference once, then sing from silence and review your recording. Shorten long notes that lose center."
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
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "Hear the reference once, then sing from silence and review your recording. Shorten long notes that lose center. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
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
        "body": "Open the practice material on this page and choose Row Row Row Your Boat or Ode to Joy. Hear the reference, choose a comfortable key, then stop it before singing. The reading Weeks 11 and 12: putting it in a song is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Choose the included Ode to Joy phrase. Hear it at Half speed, then stop the reference and tap a comfortable, steady four-beat pulse. Speak its displayed note durations before adding pitch. Row Row Row Your Boat is an optional three-beat comparison, using its own displayed meter.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Rhythm and syncopation",
        "body": "On one comfortable pitch, compare two even sounds per tap (say “1-and”), three even sounds per tap (say “1-trip-let”), and a long-short pair using the first and third triplet positions. Keep the taps equally spaced. Record these three feels in one take, naming each before you sing it, then return to the written song rhythm.",
        "look": "Each phrase start and syncopation has a written count; the body keeps the pulse through held notes and rests.",
        "listen": "On playback, compare your sung entries with your recorded taps and name where you rushed or delayed. This is a listening judgment, not a timing score."
      },
      {
        "title": "Hear the distinction",
        "body": "Make two brief, comfortable examples of the idea in “Swing, Triplet, Straight.” Change only the named variable. Record both contrast examples in one take with a quiet breath between them, then return to the easier baseline. Record your takes in the recorder. Clap the complete displayed phrase, then sing its rhythm on one pitch, then restore the melody. If recording, tap the pulse gently through each version so you can hear your timing against your own taps. Leave a breath between versions and keep them in one take. An external click is optional.",
        "look": "Each phrase start and syncopation has a written count; the body keeps the pulse through held notes and rests.",
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
        "instruction": "Isolate the rhythm and syncopation target in short, comfortable examples."
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
        "body": "Open the practice material on this page and choose Row Row Row Your Boat or Ode to Joy. Hear the reference, choose a comfortable key, then stop it before singing. The reading Weeks 11 and 12: putting it in a song is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Choose the included Ode to Joy phrase. Hear it at Half speed, then stop the reference and tap a comfortable, steady four-beat pulse. Speak its displayed note durations before adding pitch. Row Row Row Your Boat is an optional three-beat comparison, using its own displayed meter.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Rhythm and syncopation",
        "body": "Rhythm without pitch first. Pitch hides timing errors. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Each phrase start and syncopation has a written count; the body keeps the pulse through held notes and rests.",
        "listen": "On playback, compare your sung entries with your recorded taps and name where you rushed or delayed. This is a listening judgment, not a timing score."
      },
      {
        "title": "Alternate attempt and reset",
        "body": "Work in short repetitions with a normal breath and complete release between them. Clap the complete displayed phrase, then sing its rhythm on one pitch, then restore the melody. If recording, tap the pulse gently through each version so you can hear your timing against your own taps. Leave a breath between versions and keep them in one take. An external click is optional.",
        "look": "Each phrase start and syncopation has a written count; the body keeps the pulse through held notes and rests.",
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
        "instruction": "Isolate the rhythm and syncopation target in short, comfortable examples."
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
    "objective": "counted and clapped the displayed rhythm before singing it, then reviewed where my entries aligned by ear. This is a listening and reflection check.",
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
        "body": "Open the practice material on this page and choose Row Row Row Your Boat or Ode to Joy. Hear the reference, choose a comfortable key, then stop it before singing. The reading Weeks 11 and 12: putting it in a song is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Choose the included Ode to Joy phrase. Hear it at Half speed, then stop the reference and tap a comfortable, steady four-beat pulse. Speak its displayed note durations before adding pitch. Row Row Row Your Boat is an optional three-beat comparison, using its own displayed meter.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Rhythm and syncopation",
        "body": "Checked against your tapped pulse by ear. Onset timing is not automatically scored. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Each phrase start and syncopation has a written count; the body keeps the pulse through held notes and rests.",
        "listen": "On playback, compare your sung entries with your recorded taps and name where you rushed or delayed. This is a listening judgment, not a timing score."
      },
      {
        "title": "Make one evidence take",
        "body": "State the checkpoint target, record one uninterrupted attempt, and keep the result even when it does not pass. Clap the complete displayed phrase, then sing its rhythm on one pitch, then restore the melody. If recording, tap the pulse gently through each version so you can hear your timing against your own taps. Leave a breath between versions and keep them in one take. An external click is optional.",
        "look": "Each phrase start and syncopation has a written count; the body keeps the pulse through held notes and rests.",
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
        "instruction": "Isolate the rhythm and syncopation target in short, comfortable examples."
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
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
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
        "body": "Make two brief, comfortable examples of the idea in “Consonants Are the Axis Nobody Scores.” Change only the named variable. Record both contrast examples in one take with a quiet breath between them, then return to the easier baseline. Record your takes in the recorder. Keep consonants quick and vowels connected. Increase tempo only while every word remains understandable on playback.",
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
        "instruction": "Isolate the diction as a scored axis target in short, comfortable examples."
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
        "instruction": "Isolate the diction as a scored axis target in short, comfortable examples."
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
    "objective": "spoke and sang the displayed lyric slowly enough for each word to remain understandable on playback. This is a listening and reflection check.",
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
        "instruction": "Isolate the diction as a scored axis target in short, comfortable examples."
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
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
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
        "body": "Make two brief, comfortable examples of the idea in “Grace Notes, Staccato, Accent.” Change only the named variable. Record both contrast examples in one take with a quiet breath between them, then return to the easier baseline. Record your takes in the recorder. Add one named articulation at a time: a connected grace, a short release, or a clear accent. Make the gesture small enough to remain repeatable.",
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
    "objective": "Called at random mid-phrase.",
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
        "body": "Called at random mid-phrase. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The articulation lands on the planned note and does not shift the whole phrase or replace the vowel.",
        "listen": "The three versions are distinguishable in playback without one simply being much louder than the others."
      },
      {
        "title": "Make one evidence take",
        "body": "State the checkpoint target, record one uninterrupted attempt, and keep the result even when it does not pass. Add one named articulation at a time: a connected grace, a short release, or a clear accent. Make the gesture small enough to remain repeatable.",
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
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
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
        "body": "Open the practice material on this page and choose Sustained hold or Simple Gifts. Hear the reference, choose a comfortable key, then stop it before singing. The reading Breath: support versus pressure is listed there too.",
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
        "listen": "The four recordings form an audible progression while pitch stays centered."
      },
      {
        "title": "Hear the distinction",
        "body": "Make two brief, comfortable examples of the idea in “Dynamics Without Pushing.” Change only the named variable. Record both contrast examples in one take with a quiet breath between them, then return to the easier baseline. Record your takes in the recorder. Create four audible levels by changing breath-energy and resonance gradually, not by squeezing the throat. Keep each sample short.",
        "look": "Posture and microphone distance stay constant; the louder attempts do not add a lifted chin or locked neck.",
        "listen": "The four recordings form an audible progression while pitch stays centered."
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
        "recovery": "If louder means tighter or sharper, return to the easiest level, reduce the target contrast, and stop if discomfort appears."
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
        "The four recordings form an audible progression while pitch stays centered.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If louder means tighter or sharper, return to the easiest level, reduce the target contrast, and stop if discomfort appears. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
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
        "body": "Open the practice material on this page and choose Sustained hold or Simple Gifts. Hear the reference, choose a comfortable key, then stop it before singing. The reading Breath: support versus pressure is listed there too.",
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
        "listen": "The four recordings form an audible progression while pitch stays centered."
      },
      {
        "title": "Build the song from phrases",
        "body": "Mark the key, breaths, range edges, and lesson target before a full take of “Dynamic Ballad.” Rehearse the hardest phrase alone, join two phrases, then record one uninterrupted form. Create four audible levels by changing breath-energy and resonance gradually, not by squeezing the throat. Keep each sample short.",
        "look": "Posture and microphone distance stay constant; the louder attempts do not add a lifted chin or locked neck.",
        "listen": "The four recordings form an audible progression while pitch stays centered."
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
        "recovery": "If louder means tighter or sharper, return to the easiest level, reduce the target contrast, and stop if discomfort appears."
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
        "The four recordings form an audible progression while pitch stays centered.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If louder means tighter or sharper, return to the easiest level, reduce the target contrast, and stop if discomfort appears. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
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
        "body": "Open the practice material on this page and choose Sustained hold or Simple Gifts. Hear the reference, choose a comfortable key, then stop it before singing. The reading Breath: support versus pressure is listed there too.",
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
        "listen": "The four recordings form an audible progression while pitch stays centered."
      },
      {
        "title": "Make one evidence take",
        "body": "State the checkpoint target, record one uninterrupted attempt, and keep the result even when it does not pass. Create four audible levels by changing breath-energy and resonance gradually, not by squeezing the throat. Keep each sample short.",
        "look": "Posture and microphone distance stay constant; the louder attempts do not add a lifted chin or locked neck.",
        "listen": "The four recordings form an audible progression while pitch stays centered."
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
        "recovery": "If louder means tighter or sharper, return to the easiest level, reduce the target contrast, and stop if discomfort appears."
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
        "The four recordings form an audible progression while pitch stays centered.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If louder means tighter or sharper, return to the easiest level, reduce the target contrast, and stop if discomfort appears. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
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
        "body": "Make two brief, comfortable examples of the idea in “Where Your Voice Changes Gear.” Change only the named variable. Record both contrast examples in one take with a quiet breath between them, then return to the easier baseline. Record your takes in the recorder. Approach the transition from below and above on a hum or narrow vowel. Mark a zone, not a single magic pitch, and compare it with the published zone for your estimated category.",
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
        "body": "Work in short repetitions with a normal breath and complete release between them. Approach the transition from below and above on a hum or narrow vowel. Mark a zone, not a single magic pitch, and compare it with the published zone for your estimated category.",
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
        "body": "State the checkpoint target, record one uninterrupted attempt, and keep the result even when it does not pass. Approach the transition from below and above on a hum or narrow vowel. Mark a zone, not a single magic pitch, and compare it with the published zone for your estimated category.",
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
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
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
        "body": "Make two brief, comfortable examples of the idea in “Change the Vowel, Keep the Word.” Change only the named variable. Record both contrast examples in one take with a quiet breath between them, then return to the easier baseline. Record your takes in the recorder. Narrow or shade the vowel only enough to keep the crossing easy while preserving the word. Compare modified and unmodified attempts at the same pitch and volume.",
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
        "body": "State the checkpoint target, record one uninterrupted attempt, and keep the result even when it does not pass. Narrow or shade the vowel only enough to keep the crossing easy while preserving the word. Compare modified and unmodified attempts at the same pitch and volume.",
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
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
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
        "body": "Record an easy baseline phrase at fixed microphone distance and moderate input gain. Use the same pitch, vowel, and duration for comparisons.",
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
        "body": "Make two brief, comfortable examples of the idea in “Louder by Resonance, Not by Force.” Change only the named variable. Record both contrast examples in one take with a quiet breath between them, then return to the easier baseline. Record your takes in the recorder. Add a bright, focused ring with less effort than a shout. Change resonance before volume, and keep each attempt short.",
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
        "recovery": "If brightness comes only with pressure, back down to the baseline, use a lighter nasal consonant onset, and stop if the voice feels irritated."
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
      "ifNotReady": "If brightness comes only with pressure, back down to the baseline, use a lighter nasal consonant onset, and stop if the voice feels irritated. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
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
        "body": "Record an easy baseline phrase at fixed microphone distance and moderate input gain. Use the same pitch, vowel, and duration for comparisons.",
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
        "body": "Work in short repetitions with a normal breath and complete release between them. Add a bright, focused ring with less effort than a shout. Change resonance before volume, and keep each attempt short. Record the easy baseline and brighter example in one take with a quiet breath between them, so saving does not replace the sound you need to compare.",
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
        "recovery": "If brightness comes only with pressure, back down to the baseline, use a lighter nasal consonant onset, and stop if the voice feels irritated."
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
      "ifNotReady": "If brightness comes only with pressure, back down to the baseline, use a lighter nasal consonant onset, and stop if the voice feels irritated. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
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
    "objective": "compared two easy tones on the same pitch and described a change in brightness by ear. This is a listening and reflection check.",
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
        "body": "Record an easy baseline phrase at fixed microphone distance and moderate input gain. Use the same pitch, vowel, and duration for comparisons.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Resonance over force",
        "body": "Level rises, throat stays free. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Input gain and distance stay fixed so the comparison is within your own takes; the neck and jaw do not visibly brace.",
        "listen": "The second example in the same recording carries more brightness without sounding pressed or simply louder at the microphone."
      },
      {
        "title": "Make one evidence take",
        "body": "State the checkpoint target, record one uninterrupted attempt, and keep the result even when it does not pass. Add a bright, focused ring with less effort than a shout. Change resonance before volume, and keep each attempt short. Record the easy baseline and brighter example in one take with a quiet breath between them, so saving does not replace the sound you need to compare.",
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
        "recovery": "If brightness comes only with pressure, back down to the baseline, use a lighter nasal consonant onset, and stop if the voice feels irritated."
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
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If brightness comes only with pressure, back down to the baseline, use a lighter nasal consonant onset, and stop if the voice feels irritated. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
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
    "objective": "Belt and shout sound similar for about two seconds. Then one of them stops.",
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
        "body": "Open the practice material on this page and choose Wee from the fifth or Legato triad. Hear the reference, choose a comfortable key, then stop it before singing. The reading Registers, and why they exist is listed there too.",
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
        "body": "Belt and shout sound similar for about two seconds. Then one of them stops. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The chin stays level, the jaw remains available, and the pitch does not require a raised chest or rigid neck.",
        "listen": "The tone stays clear and repeatable for the planned short hold, with an easy release and no rasp that persists afterward."
      },
      {
        "title": "Hear the distinction",
        "body": "Make two brief, comfortable examples of the idea in “The Difference You Can Hear.” Change only the named variable. Record both contrast examples in one take with a quiet breath between them, then return to the easier baseline. Record your takes in the recorder. Build a speech-like mix at moderate intensity before moving upward by semitone. Never chase a belt label by adding throat pressure.",
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
      "ifNotReady": "Stop immediately for pain, burning, sudden hoarseness, loss of range, or effort that lingers. Resume another day or work with a qualified teacher; do not repeat to prove toughness. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
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
    "type": "song",
    "minutes": 6,
    "objective": "A short supplied pattern that crosses your transition zone — pick the key that puts it there.",
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
        "body": "Open the practice material on this page and choose Wee from the fifth or Legato triad. Hear the reference, choose a comfortable key, then stop it before singing. The reading Registers, and why they exist is listed there too.",
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
        "body": "Mark the key, breaths, range edges, and lesson target before a full take of the supplied pattern, Wee from the fifth or Legato triad. Rehearse the hardest part alone, join two repetitions, then record one uninterrupted take. Build a speech-like mix at moderate intensity before moving upward by semitone. Never chase a belt label by adding throat pressure.",
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
      "ifNotReady": "Stop immediately for pain, burning, sudden hoarseness, loss of range, or effort that lingers. Resume another day or work with a qualified teacher; do not repeat to prove toughness. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
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
    "objective": "tried the supplied short pattern gently, returned to an easy baseline, and noted my own effort. This is a listening and reflection check.",
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
        "body": "Open the practice material on this page and choose Wee from the fifth or Legato triad. Hear the reference, choose a comfortable key, then stop it before singing. The reading Registers, and why they exist is listed there too.",
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
        "body": "State the checkpoint target, record one uninterrupted attempt, and keep the result even when it does not pass. Build a speech-like mix at moderate intensity before moving upward by semitone. Never chase a belt label by adding throat pressure.",
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
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "Stop immediately for pain, burning, sudden hoarseness, loss of range, or effort that lingers. Resume another day or work with a qualified teacher; do not repeat to prove toughness. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
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
        "body": "Make two brief, comfortable examples of the idea in “Improvising Is Answering.” Change only the named variable. Record both contrast examples in one take with a quiet breath between them, then return to the easier baseline. Record your takes in the recorder. Answer a short call, leave space, then vary one element—rhythm, direction, or ending—while keeping the same key center. For a concrete starting call, sing 1 on beat 1, 2 on beat 2, 3 on beat 3, and rest on beat 4. Answer with 3, 2, 1, rest in bar 2. Vary one rhythm in bar 3, then end on 1 in bar 4. Once that is familiar, invent a different answer from the same note set. Record call and answer together in one take.",
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
    "objective": "used notes from the supplied pattern to invent a short answer with a clear beginning and ending. This is a listening and reflection check.",
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
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
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
        "body": "Open the practice material on this page and choose Small three-note climb; Agility run, a five-note scale, is the step up once three notes are clean. Hear the reference, choose a comfortable key, then stop it before singing. The reading Weeks 3 and 4: the middle voice is listed there too.",
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
        "body": "Make two brief, comfortable examples of the idea in “A Run Is a Scale in a Hurry.” Change only the named variable. Record both contrast examples in one take with a quiet breath between them, then return to the easier baseline. Record your takes in the recorder. Increase tempo only after every note is distinct. Keep the first and last pitch centered instead of sacrificing them for speed.",
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
        "body": "Open the practice material on this page and choose Small three-note climb; Agility run, a five-note scale, is the step up once three notes are clean. Hear the reference, choose a comfortable key, then stop it before singing. The reading Weeks 3 and 4: the middle voice is listed there too.",
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
    "objective": "isolated the existing agility pattern slowly and connected its notes without rushing by my own listening judgment. This is a listening and reflection check.",
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
        "body": "Open the practice material on this page and choose Small three-note climb; Agility run, a five-note scale, is the step up once three notes are clean. Hear the reference, choose a comfortable key, then stop it before singing. The reading Weeks 3 and 4: the middle voice is listed there too.",
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
        "body": "State the checkpoint target, record one uninterrupted attempt, and keep the result even when it does not pass. Increase tempo only after every note is distinct. Keep the first and last pitch centered instead of sacrificing them for speed.",
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
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
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
        "body": "Make two brief, comfortable examples of the idea in “One Syllable, Many Notes.” Change only the named variable. Record both contrast examples in one take with a quiet breath between them, then return to the easier baseline. Record your takes in the recorder. Keep the vowel stable while the pitch changes. Reverse the pattern only after the forward direction has four clear notes.",
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
    "objective": "sang the supplied four-note descent on one syllable, then listened for four separate pitch centers. This is a listening and reflection check.",
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
        "body": "State the checkpoint target, record one uninterrupted attempt, and keep the result even when it does not pass. Keep the vowel stable while the pitch changes. Reverse the pattern only after the forward direction has four clear notes.",
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
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
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
        "body": "Open the practice material on this page and choose Sustained hold. Hear the reference, choose a comfortable key, then stop it before singing. The reading A vocabulary for tone is listed there too.",
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
        "body": "Make two brief, comfortable examples of the idea in “Rate, Extent, Onset.” Change only the named variable. Record both contrast examples in one take with a quiet breath between them, then return to the easier baseline. Record your takes in the recorder. Invite an even vibrato rather than shaking the jaw or pulsing the abdomen. Return deliberately to straight tone and release.",
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
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Vibrato rate, extent, onset time, healthy production, or a five-to-seven-hertz result; the app does not analyze vibrato."
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
        "body": "Open the practice material on this page and choose Sustained hold. Hear the reference, choose a comfortable key, then stop it before singing. The reading A vocabulary for tone is listed there too.",
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
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Vibrato rate, extent, onset time, healthy production, or a five-to-seven-hertz result; the app does not analyze vibrato."
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
    "objective": "Heard and held, not scored. Nothing measures vibrato rate yet, so this one is your ear and your recording.",
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
        "body": "Open the practice material on this page and choose Sustained hold. Hear the reference, choose a comfortable key, then stop it before singing. The reading A vocabulary for tone is listed there too.",
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
        "body": "Heard and held, not scored. Nothing measures vibrato rate yet, so this one is your ear and your recording. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Keep the supplied reference or reading visible, settle your posture, and use only a pitch and duration you can repeat comfortably.",
        "listen": "The vibrato begins and ends on cue and sounds even rather than becoming a wide uncontrolled wobble."
      },
      {
        "title": "Make one evidence take",
        "body": "State the checkpoint target, record one uninterrupted attempt, and keep the result even when it does not pass. Invite an even vibrato rather than shaking the jaw or pulsing the abdomen. Return deliberately to straight tone and release.",
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
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If oscillation appears only through shaking or pressure, return to straight tone, shorten the hold, and work with a teacher before adding speed. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I compared straight tone with naturally occurring vibrato, without shaking the jaw or manufacturing a wobble. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Vibrato rate, extent, onset time, healthy production, or a five-to-seven-hertz result; the app does not analyze vibrato."
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
        "body": "Make two brief, comfortable examples of the idea in “Four Ornaments, Named.” Change only the named variable. Record both contrast examples in one take with a quiet breath between them, then return to the easier baseline. Record your takes in the recorder. Add one ornament at its marked place, return to plain, then contrast it with the next. Keep scoops, falls, bends, and slides small and intentional.",
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
        "body": "Work in short repetitions with a normal breath and complete release between them. Add one ornament at its marked place, return to plain, then contrast it with the next. Keep scoops, falls, bends, and slides small and intentional.",
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
        "body": "All four, correctly placed. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Each gesture begins and ends on the planned notes instead of moving the whole phrase out of key.",
        "listen": "The four versions are recognizably different and the underlying words and melody remain intact."
      },
      {
        "title": "Make one evidence take",
        "body": "State the checkpoint target, record one uninterrupted attempt, and keep the result even when it does not pass. Add one ornament at its marked place, return to plain, then contrast it with the next. Keep scoops, falls, bends, and slides small and intentional.",
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
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
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
        "body": "Make two brief, comfortable examples of the idea in “The Notes That Sound Like Feeling.” Change only the named variable. Record both contrast examples in one take with a quiet breath between them, then return to the easier baseline. Record your takes in the recorder. Use blue thirds and sevenths as deliberate destinations, not pitches reached by accidental flatness. Leave space and repeat a motif before varying it. Begin with a two-bar call: sing 1, flat 3, 5, rest, then 5, flat 3, 1, rest, one event per tapped beat. Answer with flat 7 below the tonic, 1, flat 3, rest, then flat 3, 1, 1, rest. Repeat those four bars with one rhythmic change to make eight. Pitch every note from the tonic you just heard; transpose the whole exercise if it sits too low or too high. Record the call and answer together in one take.",
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
    "objective": "used the supplied minor and pentatonic patterns to make my own short answering phrases. This is a listening and reflection check.",
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
        "body": "Rung two of the ladder. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
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
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
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
        "body": "Open the practice material on this page and choose Deep River or Amazing Grace (Verse 1 & 2). Hear the reference, choose a comfortable key, then stop it before singing. The reading Transposition without shame is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Transpose the supplied study so both ends remain repeatable. Mark each ornament and the phrase that crosses the widest interval.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Extended-range repertoire",
        "body": "Range and agility at the same time, which is the actual difficulty. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The melody fits the scan and every ornament has a written location; no phrase depends on a last-second reach.",
        "listen": "The full take keeps the authored melody recognizable and the planned ornaments audible."
      },
      {
        "title": "Hear the distinction",
        "body": "Make two brief, comfortable examples of the idea in “Range and Ornaments in a Short Phrase.” Change only the named variable. Record both contrast examples in one take with a quiet breath between them, then return to the easier baseline. Record your takes in the recorder. Rehearse the range, ornament, and continuity demands separately before combining them. Keep the top lighter rather than louder.",
        "look": "The melody fits the scan and every ornament has a written location; no phrase depends on a last-second reach.",
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
        "body": "Open the practice material on this page and choose Deep River or Amazing Grace (Verse 1 & 2). Hear the reference, choose a comfortable key, then stop it before singing. The reading Transposition without shame is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Transpose the supplied study so both ends remain repeatable. Mark each ornament and the phrase that crosses the widest interval.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Extended-range repertoire",
        "body": "Choose a comfortable key for the supplied phrase, then add one familiar small ornament and compare by ear. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The melody fits the scan and every ornament has a written location; no phrase depends on a last-second reach.",
        "listen": "The full take keeps the authored melody recognizable and the planned ornaments audible."
      },
      {
        "title": "Build the song from phrases",
        "body": "Mark the key, breaths, range edges, and lesson target before a full take of “supplied study.” Rehearse the hardest phrase alone, join two phrases, then record one uninterrupted form. Rehearse the range, ornament, and continuity demands separately before combining them. Keep the top lighter rather than louder.",
        "look": "The melody fits the scan and every ornament has a written location; no phrase depends on a last-second reach.",
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
    "objective": "rehearsed the supplied phrase and study arrangement in a comfortable key, isolating one ornament before adding it. This is a listening and reflection check.",
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
        "body": "Open the practice material on this page and choose Deep River or Amazing Grace (Verse 1 & 2). Hear the reference, choose a comfortable key, then stop it before singing. The reading Transposition without shame is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Transpose the supplied study so both ends remain repeatable. Mark each ornament and the phrase that crosses the widest interval.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Extended-range repertoire",
        "body": "Review your supplied study and describe which small ornament stayed clear. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The melody fits the scan and every ornament has a written location; no phrase depends on a last-second reach.",
        "listen": "The full take keeps the authored melody recognizable and the planned ornaments audible."
      },
      {
        "title": "Make one evidence take",
        "body": "State the checkpoint target, record one uninterrupted attempt, and keep the result even when it does not pass. Rehearse the range, ornament, and continuity demands separately before combining them. Keep the top lighter rather than louder.",
        "look": "The melody fits the scan and every ornament has a written location; no phrase depends on a last-second reach.",
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
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
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
        "title": "Hear the distinction",
        "body": "Make two brief, comfortable examples of the idea in “Hydration, Humidity, and Why Whispering Hurts.” Change only the named variable. Record both contrast examples in one take with a quiet breath between them, then return to the easier baseline. Record your takes in the recorder. Build a short sequence from gentle semi-occluded sound, comfortable range movement, and the day's specific task. Stop before fatigue changes the sound.",
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
        "recovery": "If symptoms persist, reduce voice use and seek advice from a qualified clinician. The app and this checklist do not diagnose or clear a voice for continued use."
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
      "ifNotReady": "If symptoms persist, reduce voice use and seek advice from a qualified clinician. The app and this checklist do not diagnose or clear a voice for continued use. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
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
        "recovery": "If symptoms persist, reduce voice use and seek advice from a qualified clinician. The app and this checklist do not diagnose or clear a voice for continued use."
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
      "ifNotReady": "If symptoms persist, reduce voice use and seek advice from a qualified clinician. The app and this checklist do not diagnose or clear a voice for continued use. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
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
    "objective": "assembled a short warm-up with rests and wrote the warning signs that would make me stop. This is a listening and reflection check.",
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
        "body": "Review this module before effect study. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "Keep the supplied reference or reading visible, settle your posture, and use only a pitch and duration you can repeat comfortably.",
        "listen": "The voice feels and sounds at least as easy after the routine as before it. Persistent hoarseness or pain is a reason to stop, not warm up harder."
      },
      {
        "title": "Make one evidence take",
        "body": "State the checkpoint target, record one uninterrupted attempt, and keep the result even when it does not pass. Build a short sequence from gentle semi-occluded sound, comfortable range movement, and the day's specific task. Stop before fatigue changes the sound.",
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
        "recovery": "If symptoms persist, reduce voice use and seek advice from a qualified clinician. The app and this checklist do not diagnose or clear a voice for continued use."
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
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If symptoms persist, reduce voice use and seek advice from a qualified clinician. The app and this checklist do not diagnose or clear a voice for continued use. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
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
        "body": "Open the practice material on this page and choose Amazing Grace (Verse 1 & 2) or Simple Gifts. Hear the reference, choose a comfortable key, then stop it before singing. The reading How to borrow a voice is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Choose one well-learned song in a comfortable key so pitch and words do not consume the whole task. Name two style rooms before singing.",
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
        "body": "Make two brief, comfortable examples of the idea in “Style Is a Set of Choices, Not a Sound.” Change only the named variable. Record both contrast examples in one take with a quiet breath between them, then return to the easier baseline. Record your takes in the recorder. Change onset, diction, vibrato amount, rhythmic placement, and phrase shape deliberately while keeping the melody recognizable.",
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
        "body": "Open the practice material on this page and choose Amazing Grace (Verse 1 & 2) or Simple Gifts. Hear the reference, choose a comfortable key, then stop it before singing. The reading How to borrow a voice is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Choose one well-learned song in a comfortable key so pitch and words do not consume the whole task. Name two style rooms before singing.",
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
        "body": "Mark the key, breaths, range edges, and lesson target before a full take of “Same Song, Two Rooms.” Rehearse the hardest phrase alone, join two phrases, then record one uninterrupted form. Change onset, diction, vibrato amount, rhythmic placement, and phrase shape deliberately while keeping the melody recognizable. Choose a phrase short enough to sing both treatments in one take within two minutes. Leave a quiet breath between them. Record your takes in the recorder.",
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
        "body": "Open the practice material on this page and choose Amazing Grace (Verse 1 & 2) or Simple Gifts. Hear the reference, choose a comfortable key, then stop it before singing. The reading How to borrow a voice is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "Synthesized pitches supply the notes; they are not recordings of a singer demonstrating a technique."
      },
      {
        "title": "Set a safe baseline",
        "body": "Choose one well-learned song in a comfortable key so pitch and words do not consume the whole task. Name two style rooms before singing.",
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
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
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
    "objective": "Four production choices, decoupled from pitch height. Any of them can happen anywhere in your range.",
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
        "body": "Use one mid-range phrase at moderate volume and establish a neutral baseline. Define the three intended weights in words before recording.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Weight and mode switching",
        "body": "Four production choices, decoupled from pitch height. Any of them can happen anywhere in your range. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The same phrase, key, and tempo are used; the jaw, neck, and chin remain available in every version.",
        "listen": "Three repeatable weights are audible on cue without persistent rasp, pressure, or loss of range afterward."
      },
      {
        "title": "Hear the distinction",
        "body": "Make two brief, comfortable examples of the idea in “Neutral, Restrained, Driven, Edged.” Change only the named variable. Record both contrast examples in one take with a quiet breath between them, then return to the easier baseline. Record your takes in the recorder. Change vocal weight without moving the pitch or using loudness as the only cue. Return to neutral between every attempt.",
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
        "body": "Use one mid-range phrase at moderate volume and establish a neutral baseline. Define the three intended weights in words before recording.",
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
    "objective": "Called at random, with a return to easy neutral voice between attempts. Strain is not measured.",
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
        "body": "Use one mid-range phrase at moderate volume and establish a neutral baseline. Define the three intended weights in words before recording.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Weight and mode switching",
        "body": "Called at random, with a return to easy neutral voice between attempts. Strain is not measured. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The same phrase, key, and tempo are used; the jaw, neck, and chin remain available in every version.",
        "listen": "Three repeatable weights are audible on cue without persistent rasp, pressure, or loss of range afterward."
      },
      {
        "title": "Make one evidence take",
        "body": "State the checkpoint target, record one uninterrupted attempt, and keep the result even when it does not pass. Change vocal weight without moving the pitch or using loudness as the only cue. Return to neutral between every attempt.",
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
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
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
    "prerequisites": [
      "v-l7-m3-08"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and read The safety rail. Use its written exercise and stop rules. The reading The safety rail is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "For the breathing or planning task, follow the written exercise; you do not need to make a pitched sound."
      },
      {
        "title": "Set a safe baseline",
        "body": "Do not learn a growl, scream, distortion, or other new effect from written directions. If a qualified teacher has already taught you an effect and it remains easy today, you may review that existing technique briefly; otherwise make this an observation-and-planning session without producing the effect.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Creak, growl, slide, scream",
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
        "recovery": "Stop for pain, rawness, sudden hoarseness, loss of range, extra effort in speech, or a changed speaking voice. Do not troubleshoot by repeating; rest and seek an ENT or voice-specialized speech-language pathologist when symptoms persist."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “What a Growl Actually Is.”"
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
      "ifNotReady": "Stop for pain, rawness, sudden hoarseness, loss of range, extra effort in speech, or a changed speaking voice. Do not troubleshoot by repeating; rest and seek an ENT or voice-specialized speech-language pathologist when symptoms persist. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
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
    "objective": "Short bursts, with a hard stop the moment it tightens.",
    "prerequisites": [
      "v-l7-m4-01"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and read The safety rail. Use its written exercise and stop rules. The reading The safety rail is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "For the breathing or planning task, follow the written exercise; you do not need to make a pitched sound."
      },
      {
        "title": "Set a safe baseline",
        "body": "Do not learn a growl, scream, distortion, or other new effect from written directions. If a qualified teacher has already taught you an effect and it remains easy today, you may review that existing technique briefly; otherwise make this an observation-and-planning session without producing the effect.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Creak, growl, slide, scream",
        "body": "Short bursts, with a hard stop the moment it tightens. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
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
        "recovery": "Stop for pain, rawness, sudden hoarseness, loss of range, extra effort in speech, or a changed speaking voice. Do not troubleshoot by repeating; rest and seek an ENT or voice-specialized speech-language pathologist when symptoms persist."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 60,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Effects: Listening and a Stop Plan.”"
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
      "ifNotReady": "Stop for pain, rawness, sudden hoarseness, loss of range, extra effort in speech, or a changed speaking voice. Do not troubleshoot by repeating; rest and seek an ENT or voice-specialized speech-language pathologist when symptoms persist. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
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
    "objective": "read the safety material and wrote a stop plan; I did not attempt to learn a new vocal effect from an app. This is a listening and reflection check.",
    "prerequisites": [
      "v-l7-m4-04"
    ],
    "references": [
      "nidcd-voice-care",
      "asha-voice-disorders"
    ],
    "steps": [
      {
        "title": "Use the practice material",
        "body": "Open the practice material on this page and read The safety rail. Use its written exercise and stop rules. The reading The safety rail is listed there too.",
        "look": "The exercise, song or chapter is open. Your chosen range remains comfortable.",
        "listen": "For the breathing or planning task, follow the written exercise; you do not need to make a pitched sound."
      },
      {
        "title": "Set a safe baseline",
        "body": "Do not learn a growl, scream, distortion, or other new effect from written directions. If a qualified teacher has already taught you an effect and it remains easy today, you may review that existing technique briefly; otherwise make this an observation-and-planning session without producing the effect.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Creak, growl, slide, scream",
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
        "recovery": "Stop for pain, rawness, sudden hoarseness, loss of range, extra effort in speech, or a changed speaking voice. Do not troubleshoot by repeating; rest and seek an ENT or voice-specialized speech-language pathologist when symptoms persist."
      },
      {
        "observation": "The reference and your own sound seem different, or you cannot judge the result.",
        "recovery": "Treat the reading as missing, not as a pass or failure. Stop reference audio, restore a quiet setup, make one easier fresh attempt, and keep the human listening judgment separate from the measurement."
      }
    ],
    "blocks": [
      {
        "seconds": 45,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Self-Check: Your Effects Stop Plan.”"
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
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "Stop for pain, rawness, sudden hoarseness, loss of range, extra effort in speech, or a changed speaking voice. Do not troubleshoot by repeating; rest and seek an ENT or voice-specialized speech-language pathologist when symptoms persist. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
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
        "body": "Warm up in the comfortable middle, then confirm today's repeatable low and high notes before approaching either edge.",
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
        "body": "Make two brief, comfortable examples of the idea in “Range Grows at the Edges, Slowly.” Change only the named variable. Record both contrast examples in one take with a quiet breath between them, then return to the easier baseline. Record your takes in the recorder. Move one semitone beyond the prior comfortable endpoint at low-to-moderate volume, hold briefly, release, and rescan only after rest.",
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
      "ifNotReady": "If the semitone is not easy today, keep the previous endpoint. Stop for discomfort or persistent voice change and do not count an extreme as progress. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
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
    "objective": "Extend, hold, rescan. Open the range tool yourself when you want to compare another comfortable scan.",
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
        "body": "Warm up in the comfortable middle, then confirm today's repeatable low and high notes before approaching either edge.",
        "look": "Posture, room, device, and the planned stop rule are settled before the first attempt.",
        "listen": "Begin from an easy, repeatable sound; silence playback before judging your own voice."
      },
      {
        "title": "Name the target: Range extension",
        "body": "Extend, hold, rescan. Open the range tool yourself when you want to compare another comfortable scan. Say what will count as complete in this lesson before practising, and keep the attempt inside the range and duration you can repeat comfortably.",
        "look": "The added note is reached without a lifted chin, collapsed posture, or a different microphone setup that could distort the comparison.",
        "listen": "The new endpoint sounds like a usable sung note and can be repeated, not a breathy touch or forced shout reached once."
      },
      {
        "title": "Alternate attempt and reset",
        "body": "Work in short repetitions with a normal breath and complete release between them. Move one semitone beyond the prior comfortable endpoint at low-to-moderate volume, hold briefly, release, and rescan only after rest.",
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
        "seconds": 60,
        "instruction": "Open the practice material. Prepare the room, body, and safe baseline for “Semitone at a Time.”"
      },
      {
        "seconds": 105,
        "instruction": "Isolate the range extension target in short, comfortable examples."
      },
      {
        "seconds": 165,
        "instruction": "Practise or record the complete “Semitone at a Time” task, resetting between attempts."
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
      "ifNotReady": "If the semitone is not easy today, keep the previous endpoint. Stop for discomfort or persistent voice change and do not count an extreme as progress. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
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
    "objective": "compared comfortable notes with an earlier baseline and recorded my observation without forcing an extension. This is a listening and reflection check.",
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
        "body": "Warm up in the comfortable middle, then confirm today's repeatable low and high notes before approaching either edge.",
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
        "body": "State the checkpoint target, record one uninterrupted attempt, and keep the result even when it does not pass. Move one semitone beyond the prior comfortable endpoint at low-to-moderate volume, hold briefly, release, and rescan only after rest.",
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
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If the semitone is not easy today, keep the previous endpoint. Stop for discomfort or persistent voice change and do not count an extreme as progress. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
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
        "body": "Open the practice material on this page and choose Amazing Grace (Verse 1 & 2) or Home on the Range (Verse & Chorus). Hear the reference, choose a comfortable key, then stop it before singing. The reading Building a set you can survive is listed there too.",
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
        "title": "Name the target: Performance and harmony",
        "body": "Rehearse the displayed melody alone. Record two short examples in one take at different comfortable microphone distances, keeping the phrase and volume similar. Leave a quiet gap while changing distance so handling noise is separate; record your takes in the recorder. Listen for clarity before attempting a longer study.",
        "look": "The displayed study contains one melody line. Keep the microphone position consistent within each comparison.",
        "listen": "The phrase remains understandable from its first entry to its final release."
      },
      {
        "title": "Hear the distinction",
        "body": "Rehearse the displayed melody alone. Record two short examples in one take at different comfortable microphone distances, keeping the phrase and volume similar. Leave a quiet gap while changing distance so handling noise is separate; record your takes in the recorder. Listen for clarity before attempting a longer study.",
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
        "recovery": "If you practise a harmony and it collapses into the melody, stop the reference, sing the harmony alone from its anchor notes, then bring the melody back at lower volume."
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
        "instruction": "Isolate the performance and harmony target in short, comfortable examples."
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
        "On playback, the melody keeps its own contour and the full song remains complete from first entry to release. A harmony line, if you add one, is listening practice: nothing here measures two parts at once.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If you practise a harmony and it collapses into the melody, stop the reference, sing the harmony alone from its anchor notes, then bring the melody back at lower volume. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
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
        "body": "Open the practice material on this page and choose Amazing Grace (Verse 1 & 2) or Home on the Range (Verse & Chorus). Hear the reference, choose a comfortable key, then stop it before singing. The reading Building a set you can survive is listed there too.",
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
        "title": "Name the target: Performance and harmony",
        "body": "Rehearse the displayed melody alone. Record two short examples in one take at different comfortable microphone distances, keeping the phrase and volume similar. Leave a quiet gap while changing distance so handling noise is separate; record your takes in the recorder. Listen for clarity before attempting a longer study.",
        "look": "The displayed study contains one melody line. Keep the microphone position consistent within each comparison.",
        "listen": "The phrase remains understandable from its first entry to its final release."
      },
      {
        "title": "Build the song from phrases",
        "body": "Rehearse the displayed melody alone. Record two short examples in one take at different comfortable microphone distances, keeping the phrase and volume similar. Leave a quiet gap while changing distance so handling noise is separate; record your takes in the recorder. Listen for clarity before attempting a longer study.",
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
        "recovery": "If you practise a harmony and it collapses into the melody, stop the reference, sing the harmony alone from its anchor notes, then bring the melody back at lower volume."
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
        "instruction": "Isolate the performance and harmony target in short, comfortable examples."
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
        "On playback, the melody keeps its own contour and the full song remains complete from first entry to release. A harmony line, if you add one, is listening practice: nothing here measures two parts at once.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If you practise a harmony and it collapses into the melody, stop the reference, sing the harmony alone from its anchor notes, then bring the melody back at lower volume. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
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
    "objective": "rehearsed the supplied study arrangement and compared microphone distance or phrasing on separate takes. This is a listening and reflection check.",
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
        "body": "Open the practice material on this page and choose Amazing Grace (Verse 1 & 2) or Home on the Range (Verse & Chorus). Hear the reference, choose a comfortable key, then stop it before singing. The reading Building a set you can survive is listed there too.",
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
        "title": "Name the target: Performance and harmony",
        "body": "Rehearse the displayed melody alone. Record two short examples in one take at different comfortable microphone distances, keeping the phrase and volume similar. Leave a quiet gap while changing distance so handling noise is separate; record your takes in the recorder. Listen for clarity before attempting a longer study.",
        "look": "The displayed study contains one melody line. Keep the microphone position consistent within each comparison.",
        "listen": "The phrase remains understandable from its first entry to its final release."
      },
      {
        "title": "Make one evidence take",
        "body": "Rehearse the displayed melody alone. Record two short examples in one take at different comfortable microphone distances, keeping the phrase and volume similar. Leave a quiet gap while changing distance so handling noise is separate; record your takes in the recorder. Listen for clarity before attempting a longer study.",
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
        "recovery": "If you practise a harmony and it collapses into the melody, stop the reference, sing the harmony alone from its anchor notes, then bring the melody back at lower volume."
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
        "instruction": "Isolate the performance and harmony target in short, comfortable examples."
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
        "On playback, the melody keeps its own contour and the full song remains complete from first entry to release. A harmony line, if you add one, is listening practice: nothing here measures two parts at once.",
        "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass."
      ],
      "readyWhen": "You can describe the result of the stated task and choose one useful next attempt. Completion is your own practice reflection.",
      "ifNotReady": "If you practise a harmony and it collapses into the melody, stop the reference, sing the harmony alone from its anchor notes, then bring the melody back at lower volume. Repeat a smaller version on another fresh attempt rather than forcing the checkpoint.",
      "shows": "I rehearsed the supplied study arrangement and compared microphone distance or phrasing on separate takes. This is a self-report, not an automatic assessment.",
      "doesNotShow": "An automatic pitch, rhythm, register, tone, or safety result. Two simultaneous vocal parts, harmony accuracy, blend, independence, absence of a register break, or vocal health; the detector returns one fundamental per frame."
    }
  }
];

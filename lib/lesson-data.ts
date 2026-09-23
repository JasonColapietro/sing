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
  }
];

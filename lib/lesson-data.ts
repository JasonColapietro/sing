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
  }
];

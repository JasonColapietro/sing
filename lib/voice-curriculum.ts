import curriculumContract from "@/contracts/suede-voice-curriculum.json";

export interface VoiceLesson {
  readonly id: string;
  readonly title: string;
  readonly type: string;
  readonly minutes: number;
  readonly summary: string;
}

export interface VoiceModule {
  readonly id: string;
  readonly name: string;
  readonly promise: string;
  readonly skill: string;
  readonly proofMetric: string;
  readonly lessonsTotal: number;
  readonly sampleLessonsShown: number;
  readonly lessons: readonly VoiceLesson[];
}

export interface VoiceLevel {
  readonly id: string;
  readonly name: string;
  readonly subtitle: string;
  readonly access: "free" | "paid";
  readonly moduleCount: number;
  readonly lessonCount: number;
  readonly stage: number;
  readonly modules: readonly VoiceModule[];
}

export interface VoiceCurriculumContract {
  readonly contract: "suede-voice-curriculum";
  readonly version: 1;
  readonly ownership: {
    readonly catalogRepository: "JasonColapietro/sing";
    readonly discoveryUrl: "https://sing.suedeai.ai/learn";
    readonly lessonBaseUrl: "https://guitarhub.org/learn/voice";
    readonly decisionDate: "2026-09-14";
    readonly decidedBy: "Jason Colapietro (delegated decision)";
  };
  readonly policies: {
    readonly classifierLabels: readonly [
      "bass",
      "baritone",
      "tenor",
      "contralto",
      "mezzo",
      "soprano",
    ];
    readonly importedSessionCompletion: "historyOnly";
  };
  readonly migration: {
    readonly phase: "discovery";
    readonly redirectsEnabled: false;
    readonly requiredEvidence: readonly [
      "lessonBodies",
      "identity",
      "entitlements",
      "progress",
      "urlParity",
      "vocalReview",
      "deviceAudio",
    ];
  };
  readonly curriculum: {
    readonly track: "voice";
    readonly version: number;
    readonly levels: readonly VoiceLevel[];
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isVoiceLesson(value: unknown): value is VoiceLesson {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.title) &&
    isString(value.type) &&
    isNumber(value.minutes) &&
    isString(value.summary)
  );
}

function isVoiceModule(value: unknown): value is VoiceModule {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.name) &&
    isString(value.promise) &&
    isString(value.skill) &&
    isString(value.proofMetric) &&
    isNumber(value.lessonsTotal) &&
    isNumber(value.sampleLessonsShown) &&
    Array.isArray(value.lessons) &&
    value.lessons.every(isVoiceLesson)
  );
}

function isVoiceLevel(value: unknown): value is VoiceLevel {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.name) &&
    isString(value.subtitle) &&
    (value.access === "free" || value.access === "paid") &&
    isNumber(value.moduleCount) &&
    isNumber(value.lessonCount) &&
    isNumber(value.stage) &&
    Array.isArray(value.modules) &&
    value.modules.every(isVoiceModule)
  );
}

function matchesTuple(
  value: unknown,
  expected: readonly string[],
): value is readonly string[] {
  return (
    Array.isArray(value) &&
    value.length === expected.length &&
    value.every((item, index) => item === expected[index])
  );
}

const CLASSIFIER_LABELS = [
  "bass",
  "baritone",
  "tenor",
  "contralto",
  "mezzo",
  "soprano",
] as const;

const REQUIRED_EVIDENCE = [
  "lessonBodies",
  "identity",
  "entitlements",
  "progress",
  "urlParity",
  "vocalReview",
  "deviceAudio",
] as const;

function isVoiceCurriculumContract(
  value: unknown,
): value is VoiceCurriculumContract {
  if (!isRecord(value)) return false;
  const { ownership, policies, migration, curriculum } = value;
  return (
    value.contract === "suede-voice-curriculum" &&
    value.version === 1 &&
    isRecord(ownership) &&
    ownership.catalogRepository === "JasonColapietro/sing" &&
    ownership.discoveryUrl === "https://sing.suedeai.ai/learn" &&
    ownership.lessonBaseUrl === "https://guitarhub.org/learn/voice" &&
    ownership.decisionDate === "2026-09-14" &&
    ownership.decidedBy === "Jason Colapietro (delegated decision)" &&
    isRecord(policies) &&
    matchesTuple(policies.classifierLabels, CLASSIFIER_LABELS) &&
    policies.importedSessionCompletion === "historyOnly" &&
    isRecord(migration) &&
    migration.phase === "discovery" &&
    migration.redirectsEnabled === false &&
    matchesTuple(migration.requiredEvidence, REQUIRED_EVIDENCE) &&
    isRecord(curriculum) &&
    curriculum.track === "voice" &&
    isNumber(curriculum.version) &&
    Array.isArray(curriculum.levels) &&
    curriculum.levels.every(isVoiceLevel)
  );
}

/**
 * Validate the checked-in JSON at the untyped data boundary before rendering.
 */
export function parseVoiceCurriculum(
  value: unknown,
): VoiceCurriculumContract {
  if (!isVoiceCurriculumContract(value)) {
    throw new Error("Invalid voice curriculum contract");
  }
  return value;
}

export const voiceCurriculum = parseVoiceCurriculum(curriculumContract);

const lessonIds = new Set(
  voiceCurriculum.curriculum.levels.flatMap((level) =>
    level.modules.flatMap((module) =>
      module.lessons.map((lesson) => lesson.id),
    ),
  ),
);

/**
 * Return the temporary lesson host only for a catalogued lesson.
 *
 * This guard matters during the discovery phase: accepting an arbitrary slug
 * would make Sing advertise a GuitarHub route it does not own or know exists.
 */
export function voiceLessonHref(lessonId: string): string {
  if (!lessonIds.has(lessonId)) {
    throw new Error(`Unknown voice lesson ID: ${lessonId}`);
  }
  return `${voiceCurriculum.ownership.lessonBaseUrl}/${lessonId}`;
}

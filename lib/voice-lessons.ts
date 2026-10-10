/**
 * The voice curriculum as sing serves it: the catalog in
 * contracts/suede-voice-curriculum.json, the lesson bodies in
 * lib/lesson-data.ts, and the URLs that join them.
 *
 * Routes are /learn/voice/<stage>/<module>/<lesson>. The segments are the
 * directory and file names under content/lessons, fixed when each lesson was
 * ported, and the catalog IDs stay the identity. A stage or module whose
 * lessons aren't ported yet is still listed, just not linked.
 *
 * Server-side only in practice: importing this pulls in every lesson body.
 */
import { LESSONS, type Lesson } from "@/lib/lesson-data";
import {
  voiceCurriculum,
  type VoiceLesson,
  type VoiceLevel,
  type VoiceModule,
} from "@/lib/voice-curriculum";

export const VOICE_LEARN_PATH = "/learn/voice";

export interface CourseLesson {
  catalog: VoiceLesson;
  /** Absent until the lesson body is ported. */
  body?: Lesson;
  href?: string;
}

export interface CourseModule {
  catalog: VoiceModule;
  slug?: string;
  href?: string;
  lessons: CourseLesson[];
}

export interface CourseStage {
  catalog: VoiceLevel;
  slug?: string;
  href?: string;
  modules: CourseModule[];
}

const bodies = new Map(LESSONS.map((l) => [l.id, l]));

export const lessonHref = (l: Lesson) =>
  `${VOICE_LEARN_PATH}/${l.stageSlug}/${l.moduleSlug}/${l.slug}`;

/** The whole course in catalog order, joined to whatever has been ported. */
export const COURSE: CourseStage[] = voiceCurriculum.curriculum.levels.map(
  (level) => {
    const modules = level.modules.map((module): CourseModule => {
      const lessons = module.lessons.map((catalog): CourseLesson => {
        const body = bodies.get(catalog.id);
        return { catalog, body, href: body ? lessonHref(body) : undefined };
      });
      const first = lessons.find((l) => l.body)?.body;
      return {
        catalog: module,
        lessons,
        slug: first?.moduleSlug,
        href: first
          ? `${VOICE_LEARN_PATH}/${first.stageSlug}/${first.moduleSlug}`
          : undefined,
      };
    });
    const first = modules.flatMap((m) => m.lessons).find((l) => l.body)?.body;
    return {
      catalog: level,
      modules,
      slug: first?.stageSlug,
      href: first ? `${VOICE_LEARN_PATH}/${first.stageSlug}` : undefined,
    };
  },
);

export const PORTED_LESSON_COUNT = LESSONS.length;
export const CATALOG_LESSON_COUNT = COURSE.flatMap((s) =>
  s.modules.flatMap((m) => m.lessons),
).length;

export function findStage(stageSlug: string): CourseStage | undefined {
  return COURSE.find((s) => s.slug === stageSlug);
}

export function findModule(
  stageSlug: string,
  moduleSlug: string,
): { stage: CourseStage; module: CourseModule } | undefined {
  const stage = findStage(stageSlug);
  const mod = stage?.modules.find((m) => m.slug === moduleSlug);
  return stage && mod ? { stage, module: mod } : undefined;
}

export function findLesson(
  stageSlug: string,
  moduleSlug: string,
  lessonSlug: string,
):
  | { stage: CourseStage; module: CourseModule; lesson: CourseLesson & { body: Lesson } }
  | undefined {
  const found = findModule(stageSlug, moduleSlug);
  const lesson = found?.module.lessons.find((l) => l.body?.slug === lessonSlug);
  if (!found || !lesson?.body) return undefined;
  return { ...found, lesson: { ...lesson, body: lesson.body } };
}

/** The ported lessons either side of this one, across module and stage boundaries. */
export function neighbours(id: string): { previous?: Lesson; next?: Lesson } {
  const i = LESSONS.findIndex((l) => l.id === id);
  return { previous: LESSONS[i - 1], next: LESSONS[i + 1] };
}

export function lessonById(id: string): Lesson | undefined {
  return bodies.get(id);
}

/** Every ported page, for generateStaticParams and the sitemap. */
export function coursePaths(): {
  stages: string[];
  modules: string[];
  lessons: string[];
} {
  return {
    stages: COURSE.flatMap((s) => (s.href ? [s.href] : [])),
    modules: COURSE.flatMap((s) => s.modules.flatMap((m) => (m.href ? [m.href] : []))),
    lessons: LESSONS.map(lessonHref),
  };
}

/** "Room setup and clean input" → "room setup and clean input", for mid-sentence use. */
export function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

/** Lessons in a stage, from the catalog, so the count matches what the stage lists. */
export function stageLessonCount(stage: CourseStage): number {
  return stage.modules.reduce((n, m) => n + m.lessons.length, 0);
}

/** Minutes across a module's lessons, from the catalog. */
export function moduleMinutes(module: CourseModule): number {
  return module.lessons.reduce((n, l) => n + l.catalog.minutes, 0);
}

/** The modules either side of this one across the whole course, for sideways links. */
export function moduleNeighbours(module: CourseModule): {
  previous?: CourseModule;
  next?: CourseModule;
} {
  const all = COURSE.flatMap((s) => s.modules).filter((m) => m.href);
  const i = all.indexOf(module);
  return { previous: i > 0 ? all[i - 1] : undefined, next: all[i + 1] };
}

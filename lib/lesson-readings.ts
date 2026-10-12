/**
 * The free voice-course modules that list a chapter as reading: the way back
 * from a book or atlas chapter to the lessons that cite it, so a chapter is
 * not the end of the road for someone who found it first, and a locked page a
 * lesson's reading link lands on is not "pay or go back".
 *
 * Server-side only in practice: it reads COURSE, and importing
 * lib/voice-lessons.ts pulls in every lesson body. lib/lesson-practice.ts
 * stays free of that import so a client component can read its tables.
 */
import { MODULE_PRACTICE } from "@/lib/lesson-practice";
import { COURSE } from "@/lib/voice-lessons";

export interface ChapterLesson {
  href: string;
  name: string;
  skill: string;
}

/**
 * Modules whose readings include `reading`, in curriculum order: a book slug
 * ("registers") or `atlas:<slug>` for an atlas chapter.
 */
export function freeLessonsReading(reading: string): ChapterLesson[] {
  const modules = COURSE.filter((s) => s.catalog.access === "free").flatMap((s) => s.modules);
  return Object.entries(MODULE_PRACTICE)
    .filter(([, practice]) => practice.readings.includes(reading))
    .flatMap(([id]) => {
      const m = modules.find((x) => x.catalog.id === id);
      return m?.href ? [{ href: m.href, name: m.catalog.name, skill: m.catalog.skill }] : [];
    });
}

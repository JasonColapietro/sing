import Link from "next/link";
import type { ChapterLesson } from "@/lib/lesson-readings";
import { SectionLabel } from "@/components/ui";

/**
 * "Lessons that use this chapter", on book and atlas chapter pages,
 * locked or free, and "Free lessons that use this song" on the songbook pages
 * a lesson practises on. Built from lib/lesson-readings.ts on the server.
 */
export function LessonList({
  lessons,
  label = "Lessons that use this chapter",
}: {
  lessons: ChapterLesson[];
  label?: string;
}) {
  return (
    <>
      <SectionLabel>{label}</SectionLabel>
      <ul className="mt-3 space-y-2">
        {lessons.map((l) => (
          <li key={l.href} className="text-sm text-mut">
            <Link href={l.href} className="text-violet-ink hover:underline">
              {l.name}
            </Link>
            : {l.skill}
          </li>
        ))}
      </ul>
    </>
  );
}

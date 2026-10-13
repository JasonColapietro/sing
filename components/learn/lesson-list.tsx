import Link from "next/link";
import type { ChapterLesson } from "@/lib/lesson-readings";
import { SectionLabel } from "@/components/ui";

/**
 * "Free lessons that use this chapter", on book and atlas chapter pages,
 * locked or free. Built from lib/lesson-readings.ts on the server.
 */
export function LessonList({ lessons }: { lessons: ChapterLesson[] }) {
  return (
    <>
      <SectionLabel>Free lessons that use this chapter</SectionLabel>
      <ul className="mt-3 space-y-2">
        {lessons.map((l) => (
          <li key={l.href} className="text-sm text-mut">
            <Link href={l.href} className="text-violet-ink hover:underline">
              {l.name}
            </Link>{" "}
            — {l.skill}
          </li>
        ))}
      </ul>
    </>
  );
}

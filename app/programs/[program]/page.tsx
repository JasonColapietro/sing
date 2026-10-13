import { withCanonicalOpenGraph } from "@/lib/og";
import { routeKeywords } from "@/lib/keywords";
import { PROGRAMS } from "@/lib/programs";
import {
  PROGRAMS_CANONICAL,
  PROGRAMS_DESCRIPTION,
  PROGRAMS_TITLE,
  ProgramsPage,
} from "@/components/programs/programs-page";

/**
 * A program's own view, prerendered once per program. Nothing links here:
 * next.config.ts rewrites the deep link `/programs?program=<id>` (today's
 * card, /progress, the book, GuitarHub's contract) onto it, so that address
 * gets the program's calendar in its HTML, painted first, where the static
 * list used to paint and then swap to the calendar after mount. Served at
 * that address, it ships /programs' metadata, canonical included, exactly as
 * the deep link always has.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return PROGRAMS.map((p) => ({ program: p.id }));
}

export const metadata = withCanonicalOpenGraph({
  keywords: routeKeywords("/programs"),
  title: PROGRAMS_TITLE,
  description: PROGRAMS_DESCRIPTION,
  alternates: { canonical: PROGRAMS_CANONICAL },
});

export default async function ProgramViewPage({ params }: { params: Promise<{ program: string }> }) {
  const { program } = await params;
  return <ProgramsPage program={program} />;
}

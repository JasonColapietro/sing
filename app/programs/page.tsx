import { withCanonicalOpenGraph } from "@/lib/og";
import { routeKeywords } from "@/lib/keywords";
import {
  PROGRAMS_CANONICAL,
  PROGRAMS_DESCRIPTION,
  PROGRAMS_TITLE,
  ProgramsPage as ProgramsPageBody,
} from "@/components/programs/programs-page";

export const metadata = withCanonicalOpenGraph({
  keywords: routeKeywords("/programs"),
  title: PROGRAMS_TITLE,
  description: PROGRAMS_DESCRIPTION,
  alternates: { canonical: PROGRAMS_CANONICAL },
});

/** The list. A program's own view is app/programs/[program]/page.tsx. */
export default function ProgramsPage() {
  return <ProgramsPageBody />;
}

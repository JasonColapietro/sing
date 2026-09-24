import type { Metadata } from "next";
import Link from "next/link";
import { withCanonicalOpenGraph } from "@/lib/og";
import { SITE_URL } from "@/lib/site";
import { PROGRAMS, dayMinutes } from "@/lib/programs";
import { Card, PageShell } from "@/components/ui";

const TITLE = "Singing Practice Programs: Free Multi-Week Plans";
const DESCRIPTION =
  "Free multi-week singing practice plans built from Suede Sing's warmups, breath drills, range test and ear games. Each plan says what it compares at the end and what that comparison does not show.";

export const metadata: Metadata = withCanonicalOpenGraph({
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/programs` },
});

export default function ProgramsPage() {
  return (
    <PageShell
      kicker="Programs"
      title="Practice programs"
      subtitle="A routine is one session. A program puts sessions in order over weeks, and repeats its first day at the end so you have something to compare."
    >
      <ul className="grid gap-4 md:grid-cols-3">
        {PROGRAMS.map((p) => {
          const minutes = p.days.map(dayMinutes);
          return (
            <li key={p.id}>
              <Link href={`/programs/${p.id}`} className="block h-full">
                <Card tone="raised" className="h-full">
                  <p className="font-mono text-xs text-dim">
                    {p.weeks} weeks · {p.days.length} days · {Math.min(...minutes)}–{Math.max(...minutes)} min a program day
                  </p>
                  <h2 className="mt-2 text-xl">{p.name}</h2>
                  <p className="mt-2 text-sm text-mut">{p.tagline}</p>
                </Card>
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="mt-8 max-w-2xl text-sm text-mut">
        Every program uses free exercises and rooms you can open on their own.
        On a free account guided practice stops after three minutes a day, so
        a longer program day takes more than one day to finish; the program keeps your
        place either way. Your place is kept in this browser and worked out from
        the practice your rooms already log; nothing new is recorded.
      </p>
    </PageShell>
  );
}

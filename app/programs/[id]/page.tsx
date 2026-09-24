import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { withCanonicalOpenGraph } from "@/lib/og";
import { SITE_URL } from "@/lib/site";
import { PROGRAMS, programById } from "@/lib/programs";
import { ProgramDays } from "@/components/programs/program-days";
import { Card, PageShell, SectionLabel } from "@/components/ui";

interface Params {
  id: string;
}

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return PROGRAMS.map((p) => ({ id: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const program = programById(id);
  if (!program) return {};
  return withCanonicalOpenGraph({
    title: `${program.name}: a ${program.weeks}-week singing program`,
    description: program.tagline,
    alternates: { canonical: `${SITE_URL}/programs/${program.id}` },
  });
}

export default async function ProgramPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const program = programById(id);
  if (!program) notFound();

  return (
    <PageShell
      kicker={`Program · ${program.weeks} weeks · ${program.days.length} days`}
      title={program.name}
      subtitle={program.tagline}
    >
      <div className="space-y-8">
        <ProgramDays programId={program.id} />

        <Card tone="well">
          <SectionLabel>At the end</SectionLabel>
          <p className="mt-3 max-w-2xl text-ink">{program.compare}</p>
          <p className="mt-3 max-w-2xl text-sm text-mut">
            <span className="text-ink">What this does not show:</span> {program.doesNotShow}
          </p>
        </Card>

        <p className="text-sm">
          <Link href="/programs" className="text-violet-ink hover:underline">
            ← All programs
          </Link>
        </p>
      </div>
    </PageShell>
  );
}

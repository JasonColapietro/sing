import { LinkButton, SectionLabel } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col items-start px-4 py-24 sm:px-6">
      <SectionLabel className="mb-4">404 — off pitch</SectionLabel>
      <h1 className="text-4xl sm:text-5xl">That page isn&apos;t here.</h1>
      <p className="mt-4 max-w-xl text-lg text-mut">
        The note you were reaching for doesn&apos;t exist. Every practice room
        is one click away, though.
      </p>
      <div className="mt-7 flex flex-wrap items-center gap-3">
        <LinkButton href="/studio" variant="rec" size="lg">
          Open the studio
        </LinkButton>
        <LinkButton href="/" variant="outline" size="lg">
          Back to the start
        </LinkButton>
      </div>
    </main>
  );
}

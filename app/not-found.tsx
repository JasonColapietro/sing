import { EmptyState, LinkButton, PageShell } from "@/components/ui";

export default function NotFound() {
  return (
    <PageShell kicker="404" title="That page isn't here">
      <EmptyState
        title="Nothing at this address"
        hint="The page may have moved, or the link had a typo. The studio and the singer library are both one tap away."
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <LinkButton href="/">Back to the studio</LinkButton>
            <LinkButton href="/singers" variant="outline">
              Browse famous ranges
            </LinkButton>
          </div>
        }
      />
    </PageShell>
  );
}

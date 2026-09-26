import type { Metadata } from "next";
import { EmptyState, LinkButton, PageShell } from "@/components/ui";

// Without this the tab and history entry carry the home page's title, so a
// dead link reads as the studio until the page itself says otherwise.
export const metadata: Metadata = { title: "Page not found" };

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

import { Suspense } from "react";
import { SuccessClient } from "@/components/pro/success-client";
import { PageShell } from "@/components/ui";

export const metadata = { title: "Pro unlocked" };

export default function ProSuccessPage() {
  return (
    <Suspense
      fallback={
        <PageShell kicker="Suede Sing Pro" title="Checking your purchase…">
          <p className="text-sm text-mut">One moment.</p>
        </PageShell>
      }
    >
      <SuccessClient />
    </Suspense>
  );
}

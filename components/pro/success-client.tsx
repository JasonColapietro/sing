"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { activatePro } from "@/lib/pro";
import { Button, Card, LinkButton, PageShell, SectionLabel } from "@/components/ui";

type Phase =
  | { kind: "verifying" }
  | { kind: "done"; sessionId: string }
  | { kind: "error"; message: string };

export function SuccessClient() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const [phase, setPhase] = useState<Phase>(() =>
    sessionId
      ? { kind: "verifying" }
      : {
          kind: "error",
          message:
            "This page is missing its checkout reference. If you just paid, open the receipt email from Stripe and restore with your license key on the Pro page.",
        },
  );
  const [copied, setCopied] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current || !sessionId) return;
    startedRef.current = true;
    void (async () => {
      try {
        const res = await fetch("/api/license", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          sessionId?: string;
          token?: string;
          error?: string;
        };
        if (!res.ok || !data.ok || !data.sessionId || !data.token) {
          setPhase({
            kind: "error",
            message:
              data.error ??
              "Couldn't verify the purchase. Your card wasn't charged twice — try restoring on the Pro page.",
          });
          return;
        }
        activatePro(data.sessionId, data.token);
        setPhase({ kind: "done", sessionId: data.sessionId });
      } catch {
        setPhase({
          kind: "error",
          message:
            "Couldn't reach the server to verify the purchase. Reload this page to retry — your unlock is safe.",
        });
      }
    })();
  }, [sessionId]);

  if (phase.kind === "verifying") {
    return (
      <PageShell kicker="Suede Sing Pro" title="Checking your purchase…">
        <p className="text-sm text-mut" role="status">
          Confirming with Stripe — this takes a second.
        </p>
      </PageShell>
    );
  }

  if (phase.kind === "error") {
    return (
      <PageShell kicker="Suede Sing Pro" title="Almost there">
        <Card className="max-w-xl">
          <p className="text-sm text-mut" role="alert">
            {phase.message}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="rec" onClick={() => window.location.reload()}>
              Retry verification
            </Button>
            <LinkButton href="/pro" variant="outline">
              Go to the Pro page
            </LinkButton>
          </div>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell
      kicker="Suede Sing Pro"
      title="Pro unlocked — thank you"
      subtitle="Every song, every warmup tier, and unlimited takes are live on this device."
    >
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card>
          <SectionLabel>Save your license key</SectionLabel>
          <p className="mt-3 text-sm text-mut">
            This key is how you restore Pro on another device or after clearing
            browser data. It&apos;s also in your Stripe receipt email.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <code className="break-all rounded-lg border border-line bg-panel2 px-3 py-1.5 font-mono text-xs text-ink">
              {phase.sessionId}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void navigator.clipboard
                  ?.writeText(phase.sessionId)
                  .then(() => {
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 2000);
                  });
              }}
            >
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </Card>
        <Card>
          <SectionLabel>Start with the new stuff</SectionLabel>
          <div className="mt-4 flex flex-wrap gap-2">
            <LinkButton href="/songs" variant="amber" size="sm">
              Open the songbook
            </LinkButton>
            <LinkButton href="/warmups" variant="outline" size="sm">
              Tier 3 warmups
            </LinkButton>
            <LinkButton href="/recorder" variant="outline" size="sm">
              Cut a take
            </LinkButton>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}

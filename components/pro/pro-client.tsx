"use client";

import { useState } from "react";
import { activatePro, usePro } from "@/lib/pro";
import { Button, Card, LinkButton, PageShell, Pill, SectionLabel } from "@/components/ui";

const INCLUDES = [
  ["All six practice songs", "Three are free; Pro opens the rest of the songbook."],
  ["Tier 3 · Stretching warmups", "The advanced exercises that push range and agility."],
  ["Unlimited saved takes", "The free recorder keeps five takes; Pro removes the cap."],
  ["Every future Pro pack", "New songs and warmups land in Pro first, no extra charge."],
] as const;

function CheckGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M2.5 7.5l3 3 6-7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LicenseKey({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <code className="break-all rounded-lg border border-line bg-panel2 px-3 py-1.5 font-mono text-xs text-ink">
        {value}
      </code>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          void navigator.clipboard?.writeText(value).then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          });
        }}
      >
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}

export function ProClient() {
  const pro = usePro();
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);
  const [restoreKey, setRestoreKey] = useState("");
  const [restoring, setRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);

  const startCheckout = async () => {
    setBuying(true);
    setBuyError(null);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setBuyError(data.error ?? "Couldn't start checkout. Try again in a moment.");
        setBuying(false);
        return;
      }
      window.location.assign(data.url);
    } catch {
      setBuyError("Couldn't reach the server. Check your connection and try again.");
      setBuying(false);
    }
  };

  const restore = async () => {
    const key = restoreKey.trim();
    if (!key) return;
    setRestoring(true);
    setRestoreError(null);
    try {
      const res = await fetch("/api/license", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: key }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        sessionId?: string;
        token?: string;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.sessionId || !data.token) {
        setRestoreError(data.error ?? "Couldn't restore that key. Try again.");
      } else {
        activatePro(data.sessionId, data.token);
        setRestored(true);
      }
    } catch {
      setRestoreError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setRestoring(false);
    }
  };

  if (pro) {
    return (
      <PageShell
        kicker="Suede Sing Pro"
        title="You're Pro"
        subtitle="Every song, every warmup tier, unlimited takes — all unlocked on this device."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <SectionLabel>Your license key</SectionLabel>
            <p className="mt-3 text-sm text-mut">
              This key restores Pro on any other device — paste it into the
              restore box on this page there. Keep it somewhere safe, like the
              receipt email Stripe sent you.
            </p>
            <div className="mt-4">
              <LicenseKey value={pro.sessionId} />
            </div>
            {restored && (
              <p className="mt-3 text-sm text-ok" role="status">
                Restored — welcome back.
              </p>
            )}
          </Card>
          <Card>
            <SectionLabel>Jump back in</SectionLabel>
            <p className="mt-3 text-sm text-mut">
              Everything Pro is live now. Thanks for backing an independent
              tool.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <LinkButton href="/songs" variant="amber" size="sm">
                Open the songbook
              </LinkButton>
              <LinkButton href="/warmups" variant="outline" size="sm">
                Tier 3 warmups
              </LinkButton>
              <LinkButton href="/recorder" variant="outline" size="sm">
                Recorder
              </LinkButton>
            </div>
          </Card>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      kicker="Suede Sing Pro"
      title="Unlock the full studio"
      subtitle="One purchase opens everything. No subscription, no account — the unlock lives on your device, like the rest of the app."
    >
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div className="flex items-baseline gap-2">
              <span className="tabular font-mono text-4xl text-ink">$9</span>
              <span className="text-sm text-mut">once — yours for good</span>
            </div>
            <Pill tone="amber">No subscription</Pill>
          </div>
          <ul className="mt-6 space-y-4">
            {INCLUDES.map(([title, desc]) => (
              <li key={title} className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-ok/40 text-ok">
                  <CheckGlyph />
                </span>
                <div>
                  <div className="text-sm font-medium text-ink">{title}</div>
                  <div className="mt-0.5 text-sm text-mut">{desc}</div>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-7">
            <Button
              variant="rec"
              size="lg"
              className="w-full sm:w-auto"
              onClick={() => void startCheckout()}
              disabled={buying}
            >
              {buying ? "Opening checkout…" : "Get Pro — $9"}
            </Button>
            {buyError && (
              <p className="mt-3 text-sm text-rec" role="alert">
                {buyError}
              </p>
            )}
            <p className="mt-3 text-xs text-mut">
              Secure checkout by Stripe. Card details never touch Suede Sing.
            </p>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <SectionLabel>Already bought Pro?</SectionLabel>
            <p className="mt-3 text-sm text-mut">
              Paste the license key from your purchase (it starts with{" "}
              <code className="font-mono text-xs">cs_</code>) and Pro unlocks on
              this device too.
            </p>
            <form
              className="mt-4 flex flex-wrap gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void restore();
              }}
            >
              <label className="sr-only" htmlFor="license-key">
                License key
              </label>
              <input
                id="license-key"
                name="license-key"
                value={restoreKey}
                onChange={(e) => setRestoreKey(e.target.value)}
                placeholder="cs_…"
                autoComplete="off"
                spellCheck={false}
                className="min-w-0 flex-1 rounded-full border border-line bg-panel px-4 py-2 font-mono text-sm text-ink placeholder:text-dim focus:border-line2"
              />
              <Button
                type="submit"
                variant="outline"
                disabled={restoring || restoreKey.trim() === ""}
              >
                {restoring ? "Checking…" : "Restore"}
              </Button>
            </form>
            {restoreError && (
              <p className="mt-3 text-sm text-rec" role="alert">
                {restoreError}
              </p>
            )}
          </Card>

          <Card>
            <SectionLabel>The honest fine print</SectionLabel>
            <ul className="mt-3 space-y-2 text-sm text-mut">
              <li>
                Every practice room stays free — mic tools, range test, ear
                training, breath work, and progress tracking aren&apos;t
                gated.
              </li>
              <li>
                The unlock is stored in your browser. Clearing site data locks
                it again — your license key restores it in seconds.
              </li>
              <li>Your audio still never leaves this device, Pro or not.</li>
            </ul>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

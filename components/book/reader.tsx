"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useProReady, useProState } from "@/lib/pro";
import { BOOK_CONTENTS, type BookContentsEntry } from "@/lib/book-data";
import { Markdown } from "@/lib/markdown";
import { Button, Card, LinkButton, SectionLabel } from "@/components/ui";

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; body: string }
  | { kind: "locked"; message: string }
  | { kind: "error"; message: string };

/**
 * Fetches one chapter for a verified Pro customer. Bodies are not in the
 * client bundle — /api/book re-checks the Stripe billing record and returns
 * the markdown, so a visitor without Pro has nothing to read in page source.
 */
export function ChapterReader({ chapter }: { chapter: BookContentsEntry }) {
  const pro = useProState();
  const proReady = useProReady();
  const [state, setState] = useState<State>({ kind: "idle" });

  const subscriptionId = pro.subscriptionId;
  const paymentIntentId = pro.paymentIntentId;

  const load = useCallback(async () => {
    if (!subscriptionId && !paymentIntentId) return;
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          subscriptionId,
          paymentIntentId,
          slug: chapter.slug,
        }),
      });
      const data = (await res.json()) as { body?: string; error?: string };
      if (res.status === 403) {
        setState({
          kind: "locked",
          message: data.error ?? "Suede Pro is required to read this.",
        });
        return;
      }
      if (!res.ok || !data.body) {
        setState({
          kind: "error",
          message: data.error ?? "Could not load this chapter.",
        });
        return;
      }
      setState({ kind: "ready", body: data.body });
    } catch {
      setState({
        kind: "error",
        message: "Could not reach the server. Check your connection.",
      });
    }
  }, [subscriptionId, paymentIntentId, chapter.slug]);

  useEffect(() => {
    // Every setState inside load() happens after `await fetch(...)`, so none of
    // them run synchronously in the effect body — but the rule cannot see
    // through the async boundary to prove it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  // Both "no entitlement" and "still waiting" are render-time facts derived
  // from what we already know, so the effect never sets state synchronously.
  //
  // Readiness comes first: gated chapter pages are statically prerendered
  // (dynamicParams = false) and the entitlement cache is local to the browser,
  // so the server always looks unsubscribed. Without this the locked card ships
  // in the HTML a paying Pro customer downloads.
  const view: State = !proReady
    ? { kind: "loading" }
    : !subscriptionId && !paymentIntentId
      ? { kind: "locked", message: "This chapter is part of Suede Pro." }
      : state.kind === "idle"
        ? { kind: "loading" }
        : state;

  const sample = BOOK_CONTENTS.find((c) => c.free);

  // Shared by the loading and locked states: none of these links claim anything
  // about the reader's entitlement, so they are safe to bake into the prerendered
  // HTML. Without them the static page is a dead end for anyone whose JS never
  // runs — the loading line never resolves and there is no way through to Pro.
  const ctas = (
    <div className="mt-5 flex flex-wrap gap-3">
      <LinkButton href="/pro" size="sm">
        See Suede Pro
      </LinkButton>
      {sample && (
        <LinkButton href={`/book/${sample.slug}`} variant="outline" size="sm">
          Read the free chapter
        </LinkButton>
      )}
      <LinkButton href="/pro#restore" variant="ghost" size="sm">
        Already have Pro?
      </LinkButton>
    </div>
  );

  return (
    <div>
      {view.kind === "loading" && (
        <div className="mt-6">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-dim">
            Checking your Pro access…
          </p>
          {ctas}
        </div>
      )}

      {view.kind === "locked" && (
        <Card className="mt-6 border-amber/40">
          <SectionLabel>Included with Pro</SectionLabel>
          <h2 className="mt-3 text-xl">{view.message}</h2>
          <p className="mt-2 max-w-xl text-sm text-mut">
            The Measured Voice comes with Suede Pro: all{" "}
            {BOOK_CONTENTS.length} chapters, and a PDF to keep. The studio
            itself stays free either way, and so does the first chapter.
          </p>
          {ctas}
        </Card>
      )}

      {view.kind === "error" && (
        <Card className="mt-6 border-rec/40">
          <p className="text-sm text-rec">{view.message}</p>
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setState({ kind: "idle" });
                void load();
              }}
            >
              Try again
            </Button>
          </div>
        </Card>
      )}

      {view.kind === "ready" && (
        <>
          <article className="mt-6 max-w-[64ch]">
            <Markdown source={view.body} />
          </article>
          <ChapterNav slug={chapter.slug} />
        </>
      )}
    </div>
  );
}

/**
 * Previous/next links across the whole book. The free chapter page renders this
 * too — a subscriber lands there from "Start reading", so it has to carry on
 * into the gated chapters rather than dead-ending at the sample.
 */
export function ChapterNav({ slug }: { slug: string }) {
  const index = BOOK_CONTENTS.findIndex((c) => c.slug === slug);
  const prev = index > 0 ? BOOK_CONTENTS[index - 1] : null;
  const next =
    index >= 0 && index < BOOK_CONTENTS.length - 1
      ? BOOK_CONTENTS[index + 1]
      : null;

  return (
    <nav
      aria-label="Chapters"
      className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6"
    >
      {prev ? (
        <Link
          href={`/book/${prev.slug}`}
          className="max-w-[45%] text-sm text-mut hover:text-ink"
        >
          <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-dim">
            Previous
          </span>
          {prev.title}
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          href={`/book/${next.slug}`}
          className="max-w-[45%] text-right text-sm text-amber-ink hover:text-ink"
        >
          <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-dim">
            Next
          </span>
          {next.title}
        </Link>
      ) : (
        <Link
          href="/book"
          className="text-right text-sm text-amber-ink hover:text-ink"
        >
          Back to contents
        </Link>
      )}
    </nav>
  );
}

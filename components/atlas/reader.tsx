"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useProReady, useProState } from "@/lib/pro";
import {
  ATLAS_CONTENTS,
  type AtlasContentsEntry,
  type AtlasEntry,
} from "@/lib/atlas-data";
import { Markdown } from "@/lib/markdown";
import { AtlasEntryCard } from "@/components/atlas/entry";
import { Button, Card, LinkButton, SectionLabel } from "@/components/ui";

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; body: string; entries: AtlasEntry[] }
  | { kind: "locked"; message: string }
  | { kind: "error"; message: string };

/**
 * Fetches one atlas chapter for a verified subscriber. Bodies and entry prose
 * are not in the client bundle — /api/book re-checks the subscription with
 * Stripe and returns the markdown plus the chapter's singer entries, so a
 * non-subscriber has nothing to read in the page source.
 */
export function AtlasChapterReader({ chapter }: { chapter: AtlasContentsEntry }) {
  const pro = useProState();
  const proReady = useProReady();
  const [state, setState] = useState<State>({ kind: "idle" });

  const subscriptionId = pro.subscriptionId;

  const load = useCallback(async () => {
    if (!subscriptionId) return;
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subscriptionId, slug: chapter.slug, book: "atlas" }),
      });
      const data = (await res.json()) as {
        body?: string;
        entries?: AtlasEntry[];
        error?: string;
      };
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
      setState({ kind: "ready", body: data.body, entries: data.entries ?? [] });
    } catch {
      setState({
        kind: "error",
        message: "Could not reach the server. Check your connection.",
      });
    }
  }, [subscriptionId, chapter.slug]);

  useEffect(() => {
    // Every setState inside load() happens after `await fetch(...)`, so none of
    // them run synchronously in the effect body — but the rule cannot see
    // through the async boundary to prove it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  // Gated chapter pages are statically prerendered (dynamicParams = false), and
  // the entitlement cache is local to the browser — so on the server there is
  // no subscription to find and the locked card would be baked into the HTML a
  // subscriber downloads. Hold the neutral loading card until the store reports.
  const view: State = !proReady
    ? { kind: "loading" }
    : !subscriptionId
      ? { kind: "locked", message: "This chapter is part of Suede Pro." }
      : state.kind === "idle"
        ? { kind: "loading" }
        : state;

  const free = ATLAS_CONTENTS.filter((c) => c.free);
  // Every gated chapter sits after every free one, so the last free chapter is
  // the one immediately before whatever the reader landed on.
  const sample = free[free.length - 1] ?? null;

  // Shared by the loading and locked states: none of these links claim anything
  // about the reader's entitlement, so they are safe to bake into the prerendered
  // HTML. Without them the static page is a dead end for anyone whose JS never
  // runs — the loading line never resolves and there is no way through to Pro.
  const ctas = (
    <div className="mt-5 flex flex-wrap items-center gap-3">
      <LinkButton href="/pro" size="md">
        See what Pro includes
      </LinkButton>
      {sample && (
        <LinkButton href={`/atlas/${sample.slug}`} variant="outline" size="md">
          Read a free chapter
        </LinkButton>
      )}
      <LinkButton href="/atlas" variant="ghost" size="md">
        Back to contents
      </LinkButton>
    </div>
  );

  return (
    <div className="space-y-6">
      {view.kind === "loading" && (
        <Card>
          <p className="text-sm text-mut">Loading the chapter…</p>
          {ctas}
        </Card>
      )}

      {view.kind === "locked" && (
        <Card>
          <SectionLabel>Included with Pro</SectionLabel>
          <p className="mt-3 max-w-2xl text-mut">{view.message}</p>
          <p className="mt-2 max-w-2xl text-sm text-mut">
            The full contents — every chapter and every singer covered — is
            free on the contents page, and each singer&rsquo;s range page stays
            free too. So are the first {free.length} chapters, which teach the
            notation and the labels every entry after them uses. Pro unlocks the
            remaining chapter text, the entry notes, and the PDF of the whole
            book.
          </p>
          {ctas}
        </Card>
      )}

      {view.kind === "error" && (
        <Card>
          <p className="text-sm text-mut">{view.message}</p>
          <div className="mt-4">
            <Button onClick={() => void load()} size="sm" variant="outline">
              Try again
            </Button>
          </div>
        </Card>
      )}

      {view.kind === "ready" && (
        <>
          <Card>
            <div className="max-w-[64ch]">
              <Markdown source={view.body} />
            </div>
          </Card>
          {view.entries.length > 0 && (
            <div className="space-y-4">
              <SectionLabel>The voices</SectionLabel>
              {view.entries.map((e) => (
                <AtlasEntryCard key={e.slug} entry={e} />
              ))}
            </div>
          )}
        </>
      )}

      <AtlasChapterNav slug={chapter.slug} />
    </div>
  );
}

/**
 * Previous/next links across the whole atlas. The free chapter pages render
 * this too — a subscriber reading in order reaches the last free chapter, and
 * without it there is no link onward into the gated ones.
 */
export function AtlasChapterNav({ slug }: { slug: string }) {
  const index = ATLAS_CONTENTS.findIndex((c) => c.slug === slug);
  const prev = index > 0 ? ATLAS_CONTENTS[index - 1] : null;
  const next =
    index >= 0 && index < ATLAS_CONTENTS.length - 1
      ? ATLAS_CONTENTS[index + 1]
      : null;

  return (
    <nav className="flex items-center justify-between gap-4">
      {prev ? (
        <Link
          href={`/atlas/${prev.slug}`}
          className="min-w-0 rounded-xl border border-line px-4 py-3 text-sm text-mut transition-colors hover:border-line2 hover:text-ink"
        >
          ← {prev.title}
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          href={`/atlas/${next.slug}`}
          className="min-w-0 rounded-xl border border-line px-4 py-3 text-right text-sm text-mut transition-colors hover:border-line2 hover:text-ink"
        >
          {next.title} →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

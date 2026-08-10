"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useProState } from "@/lib/pro";
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

  const view: State = !subscriptionId
    ? { kind: "locked", message: "This chapter is part of Suede Pro." }
    : state.kind === "idle"
      ? { kind: "loading" }
      : state;

  const index = ATLAS_CONTENTS.findIndex((c) => c.slug === chapter.slug);
  const prev = index > 0 ? ATLAS_CONTENTS[index - 1] : null;
  const next =
    index >= 0 && index < ATLAS_CONTENTS.length - 1
      ? ATLAS_CONTENTS[index + 1]
      : null;

  return (
    <div className="space-y-6">
      {view.kind === "loading" && (
        <Card>
          <p className="text-sm text-mut">Loading the chapter…</p>
        </Card>
      )}

      {view.kind === "locked" && (
        <Card>
          <SectionLabel>Included with Pro</SectionLabel>
          <p className="mt-3 max-w-2xl text-mut">{view.message}</p>
          <p className="mt-2 max-w-2xl text-sm text-mut">
            The full contents — every chapter and every singer covered — is
            free on the contents page, and each singer&rsquo;s range page stays
            free too. Pro unlocks the chapter text, the entry notes, and the
            PDF of the whole book.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <LinkButton href="/pro#pro-plan" size="md">
              See Pro for $9.99/month
            </LinkButton>
            <LinkButton href="/atlas" variant="outline" size="md">
              Back to contents
            </LinkButton>
          </div>
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
            <div className="max-w-3xl">
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
    </div>
  );
}

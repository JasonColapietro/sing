"use client";

import { useState } from "react";
import { useProState } from "@/lib/pro";

/**
 * Pro-only PDF download. Fetches /api/book/pdf (which re-checks the Stripe
 * billing record) and hands the bytes to the browser as a download — the PDFs
 * have no public URL.
 */
export function PdfDownload({
  book,
  filename,
}: {
  book: "measured-voice" | "atlas";
  filename: string;
}) {
  const pro = useProState();
  const [state, setState] = useState<"idle" | "working" | "error">("idle");

  const download = async () => {
    if (!pro.subscriptionId && !pro.paymentIntentId) return;
    setState("working");
    try {
      const res = await fetch("/api/book/pdf", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          subscriptionId: pro.subscriptionId,
          paymentIntentId: pro.paymentIntentId,
          book,
        }),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setState("idle");
    } catch {
      setState("error");
    }
  };

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={download}
        disabled={state === "working"}
        className="inline-flex items-center justify-center gap-2 rounded-full border border-line2 px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-amber hover:text-amber-ink disabled:opacity-60"
      >
        {state === "working" ? "Preparing…" : "Download the PDF"}
      </button>
      {state === "error" && (
        <span className="text-xs text-rec">
          Couldn&apos;t start the download — try again in a moment.
        </span>
      )}
    </span>
  );
}

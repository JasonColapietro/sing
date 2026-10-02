"use client";

/**
 * Last-resort boundary, for a failure in the root layout itself.
 *
 * This one replaces the layout, so there is no nav, no footer and no global
 * stylesheet to lean on — hence the inline styles and the literal brand
 * values rather than the design tokens, which are defined in a stylesheet
 * that may be exactly what failed to load.
 */
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0f0c1f",
          color: "#f6f4ff",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif",
          padding: "24px",
        }}
      >
        <main style={{ maxWidth: "34rem", textAlign: "center" }}>
          <p
            style={{
              fontFamily: "ui-monospace, Menlo, monospace",
              fontSize: "12px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#ffd27a",
              margin: 0,
            }}
          >
            Suede Sing
          </p>
          <h1
            style={{
              fontSize: "2rem",
              lineHeight: 1.15,
              margin: "16px 0 0",
              letterSpacing: "-0.02em",
            }}
          >
            The app failed to start
          </h1>
          <p style={{ color: "#c3bde3", margin: "16px 0 0" }}>
            Something went wrong before the page could load. Reloading usually
            fixes it. Nothing you have practiced is affected — it is stored on
            this device.
          </p>
          <div
            style={{
              marginTop: "28px",
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => unstable_retry()}
              style={{
                borderRadius: "999px",
                border: "none",
                backgroundColor: "#ff5470",
                color: "#0f0c1f",
                padding: "10px 20px",
                fontFamily: "ui-monospace, Menlo, monospace",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            {/* A plain anchor on purpose: next/link navigates through the
                router, and the router lives in the app shell that just failed
                to start. A full document load is the recovery. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                borderRadius: "999px",
                border: "1px solid #463e75",
                color: "#f6f4ff",
                padding: "10px 20px",
                fontSize: "14px",
                textDecoration: "none",
              }}
            >
              Back to the start
            </a>
          </div>
          {error.digest && (
            <p
              style={{
                marginTop: "32px",
                fontFamily: "ui-monospace, Menlo, monospace",
                fontSize: "11px",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#6b6455",
              }}
            >
              Reference {error.digest}
            </p>
          )}
        </main>
      </body>
    </html>
  );
}

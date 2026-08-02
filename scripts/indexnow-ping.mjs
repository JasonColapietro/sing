#!/usr/bin/env node
// Submit every sitemap URL to IndexNow (Bing, DuckDuckGo, Seznam, Naver, Yep).
// Google ignores IndexNow — this is for the Bing-powered surfaces, including
// ChatGPT search and DuckDuckGo. Run after a deploy that adds or changes pages:
//
//   node scripts/indexnow-ping.mjs
//
// The key file lives in public/<key>.txt so the engines can verify ownership
// at https://sing.suedeai.ai/<key>.txt. Re-running is harmless: IndexNow
// treats resubmissions as no-ops.

const HOST = "sing.suedeai.ai";
const KEY = "79cdb9d5873525c71a296b9d7c494bf9";

const sitemap = await fetch(`https://${HOST}/sitemap.xml`).then((r) => {
  if (!r.ok) throw new Error(`sitemap fetch failed: ${r.status}`);
  return r.text();
});

const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (urls.length === 0) throw new Error("no <loc> entries found in sitemap");

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host: HOST,
    key: KEY,
    keyLocation: `https://${HOST}/${KEY}.txt`,
    urlList: urls,
  }),
});

// 200 = accepted, 202 = accepted (key validation pending). Anything else is a bug.
console.log(`submitted ${urls.length} urls → HTTP ${res.status}`);
if (res.status !== 200 && res.status !== 202) {
  console.error(await res.text());
  process.exit(1);
}

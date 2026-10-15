import assert from "node:assert/strict";

const base = process.argv[2] ?? process.env.SING_BASE_URL ?? "http://127.0.0.1:3100";
const pages = [
  "/singers/sia",
  "/singers/adele",
  "/songs/scarborough-fair",
  "/singers/genre/opera",
  "/singers/voice-type/tenor",
  "/singers/records",
  "/singers",
];

// Check real Next routing, not just the image module: generateImageMetadata
// moved the image to /<version> and left the previously advertised URL at 404.
for (const page of pages) {
  const response = await fetch(new URL(page, base));
  assert.equal(response.status, 200, `${page} page`);
  const html = await response.text();
  const advertised = html.match(/<meta property="og:image" content="([^"]+)"/);
  assert.ok(advertised, `${page} advertises a share image`);
  const image = new URL(advertised[1].replaceAll("&amp;", "&"));
  const legacyPath = `${page}/opengraph-image`;
  assert.ok(image.pathname.startsWith(`${legacyPath}/`), `${page} retains a versioned image`);

  // Old metadata included a source hash as a query. It must not prevent the
  // old URL from reaching the current image, or keep the stale hash alive.
  for (const query of ["", "?old-source-hash&url=https%3A%2F%2Fexample.com&path=singers%2Fadele&id=old"]) {
    const legacy = await fetch(new URL(`${legacyPath}${query}`, base), { redirect: "manual" });
    assert.equal(legacy.status, 307, `${legacyPath} redirects to the current image`);
    assert.equal(legacy.headers.get("cache-control"), "no-store", "a rolling version must not be cached permanently");
    const target = new URL(legacy.headers.get("location"), base);
    assert.equal(target.origin, new URL(base).origin, "redirect stays on the same origin");
    assert.equal(target.pathname, image.pathname, "redirect agrees with current page metadata");
    assert.equal(target.search, "", "old source hash and unexpected query parameters are discarded");
  }
  const target = new URL(image.pathname, base);
  const card = await fetch(target);
  assert.equal(card.status, 200, `${target.pathname} image`);
  assert.match(card.headers.get("content-type") ?? "", /^image\/png/);
  const bytes = new Uint8Array(await card.arrayBuffer());
  assert.deepEqual([...bytes.slice(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], "response is PNG bytes");
  console.log(`PASS ${legacyPath} -> ${target.pathname} -> PNG`);
}

for (const page of [
  "/singers/no-such-singer-gsc-regression",
  "/songs/no-such-song-gsc-regression",
  "/singers/genre/no-such-genre-gsc-regression",
  "/singers/voice-type/no-such-type-gsc-regression",
]) {
  const response = await fetch(new URL(`${page}/opengraph-image`, base), { redirect: "manual" });
  assert.equal(response.status, 404, `${page} must not acquire an invented image`);
  assert.equal(response.headers.get("location"), null);
  console.log(`PASS ${page}/opengraph-image stays 404`);
}

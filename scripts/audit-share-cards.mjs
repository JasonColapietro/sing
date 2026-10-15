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
let buildRevision;

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
  let target;
  for (const query of ["", "?old-source-hash&render=untrusted&url=https%3A%2F%2Fexample.com&path=singers%2Fadele&id=old", ""]) {
    const legacy = await fetch(new URL(`${legacyPath}${query}`, base), { redirect: "manual" });
    assert.equal(legacy.status, 307, `${legacyPath} redirects to the current image`);
    assert.equal(legacy.headers.get("cache-control"), "no-store", "a rolling version must not be cached permanently");
    const currentTarget = new URL(legacy.headers.get("location"), base);
    if (target) assert.equal(currentTarget.href, target.href, "repeated and hostile queries resolve to the same build target");
    target = currentTarget;
    assert.equal(target.origin, new URL(base).origin, "redirect stays on the same origin");
    assert.equal(target.pathname, image.pathname, "redirect agrees with current page metadata");
    assert.deepEqual([...target.searchParams.keys()], ["render"], "only the trusted render revision survives");
    const revision = target.searchParams.get("render");
    assert.match(revision, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/, "render revision is generated at build time");
    buildRevision ??= revision;
    assert.equal(revision, buildRevision, "all six route families share one stable build revision");
  }
  const card = await fetch(target);
  assert.equal(card.status, 200, `${target.pathname} image`);
  assert.match(card.headers.get("content-type") ?? "", /^image\/png/);
  const bytes = new Uint8Array(await card.arrayBuffer());
  assert.deepEqual([...bytes.slice(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], "response is PNG bytes");
  console.log(`PASS ${legacyPath} -> ${target.pathname}${target.search} -> PNG`);
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

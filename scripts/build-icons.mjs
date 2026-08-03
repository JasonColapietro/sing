/**
 * Render the app icon set from the approved Suede mark.
 *
 * Usage: node scripts/build-icons.mjs
 *
 * The site shipped with one 132px logo doing every job: nav image, and the
 * only entry in the web manifest. That is too small for an installed PWA
 * (Android wants 192 and 512), it has transparent corners where iOS renders
 * black, and it has no maskable variant, so Android crops the round mark
 * inside its own mask and clips it.
 *
 * It also replaces the favicon, which was still the black-circle-and-triangle
 * that ships with a fresh Next scaffold — so every tab, bookmark and history
 * entry has been showing Next's logo rather than Suede's.
 *
 * Outputs, all committed so there is no build-time dependency:
 *   app/favicon.ico           16/32/48  browser tab, address bar, bookmarks
 *   app/icon.png              512  the rel=icon link
 *   app/apple-icon.png        180  iOS home screen, deliberately opaque
 *   public/icon-192.png       192  manifest, purpose "any"
 *   public/icon-512.png       512  manifest, purpose "any"
 *   public/icon-maskable.png  512  manifest, purpose "maskable"
 *
 * Source of truth is assets/suede-mark-400.png — the approved white mark on
 * transparency, copied from suede-brand-assets. Its ink occupies a measured
 * 243px square inside that 400px canvas, so the generator scales by the ink
 * rather than by the file, and every icon ends up optically the same size.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const MARK = "assets/suede-mark-400.png";
/** Measured ink box of the source mark: 243px of drawing inside 400px. */
const MARK_INK_RATIO = 243 / 400;
const BRAND_BLUE = "#015cff";

/**
 * Fraction of the icon's width the mark's ink should occupy.
 *
 * `any` icons are shown as-is, so the mark can sit large on its disc. Maskable
 * icons are cropped by the platform to a circle, squircle or rounded square,
 * and only the middle 80% is guaranteed to survive — so the ink is kept well
 * inside that, at 52%, which still reads large once the mask is applied.
 */
const INK_FRACTION = { any: 0.6, maskable: 0.52, apple: 0.58 };

const markData = `data:image/png;base64,${readFileSync(MARK).toString("base64")}`;

/**
 * `shape: "disc"` draws the blue circle on transparency — the mark as it
 * appears in the nav. `shape: "bleed"` fills the whole square, which is what
 * maskable and iOS icons need: both apply their own mask, and any transparency
 * left behind shows up as black on iOS or as a clipped corner on Android.
 */
function iconHtml({ size, shape, inkFraction }) {
  const markWidth = (size * inkFraction) / MARK_INK_RATIO;
  const radius = shape === "disc" ? "50%" : "0";
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    html, body { margin: 0; padding: 0; background: transparent; }
    .icon { width: ${size}px; height: ${size}px; border-radius: ${radius};
            background: ${BRAND_BLUE};
            display: flex; align-items: center; justify-content: center; }
    .icon img { width: ${markWidth}px; height: ${markWidth}px; display: block; }
  </style></head><body>
    <div class="icon"><img src="${markData}"></div>
  </body></html>`;
}

const TARGETS = [
  { path: "app/icon.png", size: 512, shape: "disc", ink: INK_FRACTION.any },
  { path: "app/apple-icon.png", size: 180, shape: "bleed", ink: INK_FRACTION.apple },
  { path: "public/icon-192.png", size: 192, shape: "disc", ink: INK_FRACTION.any },
  { path: "public/icon-512.png", size: 512, shape: "disc", ink: INK_FRACTION.any },
  {
    path: "public/icon-maskable.png",
    size: 512,
    shape: "bleed",
    ink: INK_FRACTION.maskable,
  },
];

/** Sizes packed into favicon.ico, covering tab, address bar and bookmarks. */
const ICO_SIZES = [16, 32, 48];

/**
 * Packs PNGs into an .ico container.
 *
 * ICO has carried PNG payloads directly since Windows Vista, and every browser
 * in use reads them, so there is no need to encode BMP + AND-mask by hand. The
 * directory is a 6-byte header followed by one 16-byte entry per image; a
 * dimension of 256 is stored as 0, which is why the byte is masked.
 */
function packIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);

  let offset = 6 + images.length * 16;
  const entries = [];
  for (const { size, data } of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size & 0xff, 0); // width, 0 means 256
    entry.writeUInt8(size & 0xff, 1); // height
    entry.writeUInt8(0, 2); // palette size, 0 for truecolour
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += data.length;
  }
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

const browser = await chromium.launch();
const page = await browser.newPage();

/** Renders one icon and returns the PNG bytes. */
async function renderIcon({ size, shape, ink }) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(iconHtml({ size, shape, inkFraction: ink }), {
    waitUntil: "load",
  });
  return page.locator(".icon").screenshot({ omitBackground: shape === "disc" });
}

/**
 * Re-encodes a PNG with an alpha channel.
 *
 * Chromium writes an RGB PNG whenever a screenshot happens to be fully opaque,
 * and Next's .ico decoder rejects those outright — "The PNG is not in RGBA
 * format!" — which fails the build. `omitBackground` does not help, because
 * the artwork itself covers every pixel. A canvas backing store is always
 * RGBA, so drawing the image through one and exporting it restores the channel
 * without touching a single pixel value.
 */
async function withAlphaChannel(buffer, size) {
  const dataUrl = await page.evaluate(
    async ({ b64, px }) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = px;
      canvas.height = px;
      canvas.getContext("2d").drawImage(img, 0, 0, px, px);
      return canvas.toDataURL("image/png");
    },
    { b64: buffer.toString("base64"), px: size },
  );
  return Buffer.from(dataUrl.split(",")[1], "base64");
}

for (const { path, size, shape, ink } of TARGETS) {
  writeFileSync(path, await renderIcon({ size, shape, ink }));
  console.log(`wrote ${path} — ${size}x${size} ${shape}`);
}

// The favicon renders full-bleed: at 16px a transparent disc leaves the mark
// floating with no edge to read against, and browsers draw it on whatever tab
// colour they like.
const icoImages = [];
for (const size of ICO_SIZES) {
  const shot = await renderIcon({
    size,
    shape: "bleed",
    ink: INK_FRACTION.apple,
  });
  icoImages.push({ size, data: await withAlphaChannel(shot, size) });
}
writeFileSync("app/favicon.ico", packIco(icoImages));
console.log(`wrote app/favicon.ico — ${ICO_SIZES.join("/")}`);

await browser.close();

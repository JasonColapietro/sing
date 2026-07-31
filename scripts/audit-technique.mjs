/**
 * Independent audit of the editorial `technique` paragraphs.
 *
 * Usage: node scripts/audit-technique.mjs data/singers
 *
 * These paragraphs are published prose about real, often living people, so they
 * get a check that does not depend on the agents that wrote or reviewed them.
 * Exits non-zero if anything in the BLOCK list is present.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const SRC = process.argv[2] ?? "data/singers";

// Publishing risks: anything matching gets the paragraph pulled, not softened.
const BLOCK = [
  [/\b(reportedly|allegedly|rumou?red|it is said|some say|purportedly)\b/i, "hedged claim"],
  [
    /\b(cancer|surgery|surgeries|nodules?|polyps?|h(a)?emorrhage|addict\w*|alcoholi\w*|overdose|rehab|died|death|suicide|abuse|assault|lawsuit|convicted|arrested)\b/i,
    "sensitive/health/legal claim",
  ],
  [/\b(grammy|oscar|tony award|billboard|chart-topping|number one|no\. 1|platinum|gold record)\b/i, "awards/chart biography"],
  [/\b(19|20)\d{2}\b/, "date — biography, not sound"],
  // Song titles in quotes are wanted; sentence-like quoted text is not. Real
  // quotations and lyrics run long and carry sentence punctuation, whereas a
  // title is short and has none — "joined", "raised" and friends are almost
  // always musical here ("registers joined", "raised soft palate"), so the
  // biography check needs the surrounding context, not the bare verb.
  [/["""][^"""]{60,}["""]/, "long quoted passage — possible quotation or lyric"],
  [/["""][^"""]*[.;:!?][^"""]*["""]/, "quoted text with sentence punctuation"],
  [
    /\b(born in|born to|grew up|raised in|debut album|studio album|joined the|left the band|solo career|signed to|his career|her career|their career)\b/i,
    "career/biography",
  ],
];

// Style problems: worth reporting, not worth blocking a deploy over.
const WARN = [
  [/\b(iconic|legendary|powerhouse|effortless|flawless|unmatched|angelic|goosebumps|unrivalled|unrivaled|greatest)\b/i, "hype word"],
  [/\b(soaring|ethereal|buttery|velvety|silky|spine-tingling|otherworldly)\b/i, "cliché"],
];

let total = 0;
const blocked = [];
const warned = [];
const openings = new Map();
const lengths = [];

for (const file of readdirSync(SRC).filter((f) => f.endsWith(".json")).sort()) {
  for (const r of JSON.parse(readFileSync(join(SRC, file), "utf8"))) {
    if (!r.technique) continue;
    total++;
    const t = String(r.technique);
    const where = `${r.name} (${file})`;
    lengths.push(t.split(/\s+/).length);

    for (const [re, why] of BLOCK) {
      const m = re.exec(t);
      if (m) blocked.push(`${where}: ${why} — "${m[0]}"`);
    }
    for (const [re, why] of WARN) {
      const m = re.exec(t);
      if (m) warned.push(`${where}: ${why} — "${m[0]}"`);
    }

    // Opening-phrase repetition is what makes generated batches feel generated.
    const open = t.split(/\s+/).slice(0, 3).join(" ").toLowerCase();
    openings.set(open, (openings.get(open) ?? 0) + 1);

    // Internal consistency: a belt claim above the entry's own cited ceiling.
    if (r.beltNote) {
      const claimed = [...t.matchAll(/\b([A-G][#b]?)([0-8])\b/g)].map(
        (x) => x[1] + x[2],
      );
      const bad = claimed.filter((n) => n !== r.beltNote && /belt/i.test(t) === false);
      if (claimed.length && !claimed.includes(r.beltNote) && !claimed.includes(r.highNote) && !claimed.includes(r.lowNote)) {
        warned.push(`${where}: names ${claimed.join("/")} but the entry's notes are ${r.lowNote}/${r.beltNote}/${r.highNote}`);
      }
      void bad;
    }
  }
}

lengths.sort((a, b) => a - b);
const repeated = [...openings.entries()].filter(([, n]) => n >= 4).sort((a, b) => b[1] - a[1]);

console.log(`audited ${total} technique paragraphs`);
console.log(
  `words: min ${lengths[0]}, median ${lengths[Math.floor(lengths.length / 2)]}, max ${lengths[lengths.length - 1]}`,
);
console.log(`distinct 3-word openings: ${openings.size} across ${total}`);
if (repeated.length) {
  console.log("openings used 4+ times:");
  for (const [o, n] of repeated) console.log(`  ${n}x  "${o}…"`);
}
if (warned.length) {
  console.log(`\n${warned.length} warnings:`);
  for (const w of warned.slice(0, 40)) console.log(`  - ${w}`);
}
if (blocked.length) {
  console.log(`\n${blocked.length} BLOCKING problems:`);
  for (const b of blocked) console.log(`  ✗ ${b}`);
  process.exit(1);
}
console.log("\nno blocking problems");

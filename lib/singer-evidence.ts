import "server-only";

import rawEvidence from "@/data/singer-evidence.json";
import { SINGERS, type Singer } from "@/lib/singers-data";

/** Server-only provenance for individually reviewed singer profiles. */
export type SingerReviewStatus = "pending" | "reviewed" | "disputed";
export type EvidenceConfidence = "limited" | "moderate" | "high";
export type EvidenceSourceKind =
  | "artist-biography"
  | "artist-study"
  | "coach-interview"
  | "expert-analysis"
  | "expert-profile"
  | "first-person-statement"
  | "licensed-score"
  | "song-analysis";

export interface SingerEvidenceSource {
  title: string;
  publisher: string;
  url: string;
  accessedAt: string;
  supportedClaim: string;
  scope: string;
  confidence: EvidenceConfidence;
  kind: EvidenceSourceKind;
  song?: string;
  performance?: string;
  octaveConvention?: string;
}

export interface SingerEvidence {
  status: SingerReviewStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  voiceTypeCopy?: string;
  sources: SingerEvidenceSource[];
}

export interface SingerEvidenceGroup {
  label: string;
  song?: string;
  performance?: string;
  sources: SingerEvidenceSource[];
}

const PENDING_EVIDENCE: SingerEvidence = { status: "pending", sources: [] };
const REVIEW_STATUSES = new Set<SingerReviewStatus>([
  "pending",
  "reviewed",
  "disputed",
]);
const CONFIDENCES = new Set<EvidenceConfidence>(["limited", "moderate", "high"]);
const SOURCE_KINDS = new Set<EvidenceSourceKind>([
  "artist-biography",
  "artist-study",
  "coach-interview",
  "expert-analysis",
  "expert-profile",
  "first-person-statement",
  "licensed-score",
  "song-analysis",
]);
const KNOWN_SLUGS = new Set(SINGERS.map((singer) => singer.slug));

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredText(value: unknown, path: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${path} must be a non-empty string`);
  }
  return value.trim();
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function requiredDate(value: unknown, path: string): string {
  const date = requiredText(value, path);
  if (!validDate(date)) throw new Error(`${path} is an invalid date`);
  return date;
}

function httpUrl(value: unknown, path: string): string {
  const url = requiredText(value, path);
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error();
    }
  } catch {
    throw new Error(`${path} must use an HTTP(S) URL`);
  }
  return url;
}

function optionalText(value: unknown, path: string): string | undefined {
  if (value === undefined) return undefined;
  return requiredText(value, path);
}

function claimsLicensedScoreProof(text: string): boolean {
  const proofVerb = "prove|establish|demonstrate|confirm|verify|show";
  const withoutExplicitLimitations = text.replace(
    new RegExp(`\\b(?:does|do|did)?\\s*not\\s+(?:${proofVerb})(?:s|d|es)?\\b`, "gi"),
    "",
  );
  return new RegExp(
    `\\b(?:${proofVerb})(?:s|d|es)?\\b[^.]*\\b(?:full[- ]career|career[- ]wide|physiological|tessitura|voice type|classical type|type)\\b`,
    "i",
  ).test(withoutExplicitLimitations);
}

function validateSource(value: unknown, path: string): SingerEvidenceSource {
  if (!isRecord(value)) throw new Error(`${path} must be an object`);

  const kind = requiredText(value.kind, `${path}.kind`);
  if (!SOURCE_KINDS.has(kind as EvidenceSourceKind)) {
    throw new Error(`${path}.kind is not a supported source kind`);
  }
  if (typeof value.scope !== "string" || !value.scope.trim()) {
    throw new Error(`${path} is missing scope`);
  }
  const source: SingerEvidenceSource = {
    title: requiredText(value.title, `${path}.title`),
    publisher: requiredText(value.publisher, `${path}.publisher`),
    url: httpUrl(value.url, `${path}.url`),
    accessedAt: requiredDate(value.accessedAt, `${path}.accessedAt`),
    supportedClaim: requiredText(value.supportedClaim, `${path}.supportedClaim`),
    scope: value.scope.trim(),
    confidence: requiredText(value.confidence, `${path}.confidence`) as EvidenceConfidence,
    kind: kind as EvidenceSourceKind,
    song: optionalText(value.song, `${path}.song`),
    performance: optionalText(value.performance, `${path}.performance`),
    octaveConvention: optionalText(value.octaveConvention, `${path}.octaveConvention`),
  };

  if (!CONFIDENCES.has(source.confidence)) {
    throw new Error(`${path}.confidence is not a supported confidence level`);
  }
  if (source.kind === "licensed-score") {
    if (!source.song) throw new Error(`${path} licensed scores require a song`);
    if (!/(song|arrangement|written)/i.test(source.scope)) {
      throw new Error(`${path} licensed score scope must be limited to the song arrangement`);
    }
    if (claimsLicensedScoreProof(source.supportedClaim) || claimsLicensedScoreProof(source.scope)) {
      throw new Error(
        `${path} licensed score cannot prove a full-career range, physiology, tessitura, or voice type`,
      );
    }
  }
  return source;
}

/**
 * Runtime validation makes the JSON data a strict boundary rather than an
 * unchecked editorial blob. Exported for focused tests and future data edits.
 */
export function validateSingerEvidence(value: unknown): Record<string, SingerEvidence> {
  if (!isRecord(value)) throw new Error("singer evidence must be keyed by singer slug");

  const validated: Record<string, SingerEvidence> = {};
  for (const [slug, rawRecord] of Object.entries(value)) {
    if (!KNOWN_SLUGS.has(slug)) throw new Error(`unknown singer slug "${slug}"`);
    if (!isRecord(rawRecord)) throw new Error(`evidence for ${slug} must be an object`);

    const status = requiredText(rawRecord.status, `${slug}.status`);
    if (!REVIEW_STATUSES.has(status as SingerReviewStatus)) {
      throw new Error(`${slug}.status is not a supported review status`);
    }
    if (!Array.isArray(rawRecord.sources)) throw new Error(`${slug}.sources must be an array`);
    const sources = rawRecord.sources.map((source, index) =>
      validateSource(source, `${slug}.sources[${index}]`),
    );
    const evidence: SingerEvidence = {
      status: status as SingerReviewStatus,
      reviewedBy: optionalText(rawRecord.reviewedBy, `${slug}.reviewedBy`),
      reviewedAt: rawRecord.reviewedAt === undefined
        ? undefined
        : requiredDate(rawRecord.reviewedAt, `${slug}.reviewedAt`),
      voiceTypeCopy: optionalText(rawRecord.voiceTypeCopy, `${slug}.voiceTypeCopy`),
      sources,
    };

    if (evidence.status !== "pending") {
      if (!evidence.reviewedBy || !evidence.reviewedAt) {
        throw new Error(`${slug} ${evidence.status} evidence requires a reviewer and review date`);
      }
      if (!evidence.voiceTypeCopy) {
        throw new Error(`${slug} ${evidence.status} evidence requires honest voice-type copy`);
      }
      if (!sources.length) throw new Error(`${slug} ${evidence.status} evidence requires sources`);
    }
    validated[slug] = evidence;
  }
  return validated;
}

const SINGER_EVIDENCE = validateSingerEvidence(rawEvidence);

/** Returns a concrete review record or the honest unreviewed fallback. */
export function getSingerEvidence(slug: string): SingerEvidence {
  return SINGER_EVIDENCE[slug] ?? PENDING_EVIDENCE;
}

export function getSingerReviewStatus(slug: string): SingerReviewStatus {
  return getSingerEvidence(slug).status;
}

/** `disputed` still means a human reviewed the record and its sources. */
export function isSingerReviewed(slug: string): boolean {
  return getSingerReviewStatus(slug) !== "pending";
}

/**
 * Human-facing voice-type wording. Pending entries must not turn a catalog
 * label into an unreviewed conclusion.
 */
export function voiceTypeEvidenceCopy(
  singer: Pick<Singer, "slug" | "name" | "voiceType">,
): string {
  const evidence = getSingerEvidence(singer.slug);
  return (
    evidence.voiceTypeCopy ??
    `The catalog lists ${singer.name} as a ${singer.voiceType.toLowerCase()}; individual evidence review is pending.`
  );
}

/** Groups source cards by the song/performance they document. */
export function groupEvidenceSources(
  sources: readonly SingerEvidenceSource[],
): SingerEvidenceGroup[] {
  const groups = new Map<string, SingerEvidenceGroup>();
  for (const source of sources) {
    const key = source.song
      ? `song:${source.song}|${source.performance ?? ""}`
      : "general";
    const existing = groups.get(key);
    if (existing) {
      existing.sources.push(source);
      continue;
    }
    groups.set(key, {
      label: source.song ? `Song evidence: ${source.song}` : "General source evidence",
      song: source.song,
      performance: source.performance,
      sources: [source],
    });
  }
  return [...groups.values()];
}

/** A sitemap date exists only when a human has explicitly reviewed the record. */
export function getSingerLastModified(slug: string): string | undefined {
  const evidence = getSingerEvidence(slug);
  return isSingerReviewed(slug) ? evidence.reviewedAt : undefined;
}

# Sing Dormant Lead Intake Implementation Plan

**Goal:** Prepare a disabled reliable sender without altering legitimate auth/payment flows.
**Architecture:** Explicit provider adapters, durable atomic Redis outbox, separately gated transport; no production registration.
**Spec:** `docs/superpowers/specs/2026-10-25-lead-intake-dormant-design.md`

## Dependency gate

- [x] Inspect current main and reviewed sender source; record unsafe differences.
- [ ] Pin the Studio owner's versioned contract SHA and repository fixtures. Wire schema implementation must wait for this artifact.

## Task 1: Contract and builders

Files: `lib/intake/events.ts`, `lib/intake/events.test.ts`, `tests/fixtures/intake/`.
- [ ] Import synthetic versioned contract fixtures with provenance and hash.
- [ ] Write failing allowlist tests using secret bait fields, consent/auth lifecycle and invalid primary email.
- [ ] Implement exact approved builders and deterministic one-way provider event identities; reject arbitrary detail maps.
- [ ] Run fixture and builder tests; commit.

## Task 2: Durable outbox and transport

Files: `lib/intake/outbox.ts`, `lib/intake/outbox.test.ts`, `lib/intake/transport.ts`, `lib/intake/transport.test.ts`.
- [ ] Write failing fault-injection tests for atomic dedupe, lease interruption, persistence failure, ambiguous ACK, timeout and config/auth/schema rejection recovery.
- [ ] Implement storage adapter with atomic enqueue/claim/transition; no loss TTL for undelivered accepted events.
- [ ] Implement explicitly disabled-by-default transport with bounded network and response parsing; acknowledge delivery only on approved durable ACK.
- [ ] Test spam/canary isolation and zero network/store activity when disabled; commit.

## Task 3: Dormant provider integration and recovery

Files: `app/api/webhooks/clerk/route.ts`, `app/api/webhooks/stripe/route.ts`, adjacent tests, operator recovery code and documentation. Avoid proxy, redeem and account model edits unless review proves essential.
- [ ] Verify installed Next documentation before route implementation, per AGENTS.md.
- [ ] Add failing verified provider-event tests and existing-flow regression tests.
- [ ] Implement adapters with explicit enable guard; no registration, external sends, credentials, migration or auth trigger changes.
- [ ] Provide bounded recovery inventory/requeue tooling without executing it against production.
- [ ] Run focused checks and full test suite; obtain independent review.
- [ ] Rebase current main, rerun applicable current-head CI, open/update separate PR and merge reviewed dormant code only.

## Review focus

Pending payments cannot imply paid fulfillment; unverified account contact cannot imply consent; unknown fields never leave; bad auth/config never becomes delivered; crashes after persistence preserve replay. Each is covered by tasks above. Activation remains separately held.

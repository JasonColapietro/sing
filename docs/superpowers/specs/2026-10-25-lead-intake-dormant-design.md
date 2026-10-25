# Sing dormant lead intake sender

Status: specification; activation on hold. Baseline: `147e7208a0d0e3d8fb6ed18641f7f677a70f2b01`.

## Intent and authorized boundary

Selectively replace the reviewed sender branch `d010c1cba3c0a3be445c99d830fd6ab6e70ba615` with a dormant integration that reports accepted Sing purchases and account lifecycle events reliably. Preserve Clerk as account authority and the existing Stripe entitlement, comp redemption and refund behavior. No new account or consent records. No live webhook registration, credentials, RLS changes, migrations, production operations or customer sends. Tests use synthetic provider events and injected network/store implementations.

## Existing behavior and rejected alternatives

Main has Clerk middleware and account sync, but no Clerk or Stripe intake webhook routes. Checkout/entitlement already own payment behavior. The stale branch adds those two routes plus comp forwarding and a broad sender. Blind merging would acknowledge hub 401/400/413 as permanent success, lack durable delivery state, and forward phone/invalid-email rescue fields unnecessarily. Treating provider retention as an outbox is insufficient: replay windows expire and the sender has no local status/recovery inventory. Inline retries alone do not survive process termination.

Chosen approach: dormant provider adapters, explicit event builders, and an atomic durable outbox using the existing Redis integration. Provider webhook replay is an additional recovery mechanism. Keep redeem unchanged initially: it has no buyer contact and its comp code/Pro credential must never leave the app. Keep middleware/framework/accessibility files under their current owner's control.

## Contract dependency

Implementation of the wire envelope is blocked until the Studio owner publishes a versioned repository contract and fixtures that address the reviewed acceptance requirements. The old branch references `docs/intake/CONTRACT.md` but does not pin its version. Do not infer a replacement from stale types. Historical artifact inspected read-only: Studio `7caec4e5b13ff593ca1e4addf372d6ac8ee635c7`, `docs/intake/CONTRACT.md` and `src/lib/intake/contract.ts`. It documents shared-Supabase auth as hub-owned (Sing uses Clerk), permits arbitrary details/rescue fields and lacks versioned failure-alert/lifecycle semantics; it is evidence, not approval to integrate or register Clerk hooks. Require the owner to explicitly reconcile Sing Clerk account events with shared identity/consent ownership before deciding whether those adapters belong here. Required artifact: immutable commit SHA, source/property allowlist, schema version, exact field schemas, authentication/signing and timeout rules, acknowledgement durability, dedupe/lifecycle scope, spam/canary capacity isolation, recoverable config-error semantics and synthetic accepted/rejected fixtures. Record its path and SHA in both spec and fixtures before implementing adapters.

## Local event allowlists and consent

Only verified Clerk `user.created` and `session.created` events, and paid Stripe `checkout.session.completed` events, qualify. The metadata.app exactly `suede-sing` restriction applies to Stripe checkout events; Clerk events use the existing verified account identity. Pending asynchronous payment events must not imply successful purchase; add a separately reviewed transition only when the contract supports it. Clerk payloads produce account-created and session-created events referencing the existing Clerk account; they do not create a second user or expand consent. Prefer verified primary email only if required for the requested service; omit phone, IP, device, raw provider payload, metadata maps and profile details. Never rescue invalid email into an unvalidated details bag.

Each builder constructs a fresh explicit object; reject unknown input fields at the serialized boundary. Payment detail allowlist: product/plan enum, integer minor-unit amount, currency enum/validated code, payment lifecycle status. No comp codes, Pro keys, checkout/session/subscription/payment-intent identifiers that can authorize entitlement, passwords, tokens or secrets. Stable event identifiers may use a one-way deterministic digest of provider identifiers; do not place access-bearing identifiers in summaries or logs.

## Delivery and lifecycle

An explicit enable flag defaults false independently of existing secrets. Disabled paths perform no outgoing request or intake persistence. Enabled adapters verify provider authenticity and reject invalid signatures; they cannot alter signup/payment outcomes. Persist a validated accepted event atomically before delivery acknowledgement. Stable provider identity deduplicates redelivery without resetting delivery progress. Do not acknowledge failed persistence as accepted. A drain/replay operation is authenticated and bounded, shipped as code only without registration or scheduling.

Failure alerts are a distinct local event class with their own explicit schema, durable capture, retention/reconciliation policy and reserved capacity; the revised contract must define delivery and lifecycle semantics before implementing them. Alerts must contain safe codes and event references rather than customer payloads or exception bodies.

Outbox state: pending, delivering with bounded lease, delivered after the contract's durable ACK only, blocked for recoverable schema/config/auth rejection. Transient failure uses bounded exponential backoff and retains the row; 401/config errors remain blocked and observable until an operator repairs configuration and requeues. Track attempts, safe status/error code and next due time, never raw exception/provider response bodies. No TTL on undelivered accepted rows without an approved retention/reconciliation policy. Handle ambiguous network delivery through identical idempotency identity on retry. Atomic claims and lease recovery prevent concurrent drainers losing events.

Spam and canary do not enter the genuine-lead outbox or consume its quota. No public route accepts a caller-defined intake event. Minimize durable personal data to the approved field schema; retention/deletion must match the source's consent. Login reporting must not infer marketing permission.

## Required synthetic verification

- Disabled/unconfigured paths invoke neither network nor store and do not change existing entitlement/signup behavior.
- Unknown metadata, secret/token/password bait fields, phone and unverified email never serialize or log.
- Duplicate Clerk/Stripe deliveries and retry after ambiguous ACK preserve stable identity and one durable row.
- Store rejection/crash before ACK, timeout, 429, 5xx, 401, 400, malformed ACK and interrupted lease retain recoverable state.
- Spam/canary bursts cannot claim genuine queue capacity.
- Independent review checks auth reconciliation, data minimization, durable state and unchanged fulfillment/refunds.
- Rebase against current main and rerun relevant/full local checks and current-head CI before merge.

## Activation hold

Merging dormant code does not authorize provisioning or activation. Separate approval is required for hub prerequisites, credentials, production storage/retention, webhook registrations, enabling forwarding and any real customer data delivery.

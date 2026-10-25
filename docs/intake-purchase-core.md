# Dormant Sing purchase intake

Prepared against draft Studio code commit `0b33f45a0bdde87b8e7746666d6200c17d0c4b82`, `src/lib/intake/contract.ts`. This is draft conformance, not protocol stabilization or activation approval. Shared supplemental fixture is copied unchanged in `tests/fixtures/intake-contract-v1.json` (historical schema commit b13442; normative TypeScript unchanged); official signing vector is `tests/fixtures/owner-v1-signing.json`.

## Implemented scope

The new Stripe route verifies an independently configured signature and awaits atomic Redis admission for paid Sing checkouts. It does not grant entitlement, refund, change accounts or notify customers. Existing checkout, entitlement, refund and Clerk flows are unchanged. No webhook is registered. Nothing is sent inline to Studio. All contact details and arbitrary metadata are omitted. Stable opaque purchase identity derives from checkout session identity, never notification identity; event time comes from checkout creation.

The local queue uses the existing Redis REST integration with a four-second hard deadline. Admission, claim and settlement are Redis Lua transactions in a single hash slot. Accepted rows have no loss TTL; delivered receipts retain opaque idempotency identity and remove purchase content. Pending and blocked rows count against the bounded capacity (default 1000); full or unavailable admission returns 503 for provider retry. Canary/spam and unknown fields cannot enter this purchase-only queue. An interrupted claim becomes eligible after its 30-second lease. A late worker cannot overwrite a newer receipt. Original validated bytes are retained unchanged across attempts.

Transport uses fixed source `sing`, fixed property `sing.suedeai.ai`, fixed HTTPS hub destination, fresh HMAC per attempt and one four-second hard deadline including response-body parsing. Only `{accepted:true,duplicate:boolean}` with status 202 marks delivered. HTTP400/401/403/413 become blocked, preserving the row for explicit repair; timeout, malformed ACK, 429 and server failure remain pending with bounded backoff and Retry-After support.

## Activation hold and operator seam

All runtime gates independently require `SING_INTAKE_ENABLED=1` and `SUEDE_INTAKE_CONTRACT` exactly the pinned draft commit. The webhook additionally requires `SING_STRIPE_INTAKE_WEBHOOK_SECRET` and the existing Redis REST credentials. Existing environment variables alone cannot activate intake. These variable names describe code interfaces only: this change creates no credentials or configuration and grants no approval to set them.

No worker, cron route or schedule is installed. A separately approved worker can construct `createOutbox(storeCommand(env))`, call bounded `drain(env)` (one claim), and explicitly `repair(id,env)` after fixing blocked authentication/configuration. Repair preserves identity and payload. Inspect the `sing:{intake-v1}:rows` hash's state/attempt/code fields in a restricted operator context; do not expose payloads in logs. Storage failures are propagated, never acknowledged as durable acceptance. Retention and delivered receipt ledger growth require review before activation. No automatic pruning is supplied.

## Concrete remaining dependencies

Clerk signup/login ownership still requires hub reconciliation with existing shared identity/consent paths. No new account hooks or auth triggers were added. The draft wire schema has no failure-alert kind or lifecycle/status field. Those events must not be tunneled through note/message fields; their wire adapters remain blocked until the hub owner versions those semantics. The initial spec/plan remains a requirements record; only the paid-purchase slice is implemented here. Cross-repo end-to-end delivery and production activation are held.

## Synthetic verification

`REDIS_SERVER_BIN=/path/to/redis-server REDIS_CLI_BIN=/path/to/redis-cli npm test` runs actual Lua against a temporary private Unix socket with TCP port zero and persistence disabled. No production Redis or provider services are contacted. Without those explicit binary paths the Redis integration cases skip; unit and route tests still run. Locally verified against Redis7.4.6 built from source tag commit4b03ddfdac5a5c007358df8d08873f508f2fbfe3. Tests cover admission dedupe/capacity, non-genuine rejection, wrong-secret repair, ambiguous network replay, expired leases and stale worker settlement, hard deadlines, signed route admission and default-disabled behavior.

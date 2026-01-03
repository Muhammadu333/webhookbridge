# WebhookBridge (Demo / Case Study)

WebhookBridge is a Node.js reference service that demonstrates **secure and reliable webhook ingestion**:
- signature verification hooks
- idempotency (dedupe + replay safety)
- background processing with retries
- event status tracking for ops visibility

This is a **demo project** (not a client claim).

## Why this matters (fintech/SaaS)

Webhooks often power critical workflows (payments, KYC, subscriptions). The hard parts are:
- preventing replay/duplicate side effects
- handling event storms safely
- verifying authenticity (signatures)
- keeping processing reliable (retries, dead-letter patterns)

## Threat model (high level)

**Primary assets**
- downstream side effects (integrity): “don’t apply the same event twice”
- webhook signing secret (authenticity)
- event payloads (may include sensitive metadata)

**Main attack surfaces**
- public webhook endpoint (high volume, untrusted input)
- signature verification logic (bypass risk)
- worker/retry logic (poison messages, infinite retries)
- logs/monitoring (data leakage)

**Abuse cases → mitigations (examples)**
- Replay / duplicate delivery → idempotency keys + unique constraints + safe processing
- Event storms (DoS) → rate limiting + payload size limits + fast 2xx responses
- Invalid signatures → strict verification + timing-safe comparisons
- Payload bombs / parsing abuse → size limits + raw body handling
- Poison events causing retry loops → max attempts + “dead-letter” status

## Run locally

### 1) Start Postgres
`docker compose up -d db`

### 2) Configure env
Copy `./.env.example` → `./.env`

### 3) Install + migrate + run
`npm install`
`npm run db:migrate`
`npm run dev`

## Test the webhook

1) Generate a signature with the same secret as `.env` (HMAC-SHA256 of raw JSON body).
2) POST an event:

`POST http://localhost:4010/webhooks/provider-x`
- headers:
  - `content-type: application/json`
  - `x-provider-signature: <hex>`
  - `idempotency-key: evt_123`
- body: `{ "type": "payment.succeeded", "data": { "amount": 5000 } }`

View events: `GET http://localhost:4010/events`

## Security considerations (implementation notes)

- Use TLS in production and keep signing secrets out of logs.
- Always apply idempotency at the persistence layer (unique constraints), not only in memory.
- Separate “public ingestion” from “internal processing”.
- Tune rate limits and max payload size to your expected provider behavior.

## Render note (DB connectivity)

If you use Render Postgres, prefer the **Internal Database URL** for `DATABASE_URL`. If you use an External URL, SSL is typically required.

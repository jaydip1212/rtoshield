# RTOShield

Open-source AI and deterministic RTO (Return To Origin) risk and fake-order
prevention for ecommerce brands.

RTOShield connects Shopify/WooCommerce, REST order ingestion, CSV brand
intelligence, first-party device signals, pincode/RTO history, and an autonomous
investigation agent. It scores each order for fake/COD/RTO risk and recommends
the safest next manual action.

RTOShield never auto-cancels. The deterministic checker and agent only
recommend; humans approve every verify/hold/ship decision.

## Features

- Premium rounded-card dashboard UI.
- Full app shell: Dashboard, Orders, Order Detail, Brand Brain, Webhooks, Risk
  Rules, Knowledge, Settings/API Keys.
- Brand Brain: brands upload their own system instructions, brand context,
  verification policy, SOP/RTO notes, and pincode intelligence CSV.
- Deterministic non-AI checker: pass/watch/fail evidence checks for pincode RTO
  rate, city/pincode mismatch, customer RTO history, order velocity, pincode COD
  spike, device reuse, and VPN/proxy signal.
- Autonomous agent: uses deterministic evidence first, uploaded brand data
  second, and an LLM explanation third. The agent improves as new data is added.
- Shopify/WooCommerce webhook manager with HMAC-verified webhook URLs.
- API-key management with public SDK keys and one-time secret reveal.
- Supabase Postgres schema with RLS migrations, pgvector RAG, seed data, SDK,
  REST API, optional worker, tests, and privacy docs.

## Stack

- Next.js App Router, TypeScript, Tailwind CSS
- Supabase Postgres / Auth / RLS with pgvector
- postgres.js data access, Drizzle schema mirror
- BullMQ + Redis optional worker; inline scoring fallback for local dev
- OpenAI-compatible LLM/embedding provider abstractions, mocked by default

## Quick start (one command)

You need Node.js 18+ and Docker.

```bash
npm install
docker compose up -d     # local Postgres with pgvector on :5432
npm run bootstrap        # writes .env.local, applies migrations, seeds demo data
npm run dev              # http://localhost:3000
```

`npm run bootstrap` runs three steps for you:

1. `setup`   - creates `.env.local` from `.env.example` and generates secrets.
2. `migrate` - applies every SQL file in `supabase/migrations`.
3. `seed`    - inserts a demo brand, orders, pincode intel, an API key, a webhook.

The seed prints one API secret key (shown once) and one public SDK key.

In dev mode the app runs without login and automatically opens the seeded
organization.

### Manual setup

If you already have a Postgres database (for example Supabase), skip Docker and
set `DATABASE_URL` yourself:

```bash
npm install
npm run setup            # creates .env.local with generated secrets
# edit .env.local and set DATABASE_URL to your database
npm run db:push          # apply migrations
npm run seed             # optional demo data
npm run dev
```

## Configuration

All configuration lives in `.env.local` (generated from `.env.example`).
Only `DATABASE_URL` is required; everything else is optional and falls back to
safe local defaults or mocks.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Postgres connection string |
| `HASH_PEPPER` | Yes | Global pepper added to per-org PII salts |
| `TOKEN_ENCRYPTION_KEY` | Yes | Base64 32-byte key for AES-256-GCM token encryption |
| `WEBHOOK_SECRET` | Yes | Shared secret for verifying store webhooks (HMAC) |
| `REDIS_URL` | No | Enables BullMQ async scoring; inline scoring if unset |
| `LLM_API_KEY` | No | OpenAI-compatible LLM; mocked if unset |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No | Supabase Auth (production) |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Server-only privileged access |

`npm run setup` generates `HASH_PEPPER`, `TOKEN_ENCRYPTION_KEY`, and
`WEBHOOK_SECRET` automatically.

## Main routes

| Route | What it does |
| --- | --- |
| `/` | Marketing landing page |
| `/dashboard` | Command dashboard: KPIs, risky orders, pincode intelligence |
| `/orders` | Orders table with risk badges and filters |
| `/orders/[id]` | Risk reasons, non-AI checker, human decision actions, activity log |
| `/brand` | Brand Brain: instructions, context, SOP/RTO notes, pincode CSV |
| `/webhooks` | Shopify/WooCommerce webhook endpoint manager |
| `/rules` | Per-org risk-rule weights and enable/disable |
| `/documents` | Uploaded RAG knowledge base |
| `/settings` | API keys, retention, data deletion |

## Brand Brain data upload

In `/brand`, merchants can add:

1. Custom system instructions: how the agent should reason for that brand.
2. Brand context: product type, regions, couriers, normal order values.
3. Verification policy: WhatsApp/call/prepaid/manual review rules.
4. Brand data documents: SOPs, courier notes, RTO reports, fraud observations.
5. Pincode intelligence CSV with columns:

```csv
pincode,city,zone,rto_rate,cod_success_rate,avg_delivery_days,notes
400001,Mumbai,West,0.18,0.82,2.4,Usually safe
800001,Patna,East,0.42,0.58,5.1,Verify COD before ship
```

This data is tenant-scoped and used by the deterministic checker and agent on
future orders.

## Deterministic non-AI checker

The checker runs before AI and labels evidence as `pass`, `watch`, or `fail`:

- pincode RTO benchmark
- city/pincode consistency
- customer prior RTO and successful delivery history
- customer order velocity
- pincode COD spike
- device COD reuse
- VPN/proxy/datacenter signal

The LLM agent is only used to explain evidence, find contradictions, and draft
verification scripts. It does not invent facts.

## Risk engine

`scoreOrder(input, weights)` returns
`{ score, risk_level, reasons[], recommended_action }`.

| Signal | Weight |
| --- | ---: |
| Phone has prior RTO | +20 |
| Address has prior RTO | +15 |
| Same device, multiple COD | +15 |
| IP velocity | +12 |
| IP/city mismatch | +10 |
| VPN/proxy/datacenter | +10 |
| Incomplete address | +8 |
| High-RTO pincode | +8 |
| First-time high COD | +8 |
| NDR history | +7 |
| Identity mismatch | +6 |
| Order velocity | +5 |
| Prepaid | -10 |
| Returning successful | -8 |
| Already verified | -5 |

Score levels: `<30 low`, `30-54 medium`, `55-79 high`, `>=80 critical`.

## API and SDK

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/api/orders` | API key `orders:write` | Ingest/upsert order, enqueue scoring |
| GET | `/api/orders` | API key `orders:read` | List org orders |
| POST | `/api/track` | Public key | First-party checkout/device signal |
| POST | `/api/webhooks/shopify?pk=...` | HMAC + public key | Shopify order webhook |
| POST | `/api/webhooks/woocommerce?pk=...` | HMAC + public key | WooCommerce order webhook |

```html
<script src="/sdk/rtoshield.js"></script>
<script>
  RTOShield.init({ publicKey: "rtos_pk_...", endpoint: "/api/track" });
  RTOShield.trackCheckout();
  RTOShield.identifyOrder({ orderId: "ORDER-123" });
</script>
```

The SDK is first-party only: no GPS, no canvas/audio fingerprinting, no raw IP
storage.

## Optional worker

Inline scoring works without Redis. To enable async scoring jobs:

```bash
REDIS_URL=redis://localhost:6379 npm run worker
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run setup` | Create `.env.local` with generated secrets |
| `npm run bootstrap` | setup + migrate + seed |
| `npm run db:push` | Apply migrations |
| `npm run seed` | Insert demo data |
| `npm run worker` | Run the BullMQ scoring worker |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm test` | Run the test suite |

## Privacy and security

- Hash phone/email/address/IP/device token with per-org salt and global pepper.
- Store minimal encrypted PII only where needed.
- Tenant-scoped tables with RLS policies.
- Service role is server-only.
- HMAC-verified webhooks.
- Audit logs for sensitive actions.
- Data retention and deletion controls.
- AI recommendations always require manual review.

See [docs/PRIVACY.md](docs/PRIVACY.md) and
[docs/AGENT_SYSTEM.md](docs/AGENT_SYSTEM.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT. See [LICENSE](LICENSE).

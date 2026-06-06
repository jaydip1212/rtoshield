# Privacy & compliance notes

RTOShield is designed to reduce RTO/fake-order losses **without** invasive tracking. These are product requirements, not optional extras.

## Core principles

1. **First-party only.** The SDK runs on the merchant's own domain and posts to the merchant's own `/api/track`. There is no cross-site/third-party tracking network.
2. **Disclosure required.** Merchants must disclose this data collection in their own privacy policy. A template clause is provided below.
3. **No covert fingerprinting.** No canvas, no audio, no WebGL fingerprinting. No precise GPS/geolocation. Screen is reported only as a coarse category (mobile/tablet/desktop).
4. **Hash PII.** Phone, email, address, IP, session_id, and device_token are hashed (HMAC-SHA256) with a **per-organization salt** plus a global pepper before storage. Raw values are not persisted by the ingestion path.
5. **Minimal + encrypted PII.** Store connection tokens are encrypted at rest (AES-256-GCM). The Supabase service-role key is used **server-side only** and never exposed to the browser.
6. **Tenant isolation.** Every tenant table has `org_id` and **Row Level Security** enabled and forced; policies restrict rows to the caller's organization.
7. **Retention.** Each org has a configurable `retention_days`. A scheduled job should purge raw signals beyond the window.
8. **Right to deletion.** A data-deletion endpoint must remove a customer's hashed identifiers and associated signals on request.
9. **Audit everything.** Sensitive mutations are written to an append-only `audit_logs` table.
10. **Recommend, never auto-act.** The AI/risk engine never cancels or holds orders. It outputs a recommendation for human review.

## Sample disclosure clause (merchant privacy policy)

> To prevent fraud and failed deliveries, we and our fraud-prevention provider collect technical signals from your device during checkout (such as a first-party device identifier, coarse network/location region, and browser/timezone information). We do not use covert fingerprinting or collect precise location. Personal identifiers are stored in hashed form. You may request deletion of this data by contacting us.

## Implementation checklist

- [ ] RLS enabled + forced on all tenant tables (see migration).
- [ ] Service-role key only in server runtime env, never in client bundles.
- [ ] All PII hashed with per-org salt before insert.
- [ ] Store tokens encrypted with `TOKEN_ENCRYPTION_KEY`.
- [ ] Webhooks verified via HMAC signature.
- [ ] Rate limiting on all public endpoints.
- [ ] Retention purge job scheduled.
- [ ] Data deletion endpoint implemented & tested.
- [ ] Audit logging on sensitive actions.
- [ ] No auto-cancel: risk decisions are advisory only.

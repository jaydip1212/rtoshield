# RTOShield first-party SDK

The SDK is a small, dependency-free script that collects coarse, non-identifying
checkout signals and sends them to your RTOShield `/api/track` endpoint. It is
served publicly from your RTOShield deployment at:

```
https://<your-rtoshield-host>/sdk/rtoshield.js
```

(The file lives at `public/sdk/rtoshield.js` in this repo; Next.js serves
everything under `public/` at the site root.)

## Install

### Option A - data attributes (no inline JS)

Drop one tag on your checkout/thank-you page. Replace the host and public key.

```html
<script
  src="https://app.example.com/sdk/rtoshield.js"
  data-public-key="rtos_pk_xxx"
  data-endpoint="https://app.example.com/api/track"
  data-auto="checkout"
  defer></script>
```

### Option B - explicit API

```html
<script src="https://app.example.com/sdk/rtoshield.js" defer></script>
<script>
  RTOShield.init({
    publicKey: "rtos_pk_xxx",
    endpoint: "https://app.example.com/api/track"
  });
  RTOShield.trackCheckout();
  RTOShield.identifyOrder({ orderId: "ORDER-123" });
</script>
```

If the SDK is served from the same origin as your store, `endpoint` defaults to
`/api/track` and can be omitted.

## Subresource Integrity (recommended)

Pin the exact file you reviewed so a tampered script cannot run. Compute the
hash after each SDK update:

```bash
curl -s https://app.example.com/sdk/rtoshield.js \
  | openssl dgst -sha384 -binary | openssl base64 -A
```

```html
<script
  src="https://app.example.com/sdk/rtoshield.js"
  integrity="sha384-<hash>"
  crossorigin="anonymous"
  defer></script>
```

## What it collects

- A first-party device token (random UUID in `localStorage`).
- A per-page session id.
- Coarse signals: user agent, language, timezone, screen category
  (mobile/tablet/desktop), and the referrer origin only.
- UTM parameters from the URL.

## What it never does

- No canvas / audio / WebGL fingerprinting.
- No GPS or precise geolocation.
- No exact screen dimensions.
- No cookies and no third-party tracking.
- No raw IP (the server derives and hashes the IP).

## Security model

The public key is not a secret - it is embedded in the storefront and only
grants write-only access to `/api/track`. The server is the trust boundary:

- Strict schema validation; unknown fields are rejected.
- Per-field length caps and an 8 KB body limit.
- Per-IP rate limiting.
- Origin allow-listing: once you connect a store domain, only that origin may
  post signals from a browser. Unconfigured orgs are open for onboarding;
  `localhost` is allowed only in development.
- IP is hashed with a per-org salt plus a global pepper; raw IP is not stored.

Note: origin checks and rate limits raise the bar against browser-based abuse,
but HTTP headers can be forged by non-browser clients. Treat device signals as
advisory. The authenticated, secret-keyed `/api/orders` endpoint is the strong
trust boundary for order data.

Client safeguards: the script runs in strict mode, exposes a single frozen
`window.RTOShield`, refuses an invalid public key, refuses to downgrade from
HTTPS to HTTP, never reads cookies, and never throws into the host page.

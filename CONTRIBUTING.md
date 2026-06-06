# Contributing to RTOShield

Thanks for your interest in improving RTOShield.

## Development setup

```bash
npm install
docker compose up -d
npm run bootstrap
npm run dev
```

See the [README](README.md) for full setup options.

## Before opening a pull request

Run all checks locally and make sure they pass:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Guidelines

- Keep changes focused; one logical change per pull request.
- Match the existing code style (tabs, no semicolons in TypeScript files).
- The risk engine and deterministic checker are advisory only. Never add logic
  that auto-cancels or silently holds orders.
- Respect tenant isolation: every database query must filter by `org_id`.
- Never log or persist raw PII. Hash phone/email/address/IP/device tokens.
- Add or update tests when you change scoring or data-handling behavior.

## Reporting security issues

Do not open public issues for security vulnerabilities. Report them privately to
the maintainers instead.

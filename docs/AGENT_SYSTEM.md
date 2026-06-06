# RTOShield autonomous agent system

RTOShield has two layers:

1. **Deterministic non-AI checker** — decides what is true, false, or unknown from real evidence:
   - uploaded pincode RTO intelligence
   - customer RTO / successful-delivery history
   - order velocity
   - COD spikes by pincode
   - device token reuse
   - hashed IP velocity
   - city/pincode mismatch
   - VPN/proxy/device signals

2. **Autonomous investigation agent** — explains the evidence and recommends a human action.

The agent never auto-cancels or silently holds orders. It only recommends actions such as WhatsApp verification, call verification, prepaid deposit request, manual review, or ship normally.

## Merchant-controlled instructions

Brands can edit the agent from `/brand`:

- Custom system instructions
- Brand context
- Verification policy
- Uploaded SOP / courier notes / RTO reports
- Uploaded pincode intelligence CSV

These inputs are merged with hard RTOShield safety rules. Merchant instructions cannot override privacy or human-review requirements.

## Daily learning model

The app stores uploaded brand data and pincode intelligence as tenant-scoped database rows. When new order data, RTO reports, or pincode stats are uploaded, the deterministic checker and agent use the new evidence immediately on future reviews.

## Privacy

- No raw phone/email/address/IP is stored by default.
- Per-org salts + pepper are used for hashes.
- Device/IP signals are first-party only.
- No GPS, canvas, or audio fingerprinting by default.
- Every sensitive action is audit-logged.

import type { Metadata } from "next"
import { MarketingShell, Hero, FeatureGrid, SeoFAQ } from "../marketing-ui"

export const metadata: Metadata = { title: "Features", description: "RTOShield features for RTO prevention, fake-order detection, pincode risk intelligence, webhooks, SDK signals, Brand Brain, and audit logs." }

export default function FeaturesPage() {
	return <MarketingShell><Hero eyebrow="Platform features" title="A complete RTO risk operating system." body="Everything ecommerce brands need to detect fake COD orders, reduce RTO losses, verify risky orders, and keep customer data private."/><FeatureGrid items={[
		{icon:"📍", title:"Pincode intelligence", body:"Upload pincode RTO rate, city, zone, COD success rate, and courier notes to improve local order checks."},
		{icon:"🧠", title:"Brand Brain", body:"Add custom system instructions, SOPs, return policies, RTO reports, and verification rules for the agent."},
		{icon:"↯", title:"Webhook ingestion", body:"Shopify and WooCommerce webhooks normalize orders, hash PII, and trigger scoring in real time."},
		{icon:"🧿", title:"Device/IP signals", body:"First-party SDK tracks privacy-safe device reuse, coarse geo, VPN/proxy signal, and checkout velocity."},
		{icon:"⚖️", title:"Human-safe decisions", body:"RTOShield recommends WhatsApp, call, prepaid deposit, manual review, or ship normally — never auto-cancels."},
		{icon:"🔐", title:"Security controls", body:"Per-org salts, hashed PII, RLS policies, audit logs, retention settings, and data deletion flows."},
	]}/><SeoFAQ faqs={[{q:"Can RTOShield auto-cancel orders?",a:"No. The system recommends actions only. A human must approve holds, cancellations, or shipping decisions."},{q:"Does the SDK fingerprint users?",a:"No GPS, no canvas fingerprinting, no audio fingerprinting by default. It uses first-party privacy-safe signals."},{q:"Can merchants upload their own RTO reports?",a:"Yes. The Brand Brain accepts SOPs, notes, and pincode CSV intelligence that the checker and agent use for future decisions."},{q:"Does it support Shopify and WooCommerce?",a:"Yes. Webhook routes and connector abstractions are included for both platforms."}]}/></MarketingShell>
}

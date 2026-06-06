import type { Metadata } from "next"
import { MarketingShell, Hero, FeatureGrid, SeoFAQ } from "../../marketing-ui"

export const metadata: Metadata = {
	title: "RTO Prevention for Ecommerce Brands",
	description: "Reduce return-to-origin losses with COD verification, pincode RTO intelligence, device checks, and human-safe AI recommendations.",
}

export default function RtoPreventionPage() {
	return <MarketingShell>
		<Hero eyebrow="Solution" title="RTO prevention built for COD-heavy ecommerce." body="Catch high-risk delivery patterns before dispatch using pincode RTO history, prior customer outcomes, delivery-zone intelligence, and manual verification workflows." />
		<FeatureGrid items={[
			{ icon: "📍", title: "Pincode risk scoring", body: "Rank areas by uploaded RTO rate, COD success rate, delivery days, and courier notes." },
			{ icon: "☎️", title: "Verification workflows", body: "Recommend WhatsApp, phone call, prepaid deposit, manual review, or ship normally." },
			{ icon: "↩️", title: "RTO history matching", body: "Use hashed phone/address/customer history to detect repeat RTO patterns without exposing raw PII." },
			{ icon: "📊", title: "Operational dashboard", body: "Monitor risky orders, trend lines, pincode hot spots, audit logs, and action queues." },
			{ icon: "🧠", title: "Merchant policy aware", body: "The Brand Brain applies your verification SOPs and courier rules to future order reviews." },
			{ icon: "🔐", title: "Privacy-safe", body: "First-party signals, per-org salts, hashed identifiers, RLS, retention, and deletion controls." },
		]} />
		<SeoFAQ faqs={[
			{ q: "How does RTOShield reduce RTO?", a: "It identifies risky COD orders before shipment and recommends verification or prepaid conversion instead of blindly shipping." },
			{ q: "Can it use my own RTO data?", a: "Yes. Upload pincode CSVs, RTO reports, courier notes, and brand policies into Brand Brain." },
			{ q: "Does it cancel orders automatically?", a: "No. It only recommends. Humans decide whether to ship, verify, hold, or request prepaid." },
			{ q: "Can it work with Shopify?", a: "Yes. Shopify webhook ingestion and SDK tracking are included." },
		]} />
	</MarketingShell>
}

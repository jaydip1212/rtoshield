import type { Metadata } from "next"
import { MarketingShell, Hero, FeatureGrid, SeoFAQ } from "../../marketing-ui"

export const metadata: Metadata = {
	title: "Fake Order Detection for Shopify & WooCommerce",
	description: "Detect fake COD orders with deterministic device, IP, pincode, customer history, and AI-assisted investigation workflows.",
}

export default function FakeOrderDetectionPage() {
	return <MarketingShell>
		<Hero eyebrow="Solution" title="Fake-order detection with truth checks first." body="RTOShield checks what is true, false, and unknown before AI explains the risk — device reuse, IP velocity, customer history, pincode mismatch, and COD spikes." />
		<FeatureGrid items={[
			{ icon: "🧿", title: "Device reuse", body: "Detect multiple COD attempts from the same first-party device token." },
			{ icon: "🌐", title: "IP velocity", body: "Spot repeated checkout attempts from the same hashed IP window and proxy/VPN signals." },
			{ icon: "📍", title: "Geo contradiction", body: "Compare uploaded pincode city/zone against shipping city to catch inconsistent addresses." },
			{ icon: "👤", title: "Customer history", body: "Use hashed customer records to identify prior RTO or successful delivery patterns." },
			{ icon: "🧠", title: "AI investigation", body: "Generate clear reasons, contradictions, recommended action, and customer verification scripts." },
			{ icon: "⚖️", title: "Human-safe", body: "No auto-cancel. No unsupported claims. No invented facts." },
		]} />
		<SeoFAQ faqs={[
			{ q: "Is this an AI-only fraud detector?", a: "No. Deterministic non-AI checks run first. AI explains the evidence and helps draft verification actions." },
			{ q: "Does it store raw phone or address?", a: "By default, phone, email, address, IP, session, and device token are hashed with tenant salts." },
			{ q: "Can I tune the scoring?", a: "Yes. The Risk Rules page allows per-org weight tuning and enable/disable controls." },
			{ q: "Does it support WooCommerce?", a: "Yes. WooCommerce webhook normalization and connector abstractions are included." },
		]} />
	</MarketingShell>
}

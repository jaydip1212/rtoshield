import type { Metadata } from "next"
import Link from "next/link"
import { MarketingShell, Hero } from "../../marketing-ui"

export const metadata: Metadata = {
	title: "RTO Guide: Reduce Return-to-Origin and Fake COD Orders",
	description: "A practical ecommerce RTO prevention guide covering COD verification, pincode risk, fake-order signals, and privacy-safe order scoring.",
}

const sections = [
	["What is RTO?", "Return-to-origin happens when a shipped order returns undelivered. COD-heavy brands lose shipping cost, inventory velocity, and support time."],
	["Best RTO signals", "Prior RTO phone/address history, high-RTO pincode, first-time high COD, device reuse, IP velocity, incomplete address, city mismatch, and NDR history."],
	["How to reduce RTO", "Verify medium/high-risk COD orders by WhatsApp or call, request prepaid deposit for high-risk patterns, and manually review critical orders."],
	["Privacy-first tracking", "Use first-party collection, clear merchant disclosure, hashed identifiers, retention windows, and data deletion flows."],
]

export default function RtoGuidePage() {
	return <MarketingShell>
		<Hero eyebrow="RTO playbook" title="The practical guide to reducing RTO losses." body="Learn how modern ecommerce brands combine deterministic signals, pincode intelligence, and human-safe AI review to prevent fake COD shipments." />
		<section className="mt-7 grid gap-5 md:grid-cols-2">
			{sections.map(([title, body]) => <article key={title} className="hover-lift rounded-[2rem] bg-white p-8 shadow-xl shadow-slate-900/5"><h2 className="text-3xl font-black">{title}</h2><p className="mt-4 leading-relaxed text-gray-600">{body}</p></article>)}
		</section>
		<section className="mt-7 rounded-[2.5rem] bg-black p-10 text-white">
			<h2 className="max-w-3xl text-5xl font-black leading-tight">Start with pincode intelligence and order verification.</h2>
			<p className="mt-5 max-w-2xl text-white/60">RTOShield gives you the system: upload your RTO data, connect webhooks, collect first-party signals, score every order, and keep humans in control.</p>
			<Link href="/dashboard" className="mt-8 inline-flex rounded-full bg-[#ff4f0f] px-6 py-3 text-sm font-black text-white">Open dashboard ↗</Link>
		</section>
	</MarketingShell>
}

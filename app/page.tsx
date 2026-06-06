import Link from "next/link"

const nav = ["Platform", "Brand Brain", "Webhooks", "Privacy"]
const signals = [
	{ icon: "⌁", label: "Pincode RTO", value: "42%", tone: "bg-red-100 text-red-700" },
	{ icon: "◉", label: "Device reuse", value: "3 COD", tone: "bg-orange-100 text-orange-700" },
	{ icon: "✦", label: "City mismatch", value: "fail", tone: "bg-sky-100 text-sky-700" },
]
const features = [
	{ icon: "🧠", title: "Brand Brain", body: "Upload your own SOPs, courier notes, RTO reports, verification rules, and custom agent instructions." },
	{ icon: "📍", title: "Geo + pincode checker", body: "Non-AI checks for pincode RTO rate, city mismatch, COD spikes, and delivery-zone risk." },
	{ icon: "🕵️", title: "Fake-order investigation", body: "Cross-check device reuse, IP velocity, customer history, pincode data, and order patterns before shipping." },
	{ icon: "🔐", title: "Privacy-first signals", body: "First-party SDK only, hashed PII, per-org salts, no GPS, no canvas/audio fingerprinting by default." },
]
const program = [
	"Shopify/WooCommerce webhooks",
	"REST API + first-party SDK",
	"Manual review workflows",
	"Audit logs + retention controls",
]

function Pill({ children }: { children: React.ReactNode }) {
	return <span className="rounded-full border border-black/10 bg-white/80 px-4 py-2 text-xs font-bold shadow-sm">{children}</span>
}

export default function LandingPage() {
	return (
		<main className="mx-auto max-w-[1500px] px-4 py-4 md:px-8 md:py-8">
			<section className="blue-court grid-noise relative overflow-hidden rounded-[2.6rem] p-4 text-white shadow-2xl md:min-h-[760px] md:p-6">
				<header className="relative z-20 flex items-center justify-between border-b border-white/15 pb-4">
					<Link href="/" className="text-xl font-black tracking-tight">RTOShield</Link>
					<nav className="hidden items-center gap-7 text-sm font-semibold text-white/80 md:flex">
						{nav.map((n, i) => <a key={n} href={`#section-${i}`} className="hover:text-white">{n}{i === 1 && <span className="ml-1 rounded-full bg-[#ff4f0f] px-2 py-0.5 text-[10px] text-white">New</span>}</a>)}
					</nav>
					<Link href="/dashboard" className="rounded-full bg-white px-4 py-2 text-sm font-black text-black">Open app ↗</Link>
				</header>

				<div className="relative z-10 mt-8 flex items-start justify-between text-xs font-bold uppercase tracking-wide text-white/85">
					<span>Custom RTO intelligence</span>
					<Link href="/brand" className="underline decoration-white/50 underline-offset-4">Train your brand brain</Link>
				</div>

				<div className="relative z-10 mt-24 max-w-3xl md:ml-20">
					<h1 className="text-5xl font-black leading-[.86] tracking-[-.06em] md:text-8xl lg:text-[9.5rem]">
						Stop fake<br/>COD orders<br/><span className="shimmer-text">before ship.</span>
					</h1>
					<p className="mt-7 max-w-lg text-base font-medium leading-relaxed text-white/78 md:text-lg">
						A premium AI + deterministic RTO command center for ecommerce brands — with pincode intelligence, device checks, webhook ingestion, and human-safe recommendations.
					</p>
					<div className="mt-8 flex flex-wrap gap-3">
						<Link href="/dashboard" className="rounded-full bg-[#ff4f0f] px-6 py-3 text-sm font-black text-white shadow-xl shadow-orange-900/20">Launch dashboard</Link>
						<Link href="/brand" className="rounded-full bg-white px-6 py-3 text-sm font-black text-black">Upload brand data</Link>
					</div>
				</div>

				<div className="orange-orb float-slow absolute right-[6%] top-[17%] z-0 h-72 w-72 rounded-full md:h-[25rem] md:w-[25rem]" />
				<div className="absolute right-[8%] top-[20%] z-10 hidden h-[19rem] w-[19rem] rounded-full border-[18px] border-black/15 md:block" />
				<div className="float-reverse glass-panel absolute bottom-9 right-9 z-20 hidden w-[360px] rounded-[2rem] p-5 text-black md:block">
					<div className="flex items-center justify-between">
						<span className="rounded-full bg-black px-3 py-1 text-xs font-black text-white">Live risk scan</span>
						<span className="text-xs font-bold text-gray-500">Order #COD-8841</span>
					</div>
					<div className="mt-5 grid gap-3">
						{signals.map((s) => <div key={s.label} className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-sm"><span className="flex items-center gap-2 text-sm font-bold"><span className={`grid h-8 w-8 place-items-center rounded-full ${s.tone}`}>{s.icon}</span>{s.label}</span><b>{s.value}</b></div>)}
					</div>
				</div>
			</section>

			<section id="section-0" className="mt-7 grid gap-7 lg:grid-cols-[.9fr_1.1fr]">
				<div className="rounded-[2.5rem] bg-[#eef1f7] p-7 md:p-10">
					<div className="mb-5 flex flex-wrap gap-2"><Pill>⚡ fake-order checks</Pill><Pill>🔍 explainable scores</Pill></div>
					<h2 className="max-w-xl text-5xl font-black leading-[.95] tracking-tight md:text-6xl">Explore a flexible risk system for every store.</h2>
					<div className="mt-8 space-y-3">
						<div className="rounded-[1.6rem] bg-white p-5 shadow-sm"><div className="flex justify-between text-xl font-bold"><span>Connections</span><span>−</span></div><p className="mt-2 text-sm text-gray-500">Built to connect Shopify, WooCommerce, CSV uploads, SDK signals, and RTO reports.</p></div>
						<div className="rounded-[1.6rem] bg-white/60 p-5"><div className="flex justify-between text-xl font-bold"><span>Agent package</span><span>+</span></div></div>
					</div>
				</div>
				<div className="rounded-[2.5rem] bg-white p-7 shadow-xl shadow-slate-900/5 md:p-10">
					<div className="grid gap-5 md:grid-cols-2">
						<div className="flex flex-col justify-between">
							<div><span className="text-sm font-black uppercase text-[#ff4f0f]">EST — 2026</span><p className="mt-6 text-gray-600">Smart features designed to move orders fast, safely, and with evidence.</p></div>
							<div><h3 className="text-4xl font-black leading-none">Visionary<br/>Precision Risk</h3><Link href="/dashboard" className="mt-5 inline-flex rounded-full bg-black px-6 py-3 text-sm font-black text-white">Join now ↗</Link></div>
						</div>
						<div className="soft-image-card relative min-h-[360px] overflow-hidden rounded-[2rem] p-5 text-white">
							<span className="rounded-full bg-white px-3 py-1 text-xs font-black text-black">Webhook Sale</span>
							<div className="absolute bottom-5 left-5 rounded-3xl bg-white/85 p-4 text-black backdrop-blur"><div className="text-xs text-gray-500">Fake-order risk</div><div className="text-4xl font-black">86%</div><div className="mt-1 rounded-full bg-cyan-500 px-3 py-1 text-xs font-bold text-white">↯ Boost</div></div>
						</div>
					</div>
				</div>
			</section>

			<section id="section-1" className="mt-7 rounded-[2.5rem] bg-white p-7 shadow-xl shadow-slate-900/5 md:p-10">
				<div className="flex flex-col justify-between gap-6 md:flex-row">
					<div><div className="mb-5 flex flex-wrap gap-2"><Pill>🧠 Brand Brain</Pill><Pill>📍 Pincode intelligence</Pill></div><h2 className="max-w-3xl text-5xl font-black leading-[.96] tracking-tight md:text-6xl">Elevate your fraud defense with uploaded brand knowledge.</h2></div>
					<p className="max-w-xs text-gray-500">Your agent learns from your own RTO reports, courier SOPs, verification scripts, and regional risk data.</p>
				</div>
				<div className="mt-9 grid gap-5 md:grid-cols-3">
					<div className="rounded-[2rem] bg-[#f4f6fb] p-6"><div className="text-6xl font-black">01<span className="text-2xl text-gray-300">/8</span></div><p className="mt-3 text-sm text-gray-500">Upcoming intelligence module</p><div className="mt-24 flex gap-2"><span className="grid h-12 w-12 place-items-center rounded-full bg-white">←</span><span className="grid h-12 w-12 place-items-center rounded-full bg-[#ff4f0f] text-white">→</span></div></div>
					<div className="rounded-[2rem] bg-black p-6 text-white"><h3 className="text-4xl font-black leading-tight">The agent checks facts and explains risk without guessing.</h3><div className="mt-20 flex justify-between text-sm"><span>◉ Live</span><span className="rounded-full border border-white/30 px-3 py-1">rtoshield.ai</span></div></div>
					<div className="soft-image-card rounded-[2rem] p-6 text-white"><div className="rounded-full bg-white/25 px-3 py-1 text-xs font-bold backdrop-blur">Riskcenter</div><div className="mt-28 rounded-3xl bg-white/80 p-4 text-black backdrop-blur"><div className="text-3xl font-black">2.88k</div><div className="text-xs text-gray-500">Signals checked</div></div><h3 className="mt-8 text-4xl font-black leading-none">Order Truth Partner</h3></div>
				</div>
			</section>

			<section id="section-2" className="mt-7 grid gap-7 lg:grid-cols-2">
				<div className="soft-image-card min-h-[560px] rounded-[2.5rem] p-8 text-white"><div className="glass-panel mt-40 max-w-sm rounded-[2rem] p-6 text-black"><div className="flex justify-between"><b>Activity</b><span className="rounded-full bg-[#ff4f0f] px-3 py-1 text-xs font-bold text-white">+87%</span></div><div className="mt-6 text-5xl font-black">2.780</div><p className="text-xs text-gray-400">Orders protected this week</p><div className="mt-7 flex justify-between text-sm"><span>Walking<br/><b>127</b></span><span>Running<br/><b>386</b></span><span>Workout<br/><b>249</b></span></div></div></div>
				<div className="p-5 md:p-10"><div className="mb-5 text-sm font-black uppercase text-cyan-600">● Featured features</div><h2 className="text-5xl font-black leading-[.95] md:text-6xl">Stay motivated with fraud tracking.</h2><div className="mt-8 flex gap-4"><span className="icon-bubble grid h-16 w-16 place-items-center rounded-full bg-white text-2xl">⌘</span><span className="icon-bubble grid h-16 w-16 place-items-center rounded-full bg-white text-2xl">🛡️</span><span className="icon-bubble grid h-16 w-16 place-items-center rounded-full bg-white text-2xl">🔎</span><span className="grid h-10 w-10 place-items-center rounded-full bg-[#ff4f0f] text-sm font-black text-white">8+</span></div><p className="mt-20 max-w-sm text-xl text-gray-600">Record activities and signals to boost your performance.</p><p className="mt-4 font-black">WITH GPT-4O READY PROVIDERS</p><Link href="/brand" className="mt-10 inline-grid h-24 w-24 place-items-center rounded-full bg-[#ff4f0f] text-4xl text-white">↗</Link></div>
			</section>

			<section id="section-3" className="mt-7 rounded-[2.5rem] bg-black p-7 text-white md:p-12">
				<div className="grid gap-8 lg:grid-cols-[.3fr_.7fr]"><div className="text-sm uppercase text-white/60">● Current system</div><h2 className="text-5xl font-black leading-[.98] md:text-7xl">To win over risky COD orders with evidence, privacy, and excellent systems.</h2></div>
				<div className="relative mt-12 space-y-4">{program.map((p, i) => <div key={p} className={`flex items-center justify-between rounded-3xl px-6 py-5 text-2xl ${i===1 ? "bg-[#ff4f0f]" : "border-b border-white/10"}`}><span>{p}</span><span>↗</span></div>)}<div className="float-slow soft-image-card absolute right-20 top-8 hidden h-56 w-72 rotate-[-6deg] rounded-[2rem] lg:block"/></div>
			</section>

			<footer className="mt-7 rounded-[2.5rem] bg-white p-8 md:p-12">
				<div className="grid gap-8 md:grid-cols-[.25fr_.55fr_.2fr]"><div className="soft-image-card h-40 rounded-[2rem] p-5 text-white"><b>Explore<br/>More</b></div><div><h2 className="text-5xl font-black leading-none md:text-6xl">We’re building everything for safer ecommerce.</h2><div className="mt-5 flex flex-wrap gap-2"><Pill>API keys</Pill><Pill>Priority event</Pill><Pill>Badges</Pill></div></div><div className="text-sm"><p>Program ↗</p><p>Product ↗</p><p>Event ↗</p><p>About ↗</p></div></div>
				<div className="mt-14 flex items-end justify-between border-t pt-8 text-sm text-gray-500"><span>Privacy Policy</span><span>EST — 2026</span><span>©2026 RTOShield</span></div>
				<div className="mt-6 overflow-hidden text-[18vw] font-black leading-[.75] tracking-[-.08em] text-black">RTOShield</div>
			</footer>
		</main>
	)
}

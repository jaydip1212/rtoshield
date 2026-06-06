import Link from "next/link"
import { getCurrentOrg } from "@/lib/session"
import { getDashboardStats, getRecentRiskyOrders, getAgentLearningStats, listPincodeIntel, getDashboardDeepStats, getOrderTrend, getRecentAuditLogs } from "@/lib/queries"
import { Card, DarkCard, PageHeader, RiskBadge, ActionPill, NoDatabaseNotice, money, ButtonLike } from "@/components/ui"

export const dynamic = "force-dynamic"

const LEVEL_META: Record<string, { bar: string; icon: string; glow: string }> = {
	low: { bar: "bg-emerald-400", icon: "✓", glow: "shadow-emerald-200" },
	medium: { bar: "bg-yellow-400", icon: "◐", glow: "shadow-yellow-200" },
	high: { bar: "bg-orange-500", icon: "⚠", glow: "shadow-orange-200" },
	critical: { bar: "bg-red-500", icon: "✕", glow: "shadow-red-200" },
}

const KPI_ICONS = ["⌁", "◉", "⚠", "↯"]
const KPI_GRADIENTS = [
	"from-white to-cyan-50",
	"from-white to-blue-50",
	"from-[#ff4f0f] to-[#ff8a3d] text-white",
	"from-white to-orange-50",
]

function SystemIcon({ children, className = "" }: { children: React.ReactNode; className?: string }) {
	return (
		<span className={`icon-bubble relative grid h-12 w-12 place-items-center rounded-full bg-white text-xl font-black ${className}`}>
			<span className="pulse-ring absolute inset-0 rounded-full bg-current opacity-20" />
			<span className="relative">{children}</span>
		</span>
	)
}

function MiniSignal({ icon, label, value, tone }: { icon: string; label: string; value: string; tone: string }) {
	return (
		<div className="hover-lift rounded-[1.5rem] bg-white/90 p-4 text-black shadow-xl shadow-black/10 backdrop-blur">
			<div className="flex items-center justify-between gap-3">
				<span className={`grid h-10 w-10 place-items-center rounded-full text-lg ${tone}`}>{icon}</span>
				<span className="text-2xl font-black">{value}</span>
			</div>
			<div className="mt-3 text-xs font-bold uppercase tracking-wide text-gray-500">{label}</div>
		</div>
	)
}

export default async function DashboardPage() {
	const org = await getCurrentOrg()
	if (!org) return <><PageHeader title="Dashboard" /><NoDatabaseNotice /></>
	const [stats, risky, learn, pins, deep, trend, audits] = await Promise.all([
		getDashboardStats(org.id),
		getRecentRiskyOrders(org.id, 6),
		getAgentLearningStats(org.id),
		listPincodeIntel(org.id, 6),
		getDashboardDeepStats(org.id),
		getOrderTrend(org.id, 7),
		getRecentAuditLogs(org.id, 8),
	])
	const total = stats.dist.reduce((s, d) => s + d.n, 0) || 1
	const automationScore = Math.min(99, Math.round(((learn.docs + learn.pincodes + learn.rto_cases + learn.device_signals) / 25) * 10))
	const kpis = [
		{ label: "Total orders", value: stats.totalOrders, sub: "Imported + webhook" },
		{ label: "Scored orders", value: stats.scored, sub: "Deterministic engine" },
		{ label: "High / critical", value: stats.risky, sub: "Needs review" },
		{ label: "COD orders", value: stats.cod, sub: "Cash-on-delivery" },
	]
	return (
		<>
			<section className="grid gap-5 xl:grid-cols-[1.28fr_.72fr]">
				<div className="blue-court grid-noise card-glow relative min-h-[560px] overflow-hidden rounded-[2.7rem] p-7 text-white md:p-10">
					<div className="relative z-20 flex items-center justify-between text-sm">
						<span className="rounded-full bg-white/15 px-4 py-2 font-black uppercase tracking-wide backdrop-blur">⚡ Fake-order prevention</span>
						<Link href="/brand" className="rounded-full bg-white px-4 py-2 font-black text-black">Train brain ↗</Link>
					</div>
					<div className="relative z-10 mt-20 max-w-4xl">
						<h1 className="text-6xl font-black leading-[.86] tracking-[-.06em] md:text-8xl lg:text-[8.6rem]">
							Command<br/><span className="shimmer-text">Center</span>
						</h1>
						<p className="mt-7 max-w-2xl text-lg leading-relaxed text-white/78">
							Non-AI truth checks + autonomous agent review for pincode, geo, COD velocity, device reuse, webhook order signals, and uploaded brand intelligence.
						</p>
						<div className="mt-8 flex flex-wrap gap-3">
							<ButtonLike tone="orange">{stats.risky} risky orders</ButtonLike>
							<ButtonLike tone="light">{learn.pincodes} pincode rules</ButtonLike>
							<ButtonLike tone="light">{learn.docs} brand docs</ButtonLike>
						</div>
					</div>
					<div className="orange-orb float-slow absolute -right-12 top-24 h-72 w-72 rounded-full md:h-[25rem] md:w-[25rem]" />
					<div className="absolute right-10 top-32 hidden h-72 w-72 rounded-full border-[18px] border-black/15 md:block" />
					<div className="absolute bottom-7 right-7 z-20 grid w-full max-w-xl gap-3 md:grid-cols-3">
						<MiniSignal icon="📍" label="Geo check" value="live" tone="bg-cyan-100 text-cyan-700" />
						<MiniSignal icon="🧬" label="Device reuse" value={`${learn.device_signals}`} tone="bg-orange-100 text-orange-700" />
						<MiniSignal icon="🛡️" label="Manual safe" value="100%" tone="bg-emerald-100 text-emerald-700" />
					</div>
				</div>

				<DarkCard className="relative min-h-[560px] overflow-hidden">
					<div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#ff4f0f]/70 blur-3xl" />
					<div className="relative z-10">
						<div className="flex items-center justify-between">
							<div className="text-sm font-black uppercase text-white/45">Agent autonomy</div>
							<SystemIcon className="text-[#ff4f0f]">AI</SystemIcon>
						</div>
						<div className="mt-8 text-8xl font-black leading-none">{automationScore}<span className="text-3xl text-white/35">%</span></div>
						<p className="mt-4 text-white/60">Improves daily as the brand uploads more RTO reports, pincode tables, SOPs, and verification policies.</p>
						<div className="mt-8 grid grid-cols-2 gap-3">
							{[
								["📄", "Docs", learn.docs],
								["📍", "Pincodes", learn.pincodes],
								["↩", "RTO cases", learn.rto_cases],
								["🧿", "Signals", learn.device_signals],
							].map(([icon, label, value]) => (
								<div key={String(label)} className="hover-lift rounded-[1.5rem] bg-white p-4 text-black">
									<div className="text-2xl">{icon}</div>
									<div className="mt-3 text-3xl font-black">{value}</div>
									<div className="text-xs font-bold uppercase text-gray-400">{label}</div>
								</div>
							))}
						</div>
					</div>
				</DarkCard>
			</section>

			<section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{kpis.map((k, i) => (
					<Card key={k.label} className={`hover-lift bg-gradient-to-br ${KPI_GRADIENTS[i]} relative overflow-hidden`}>
						<div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-current opacity-5" />
						<div className="flex items-start justify-between">
							<div><div className="text-sm font-bold opacity-65">{k.label}</div><div className="mt-4 text-6xl font-black leading-none">{k.value}</div><div className="mt-3 text-xs font-bold uppercase opacity-55">{k.sub}</div></div>
							<SystemIcon className={i === 2 ? "bg-white text-[#ff4f0f]" : "text-[#ff4f0f]"}>{KPI_ICONS[i]}</SystemIcon>
						</div>
					</Card>
				))}
			</section>

			<section className="mt-5 grid gap-5 xl:grid-cols-[.82fr_1.18fr]">
				<Card className="hover-lift">
					<div className="flex items-center justify-between">
						<h2 className="text-3xl font-black">Risk distribution</h2>
						<SystemIcon className="text-cyan-600">⌁</SystemIcon>
					</div>
					<div className="mt-6 space-y-5">
						{["low", "medium", "high", "critical"].map((level) => {
							const n = stats.dist.find((d) => d.level === level)?.n ?? 0
							const pct = Math.round((n / total) * 100)
							const meta = LEVEL_META[level]
							return (
								<div key={level} className={`rounded-3xl bg-gray-50 p-4 shadow-lg ${meta.glow}`}>
									<div className="mb-2 flex items-center justify-between text-xs font-black uppercase tracking-wide">
										<span className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-full bg-white">{meta.icon}</span>{level}</span>
										<span>{n} orders · {pct}%</span>
									</div>
									<div className="h-4 overflow-hidden rounded-full bg-white"><div className={`h-full rounded-full ${meta.bar}`} style={{ width: `${pct}%` }} /></div>
								</div>
							)
						})}
					</div>
				</Card>

				<Card>
					<div className="flex items-center justify-between">
						<div><h2 className="text-3xl font-black">Orders to verify</h2><p className="mt-1 text-sm text-gray-500">High-signal orders needing a human decision.</p></div>
						<Link href="/orders" className="rounded-full bg-black px-5 py-3 text-sm font-black text-white">View all ↗</Link>
					</div>
					<div className="mt-5 space-y-3">
						{risky.length === 0 && <p className="rounded-3xl bg-emerald-50 p-5 text-sm font-bold text-emerald-800">No high-risk orders. 🎉</p>}
						{risky.map((o, index) => (
							<Link key={o.id} href={`/orders/${o.id}`} className="hover-lift flex items-center justify-between rounded-[1.5rem] bg-gray-50 p-4">
								<div className="flex items-center gap-4">
									<span className="grid h-12 w-12 place-items-center rounded-full bg-white text-lg font-black text-[#ff4f0f]">{index + 1}</span>
									<div><div className="font-black">{o.external_id ?? o.id.slice(0, 8)}</div><div className="text-sm text-gray-500">{money(o.total, o.currency)} · {o.payment_method.toUpperCase()} · {o.city ?? "unknown"} · {o.pincode ?? "no pin"}</div></div>
								</div>
								<div className="flex flex-wrap justify-end gap-2"><ActionPill action={o.recommended_action} /><RiskBadge level={o.level} score={o.score} /></div>
							</Link>
						))}
					</div>
				</Card>
			</section>

			<section className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
				<DarkCard className="relative overflow-hidden">
					<div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
					<div className="relative z-10 grid gap-6 md:grid-cols-[.8fr_1.2fr]">
						<div><div className="text-sm font-black uppercase text-white/50">Non-AI checker</div><h2 className="mt-4 text-5xl font-black leading-[.94]">Truth before AI.</h2><p className="mt-5 text-white/60">The agent explains evidence; deterministic rules decide what is true, false, or unknown.</p></div>
						<div className="grid gap-3 sm:grid-cols-2">
							{[
								["📍", "Pincode", "RTO rate + city match"],
								["🧿", "Device", "Reuse + COD velocity"],
								["🌐", "IP", "Proxy + order velocity"],
								["👤", "Customer", "Prior RTO + returns"],
							].map(([icon, title, body]) => (
								<div key={String(title)} className="hover-lift rounded-[1.5rem] bg-white p-4 text-black"><div className="text-3xl">{icon}</div><div className="mt-3 font-black">{title}</div><div className="text-xs text-gray-500">{body}</div></div>
							))}
						</div>
					</div>
				</DarkCard>

				<Card>
					<div className="flex items-center justify-between"><h2 className="text-3xl font-black">Highest RTO pincodes</h2><SystemIcon className="text-[#ff4f0f]">📍</SystemIcon></div>
					<div className="mt-5 space-y-3">
						{pins.length ? pins.map((p, i) => (
							<div key={p.id} className="hover-lift flex items-center justify-between rounded-3xl bg-gray-50 p-4">
								<div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-white text-sm font-black">{i + 1}</span><div><b>{p.pincode}</b><span className="ml-2 text-gray-500">{p.city}</span><div className="text-xs text-gray-400">{p.zone ?? "No zone"}</div></div></div>
								<span className="rounded-full bg-[#ff4f0f] px-4 py-2 text-sm font-black text-white">{Math.round(Number(p.rto_rate) * 100)}%</span>
							</div>
						)) : <p className="rounded-3xl bg-gray-50 p-5 text-sm text-gray-500">Upload pincode CSV in Brand Brain to power this panel.</p>}
					</div>
				</Card>
			</section>

			<section className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
				<Card className="relative overflow-hidden">
					<div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-200/50 blur-3xl" />
					<div className="relative z-10 flex items-center justify-between"><div><h2 className="text-3xl font-black">7-day order pulse</h2><p className="mt-1 text-sm text-gray-500">Orders vs risky orders from the live database.</p></div><SystemIcon className="text-cyan-600">📈</SystemIcon></div>
					<div className="relative z-10 mt-7 flex h-56 items-end gap-3">
						{trend.map((d) => {
							const max = Math.max(...trend.map((x) => x.orders), 1)
							const h = Math.max(8, Math.round((d.orders / max) * 180))
							const riskyH = Math.max(4, Math.round((d.risky / max) * 180))
							return <div key={d.day} className="flex flex-1 flex-col items-center justify-end gap-2"><div className="relative flex h-44 w-full items-end justify-center rounded-full bg-gray-50"><div className="w-6 rounded-full bg-cyan-400" style={{height: `${h}px`}}/><div className="absolute bottom-0 w-3 rounded-full bg-[#ff4f0f]" style={{height: `${riskyH}px`}}/></div><span className="text-[10px] font-bold text-gray-400">{new Date(d.day).toLocaleDateString('en-US',{weekday:'short'})}</span></div>
						})}
					</div>
				</Card>

				<DarkCard className="relative overflow-hidden">
					<div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-[#ff4f0f]/30 blur-3xl" />
					<div className="relative z-10"><div className="text-sm font-black uppercase text-white/45">System health</div><h2 className="mt-2 text-4xl font-black">Working stack, live signals.</h2>
					<div className="mt-7 grid grid-cols-2 gap-3">
						{[["Avg score", deep.avg_score, "🎯"],["Held/prepaid", deep.blocked_or_held, "🛑"],["24h orders", deep.orders_24h, "⏱️"],["Webhooks", deep.active_webhooks, "↯"],["API keys", deep.api_keys, "🔑"],["Audit 24h", deep.audit_24h, "📜"]].map(([label,value,icon]) => <div key={String(label)} className="hover-lift rounded-3xl bg-white p-4 text-black"><div className="text-2xl">{icon}</div><div className="mt-3 text-3xl font-black">{value}</div><div className="text-xs font-bold uppercase text-gray-400">{label}</div></div>)}
					</div></div>
				</DarkCard>
			</section>

			<section className="mt-5 grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
				<Card>
					<div className="flex items-center justify-between"><h2 className="text-3xl font-black">Recent audit trail</h2><SystemIcon className="text-[#ff4f0f]">📜</SystemIcon></div>
					<div className="mt-5 space-y-3">{audits.length ? audits.map((a, i) => <div key={i} className="hover-lift rounded-3xl bg-gray-50 p-4"><div className="flex justify-between gap-3"><b>{a.action}</b><span className="text-xs text-gray-400">{new Date(a.created_at).toLocaleString()}</span></div><div className="mt-1 text-xs text-gray-500">Target: {a.target ?? 'system'}</div></div>) : <p className="rounded-3xl bg-gray-50 p-5 text-sm text-gray-500">No audit events yet.</p>}</div>
				</Card>
				<Card className="bg-gradient-to-br from-white to-orange-50">
					<div className="flex items-center justify-between"><h2 className="text-3xl font-black">Next best actions</h2><SystemIcon className="text-[#ff4f0f]">✨</SystemIcon></div>
					<div className="mt-5 grid gap-3 sm:grid-cols-2">
						{[["Train Brand Brain", "/brand", "Upload SOP, RTO notes, pincode CSV"],["Review risky orders", "/orders?level=high", "Verify COD before ship"],["Connect webhooks", "/webhooks", "Shopify/Woo real-time ingestion"],["Tune risk rules", "/rules", "Adjust weights per brand"]].map(([title,href,body]) => <Link key={title} href={href} className="hover-lift rounded-3xl bg-white p-5"><div className="text-lg font-black">{title} ↗</div><p className="mt-2 text-sm text-gray-500">{body}</p></Link>)}
					</div>
				</Card>
			</section>
		</>
	)
}

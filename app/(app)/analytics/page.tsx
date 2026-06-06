import Link from "next/link"
import { getCurrentOrg } from "@/lib/session"
import { getDashboardStats, getDashboardDeepStats, getOrderTrend, getRecentAuditLogs, listPincodeIntel } from "@/lib/queries"
import { Card, DarkCard, PageHeader, NoDatabaseNotice } from "@/components/ui"

export const dynamic = "force-dynamic"

function Stat({ icon, label, value, sub }: { icon: string; label: string; value: number | string; sub: string }) {
	return <Card className="hover-lift bg-gradient-to-br from-white to-cyan-50"><div className="flex items-start justify-between"><div><div className="text-sm font-bold text-gray-500">{label}</div><div className="mt-3 text-5xl font-black">{value}</div><div className="mt-2 text-xs font-bold uppercase text-gray-400">{sub}</div></div><span className="icon-bubble grid h-12 w-12 place-items-center rounded-full bg-white text-2xl">{icon}</span></div></Card>
}

export default async function AnalyticsPage() {
	const org = await getCurrentOrg()
	if (!org) return <><PageHeader title="Analytics" /><NoDatabaseNotice /></>
	const [stats, deep, trend, audits, pins] = await Promise.all([
		getDashboardStats(org.id),
		getDashboardDeepStats(org.id),
		getOrderTrend(org.id, 14),
		getRecentAuditLogs(org.id, 10),
		listPincodeIntel(org.id, 8),
	])
	const maxOrders = Math.max(...trend.map(t => t.orders), 1)
	const riskRate = stats.totalOrders ? Math.round((stats.risky / stats.totalOrders) * 100) : 0
	return <>
		<PageHeader title="Analytics command room" subtitle="A clearer operating view for risk, verification, pincode performance, and system activity." action={<Link href="/dashboard" className="rounded-full bg-black px-5 py-3 text-sm font-black text-white">Dashboard ↗</Link>} />
		<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
			<Stat icon="🎯" label="Average risk" value={deep.avg_score} sub="Latest decisions" />
			<Stat icon="⚠️" label="Risk rate" value={`${riskRate}%`} sub="High / critical" />
			<Stat icon="🛑" label="Held / prepaid" value={deep.blocked_or_held} sub="Manual actions" />
			<Stat icon="⏱️" label="Orders 24h" value={deep.orders_24h} sub="Recent load" />
		</section>
		<section className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
			<Card>
				<div className="flex items-center justify-between"><div><h2 className="text-3xl font-black">14-day trend</h2><p className="mt-1 text-sm text-gray-500">Blue = all orders, orange = risky orders.</p></div><span className="icon-bubble grid h-12 w-12 place-items-center rounded-full bg-white text-2xl">📈</span></div>
				<div className="mt-8 flex h-72 items-end gap-2">
					{trend.map((d) => {
						const h = Math.max(10, Math.round((d.orders / maxOrders) * 230))
						const riskyH = Math.max(4, Math.round((d.risky / maxOrders) * 230))
						return <div key={d.day} className="group flex flex-1 flex-col items-center justify-end gap-2"><div className="relative flex h-60 w-full items-end justify-center rounded-full bg-gray-50"><div className="w-5 rounded-full bg-cyan-400 transition-all group-hover:bg-cyan-500" style={{height: `${h}px`}}/><div className="absolute bottom-0 w-2 rounded-full bg-[#ff4f0f]" style={{height: `${riskyH}px`}}/></div><span className="text-[10px] font-bold text-gray-400">{new Date(d.day).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span></div>
					})}
				</div>
			</Card>
			<DarkCard>
				<div className="text-sm font-black uppercase text-white/45">Conversion guardrails</div>
				<h2 className="mt-3 text-5xl font-black leading-[.95]">Ship faster without shipping blind.</h2>
				<div className="mt-8 grid gap-3">
					{[["Active webhooks", deep.active_webhooks, "↯"], ["API keys", deep.api_keys, "🔑"], ["Audit events 24h", deep.audit_24h, "📜"]].map(([label, value, icon]) => <div key={String(label)} className="hover-lift rounded-3xl bg-white p-4 text-black"><div className="flex items-center justify-between"><b>{label}</b><span className="text-2xl">{icon}</span></div><div className="mt-2 text-4xl font-black">{value}</div></div>)}
				</div>
			</DarkCard>
		</section>
		<section className="mt-5 grid gap-5 xl:grid-cols-2">
			<Card><h2 className="text-3xl font-black">Top pincode risk</h2><div className="mt-5 space-y-3">{pins.map((p, i) => <div key={p.id} className="hover-lift flex items-center justify-between rounded-3xl bg-gray-50 p-4"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-white font-black">{i+1}</span><div><b>{p.pincode}</b><span className="ml-2 text-gray-500">{p.city}</span><div className="text-xs text-gray-400">COD success {Math.round(Number(p.cod_success_rate)*100)}%</div></div></div><span className="rounded-full bg-[#ff4f0f] px-4 py-2 text-sm font-black text-white">{Math.round(Number(p.rto_rate)*100)}%</span></div>)}</div></Card>
			<Card><h2 className="text-3xl font-black">Recent system events</h2><div className="mt-5 space-y-3">{audits.map((a, i) => <div key={i} className="hover-lift rounded-3xl bg-gray-50 p-4"><div className="flex justify-between"><b>{a.action}</b><span className="text-xs text-gray-400">{new Date(a.created_at).toLocaleString()}</span></div><div className="mt-1 text-xs text-gray-500">{a.target ?? "system"}</div></div>)}</div></Card>
		</section>
	</>
}

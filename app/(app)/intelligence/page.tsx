import Link from "next/link"
import { getCurrentOrg } from "@/lib/session"
import { getAgentLearningStats, getBrandProfile, listDocuments, listPincodeIntel, getWebhookEndpoints } from "@/lib/queries"
import { Card, DarkCard, PageHeader, NoDatabaseNotice } from "@/components/ui"

export const dynamic = "force-dynamic"

export default async function IntelligencePage() {
	const org = await getCurrentOrg()
	if (!org) return <><PageHeader title="Intelligence" /><NoDatabaseNotice /></>
	const [stats, profile, docs, pins, hooks] = await Promise.all([
		getAgentLearningStats(org.id),
		getBrandProfile(org.id),
		listDocuments(org.id),
		listPincodeIntel(org.id, 10),
		getWebhookEndpoints(org.id),
	])
	const maturity = Math.min(100, Math.round(((stats.docs * 12) + (stats.pincodes * 6) + (stats.rto_cases * 8) + (stats.device_signals * 1)) / 4))
	return <>
		<PageHeader title="Intelligence layer" subtitle="All knowledge sources powering the non-AI checker and autonomous agent." action={<Link href="/brand" className="rounded-full bg-[#ff4f0f] px-5 py-3 text-sm font-black text-white">Upload data ↗</Link>} />
		<section className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
			<DarkCard className="relative overflow-hidden"><div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl"/><div className="relative z-10"><div className="text-sm font-black uppercase text-white/45">Brand intelligence maturity</div><div className="mt-5 text-8xl font-black">{maturity}<span className="text-3xl text-white/35">%</span></div><p className="mt-4 text-white/60">Maturity improves as you upload pincode data, RTO cases, SOP documents, and capture device/webhook signals.</p><div className="mt-8 grid grid-cols-2 gap-3">{[["Docs",stats.docs,"📄"],["Pincodes",stats.pincodes,"📍"],["RTO cases",stats.rto_cases,"↩"],["Signals",stats.device_signals,"🧿"]].map(([l,v,i])=><div key={String(l)} className="rounded-3xl bg-white p-4 text-black"><div className="text-2xl">{i}</div><div className="mt-2 text-3xl font-black">{v}</div><div className="text-xs font-bold uppercase text-gray-400">{l}</div></div>)}</div></div></DarkCard>
			<Card><h2 className="text-3xl font-black">Agent instructions</h2><div className="mt-5 space-y-4"><div className="rounded-3xl bg-gray-50 p-5"><div className="text-xs font-black uppercase text-gray-400">System override</div><p className="mt-2 text-sm text-gray-600">{profile.system_instructions || "No custom system instructions yet."}</p></div><div className="rounded-3xl bg-gray-50 p-5"><div className="text-xs font-black uppercase text-gray-400">Brand context</div><p className="mt-2 text-sm text-gray-600">{profile.brand_context || "No brand context yet."}</p></div><div className="rounded-3xl bg-gray-50 p-5"><div className="text-xs font-black uppercase text-gray-400">Verification policy</div><p className="mt-2 text-sm text-gray-600">{profile.verification_policy || "No verification policy yet."}</p></div></div></Card>
		</section>
		<section className="mt-5 grid gap-5 xl:grid-cols-3">
			<Card><h2 className="text-2xl font-black">Knowledge docs</h2><div className="mt-4 space-y-3">{docs.map(d=><div key={d.id} className="rounded-3xl bg-gray-50 p-4"><b>{d.title}</b><div className="text-xs uppercase text-gray-400">{d.type} · {d.chunks} chunks</div></div>)}</div></Card>
			<Card><h2 className="text-2xl font-black">Pincode brain</h2><div className="mt-4 space-y-3">{pins.map(p=><div key={p.id} className="flex justify-between rounded-3xl bg-gray-50 p-4"><div><b>{p.pincode}</b><span className="ml-2 text-gray-500">{p.city}</span></div><b className="text-[#ff4f0f]">{Math.round(Number(p.rto_rate)*100)}%</b></div>)}</div></Card>
			<Card><h2 className="text-2xl font-black">Connected ingestion</h2><div className="mt-4 space-y-3">{hooks.map(h=><div key={h.id} className="rounded-3xl bg-gray-50 p-4"><div className="flex justify-between"><b className="capitalize">{h.platform}</b><span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">{h.status}</span></div><div className="mt-2 truncate text-xs text-gray-500">{h.endpoint_url}</div></div>)}</div></Card>
		</section>
	</>
}

import { getCurrentOrg } from "@/lib/session"
import { getAgentLearningStats, getBrandProfile, listDocuments, listPincodeIntel } from "@/lib/queries"
import { PageHeader, NoDatabaseNotice, Card, DarkCard } from "@/components/ui"
import { BrandBrainClient } from "./BrandBrainClient"

export const dynamic = "force-dynamic"

export default async function BrandBrainPage() {
	const org = await getCurrentOrg()
	if (!org) return <><PageHeader title="Brand brain" /><NoDatabaseNotice /></>
	const [profile, docs, pins, stats] = await Promise.all([
		getBrandProfile(org.id),
		listDocuments(org.id),
		listPincodeIntel(org.id, 20),
		getAgentLearningStats(org.id),
	])
	return (
		<>
			<PageHeader
				title="Train the brand brain"
				subtitle="Upload brand data, pincode/RTO intelligence, and your own system instructions. The agent uses this daily to cross-check fake orders with deterministic evidence first, AI explanation second."
			/>
			<section className="grid gap-5 lg:grid-cols-3">
				<DarkCard className="lg:col-span-1">
					<div className="text-sm uppercase text-white/50">Autonomous learning</div>
					<div className="mt-4 text-6xl font-black">{stats.docs + stats.pincodes + stats.rto_cases}</div>
					<p className="mt-3 text-white/60">Uploaded knowledge signals currently available to the agent.</p>
					<div className="mt-6 grid grid-cols-2 gap-3 text-sm">
						<div className="rounded-2xl bg-white/10 p-3"><b>{stats.docs}</b><br/><span className="text-white/50">Docs</span></div>
						<div className="rounded-2xl bg-white/10 p-3"><b>{stats.pincodes}</b><br/><span className="text-white/50">Pincodes</span></div>
						<div className="rounded-2xl bg-white/10 p-3"><b>{stats.rto_cases}</b><br/><span className="text-white/50">RTO cases</span></div>
						<div className="rounded-2xl bg-white/10 p-3"><b>{stats.device_signals}</b><br/><span className="text-white/50">Signals</span></div>
					</div>
				</DarkCard>
				<Card className="lg:col-span-2">
					<BrandBrainClient profile={profile} />
				</Card>
			</section>
			<section className="mt-5 grid gap-5 lg:grid-cols-2">
				<Card>
					<h2 className="text-2xl font-black">Uploaded knowledge</h2>
					<div className="mt-4 space-y-3">{docs.map(d=><div key={d.id} className="rounded-2xl bg-gray-50 p-3"><div className="text-xs font-bold uppercase text-gray-400">{d.type}</div><div className="font-bold">{d.title}</div><div className="text-xs text-gray-500">{d.chunks} indexed chunk(s)</div></div>)}{docs.length===0&&<p className="text-sm text-gray-500">No docs uploaded yet.</p>}</div>
				</Card>
				<Card>
					<h2 className="text-2xl font-black">Pincode intelligence</h2>
					<div className="mt-4 space-y-3">{pins.map(p=><div key={p.id} className="flex items-center justify-between rounded-2xl bg-gray-50 p-3"><div><div className="font-black">{p.pincode} <span className="font-normal text-gray-500">{p.city}</span></div><div className="text-xs text-gray-500">{p.zone ?? "No zone"} · COD success {Math.round(Number(p.cod_success_rate)*100)}%</div></div><div className="rounded-full bg-[#ff4f0f] px-3 py-1 text-sm font-black text-white">RTO {Math.round(Number(p.rto_rate)*100)}%</div></div>)}{pins.length===0&&<p className="text-sm text-gray-500">Paste pincode CSV above to power geo checks.</p>}</div>
				</Card>
			</section>
		</>
	)
}

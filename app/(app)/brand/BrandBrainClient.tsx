"use client"
import { useState, useTransition } from "react"
import { saveBrandProfile, uploadBrandData, upsertPincodeIntel } from "@/app/actions"

type Profile = { system_instructions: string; brand_context: string; verification_policy: string; daily_learning_enabled: boolean }

export function BrandBrainClient({ profile }: { profile: Profile }) {
	const [pending, start] = useTransition()
	const [systemInstructions, setSystemInstructions] = useState(profile.system_instructions)
	const [brandContext, setBrandContext] = useState(profile.brand_context)
	const [verificationPolicy, setVerificationPolicy] = useState(profile.verification_policy)
	const [daily, setDaily] = useState(profile.daily_learning_enabled)
	const [title, setTitle] = useState("COD verification policy")
	const [type, setType] = useState("cod_policy")
	const [text, setText] = useState("")
	const [csv, setCsv] = useState("pincode,city,zone,rto_rate,cod_success_rate,avg_delivery_days,notes\n400001,Mumbai,West,0.18,0.82,2.4,Usually safe\n800001,Patna,East,0.42,0.58,5.1,Verify COD before ship")
	const [msg, setMsg] = useState<string | null>(null)

	function parseCsv() {
		const lines = csv.trim().split(/\r?\n/).filter(Boolean)
		const rows = lines.slice(1).map(line => {
			const [pincode, city, zone, rto, cod, days, notes] = line.split(",").map(x => x?.trim())
			return { pincode, city, zone, rtoRate: Number(rto || 0), codSuccessRate: Number(cod || 0), avgDeliveryDays: days ? Number(days) : undefined, notes }
		}).filter(r => r.pincode)
		return rows
	}

	return <div className="space-y-8">
		<div>
			<h2 className="text-2xl font-black">Custom agent system instructions</h2>
			<p className="mt-1 text-sm text-gray-500">These instructions are merged with RTOShield safety rules. They help the agent understand your brand, courier SOP, COD limits, and what evidence matters.</p>
			<div className="mt-4 grid gap-3">
				<textarea value={systemInstructions} onChange={e=>setSystemInstructions(e.target.value)} rows={5} className="w-full rounded-3xl border p-4 text-sm" placeholder="Example: For luxury COD orders above ₹3,000, always verify availability. Treat repeat successful customers as lower risk." />
				<textarea value={brandContext} onChange={e=>setBrandContext(e.target.value)} rows={3} className="w-full rounded-3xl border p-4 text-sm" placeholder="Brand context: products, regions, typical order value, courier partners..." />
				<textarea value={verificationPolicy} onChange={e=>setVerificationPolicy(e.target.value)} rows={3} className="w-full rounded-3xl border p-4 text-sm" placeholder="Verification policy: WhatsApp/call/prepaid deposit rules..." />
				<label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={daily} onChange={e=>setDaily(e.target.checked)} /> Enable daily learning from uploaded data</label>
				<button disabled={pending} onClick={()=>start(async()=>{ await saveBrandProfile({systemInstructions,brandContext,verificationPolicy,dailyLearningEnabled:daily}); setMsg("Brand brain saved") })} className="w-fit rounded-full bg-black px-5 py-3 text-sm font-black text-white disabled:opacity-50">Save brand brain</button>
			</div>
		</div>

		<div className="grid gap-5 lg:grid-cols-2">
			<div className="rounded-[2rem] bg-gray-50 p-5">
				<h3 className="font-black">Upload brand data / SOP / RTO notes</h3>
				<input value={title} onChange={e=>setTitle(e.target.value)} className="mt-3 w-full rounded-2xl border p-3 text-sm" placeholder="Document title" />
				<select value={type} onChange={e=>setType(e.target.value)} className="mt-3 w-full rounded-2xl border p-3 text-sm"><option>cod_policy</option><option>return_policy</option><option>courier_sop</option><option>fraud_notes</option><option>pincode_rules</option><option>support_sop</option></select>
				<textarea value={text} onChange={e=>setText(e.target.value)} rows={7} className="mt-3 w-full rounded-2xl border p-3 text-sm" placeholder="Paste CSV summary, SOP, courier notes, fake-order patterns, RTO report observations..." />
				<button disabled={pending || !text.trim()} onClick={()=>start(async()=>{ await uploadBrandData({title,type,text}); setText(""); setMsg("Brand data uploaded and indexed") })} className="mt-3 rounded-full bg-[#ff4f0f] px-5 py-3 text-sm font-black text-white disabled:opacity-50">Upload + index</button>
			</div>
			<div className="rounded-[2rem] bg-gray-50 p-5">
				<h3 className="font-black">Upload pincode intelligence CSV</h3>
				<p className="mt-1 text-xs text-gray-500">Columns: pincode, city, zone, rto_rate, cod_success_rate, avg_delivery_days, notes</p>
				<textarea value={csv} onChange={e=>setCsv(e.target.value)} rows={10} className="mt-3 w-full rounded-2xl border p-3 font-mono text-xs" />
				<button disabled={pending} onClick={()=>start(async()=>{ await upsertPincodeIntel(parseCsv()); setMsg("Pincode intelligence saved") })} className="mt-3 rounded-full bg-black px-5 py-3 text-sm font-black text-white disabled:opacity-50">Save pincode data</button>
			</div>
		</div>
		{msg && <div className="rounded-full bg-green-100 px-4 py-2 text-sm font-bold text-green-800">{msg}</div>}
	</div>
}

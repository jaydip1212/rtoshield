"use client"
import { useState, useTransition } from "react"
import { saveWebhookEndpoint } from "@/app/actions"

type Hook = { id: string; platform: string; endpoint_url: string; public_key: string | null; status: string; last_event_at: string | null; created_at: string }
type Key = { publicKey: string; name: string | null }

export function WebhookClient({ keys, hooks }: { keys: Key[]; hooks: Hook[] }) {
	const [platform, setPlatform] = useState("shopify")
	const [publicKey, setPublicKey] = useState(keys[0]?.publicKey ?? "")
	const [pending, start] = useTransition()
	const [copied, setCopied] = useState<string | null>(null)
	return <div>
		<h2 className="text-2xl font-black">Create webhook endpoint</h2>
		<div className="mt-4 flex flex-wrap gap-3">
			<select className="rounded-full border px-4 py-3 text-sm" value={platform} onChange={e=>setPlatform(e.target.value)}><option value="shopify">Shopify</option><option value="woocommerce">WooCommerce</option></select>
			<select className="min-w-64 rounded-full border px-4 py-3 text-sm" value={publicKey} onChange={e=>setPublicKey(e.target.value)}>{keys.map(k=><option key={k.publicKey} value={k.publicKey}>{k.name ?? "API key"} · {k.publicKey}</option>)}</select>
			<button disabled={pending || !publicKey} className="rounded-full bg-black px-5 py-3 text-sm font-black text-white disabled:opacity-50" onClick={()=>start(async()=>{ await saveWebhookEndpoint({platform, publicKey}) })}>Save endpoint</button>
		</div>
		<div className="mt-6 space-y-3">
			{hooks.map(h=><div key={h.id} className="rounded-3xl bg-gray-50 p-4"><div className="flex items-center justify-between"><b className="capitalize">{h.platform}</b><span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">{h.status}</span></div><code className="mt-3 block break-all rounded-2xl bg-white p-3 text-xs">{h.endpoint_url}</code><button className="mt-2 text-xs font-bold text-[#ff4f0f]" onClick={async()=>{ await navigator.clipboard.writeText(h.endpoint_url); setCopied(h.id)}}>{copied===h.id?"Copied":"Copy endpoint"}</button></div>)}
			{hooks.length===0 && <p className="text-sm text-gray-500">No webhook endpoints yet. Create one above.</p>}
		</div>
	</div>
}

import { getCurrentOrg } from "@/lib/session"
import { getWebhookEndpoints, listApiKeys } from "@/lib/queries"
import { PageHeader, NoDatabaseNotice, Card, DarkCard } from "@/components/ui"
import { WebhookClient } from "./WebhookClient"

export const dynamic = "force-dynamic"

export default async function WebhooksPage() {
	const org = await getCurrentOrg()
	if (!org) return <><PageHeader title="Webhooks" /><NoDatabaseNotice /></>
	const [hooks, keys] = await Promise.all([getWebhookEndpoints(org.id), listApiKeys(org.id)])
	return (
		<>
			<PageHeader title="Webhooks & store sync" subtitle="Connect Shopify/WooCommerce webhooks with HMAC verification. Orders are normalized, PII is hashed, then the deterministic checker and agent run." />
			<section className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
				<DarkCard>
					<div className="text-sm uppercase text-white/50">Secure ingestion</div>
					<h2 className="mt-3 text-4xl font-black">HMAC first. Hash PII. Score after.</h2>
					<p className="mt-4 text-white/60">Use your SDK public key in the webhook URL. Keep WEBHOOK_SECRET server-side only. Service-role keys are never exposed.</p>
					<div className="mt-6 rounded-2xl bg-white p-4 text-black"><code className="break-all text-xs">/api/webhooks/shopify?pk=rtos_pk_...</code></div>
				</DarkCard>
				<Card>
					<WebhookClient keys={keys.map(k=>({publicKey:k.public_key,name:k.name}))} hooks={hooks} />
				</Card>
			</section>
			<Card className="mt-5">
				<h2 className="text-2xl font-black">Webhook flow</h2>
				<div className="mt-5 grid gap-3 md:grid-cols-4">
					{["Verify HMAC signature","Resolve org by public key","Normalize order payload","Hash phone/email/address and score"].map((s,i)=><div key={s} className="rounded-3xl bg-gray-50 p-4"><div className="text-4xl font-black text-[#ff4f0f]">0{i+1}</div><div className="mt-2 font-bold">{s}</div></div>)}
				</div>
			</Card>
		</>
	)
}

import { NextRequest, NextResponse } from "next/server"
import { getShopifyConnector, getWooConnector } from "@/lib/providers"
import { resolveOrgByPublicKey } from "@/lib/auth"
import { getServiceDb } from "@/lib/db"
import { hashPii } from "@/lib/hash"
import { writeAudit } from "@/lib/audit"

// POST /api/webhooks/shopify  |  /api/webhooks/woocommerce
// HMAC-verified store webhooks that normalize and ingest orders.
export async function POST(req: NextRequest, ctx: { params: { platform: string } }) {
	const platform = ctx.params.platform
	const connector =
		platform === "shopify" ? getShopifyConnector() : platform === "woocommerce" ? getWooConnector() : null
	if (!connector) return NextResponse.json({ error: "unknown_platform" }, { status: 404 })

	const raw = await req.text()
	const signature =
		req.headers.get("x-shopify-hmac-sha256") ?? req.headers.get("x-wc-webhook-signature") ?? ""
	const secret = process.env.WEBHOOK_SECRET ?? ""
	if (!connector.verifyWebhook(raw, signature, secret)) {
		return NextResponse.json({ error: "invalid_signature" }, { status: 401 })
	}

	// Identify org by the public key passed as a query param during webhook registration.
	const publicKey = new URL(req.url).searchParams.get("pk") ?? ""
	const org = await resolveOrgByPublicKey(publicKey)
	if (!org) return NextResponse.json({ error: "invalid_org" }, { status: 401 })

	const n = connector.normalizeOrder(JSON.parse(raw)) as any
	const db = getServiceDb()
	const order = await db.upsertOrder({
		org_id: org.id,
		store_id: null,
		external_id: String(n.external_id),
		payment_method: n.payment_method,
		total: Number(n.total ?? 0),
		currency: "INR",
		pincode: n.shipping?.pincode ?? null,
		city: n.shipping?.city ?? null,
		address_complete: Boolean(n.shipping?.address1 && n.shipping?.pincode),
		utm: null,
		customer: {
			phone_hash: n.customer?.phone ? hashPii(n.customer.phone, org.salt) : null,
			email_hash: n.customer?.email ? hashPii(n.customer.email, org.salt) : null,
			address_hash: n.shipping?.address1 ? hashPii(`${n.shipping.address1}|${n.shipping.pincode ?? ""}`, org.salt) : null,
		},
	})
	await db.enqueueScoring(order.id)
	await db.raw`update webhook_endpoints set last_event_at = now(), status = 'receiving'
		where org_id = ${org.id} and platform = ${platform}`.catch(() => null)
	await writeAudit(org.id, "system", `webhook.${platform}.order`, order.id)
	return NextResponse.json({ ok: true, id: order.id })
}

"use server"
import { randomBytes } from "node:crypto"
import { revalidatePath } from "next/cache"
import { getCurrentOrg } from "@/lib/session"
import { getServiceDb } from "@/lib/db"
import { hashApiKey } from "@/lib/hash"
import { writeAudit } from "@/lib/audit"

// All actions resolve the caller's org server-side and scope writes to it.

type ManualAction = "verify" | "request_prepaid" | "hold" | "ship" | "reset"

export async function applyManualAction(orderId: string, action: ManualAction) {
	const org = await getCurrentOrg()
	if (!org) throw new Error("No organization")
	const db = getServiceDb()

	const map: Record<ManualAction, { status: string; verified: boolean; event: string }> = {
		verify: { status: "verified", verified: true, event: "verified" },
		request_prepaid: { status: "awaiting_prepaid", verified: false, event: "prepaid_requested" },
		hold: { status: "held", verified: false, event: "held" },
		ship: { status: "shipping", verified: true, event: "released_to_ship" },
		reset: { status: "received", verified: false, event: "reset" },
	}
	const m = map[action]
	await db.raw`update orders set status = ${m.status}, verified = ${m.verified}
		where id = ${orderId} and org_id = ${org.id}`
	await db.raw`insert into order_events (org_id, order_id, type, payload)
		values (${org.id}, ${orderId}, ${m.event}, ${db.raw.json({ actor: "user", manual: true })})`
	// Decisions are advisory; a human just made the call. Always audited.
	await writeAudit(org.id, "user", `order.${m.event}`, orderId)
	revalidatePath(`/orders/${orderId}`)
	revalidatePath("/orders")
}

export async function saveRules(
	rules: Array<{ code: string; weight: number; enabled: boolean }>,
) {
	const org = await getCurrentOrg()
	if (!org) throw new Error("No organization")
	const db = getServiceDb()
	for (const r of rules) {
		const weight = Math.max(-50, Math.min(50, Math.round(r.weight)))
		await db.raw`insert into risk_rules (org_id, code, weight, enabled)
			values (${org.id}, ${r.code}, ${weight}, ${r.enabled})
			on conflict (org_id, code) do update set weight = excluded.weight, enabled = excluded.enabled`
	}
	await writeAudit(org.id, "user", "risk_rules.update", org.id, { count: rules.length })
	revalidatePath("/rules")
}

export async function createApiKey(name: string, scopes: string[]) {
	const org = await getCurrentOrg()
	if (!org) throw new Error("No organization")
	const db = getServiceDb()
	const secret = `rtos_sk_${randomBytes(18).toString("hex")}`
	const publicKey = `rtos_pk_${randomBytes(12).toString("hex")}`
	await db.raw`insert into api_keys (org_id, name, hashed_key, public_key, scopes)
		values (${org.id}, ${name || "API key"}, ${hashApiKey(secret)}, ${publicKey}, ${db.raw.array(scopes)})`
	await writeAudit(org.id, "user", "api_key.create", publicKey)
	revalidatePath("/settings")
	// The secret is returned ONCE and never stored in plaintext.
	return { secret, publicKey }
}

export async function revokeApiKey(id: string) {
	const org = await getCurrentOrg()
	if (!org) throw new Error("No organization")
	const db = getServiceDb()
	await db.raw`delete from api_keys where id = ${id} and org_id = ${org.id}`
	await writeAudit(org.id, "user", "api_key.revoke", id)
	revalidatePath("/settings")
}

export async function updateRetention(days: number) {
	const org = await getCurrentOrg()
	if (!org) throw new Error("No organization")
	const clamped = Math.max(7, Math.min(3650, Math.round(days)))
	const db = getServiceDb()
	await db.raw`update organizations set retention_days = ${clamped} where id = ${org.id}`
	await writeAudit(org.id, "user", "org.retention_update", org.id, { days: clamped })
	revalidatePath("/settings")
}

// GDPR-style deletion: remove a customer's hashed identifiers + device signals.
export async function requestDataDeletion(customerId: string) {
	const org = await getCurrentOrg()
	if (!org) throw new Error("No organization")
	const db = getServiceDb()
	await db.raw`update customers set phone_hash = null, email_hash = null, address_hash = null
		where id = ${customerId} and org_id = ${org.id}`
	await db.raw`delete from device_signals ds using orders o
		where ds.order_id = o.id and o.customer_id = ${customerId} and ds.org_id = ${org.id}`
	await writeAudit(org.id, "user", "customer.data_deletion", customerId)
	revalidatePath("/settings")
}

export async function saveBrandProfile(input: {
	systemInstructions: string
	brandContext: string
	verificationPolicy: string
	dailyLearningEnabled: boolean
}) {
	const org = await getCurrentOrg()
	if (!org) throw new Error("No organization")
	const db = getServiceDb()
	await db.raw`insert into brand_profiles (org_id, system_instructions, brand_context, verification_policy, daily_learning_enabled, updated_at)
		values (${org.id}, ${input.systemInstructions}, ${input.brandContext}, ${input.verificationPolicy}, ${input.dailyLearningEnabled}, now())
		on conflict (org_id) do update set
			system_instructions = excluded.system_instructions,
			brand_context = excluded.brand_context,
			verification_policy = excluded.verification_policy,
			daily_learning_enabled = excluded.daily_learning_enabled,
			updated_at = now()`
	await writeAudit(org.id, "user", "brand_profile.update", org.id)
	revalidatePath("/brand")
}

export async function uploadBrandData(input: { title: string; type: string; text: string }) {
	const org = await getCurrentOrg()
	if (!org) throw new Error("No organization")
	const db = getServiceDb()
	const [doc] = await db.raw`insert into documents (org_id, type, title) values (${org.id}, ${input.type}, ${input.title}) returning id`
	try {
		const { indexDocument } = await import("@/lib/rag")
		await indexDocument(org.id, doc.id, input.text)
	} catch {
		await db.raw`insert into document_chunks (org_id, document_id, idx, content) values (${org.id}, ${doc.id}, 0, ${input.text})`
	}
	await writeAudit(org.id, "user", "brand_data.upload", doc.id, { type: input.type })
	revalidatePath("/brand")
	revalidatePath("/documents")
}

export async function upsertPincodeIntel(rows: Array<{ pincode: string; city?: string; zone?: string; rtoRate: number; codSuccessRate?: number; avgDeliveryDays?: number; notes?: string }>) {
	const org = await getCurrentOrg()
	if (!org) throw new Error("No organization")
	const db = getServiceDb()
	for (const r of rows) {
		if (!r.pincode) continue
		await db.raw`insert into pincode_intelligence (org_id, pincode, city, zone, rto_rate, cod_success_rate, avg_delivery_days, notes, updated_at)
			values (${org.id}, ${r.pincode}, ${r.city ?? null}, ${r.zone ?? null}, ${r.rtoRate}, ${r.codSuccessRate ?? 0}, ${r.avgDeliveryDays ?? null}, ${r.notes ?? null}, now())
			on conflict (org_id, pincode) do update set city = excluded.city, zone = excluded.zone, rto_rate = excluded.rto_rate,
			cod_success_rate = excluded.cod_success_rate, avg_delivery_days = excluded.avg_delivery_days, notes = excluded.notes, updated_at = now()`
	}
	await writeAudit(org.id, "user", "pincode_intelligence.upsert", org.id, { count: rows.length })
	revalidatePath("/brand")
}

export async function saveWebhookEndpoint(input: { platform: string; publicKey: string }) {
	const org = await getCurrentOrg()
	if (!org) throw new Error("No organization")
	const db = getServiceDb()
	const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
	const endpoint = `${base}/api/webhooks/${input.platform}?pk=${encodeURIComponent(input.publicKey)}`
	await db.raw`insert into webhook_endpoints (org_id, platform, endpoint_url, public_key, status)
		values (${org.id}, ${input.platform}, ${endpoint}, ${input.publicKey}, 'ready')
		on conflict (org_id, platform) do update set endpoint_url = excluded.endpoint_url, public_key = excluded.public_key, status = 'ready'`
	await writeAudit(org.id, "user", "webhook_endpoint.save", input.platform)
	revalidatePath("/webhooks")
}

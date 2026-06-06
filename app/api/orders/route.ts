import { NextRequest, NextResponse } from "next/server"
import { createOrderSchema } from "@/lib/zod-schemas"
import { requireApiKey } from "@/lib/auth"
import { rateLimit } from "@/lib/rate-limit"
import { getServiceDb } from "@/lib/db"
import { hashPii } from "@/lib/hash"
import { writeAudit } from "@/lib/audit"

// POST /api/orders  — REST order ingestion (API key auth)
export async function POST(req: NextRequest) {
	const limited = await rateLimit(req, "orders:create", 120)
	if (limited) return limited

	const auth = await requireApiKey(req, ["orders:write"])
	if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 })

	const json = await req.json().catch(() => null)
	const parsed = createOrderSchema.safeParse(json)
	if (!parsed.success) {
		return NextResponse.json(
			{ error: "validation_error", details: parsed.error.flatten() },
			{ status: 422 },
		)
	}

	const { org } = auth
	const body = parsed.data
	const db = getServiceDb()

	// Hash PII with the org salt before storage. Raw PII is never persisted here.
	const phone_hash = body.customer.phone ? hashPii(body.customer.phone, org.salt) : null
	const email_hash = body.customer.email ? hashPii(body.customer.email, org.salt) : null
	const address_hash = body.shipping.address1
		? hashPii(
				`${body.shipping.address1}|${body.shipping.pincode ?? ""}`,
				org.salt,
		  )
		: null

	const order = await db.upsertOrder({
		org_id: org.id,
		store_id: body.store_id ?? null,
		external_id: body.external_id,
		payment_method: body.payment_method,
		total: body.total,
		currency: body.currency,
		pincode: body.shipping.pincode ?? null,
		city: body.shipping.city ?? null,
		address_complete: Boolean(body.shipping.address1 && body.shipping.pincode),
		utm: body.utm ?? null,
		customer: { phone_hash, email_hash, address_hash },
	})

	await writeAudit(org.id, "system", "order.created", order.id)

	// Enqueue async scoring (BullMQ). Falls back to inline scoring if no Redis.
	await db.enqueueScoring(order.id)

	return NextResponse.json({ id: order.id, status: "queued_for_scoring" }, { status: 201 })
}

// GET /api/orders — list orders for the authenticated org
export async function GET(req: NextRequest) {
	const auth = await requireApiKey(req, ["orders:read"])
	if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 })
	const url = new URL(req.url)
	const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 200)
	const rows = await getServiceDb().listOrders(auth.org.id, limit)
	return NextResponse.json({ data: rows })
}

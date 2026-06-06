/**
 * Server-side data access using the Supabase SERVICE ROLE.
 * This bypasses RLS and must NEVER be imported into client components.
 * Real queries use `postgres`/Drizzle; this wrapper keeps the surface small
 * and demo-friendly. Swap the in-memory fallback for real SQL in production.
 */
// NOTE: This module uses the Supabase SERVICE ROLE and must only be used
// server-side (RSC, route handlers, server actions, scripts/worker).
import postgres from "postgres"

let sql: ReturnType<typeof postgres> | null = null
function client() {
	if (!sql) {
		const url = process.env.DATABASE_URL
		if (!url) throw new Error("DATABASE_URL is not set")
		sql = postgres(url, { prepare: false })
	}
	return sql
}

export interface OrgRow {
	id: string
	salt: string
	name: string
}

export function getServiceDb() {
	const db = client()
	return {
		async upsertOrder(input: {
			org_id: string
			store_id: string | null
			external_id: string
			payment_method: string
			total: number
			currency: string
			pincode: string | null
			city: string | null
			address_complete: boolean
			utm: unknown
			customer: { phone_hash: string | null; email_hash: string | null; address_hash: string | null }
		}) {
			const [customer] = await db`
				insert into customers (org_id, phone_hash, email_hash, address_hash)
				values (${input.org_id}, ${input.customer.phone_hash}, ${input.customer.email_hash}, ${input.customer.address_hash})
				returning id`
			const [order] = await db`
				insert into orders (org_id, store_id, customer_id, external_id, payment_method, total, currency, pincode, city, address_complete, utm)
				values (${input.org_id}, ${input.store_id}, ${customer.id}, ${input.external_id}, ${input.payment_method}, ${input.total}, ${input.currency}, ${input.pincode}, ${input.city}, ${input.address_complete}, ${db.json(input.utm as any)})
				on conflict (org_id, external_id) do update set total = excluded.total
				returning id`
			return { id: order.id as string }
		},
		async listOrders(org_id: string, limit: number) {
			return db`select id, external_id, payment_method, total, status, verified, created_at
				from orders where org_id = ${org_id} order by created_at desc limit ${limit}`
		},
		async insertDeviceSignal(s: Record<string, unknown>) {
			await db`insert into device_signals ${db(s as any)}`
		},
		async saveRiskDecision(d: {
			org_id: string
			order_id: string
			score: number
			level: string
			reasons: unknown
			recommended_action: string
		}) {
			await db`insert into risk_decisions (org_id, order_id, score, level, reasons, recommended_action)
				values (${d.org_id}, ${d.order_id}, ${d.score}, ${d.level}, ${db.json(d.reasons as any)}, ${d.recommended_action})`
		},
		async enqueueScoring(orderId: string) {
			// See lib/queue.ts — enqueues a BullMQ job. Falls back to inline scoring
			// when REDIS_URL is unset (local dev).
			const { enqueueScoreJob } = await import("./queue")
			await enqueueScoreJob(orderId)
		},
		raw: db,
	}
}

import "server-only"
import { getServiceDb } from "./db"
import { DEFAULT_RULE_WEIGHTS, RULE_LABELS, type RuleCode } from "./risk-engine"

// NOTE: getServiceDb uses the service role and bypasses RLS, so every query
// here filters explicitly by org_id. Never expose these helpers to the client.

export interface DashboardStats {
	totalOrders: number
	scored: number
	risky: number
	cod: number
	verified: number
	dist: Array<{ level: string; n: number }>
}

export async function getDashboardStats(orgId: string): Promise<DashboardStats> {
	const db = getServiceDb()
	const [c] = await db.raw`
		select
			(select count(*) from orders where org_id = ${orgId})::int as "totalOrders",
			(select count(*) from risk_decisions where org_id = ${orgId})::int as scored,
			(select count(*) from risk_decisions where org_id = ${orgId} and level in ('high','critical'))::int as risky,
			(select count(*) from orders where org_id = ${orgId} and payment_method = 'cod')::int as cod,
			(select count(*) from orders where org_id = ${orgId} and verified)::int as verified`
	const dist = (await db.raw`
		select level, count(*)::int as n from risk_decisions where org_id = ${orgId} group by level`) as Array<{ level: string; n: number }>
	return { ...(c as any), dist }
}

export interface OrderRow {
	id: string
	external_id: string | null
	payment_method: string
	total: string
	currency: string
	city: string | null
	pincode: string | null
	status: string
	verified: boolean
	created_at: string
	score: number | null
	level: string | null
	recommended_action: string | null
}

export async function listOrdersWithRisk(
	orgId: string,
	opts: { limit?: number; level?: string } = {},
): Promise<OrderRow[]> {
	const db = getServiceDb()
	const limit = Math.min(opts.limit ?? 100, 500)
	const rows = await db.raw`
		select o.id, o.external_id, o.payment_method, o.total, o.currency, o.city, o.pincode,
			   o.status, o.verified, o.created_at,
			   rd.score, rd.level, rd.recommended_action
		from orders o
		left join lateral (
			select score, level, recommended_action from risk_decisions r
			where r.order_id = o.id order by r.created_at desc limit 1
		) rd on true
		where o.org_id = ${orgId}
		${opts.level ? db.raw`and rd.level = ${opts.level}` : db.raw``}
		order by o.created_at desc
		limit ${limit}`
	return rows as unknown as OrderRow[]
}

export async function getRecentRiskyOrders(orgId: string, limit = 8): Promise<OrderRow[]> {
	const db = getServiceDb()
	const rows = await db.raw`
		select o.id, o.external_id, o.payment_method, o.total, o.currency, o.city, o.pincode,
			   o.status, o.verified, o.created_at,
			   rd.score, rd.level, rd.recommended_action
		from orders o
		join lateral (
			select score, level, recommended_action from risk_decisions r
			where r.order_id = o.id order by r.created_at desc limit 1
		) rd on true
		where o.org_id = ${orgId} and rd.level in ('high','critical')
		order by rd.score desc, o.created_at desc
		limit ${limit}`
	return rows as unknown as OrderRow[]
}

export interface OrderDetail extends OrderRow {
	reasons: Array<{ code: string; label: string; weight: number }>
	events: Array<{ type: string; created_at: string; payload: any }>
}

export async function getOrderDetail(orgId: string, id: string): Promise<OrderDetail | null> {
	const db = getServiceDb()
	const [o] = await db.raw`
		select o.id, o.external_id, o.payment_method, o.total, o.currency, o.city, o.pincode,
			   o.status, o.verified, o.created_at,
			   rd.score, rd.level, rd.recommended_action, rd.reasons
		from orders o
		left join lateral (
			select score, level, recommended_action, reasons from risk_decisions r
			where r.order_id = o.id order by r.created_at desc limit 1
		) rd on true
		where o.org_id = ${orgId} and o.id = ${id} limit 1`
	if (!o) return null
	const events = await db.raw`
		select type, created_at, payload from order_events
		where org_id = ${orgId} and order_id = ${id} order by created_at desc limit 50`
	return { ...(o as any), reasons: (o as any).reasons ?? [], events: events as any }
}

export interface RuleRow {
	code: string
	label: string
	weight: number
	enabled: boolean
}

export async function listRules(orgId: string): Promise<RuleRow[]> {
	const db = getServiceDb()
	const rows = (await db.raw`
		select code, weight, enabled from risk_rules where org_id = ${orgId}`) as Array<{
		code: string
		weight: number
		enabled: boolean
	}>
	const byCode = new Map(rows.map((r) => [r.code, r]))
	return (Object.keys(DEFAULT_RULE_WEIGHTS) as RuleCode[]).map((code) => ({
		code,
		label: RULE_LABELS[code],
		weight: byCode.get(code)?.weight ?? DEFAULT_RULE_WEIGHTS[code],
		enabled: byCode.get(code)?.enabled ?? true,
	}))
}

export interface ApiKeyRow {
	id: string
	name: string | null
	public_key: string
	scopes: string[]
	last_used_at: string | null
	created_at: string
}

export async function listApiKeys(orgId: string): Promise<ApiKeyRow[]> {
	const db = getServiceDb()
	const rows = await db.raw`
		select id, name, public_key, scopes, last_used_at, created_at
		from api_keys where org_id = ${orgId} order by created_at desc`
	return rows as unknown as ApiKeyRow[]
}

export async function getOrgSettings(orgId: string): Promise<{ name: string; retention_days: number }> {
	const db = getServiceDb()
	const [row] = await db.raw`select name, retention_days from organizations where id = ${orgId}`
	return row as any
}

export interface DocumentRow {
	id: string
	type: string
	title: string
	created_at: string
	chunks: number
}

export async function listDocuments(orgId: string): Promise<DocumentRow[]> {
	const db = getServiceDb()
	const rows = await db.raw`
		select d.id, d.type, d.title, d.created_at,
			   (select count(*) from document_chunks c where c.document_id = d.id)::int as chunks
		from documents d where d.org_id = ${orgId} order by d.created_at desc`
	return rows as unknown as DocumentRow[]
}

export async function listCustomersForDeletion(orgId: string, limit = 25) {
	const db = getServiceDb()
	const rows = await db.raw`
		select id, phone_hash, address_hash, rto_count, successful_deliveries
		from customers where org_id = ${orgId}
		order by created_at desc limit ${limit}`
	return rows as any[]
}

export interface BrandProfileRow {
	system_instructions: string
	brand_context: string
	verification_policy: string
	daily_learning_enabled: boolean
}

export async function getBrandProfile(orgId: string): Promise<BrandProfileRow> {
	const db = getServiceDb()
	try {
		const [row] = await db.raw`
			select system_instructions, brand_context, verification_policy, daily_learning_enabled
			from brand_profiles where org_id = ${orgId} limit 1`
		return (row as unknown as BrandProfileRow) ?? { system_instructions: "", brand_context: "", verification_policy: "", daily_learning_enabled: true }
	} catch {
		return { system_instructions: "", brand_context: "Run migration 0002_brand_intelligence.sql to enable brand profiles.", verification_policy: "", daily_learning_enabled: true }
	}
}

export interface PincodeIntelRow {
	id: string
	pincode: string
	city: string | null
	zone: string | null
	rto_rate: string
	cod_success_rate: string
	avg_delivery_days: string | null
	notes: string | null
}

export async function listPincodeIntel(orgId: string, limit = 30): Promise<PincodeIntelRow[]> {
	const db = getServiceDb()
	try {
		return (await db.raw`
			select id, pincode, city, zone, rto_rate, cod_success_rate, avg_delivery_days, notes
			from pincode_intelligence where org_id = ${orgId}
			order by rto_rate desc, updated_at desc limit ${limit}`) as any
	} catch {
		return []
	}
}

export async function getWebhookEndpoints(orgId: string) {
	const db = getServiceDb()
	try {
		return (await db.raw`
			select id, platform, endpoint_url, public_key, status, last_event_at, created_at
			from webhook_endpoints where org_id = ${orgId} order by created_at desc`) as Array<{
				id: string; platform: string; endpoint_url: string; public_key: string | null; status: string; last_event_at: string | null; created_at: string
			}>
	} catch {
		return []
	}
}

export async function getAgentLearningStats(orgId: string) {
	const db = getServiceDb()
	const [row] = await db.raw`
		select
			(select count(*) from documents where org_id = ${orgId})::int as docs,
			(select count(*) from pincode_intelligence where org_id = ${orgId})::int as pincodes,
			(select count(*) from rto_cases where org_id = ${orgId})::int as rto_cases,
			(select count(*) from device_signals where org_id = ${orgId})::int as device_signals,
			(select count(*) from agent_actions where org_id = ${orgId})::int as agent_actions`
	return row as { docs: number; pincodes: number; rto_cases: number; device_signals: number; agent_actions: number }
}

export async function getDashboardDeepStats(orgId: string) {
	const db = getServiceDb()
	const [row] = await db.raw`
		select
			(select coalesce(round(avg(score)),0)::int from risk_decisions where org_id = ${orgId}) as avg_score,
			(select count(*)::int from orders where org_id = ${orgId} and status in ('held','awaiting_prepaid')) as blocked_or_held,
			(select count(*)::int from orders where org_id = ${orgId} and created_at > now() - interval '24 hours') as orders_24h,
			(select count(*)::int from audit_logs where org_id = ${orgId} and created_at > now() - interval '24 hours') as audit_24h,
			(select count(*)::int from webhook_endpoints where org_id = ${orgId} and status in ('ready','receiving')) as active_webhooks,
			(select count(*)::int from api_keys where org_id = ${orgId}) as api_keys`
	return row as { avg_score: number; blocked_or_held: number; orders_24h: number; audit_24h: number; active_webhooks: number; api_keys: number }
}

export async function getOrderTrend(orgId: string, days = 7) {
	const db = getServiceDb()
	const rows = await db.raw`
		with series as (
			select generate_series(current_date - (${days - 1})::int, current_date, interval '1 day')::date as day
		)
		select s.day::text,
			coalesce(count(o.id),0)::int as orders,
			coalesce(count(rd.id) filter (where rd.level in ('high','critical')),0)::int as risky
		from series s
		left join orders o on o.org_id = ${orgId} and o.created_at::date = s.day
		left join lateral (
			select id, level from risk_decisions r where r.order_id = o.id order by created_at desc limit 1
		) rd on true
		group by s.day order by s.day asc`
	return rows as unknown as Array<{ day: string; orders: number; risky: number }>
}

export async function getRecentAuditLogs(orgId: string, limit = 8) {
	const db = getServiceDb()
	const rows = await db.raw`
		select action, target, created_at, metadata from audit_logs
		where org_id = ${orgId} order by created_at desc limit ${limit}`
	return rows as unknown as Array<{ action: string; target: string | null; created_at: string; metadata: any }>
}

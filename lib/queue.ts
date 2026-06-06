import { getServiceDb } from "./db"
import { scoreOrder, type RiskInput } from "./risk-engine"

/**
 * Async scoring queue. Uses BullMQ when REDIS_URL is set; otherwise scores
 * inline so the app is fully runnable in local dev without Redis.
 *
 * The input is built from deterministic evidence only: uploaded pincode intel,
 * customer history, order velocity, device/IP signals, and the order itself.
 */
async function buildRiskInput(orderId: string): Promise<{ orgId: string; input: RiskInput } | null> {
	const db = getServiceDb()
	const [o] = await db.raw`select * from orders where id = ${orderId} limit 1`
	if (!o) return null

	const [pin] = await db.raw`
		select * from pincode_intelligence where org_id = ${o.org_id} and pincode = ${o.pincode} limit 1`.catch(() => [null] as any)
	const [cust] = o.customer_id
		? await db.raw`select * from customers where org_id = ${o.org_id} and id = ${o.customer_id} limit 1`
		: [null]
	const [velocity] = await db.raw`
		select count(*)::int as n from orders
		where org_id = ${o.org_id} and customer_id = ${o.customer_id} and created_at > now() - interval '24 hours'`
	const [device] = await db.raw`
		select * from device_signals where org_id = ${o.org_id} and order_id = ${orderId} order by created_at desc limit 1`
	const [deviceCod] = device?.device_token_hash
		? await db.raw`
			select count(*)::int as n from device_signals ds
			join orders ord on ord.id = ds.order_id
			where ds.org_id = ${o.org_id} and ds.device_token_hash = ${device.device_token_hash}
			and ord.payment_method = 'cod' and ds.created_at > now() - interval '7 days'`
		: [{ n: 0 }]
	const [ipVelocity] = device?.ip_hash
		? await db.raw`
			select count(*)::int as n from device_signals
			where org_id = ${o.org_id} and ip_hash = ${device.ip_hash} and created_at > now() - interval '2 hours'`
		: [{ n: 0 }]

	const input: RiskInput = {
		paymentMethod: o.payment_method,
		orderValue: Number(o.total),
		isFirstTimeCustomer: !cust || ((cust.successful_deliveries ?? 0) === 0 && (cust.rto_count ?? 0) === 0),
		alreadyVerified: o.verified,
		addressComplete: o.address_complete,
		phoneHasPreviousRto: (cust?.rto_count ?? 0) > 0,
		addressHasPreviousRto: (cust?.rto_count ?? 0) > 0,
		deviceCodOrderCount: Number(deviceCod?.n ?? 0),
		ipOrdersInWindow: Number(ipVelocity?.n ?? 0),
		ipCityMismatch: Boolean(pin?.city && o.city && String(pin.city).toLowerCase() !== String(o.city).toLowerCase()),
		vpnProxyDatacenter: Boolean(device?.vpn_flag),
		pincodeRtoRate: Number(pin?.rto_rate ?? 0),
		ndrFailureCount: 0,
		identitySignalMismatch: Boolean(pin?.city && o.city && String(pin.city).toLowerCase() !== String(o.city).toLowerCase()),
		customerOrderVelocity: Number(velocity?.n ?? 0),
		returningWithSuccessfulDeliveries: (cust?.successful_deliveries ?? 0) > 0,
	}
	return { orgId: o.org_id, input }
}

export async function scoreOrderNow(orderId: string) {
	const built = await buildRiskInput(orderId)
	if (!built) return
	const decision = scoreOrder(built.input)
	await getServiceDb().saveRiskDecision({
		org_id: built.orgId,
		order_id: orderId,
		score: decision.score,
		level: decision.risk_level,
		reasons: decision.reasons,
		recommended_action: decision.recommended_action,
	})
}

export async function enqueueScoreJob(orderId: string) {
	if (!process.env.REDIS_URL) {
		await scoreOrderNow(orderId)
		return
	}
	const { Queue } = await import("bullmq")
	const IORedis = (await import("ioredis")).default
	const connection = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null })
	// BullMQ bundles its own ioredis types; cast to bridge the duplicate type identity.
	const queue = new Queue("scoring", { connection: connection as any })
	await queue.add("score", { orderId }, { removeOnComplete: true, attempts: 3 })
}

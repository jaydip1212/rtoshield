import { getServiceDb } from "./db"

export type DeterministicCheck = {
	code: string
	label: string
	severity: "pass" | "watch" | "fail"
	detail: string
	weight: number
}

function sev(weight: number): DeterministicCheck["severity"] {
	return weight >= 12 ? "fail" : weight > 0 ? "watch" : "pass"
}

/**
 * Non-AI fraud/RTO checker. It never guesses: it cross-checks the order against
 * merchant history, uploaded pincode intelligence, device/IP velocity, and
 * customer history. The AI agent only explains these facts later.
 */
export async function runDeterministicChecks(orgId: string, orderId: string): Promise<DeterministicCheck[]> {
	const db = getServiceDb()
	const [order] = await db.raw`select * from orders where org_id = ${orgId} and id = ${orderId} limit 1`
	if (!order) return []

	const [pin] = await db.raw`
		select * from pincode_intelligence where org_id = ${orgId} and pincode = ${order.pincode} limit 1`
	const [cust] = order.customer_id
		? await db.raw`select * from customers where org_id = ${orgId} and id = ${order.customer_id} limit 1`
		: [null]
	const [velocity] = await db.raw`
		select count(*)::int as n from orders
		where org_id = ${orgId} and customer_id = ${order.customer_id} and created_at > now() - interval '24 hours'`
	const [samePinCod] = await db.raw`
		select count(*)::int as n from orders
		where org_id = ${orgId} and pincode = ${order.pincode} and payment_method = 'cod' and created_at > now() - interval '7 days'`
	const [device] = await db.raw`
		select vpn_flag, coarse_geo, device_token_hash, ip_hash from device_signals
		where org_id = ${orgId} and order_id = ${orderId} order by created_at desc limit 1`
	const [deviceCod] = device?.device_token_hash
		? await db.raw`
			select count(*)::int as n from device_signals ds
			join orders o on o.id = ds.order_id
			where ds.org_id = ${orgId} and ds.device_token_hash = ${device.device_token_hash}
			and o.payment_method = 'cod' and ds.created_at > now() - interval '7 days'`
		: [{ n: 0 }]

	const checks: DeterministicCheck[] = []
	const rtoRate = Number(pin?.rto_rate ?? 0)
	checks.push({
		code: "pincode_rto_rate",
		label: "Pincode RTO rate",
		severity: sev(rtoRate >= 0.35 ? 14 : rtoRate >= 0.2 ? 8 : 0),
		detail: pin ? `${order.pincode} ${pin.city ?? ""} has ${(rtoRate * 100).toFixed(0)}% uploaded RTO rate` : "No uploaded pincode benchmark yet",
		weight: rtoRate >= 0.35 ? 14 : rtoRate >= 0.2 ? 8 : 0,
	})
	checks.push({
		code: "city_pincode_match",
		label: "City/pincode consistency",
		severity: pin?.city && order.city && pin.city.toLowerCase() !== String(order.city).toLowerCase() ? "fail" : "pass",
		detail: pin?.city ? `Uploaded city for ${order.pincode}: ${pin.city}; order city: ${order.city ?? "unknown"}` : "No city benchmark uploaded",
		weight: pin?.city && order.city && pin.city.toLowerCase() !== String(order.city).toLowerCase() ? 10 : 0,
	})
	checks.push({
		code: "customer_rto_history",
		label: "Customer prior RTO",
		severity: sev((cust?.rto_count ?? 0) > 0 ? 20 : 0),
		detail: `${cust?.rto_count ?? 0} prior RTO case(s), ${cust?.successful_deliveries ?? 0} successful delivery(s)`,
		weight: (cust?.rto_count ?? 0) > 0 ? 20 : (cust?.successful_deliveries ?? 0) > 0 ? -8 : 0,
	})
	checks.push({
		code: "order_velocity",
		label: "Customer order velocity",
		severity: sev((velocity?.n ?? 0) >= 3 ? 8 : 0),
		detail: `${velocity?.n ?? 0} order(s) from same customer in 24h`,
		weight: (velocity?.n ?? 0) >= 3 ? 8 : 0,
	})
	checks.push({
		code: "pincode_cod_spike",
		label: "Pincode COD spike",
		severity: sev((samePinCod?.n ?? 0) >= 10 ? 12 : (samePinCod?.n ?? 0) >= 5 ? 6 : 0),
		detail: `${samePinCod?.n ?? 0} COD order(s) in this pincode in 7d`,
		weight: (samePinCod?.n ?? 0) >= 10 ? 12 : (samePinCod?.n ?? 0) >= 5 ? 6 : 0,
	})
	checks.push({
		code: "device_cod_reuse",
		label: "Device COD reuse",
		severity: sev((deviceCod?.n ?? 0) >= 3 ? 15 : 0),
		detail: `${deviceCod?.n ?? 0} COD order(s) from same device token in 7d`,
		weight: (deviceCod?.n ?? 0) >= 3 ? 15 : 0,
	})
	checks.push({
		code: "vpn_proxy",
		label: "VPN/proxy signal",
		severity: device?.vpn_flag ? "watch" : "pass",
		detail: device ? (device.vpn_flag ? "Device signal marked VPN/proxy/datacenter" : "No VPN/proxy flag") : "No device signal yet",
		weight: device?.vpn_flag ? 10 : 0,
	})
	return checks
}

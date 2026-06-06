/**
 * RTOShield deterministic risk engine.
 *
 * Pure function: given normalized order + signal + history inputs and a set of
 * rule weights, returns a 0-100 score, a risk level, the list of reasons that
 * fired, and a recommended action.
 *
 * IMPORTANT: This engine NEVER cancels an order. It only recommends. Cancellation
 * or holding is always a human decision (see recommended_action).
 */

export type PaymentMethod = "cod" | "prepaid"

export type RiskLevel = "low" | "medium" | "high" | "critical"

export type RecommendedAction =
	| "ship_normally"
	| "verify_by_whatsapp"
	| "verify_by_call"
	| "request_prepaid_deposit"
	| "manual_review"
	| "hold_order"

/** Rule codes map 1:1 to the configurable weights in the `risk_rules` table. */
export type RuleCode =
	| "phone_prev_rto"
	| "address_prev_rto"
	| "device_multi_cod"
	| "ip_velocity"
	| "ip_city_mismatch"
	| "vpn_proxy_dc"
	| "address_incomplete"
	| "pincode_high_rto"
	| "first_time_high_cod"
	| "ndr_history"
	| "identity_mismatch"
	| "order_velocity"
	| "prepaid"
	| "returning_success"
	| "already_verified"

/** Default weights. Per-org overrides live in the `risk_rules` table. */
export const DEFAULT_RULE_WEIGHTS: Record<RuleCode, number> = {
	phone_prev_rto: 20,
	address_prev_rto: 15,
	device_multi_cod: 15,
	ip_velocity: 12,
	ip_city_mismatch: 10,
	vpn_proxy_dc: 10,
	address_incomplete: 8,
	pincode_high_rto: 8,
	first_time_high_cod: 8,
	ndr_history: 7,
	identity_mismatch: 6,
	order_velocity: 5,
	prepaid: -10,
	returning_success: -8,
	already_verified: -5,
}

export const RULE_LABELS: Record<RuleCode, string> = {
	phone_prev_rto: "Same phone has a previous RTO",
	address_prev_rto: "Same address has a previous RTO",
	device_multi_cod: "Same device placed multiple COD orders",
	ip_velocity: "Same IP placed many orders in a short time",
	ip_city_mismatch: "IP city and shipping city mismatch",
	vpn_proxy_dc: "VPN / proxy / datacenter IP detected",
	address_incomplete: "Shipping address is incomplete",
	pincode_high_rto: "Pincode has a high RTO rate",
	first_time_high_cod: "First-time customer with high COD value",
	ndr_history: "Repeated NDR / delivery failure history",
	identity_mismatch: "Mismatched customer identity signals",
	order_velocity: "Unusual order velocity",
	prepaid: "Order is prepaid",
	returning_success: "Returning customer with successful deliveries",
	already_verified: "Order already verified",
}

/** Normalized inputs the engine reasons over. All derived server-side from hashed data. */
export interface RiskInput {
	paymentMethod: PaymentMethod
	orderValue: number
	highCodThreshold?: number // default 2000
	isFirstTimeCustomer: boolean
	alreadyVerified: boolean
	addressComplete: boolean
	// history / signal flags (computed by callers from hashed lookups)
	phoneHasPreviousRto: boolean
	addressHasPreviousRto: boolean
	deviceCodOrderCount: number // distinct COD orders seen for this device token hash
	ipOrdersInWindow: number // orders from this ip hash in the velocity window
	ipCityMismatch: boolean
	vpnProxyDatacenter: boolean
	pincodeRtoRate: number // 0..1
	pincodeHighRtoThreshold?: number // default 0.35
	ndrFailureCount: number
	identitySignalMismatch: boolean
	customerOrderVelocity: number // orders by this customer in window
	returningWithSuccessfulDeliveries: boolean
}

export interface FiredReason {
	code: RuleCode
	label: string
	weight: number
}

export interface RiskDecision {
	score: number // 0..100 (clamped)
	risk_level: RiskLevel
	reasons: FiredReason[]
	recommended_action: RecommendedAction
}

function clamp(n: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, n))
}

export function levelForScore(score: number): RiskLevel {
	if (score >= 80) return "critical"
	if (score >= 55) return "high"
	if (score >= 30) return "medium"
	return "low"
}

export function recommendedActionFor(
	level: RiskLevel,
	input: RiskInput,
): RecommendedAction {
	if (input.alreadyVerified) return "ship_normally"
	switch (level) {
		case "low":
			return "ship_normally"
		case "medium":
			return input.paymentMethod === "cod" ? "verify_by_whatsapp" : "ship_normally"
		case "high":
			return input.paymentMethod === "cod"
				? "request_prepaid_deposit"
				: "verify_by_call"
		case "critical":
			return "manual_review"
	}
}

export function scoreOrder(
	input: RiskInput,
	weights: Record<RuleCode, number> = DEFAULT_RULE_WEIGHTS,
): RiskDecision {
	const highCod = input.highCodThreshold ?? 2000
	const pincodeThreshold = input.pincodeHighRtoThreshold ?? 0.35

	const fired: Partial<Record<RuleCode, boolean>> = {
		phone_prev_rto: input.phoneHasPreviousRto,
		address_prev_rto: input.addressHasPreviousRto,
		device_multi_cod:
			input.paymentMethod === "cod" && input.deviceCodOrderCount > 1,
		ip_velocity: input.ipOrdersInWindow >= 5,
		ip_city_mismatch: input.ipCityMismatch,
		vpn_proxy_dc: input.vpnProxyDatacenter,
		address_incomplete: !input.addressComplete,
		pincode_high_rto: input.pincodeRtoRate >= pincodeThreshold,
		first_time_high_cod:
			input.isFirstTimeCustomer &&
			input.paymentMethod === "cod" &&
			input.orderValue >= highCod,
		ndr_history: input.ndrFailureCount > 0,
		identity_mismatch: input.identitySignalMismatch,
		order_velocity: input.customerOrderVelocity >= 3,
		prepaid: input.paymentMethod === "prepaid",
		returning_success: input.returningWithSuccessfulDeliveries,
		already_verified: input.alreadyVerified,
	}

	const reasons: FiredReason[] = []
	let raw = 0
	for (const code of Object.keys(weights) as RuleCode[]) {
		if (fired[code]) {
			const weight = weights[code]
			raw += weight
			reasons.push({ code, label: RULE_LABELS[code], weight })
		}
	}

	const score = clamp(Math.round(raw), 0, 100)
	const risk_level = levelForScore(score)
	return {
		score,
		risk_level,
		reasons,
		recommended_action: recommendedActionFor(risk_level, input),
	}
}

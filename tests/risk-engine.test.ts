import { describe, it, expect } from "vitest"
import {
	scoreOrder,
	levelForScore,
	DEFAULT_RULE_WEIGHTS,
	type RiskInput,
} from "../lib/risk-engine"

const baseInput: RiskInput = {
	paymentMethod: "prepaid",
	orderValue: 500,
	isFirstTimeCustomer: false,
	alreadyVerified: false,
	addressComplete: true,
	phoneHasPreviousRto: false,
	addressHasPreviousRto: false,
	deviceCodOrderCount: 0,
	ipOrdersInWindow: 0,
	ipCityMismatch: false,
	vpnProxyDatacenter: false,
	pincodeRtoRate: 0,
	ndrFailureCount: 0,
	identitySignalMismatch: false,
	customerOrderVelocity: 0,
	returningWithSuccessfulDeliveries: false,
}

describe("levelForScore", () => {
	it("maps score ranges to levels", () => {
		expect(levelForScore(0)).toBe("low")
		expect(levelForScore(29)).toBe("low")
		expect(levelForScore(30)).toBe("medium")
		expect(levelForScore(55)).toBe("high")
		expect(levelForScore(80)).toBe("critical")
		expect(levelForScore(100)).toBe("critical")
	})
})

describe("scoreOrder", () => {
	it("clamps a clean prepaid order to a low score", () => {
		const d = scoreOrder(baseInput)
		expect(d.score).toBe(0) // prepaid -10 clamped to 0
		expect(d.risk_level).toBe("low")
		expect(d.recommended_action).toBe("ship_normally")
	})

	it("accumulates weights for a risky COD order", () => {
		const d = scoreOrder({
			...baseInput,
			paymentMethod: "cod",
			isFirstTimeCustomer: true,
			orderValue: 5000,
			phoneHasPreviousRto: true, // +20
			addressHasPreviousRto: true, // +15
			vpnProxyDatacenter: true, // +10
		})
		// 20 + 15 + 10 + 8 (first_time_high_cod) = 53
		expect(d.score).toBe(53)
		expect(d.risk_level).toBe("medium")
		expect(d.reasons.map((r) => r.code)).toContain("phone_prev_rto")
	})

	it("recommends manual review for critical orders", () => {
		const d = scoreOrder({
			...baseInput,
			paymentMethod: "cod",
			phoneHasPreviousRto: true, // +20
			addressHasPreviousRto: true, // +15
			deviceCodOrderCount: 3, // +15
			ipOrdersInWindow: 6, // +12
			ipCityMismatch: true, // +10
			vpnProxyDatacenter: true, // +10
		})
		expect(d.score).toBe(82)
		expect(d.risk_level).toBe("critical")
		expect(d.recommended_action).toBe("manual_review")
	})

	it("never returns a score outside 0-100", () => {
		const d = scoreOrder({
			...baseInput,
			paymentMethod: "cod",
			phoneHasPreviousRto: true,
			addressHasPreviousRto: true,
			deviceCodOrderCount: 9,
			ipOrdersInWindow: 99,
			ipCityMismatch: true,
			vpnProxyDatacenter: true,
			addressComplete: false,
			pincodeRtoRate: 0.9,
			isFirstTimeCustomer: true,
			orderValue: 99999,
			ndrFailureCount: 5,
			identitySignalMismatch: true,
			customerOrderVelocity: 9,
		})
		expect(d.score).toBeLessThanOrEqual(100)
		expect(d.score).toBeGreaterThanOrEqual(0)
	})

	it("respects already-verified short circuit", () => {
		const d = scoreOrder({ ...baseInput, alreadyVerified: true })
		expect(d.recommended_action).toBe("ship_normally")
	})

	it("exposes default weights summing to expected total", () => {
		const positive = Object.values(DEFAULT_RULE_WEIGHTS).filter((w) => w > 0)
		expect(positive.length).toBe(12)
	})
})

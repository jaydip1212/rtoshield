import { z } from "zod"

export const paymentMethodSchema = z.enum(["cod", "prepaid"])

export const createOrderSchema = z.object({
	external_id: z.string().min(1),
	store_id: z.string().uuid().optional(),
	payment_method: paymentMethodSchema,
	total: z.number().nonnegative(),
	currency: z.string().length(3).default("INR"),
	customer: z.object({
		phone: z.string().min(6).optional(),
		email: z.string().email().optional(),
		name: z.string().optional(),
	}),
	shipping: z.object({
		address1: z.string().optional(),
		address2: z.string().optional(),
		city: z.string().optional(),
		pincode: z.string().optional(),
		country: z.string().optional(),
	}),
	line_items: z
		.array(z.object({ sku: z.string(), qty: z.number().int().positive() }))
		.default([]),
	checkout_id: z.string().optional(),
	utm: z
		.object({
			source: z.string().optional(),
			medium: z.string().optional(),
			campaign: z.string().optional(),
		})
		.optional(),
})
export type CreateOrderInput = z.infer<typeof createOrderSchema>

/** Privacy-safe SDK payload. NOTE: no raw GPS, no canvas/audio fingerprint. */
export const trackSignalSchema = z.object({
	public_key: z.string().min(1),
	session_id: z.string().min(1),
	device_token: z.string().min(1),
	order_id: z.string().optional(),
	checkout_id: z.string().optional(),
	user_agent: z.string().optional(),
	timezone: z.string().optional(),
	language: z.string().optional(),
	// screen *category* only (e.g. "mobile" | "tablet" | "desktop"), never exact dimensions
	screen_category: z.enum(["mobile", "tablet", "desktop", "unknown"]).optional(),
	referrer: z.string().optional(),
	utm: z
		.object({
			source: z.string().optional(),
			medium: z.string().optional(),
			campaign: z.string().optional(),
		})
		.optional(),
})
export type TrackSignalInput = z.infer<typeof trackSignalSchema>

export const riskRuleUpdateSchema = z.object({
	rules: z.array(
		z.object({
			code: z.string(),
			weight: z.number().int().min(-50).max(50),
			enabled: z.boolean().default(true),
		}),
	),
})

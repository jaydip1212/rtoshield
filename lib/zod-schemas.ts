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

/**
 * Privacy-safe SDK payload. NOTE: no raw GPS, no canvas/audio fingerprint.
 *
 * `.strict()` rejects any unexpected field so a tampered SDK or a hand-crafted
 * request cannot smuggle extra data into storage. Every string is length-capped
 * to bound row size and block storage-abuse from a leaked public key.
 */
export const trackSignalSchema = z
	.object({
		public_key: z.string().regex(/^rtos_pk_[A-Za-z0-9]+$/),
		session_id: z.string().min(8).max(128),
		device_token: z.string().regex(/^[A-Za-z0-9-]{8,128}$/),
		order_id: z.string().max(128).optional(),
		checkout_id: z.string().max(128).optional(),
		user_agent: z.string().max(512).optional(),
		timezone: z.string().max(64).optional(),
		language: z.string().max(32).optional(),
		// screen *category* only (e.g. "mobile" | "tablet" | "desktop"), never exact dimensions
		screen_category: z.enum(["mobile", "tablet", "desktop", "unknown"]).optional(),
		// origin only — the SDK strips full referrer URLs before sending
		referrer: z.string().max(256).optional(),
		utm: z
			.object({
				source: z.string().max(128).optional(),
				medium: z.string().max(128).optional(),
				campaign: z.string().max(128).optional(),
			})
			.strict()
			.optional(),
	})
	.strict()
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

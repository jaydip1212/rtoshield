/**
 * External provider interfaces + mock implementations.
 * Swap mocks for real providers by setting *_PROVIDER env vars and adding a
 * real implementation in the corresponding factory.
 */

// ---------- IP intelligence ----------
export interface IpIntel {
	coarseGeo: string | null // city/region only — never precise coordinates
	asn: string | null
	isp: string | null
	vpnProxyDatacenter: boolean
}
export interface IpIntelProvider {
	lookup(ip: string): Promise<IpIntel>
}
class MockIpIntelProvider implements IpIntelProvider {
	async lookup(ip: string): Promise<IpIntel> {
		const isPrivate = /^(10\.|192\.168\.|127\.|0\.)/.test(ip)
		return {
			coarseGeo: isPrivate ? null : "Mumbai, MH",
			asn: "AS0000",
			isp: "MockISP",
			vpnProxyDatacenter: ip.endsWith(".66"), // deterministic demo flag
		}
	}
}
export function getIpIntelProvider(): IpIntelProvider {
	return new MockIpIntelProvider()
}

// ---------- Messaging (WhatsApp / SMS) ----------
export interface MessageProvider {
	send(to: string, body: string): Promise<{ id: string; status: string }>
}
class MockMessageProvider implements MessageProvider {
	constructor(private channel: string) {}
	async send(to: string, body: string) {
		console.log(`[mock ${this.channel}] -> ${to}: ${body.slice(0, 60)}...`)
		return { id: `mock_${Date.now()}`, status: "queued" }
	}
}
export function getWhatsAppProvider(): MessageProvider {
	return new MockMessageProvider("whatsapp")
}
export function getSmsProvider(): MessageProvider {
	return new MockMessageProvider("sms")
}

// ---------- Courier ----------
export interface CourierProvider {
	getRtoHistory(phoneHash: string): Promise<{ rtoCount: number }>
}
class MockCourierProvider implements CourierProvider {
	async getRtoHistory() {
		return { rtoCount: 0 }
	}
}
export function getCourierProvider(): CourierProvider {
	return new MockCourierProvider()
}

// ---------- Storefront connectors ----------
export interface StoreConnector {
	platform: "shopify" | "woocommerce"
	verifyWebhook(rawBody: string, signature: string, secret: string): boolean
	normalizeOrder(payload: unknown): Record<string, unknown>
}
import { createHmac, timingSafeEqual } from "node:crypto"
class MockShopify implements StoreConnector {
	platform = "shopify" as const
	verifyWebhook(rawBody: string, signature: string, secret: string) {
		const digest = createHmac("sha256", secret).update(rawBody, "utf8").digest("base64")
		try {
			return timingSafeEqual(Buffer.from(digest), Buffer.from(signature))
		} catch {
			return false
		}
	}
	normalizeOrder(p: any) {
		return {
			external_id: String(p?.id ?? ""),
			payment_method: p?.financial_status === "paid" ? "prepaid" : "cod",
			total: Number(p?.total_price ?? 0),
			customer: { phone: p?.phone, email: p?.email },
			shipping: {
				address1: p?.shipping_address?.address1,
				city: p?.shipping_address?.city,
				pincode: p?.shipping_address?.zip,
			},
		}
	}
}
class MockWoo implements StoreConnector {
	platform = "woocommerce" as const
	verifyWebhook(rawBody: string, signature: string, secret: string) {
		const digest = createHmac("sha256", secret).update(rawBody, "utf8").digest("base64")
		try {
			return timingSafeEqual(Buffer.from(digest), Buffer.from(signature))
		} catch {
			return false
		}
	}
	normalizeOrder(p: any) {
		return {
			external_id: String(p?.id ?? ""),
			payment_method: p?.payment_method === "cod" ? "cod" : "prepaid",
			total: Number(p?.total ?? 0),
			customer: { phone: p?.billing?.phone, email: p?.billing?.email },
			shipping: {
				address1: p?.shipping?.address_1,
				city: p?.shipping?.city,
				pincode: p?.shipping?.postcode,
			},
		}
	}
}
export function getShopifyConnector(): StoreConnector {
	return new MockShopify()
}
export function getWooConnector(): StoreConnector {
	return new MockWoo()
}

// ---------- LLM / Embeddings (OpenAI-compatible) ----------
export interface LlmProvider {
	complete(system: string, user: string): Promise<string>
}
export interface EmbeddingProvider {
	embed(texts: string[]): Promise<number[][]>
}
class MockLlm implements LlmProvider {
	async complete(_system: string, user: string) {
		return `MOCK RISK EXPLANATION based strictly on provided data:\n${user.slice(0, 240)}`
	}
}
class MockEmbedding implements EmbeddingProvider {
	async embed(texts: string[]) {
		// deterministic pseudo-embeddings for local dev
		return texts.map((t) => {
			const v = new Array(1536).fill(0)
			for (let i = 0; i < t.length; i++) v[i % 1536] += t.charCodeAt(i) / 255
			return v
		})
	}
}
export function getLlmProvider(): LlmProvider {
	return new MockLlm()
}
export function getEmbeddingProvider(): EmbeddingProvider {
	return new MockEmbedding()
}

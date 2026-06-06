/**
 * Seed demo data: one org, one user, one store, an API key, risk rules,
 * a batch of orders with device signals, a few RTO cases, and policy docs
 * for RAG. Run with: npm run seed
 */
import "./env"
import postgres from "postgres"
import { randomUUID, randomBytes } from "node:crypto"
import { DEFAULT_RULE_WEIGHTS } from "../lib/risk-engine"
import { hashPii, hashApiKey, newOrgSalt } from "../lib/hash"
import { scoreOrder, type RiskInput } from "../lib/risk-engine"

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) throw new Error("Set DATABASE_URL before seeding")
const sql = postgres(DATABASE_URL, { prepare: false })

const CITIES = ["Mumbai", "Delhi", "Bengaluru", "Patna", "Jaipur"]
const PINCODES = ["400001", "110001", "560001", "800001", "302001"]

function pick<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)]
}

async function main() {
	const salt = newOrgSalt()
	const [org] = await sql`insert into organizations (name, salt) values ('Demo Brand', ${salt}) returning id`
	const orgId = org.id as string

	await sql`insert into brand_profiles (org_id, system_instructions, brand_context, verification_policy, daily_learning_enabled)
		values (${orgId}, 'Prioritize deterministic evidence. For COD above ₹2500 verify by WhatsApp. For high-RTO pincode plus first-time customer request prepaid deposit.', 'Demo D2C brand selling apparel and accessories across India. Common RTO clues: fake phone, city/pincode mismatch, repeated COD from same device, high-RTO pincodes.', 'Medium COD risk: WhatsApp. High COD risk: prepaid deposit or call. Critical: manual review only. Never auto-cancel.', true)
		on conflict (org_id) do update set system_instructions = excluded.system_instructions`

	await sql`insert into pincode_intelligence (org_id, pincode, city, zone, rto_rate, cod_success_rate, avg_delivery_days, notes) values
		(${orgId}, '400001', 'Mumbai', 'West', 0.12, 0.88, 2.1, 'Generally safe'),
		(${orgId}, '110001', 'Delhi', 'North', 0.21, 0.79, 2.8, 'Verify high-value COD'),
		(${orgId}, '560001', 'Bengaluru', 'South', 0.09, 0.91, 2.3, 'Good prepaid conversion'),
		(${orgId}, '800001', 'Patna', 'East', 0.43, 0.57, 5.0, 'High RTO history; verify COD'),
		(${orgId}, '302001', 'Jaipur', 'West', 0.26, 0.74, 3.4, 'Watch COD velocity')
		on conflict (org_id, pincode) do nothing`

	await sql`insert into users (org_id, email, role) values (${orgId}, 'owner@demo-brand.test', 'owner')`
	const [store] = await sql`insert into stores (org_id, platform, name, domain) values (${orgId}, 'shopify', 'Demo Store', 'demo.myshopify.com') returning id`

	const rawKey = `rtos_sk_${randomBytes(18).toString("hex")}`
	const publicKey = `rtos_pk_${randomBytes(12).toString("hex")}`
	await sql`insert into api_keys (org_id, name, hashed_key, public_key, scopes)
		values (${orgId}, 'Default', ${hashApiKey(rawKey)}, ${publicKey}, ${sql.array(["orders:read", "orders:write", "track:write"])})`
	await sql`insert into webhook_endpoints (org_id, platform, endpoint_url, public_key, status)
		values (${orgId}, 'shopify', ${'http://localhost:3000/api/webhooks/shopify?pk=' + publicKey}, ${publicKey}, 'ready')
		on conflict (org_id, platform) do update set endpoint_url = excluded.endpoint_url, public_key = excluded.public_key`

	for (const code of Object.keys(DEFAULT_RULE_WEIGHTS)) {
		await sql`insert into risk_rules (org_id, code, weight) values (${orgId}, ${code}, ${DEFAULT_RULE_WEIGHTS[code as keyof typeof DEFAULT_RULE_WEIGHTS]})`
	}

	// Policy docs for RAG (text only; embeddings can be generated via indexDocument).
	const docs = [
		["return_policy", "Returns accepted within 7 days for unused items. RTO orders are restocked."],
		["cod_policy", "COD available up to INR 5000. High-value COD may require verification."],
		["fraud_notes", "Repeated COD from same device or pincode with prior RTO should be verified by WhatsApp."],
	]
	for (const [type, title] of docs) {
		await sql`insert into documents (org_id, type, title) values (${orgId}, ${type}, ${title})`
	}

	for (let i = 0; i < 40; i++) {
		const payment = Math.random() < 0.6 ? "cod" : "prepaid"
		const total = Math.round(300 + Math.random() * 6000)
		const city = pick(CITIES)
		const pincode = pick(PINCODES)
		const phone = `+9198${Math.floor(10000000 + Math.random() * 89999999)}`
		const [cust] = await sql`insert into customers (org_id, phone_hash, address_hash)
			values (${orgId}, ${hashPii(phone, salt)}, ${hashPii(`${city}|${pincode}`, salt)}) returning id`
		const [order] = await sql`insert into orders (org_id, store_id, customer_id, external_id, payment_method, total, currency, pincode, city, address_complete)
			values (${orgId}, ${store.id}, ${cust.id}, ${"DEMO-" + (1000 + i)}, ${payment}, ${total}, 'INR', ${pincode}, ${city}, ${Math.random() > 0.1}) returning id`

		const input: RiskInput = {
			paymentMethod: payment as "cod" | "prepaid",
			orderValue: total,
			isFirstTimeCustomer: Math.random() > 0.5,
			alreadyVerified: false,
			addressComplete: Math.random() > 0.1,
			phoneHasPreviousRto: Math.random() > 0.8,
			addressHasPreviousRto: Math.random() > 0.85,
			deviceCodOrderCount: Math.random() > 0.7 ? 2 : 0,
			ipOrdersInWindow: Math.random() > 0.8 ? 6 : 1,
			ipCityMismatch: Math.random() > 0.8,
			vpnProxyDatacenter: Math.random() > 0.9,
			pincodeRtoRate: Math.random(),
			ndrFailureCount: Math.random() > 0.85 ? 1 : 0,
			identitySignalMismatch: Math.random() > 0.9,
			customerOrderVelocity: Math.random() > 0.85 ? 3 : 1,
			returningWithSuccessfulDeliveries: Math.random() > 0.7,
		}
		const d = scoreOrder(input)
		await sql`insert into risk_decisions (org_id, order_id, score, level, reasons, recommended_action)
			values (${orgId}, ${order.id}, ${d.score}, ${d.risk_level}, ${sql.json(d.reasons as any)}, ${d.recommended_action})`

		if (d.risk_level === "critical" && Math.random() > 0.5) {
			await sql`insert into rto_cases (org_id, order_id, courier, reason, occurred_at)
				values (${orgId}, ${order.id}, 'Delhivery', 'Customer refused', now())`
		}
	}

	console.log("\nSeed complete.")
	console.log("Organization:", orgId)
	console.log("API secret key (store securely, shown once):", rawKey)
	console.log("SDK public key:", publicKey)
	await sql.end()
}

main().catch(async (e) => {
	console.error(e)
	await sql.end()
	process.exit(1)
})

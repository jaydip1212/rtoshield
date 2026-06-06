import { createHash, createHmac, randomBytes, createCipheriv, createDecipheriv } from "node:crypto"

const PEPPER = process.env.HASH_PEPPER ?? ""

/**
 * Deterministically hash a PII value with a per-organization salt + a global pepper.
 * Same input + same org salt => same hash, enabling fraud correlation without
 * storing the raw value.
 */
export function hashPii(value: string, orgSalt: string): string {
	const normalized = value.trim().toLowerCase()
	return createHmac("sha256", `${orgSalt}:${PEPPER}`).update(normalized).digest("hex")
}

/** Generate a random per-organization salt. Store on the organization row. */
export function newOrgSalt(): string {
	return randomBytes(16).toString("hex")
}

/** Hash an API key for storage. The raw key is shown to the user only once. */
export function hashApiKey(rawKey: string): string {
	return createHash("sha256").update(rawKey).digest("hex")
}

function encryptionKey(): Buffer {
	const raw = process.env.TOKEN_ENCRYPTION_KEY ?? ""
	const b64 = raw.startsWith("base64:") ? raw.slice(7) : raw
	const key = Buffer.from(b64, "base64")
	if (key.length !== 32) {
		throw new Error("TOKEN_ENCRYPTION_KEY must decode to 32 bytes")
	}
	return key
}

/** AES-256-GCM encrypt a provider token for at-rest storage. Returns base64(iv|tag|ct). */
export function encryptToken(plaintext: string): string {
	const iv = randomBytes(12)
	const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv)
	const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
	const tag = cipher.getAuthTag()
	return Buffer.concat([iv, tag, ct]).toString("base64")
}

export function decryptToken(payload: string): string {
	const buf = Buffer.from(payload, "base64")
	const iv = buf.subarray(0, 12)
	const tag = buf.subarray(12, 28)
	const ct = buf.subarray(28)
	const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv)
	decipher.setAuthTag(tag)
	return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8")
}

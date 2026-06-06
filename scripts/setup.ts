/**
 * One-time local setup.
 *
 * Creates `.env.local` from `.env.example` and fills in strong random secrets
 * for HASH_PEPPER, TOKEN_ENCRYPTION_KEY, and WEBHOOK_SECRET so the app is ready
 * to run without any manual editing.
 *
 * Safe to run repeatedly: it never overwrites an existing `.env.local`.
 *
 * Usage: npm run setup
 */
import fs from "node:fs"
import path from "node:path"
import { randomBytes } from "node:crypto"

const root = process.cwd()
const examplePath = path.join(root, ".env.example")
const envPath = path.join(root, ".env.local")

if (fs.existsSync(envPath)) {
	console.log(".env.local already exists - leaving it untouched.")
	process.exit(0)
}

if (!fs.existsSync(examplePath)) {
	console.error(".env.example not found. Run this from the project root.")
	process.exit(1)
}

let env = fs.readFileSync(examplePath, "utf8")

const pepper = randomBytes(32).toString("hex")
const encryptionKey = `base64:${randomBytes(32).toString("base64")}`
const webhookSecret = randomBytes(24).toString("hex")

env = env
	.replace(/^HASH_PEPPER=.*$/m, `HASH_PEPPER=${pepper}`)
	.replace(/^TOKEN_ENCRYPTION_KEY=.*$/m, `TOKEN_ENCRYPTION_KEY=${encryptionKey}`)
	.replace(/^WEBHOOK_SECRET=.*$/m, `WEBHOOK_SECRET=${webhookSecret}`)

fs.writeFileSync(envPath, env)

console.log("Created .env.local with generated secrets.")
console.log("DATABASE_URL defaults to the local Docker Postgres (docker compose up -d).")
console.log("Next: npm run db:push && npm run seed && npm run dev")

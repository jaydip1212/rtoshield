/**
 * Loads `.env.local` (then `.env`) into process.env for standalone scripts.
 *
 * Next.js loads these files automatically for the app, but scripts run directly
 * with tsx do not. Import this first in any script that needs env vars:
 *   import "./env"
 *
 * Existing process.env values always win, so shell overrides keep working.
 */
import fs from "node:fs"
import path from "node:path"

for (const file of [".env.local", ".env"]) {
	const p = path.join(process.cwd(), file)
	if (!fs.existsSync(p)) continue
	for (const line of fs.readFileSync(p, "utf8").split("\n")) {
		const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/)
		if (!m) continue
		const key = m[1]
		if (process.env[key] !== undefined) continue
		let val = m[2].trim()
		if (
			(val.startsWith('"') && val.endsWith('"')) ||
			(val.startsWith("'") && val.endsWith("'"))
		) {
			val = val.slice(1, -1)
		}
		process.env[key] = val
	}
}

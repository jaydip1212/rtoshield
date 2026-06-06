/** Apply all SQL migrations in supabase/migrations in order. */
import "./env"
import fs from "node:fs/promises"
import path from "node:path"
import postgres from "postgres"

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) throw new Error("Set DATABASE_URL before running migrations")
const sql = postgres(DATABASE_URL, { prepare: false, max: 1 })

async function main() {
	const dir = path.join(process.cwd(), "supabase", "migrations")
	const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".sql")).sort()
	for (const file of files) {
		const full = path.join(dir, file)
		const text = await fs.readFile(full, "utf8")
		console.log(`Applying ${file}...`)
		await sql.unsafe(text)
	}
	console.log("Migrations applied.")
	await sql.end()
}

main().catch(async (e) => {
	console.error(e)
	await sql.end()
	process.exit(1)
})

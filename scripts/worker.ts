/**
 * BullMQ scoring worker. Run alongside the app when REDIS_URL is set:
 *   node --env-file=.env.local --import tsx scripts/worker.ts
 * (or: REDIS_URL=... DATABASE_URL=... npx tsx scripts/worker.ts)
 *
 * When REDIS_URL is unset, the app scores inline and this worker is not needed.
 */
import "./env"
import { Worker } from "bullmq"
import IORedis from "ioredis"
import { scoreOrderNow } from "../lib/queue"

const url = process.env.REDIS_URL
if (!url) {
	console.error("REDIS_URL is required to run the worker. (Without it, scoring runs inline in the app.)")
	process.exit(1)
}

const connection = new IORedis(url, { maxRetriesPerRequest: null })
const worker = new Worker(
	"scoring",
	async (job) => {
		await scoreOrderNow(job.data.orderId as string)
	},
	// BullMQ bundles its own ioredis types; cast to bridge the duplicate type identity.
	{ connection: connection as any },
)

worker.on("completed", (job) => console.log("scored order", job.data?.orderId))
worker.on("failed", (job, err) => console.error("scoring failed", job?.data?.orderId, err))
console.log("RTOShield scoring worker started")

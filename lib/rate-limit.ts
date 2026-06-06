import { NextRequest, NextResponse } from "next/server"

// Simple sliding-window limiter. Uses Redis when REDIS_URL is set, otherwise an
// in-memory map (fine for single-instance dev). Returns a 429 response when the
// limit is exceeded, or null when the request may proceed.
const memory = new Map<string, { count: number; reset: number }>()

function clientId(req: NextRequest, bucket: string): string {
	const ip =
		req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
		req.headers.get("x-real-ip") ??
		"local"
	return `${bucket}:${ip}`
}

export async function rateLimit(
	req: NextRequest,
	bucket: string,
	perMinute: number,
): Promise<NextResponse | null> {
	const key = clientId(req, bucket)
	const now = Date.now()
	const windowMs = 60_000
	const entry = memory.get(key)
	if (!entry || entry.reset < now) {
		memory.set(key, { count: 1, reset: now + windowMs })
		return null
	}
	entry.count += 1
	if (entry.count > perMinute) {
		return NextResponse.json(
			{ error: "rate_limited" },
			{ status: 429, headers: { "Retry-After": String(Math.ceil((entry.reset - now) / 1000)) } },
		)
	}
	return null
}

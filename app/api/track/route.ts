import { NextRequest, NextResponse } from "next/server"
import { trackSignalSchema } from "@/lib/zod-schemas"
import { resolveOrgByPublicKey, getAllowedHostsForOrg } from "@/lib/auth"
import { rateLimit } from "@/lib/rate-limit"
import { getServiceDb } from "@/lib/db"
import { hashPii } from "@/lib/hash"
import { getIpIntelProvider } from "@/lib/providers"

// POST /api/track — first-party SDK signal ingestion.
//
// Security:
//   - Public key only identifies the org; it grants write-only access here.
//   - Body is size-capped and strictly validated (unknown fields rejected).
//   - Origin is allow-listed against the org's registered store domains so a
//     leaked public key cannot be abused from an unrelated site in a browser.
//   - IP is derived server-side and hashed; we never trust client-supplied IP.
//   - Rate limited per IP.
const MAX_BODY_BYTES = 8 * 1024

function isDev() {
	return process.env.NODE_ENV !== "production"
}

function originHost(origin: string | null): string | null {
	if (!origin) return null
	try {
		return new URL(origin).hostname.toLowerCase()
	} catch {
		return null
	}
}

function isLocalHost(host: string | null): boolean {
	return host === "localhost" || host === "127.0.0.1" || host === "[::1]"
}

// Reflect the requesting origin for write-only CORS. No credentials are used,
// so this does not expose any cross-origin data; the POST handler enforces the
// real per-org origin allow-list.
function corsHeaders(origin: string | null): Record<string, string> {
	return {
		"Access-Control-Allow-Origin": origin ?? "*",
		"Access-Control-Allow-Methods": "POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type",
		"Access-Control-Max-Age": "86400",
		Vary: "Origin",
		"X-Content-Type-Options": "nosniff",
		"Cache-Control": "no-store",
	}
}

export async function OPTIONS(req: NextRequest) {
	return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) })
}

export async function POST(req: NextRequest) {
	const origin = req.headers.get("origin")
	const headers = corsHeaders(origin)

	const limited = await rateLimit(req, "track", 600)
	if (limited) {
		for (const [k, v] of Object.entries(headers)) limited.headers.set(k, v)
		return limited
	}

	// Reject oversized bodies early (defense against storage/CPU abuse).
	const declaredLen = Number(req.headers.get("content-length") ?? 0)
	if (declaredLen > MAX_BODY_BYTES) {
		return NextResponse.json({ error: "payload_too_large" }, { status: 413, headers })
	}
	const raw = await req.text()
	if (raw.length > MAX_BODY_BYTES) {
		return NextResponse.json({ error: "payload_too_large" }, { status: 413, headers })
	}

	let json: unknown = null
	try {
		json = JSON.parse(raw)
	} catch {
		return NextResponse.json({ error: "invalid_json" }, { status: 400, headers })
	}

	const parsed = trackSignalSchema.safeParse(json)
	if (!parsed.success) {
		return NextResponse.json({ error: "validation_error" }, { status: 422, headers })
	}
	const body = parsed.data

	const org = await resolveOrgByPublicKey(body.public_key)
	if (!org) return NextResponse.json({ error: "invalid_public_key" }, { status: 401, headers })

	// Origin allow-listing: if the org has registered store domains, the browser
	// Origin must match one of them. Unconfigured orgs are allowed (onboarding),
	// and localhost is allowed in development for local testing.
	const allowedHosts = await getAllowedHostsForOrg(org.id)
	if (allowedHosts.length > 0) {
		const host = originHost(origin)
		const ok =
			(host && allowedHosts.includes(host)) ||
			(isDev() && isLocalHost(host))
		if (!ok) {
			return NextResponse.json({ error: "origin_not_allowed" }, { status: 403, headers })
		}
	}

	// Server-derived IP — never trust client-supplied IP.
	const ip =
		req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
		req.headers.get("x-real-ip") ??
		"0.0.0.0"
	const intel = await getIpIntelProvider().lookup(ip)

	await getServiceDb().insertDeviceSignal({
		org_id: org.id,
		order_id: body.order_id ?? null,
		checkout_id: body.checkout_id ?? null,
		session_id: body.session_id,
		device_token_hash: hashPii(body.device_token, org.salt),
		ip_hash: hashPii(ip, org.salt),
		coarse_geo: intel.coarseGeo,
		asn: intel.asn,
		isp: intel.isp,
		vpn_flag: intel.vpnProxyDatacenter,
		user_agent: body.user_agent ?? null,
		timezone: body.timezone ?? null,
		language: body.language ?? null,
		screen_category: body.screen_category ?? null,
		referrer: body.referrer ?? null,
		utm: body.utm ?? null,
	})

	// 204 ack — write-only, no body, no caching.
	return new NextResponse(null, { status: 204, headers })
}

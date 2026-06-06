import { NextRequest, NextResponse } from "next/server"
import { trackSignalSchema } from "@/lib/zod-schemas"
import { resolveOrgByPublicKey } from "@/lib/auth"
import { rateLimit } from "@/lib/rate-limit"
import { getServiceDb } from "@/lib/db"
import { hashPii } from "@/lib/hash"
import { getIpIntelProvider } from "@/lib/providers"

// POST /api/track — first-party SDK signal ingestion.
// Privacy: we DO NOT accept GPS, canvas, or audio fingerprints. We hash the
// device token and IP. We only store coarse geo + ASN/ISP from the provider.
export async function POST(req: NextRequest) {
	const limited = await rateLimit(req, "track", 600)
	if (limited) return limited

	const json = await req.json().catch(() => null)
	const parsed = trackSignalSchema.safeParse(json)
	if (!parsed.success) {
		return NextResponse.json({ error: "validation_error" }, { status: 422 })
	}
	const body = parsed.data

	const org = await resolveOrgByPublicKey(body.public_key)
	if (!org) return NextResponse.json({ error: "invalid_public_key" }, { status: 401 })

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

	// 204-style ack with CORS for first-party embedding.
	return new NextResponse(null, {
		status: 204,
		headers: { "Cache-Control": "no-store" },
	})
}

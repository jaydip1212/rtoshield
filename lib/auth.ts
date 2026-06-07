import "server-only"
import { NextRequest } from "next/server"
import { getServiceDb, type OrgRow } from "./db"
import { hashApiKey } from "./hash"

export type AuthResult =
	| { ok: true; org: OrgRow; scopes: string[] }
	| { ok: false; error: string }

/** Bearer API key auth for REST ingestion endpoints, with scope checks. */
export async function requireApiKey(
	req: NextRequest,
	requiredScopes: string[] = [],
): Promise<AuthResult> {
	const header = req.headers.get("authorization") ?? ""
	const token = header.startsWith("Bearer ") ? header.slice(7) : null
	if (!token) return { ok: false, error: "missing_api_key" }

	const db = getServiceDb()
	const hashed = hashApiKey(token)
	const [row] = await db.raw`
		select k.scopes, o.id, o.salt, o.name
		from api_keys k join organizations o on o.id = k.org_id
		where k.hashed_key = ${hashed} limit 1`
	if (!row) return { ok: false, error: "invalid_api_key" }

	const scopes: string[] = row.scopes ?? []
	const missing = requiredScopes.filter((s) => !scopes.includes(s))
	if (missing.length) return { ok: false, error: `missing_scope:${missing.join(",")}` }

	await db.raw`update api_keys set last_used_at = now() where hashed_key = ${hashed}`
	return { ok: true, org: { id: row.id, salt: row.salt, name: row.name }, scopes }
}

/** Public-key resolution for the first-party SDK /api/track endpoint. */
export async function resolveOrgByPublicKey(publicKey: string): Promise<OrgRow | null> {
	const [row] = await getServiceDb().raw`
		select o.id, o.salt, o.name
		from api_keys k join organizations o on o.id = k.org_id
		where k.public_key = ${publicKey} limit 1`
	return row ? { id: row.id, salt: row.salt, name: row.name } : null
}

/**
 * Hostnames an org has registered (from connected stores). Used to allow-list
 * the Origin of first-party SDK requests so a leaked public key cannot be
 * abused to inject device signals from an unrelated site in a browser.
 */
export async function getAllowedHostsForOrg(orgId: string): Promise<string[]> {
	const rows = (await getServiceDb().raw`
		select domain from stores where org_id = ${orgId} and domain is not null`) as unknown as Array<{ domain: string | null }>
	const hosts = new Set<string>()
	for (const r of rows) {
		const raw = (r.domain ?? "").trim().toLowerCase()
		if (!raw) continue
		try {
			// Accept either a bare host ("shop.example.com") or a full URL.
			hosts.add(raw.includes("://") ? new URL(raw).hostname : new URL(`https://${raw}`).hostname)
		} catch {
			/* ignore malformed domains */
		}
	}
	return [...hosts]
}

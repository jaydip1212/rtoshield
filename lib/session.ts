import "server-only"
import { getServiceDb, type OrgRow } from "./db"

/**
 * Resolve the active organization for the current request.
 *
 * - PRODUCTION: wire Supabase Auth and resolve the org from the signed-in user
 *   (users.auth_user_id = auth.uid()). A stub is shown below.
 * - LOCAL / DEMO (no auth configured): fall back to the first organization in
 *   the database so the seeded data is immediately usable with `npm run dev`.
 *
 * Returns null when there is no database / no organization yet, so pages can
 * render a friendly empty state instead of crashing.
 */
export async function getCurrentOrg(): Promise<OrgRow | null> {
	try {
		const db = getServiceDb()
		// --- Production auth path (enable once Supabase Auth is wired) ---
		// const { createServerClient } = await import("./supabase")
		// const supabase = createServerClient()
		// const { data } = await supabase.auth.getUser()
		// if (data.user) {
		//   const [row] = await db.raw`select o.id, o.salt, o.name from organizations o
		//     join users u on u.org_id = o.id where u.auth_user_id = ${data.user.id} limit 1`
		//   if (row) return { id: row.id, salt: row.salt, name: row.name }
		// }

		// --- Dev / demo fallback ---
		const [row] = await db.raw`
			select id, salt, name from organizations order by created_at asc limit 1`
		return row ? { id: row.id, salt: row.salt, name: row.name } : null
	} catch {
		return null
	}
}

/** True when running without a configured auth provider (dev/demo mode). */
export function isDevMode(): boolean {
	return !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.RTOSHIELD_DEV_MODE === "1"
}

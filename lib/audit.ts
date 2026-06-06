import "server-only"
import { getServiceDb } from "./db"

/** Append an immutable audit-log entry. Call on every sensitive mutation. */
export async function writeAudit(
	orgId: string,
	actor: string,
	action: string,
	target: string,
	metadata?: Record<string, unknown>,
): Promise<void> {
	await getServiceDb().raw`
		insert into audit_logs (org_id, actor, action, target, metadata)
		values (${orgId}, ${actor}, ${action}, ${target}, ${getServiceDb().raw.json((metadata ?? {}) as any)})`
}

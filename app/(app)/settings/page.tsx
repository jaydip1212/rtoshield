import { getCurrentOrg } from "@/lib/session"
import { listApiKeys, getOrgSettings, listCustomersForDeletion } from "@/lib/queries"
import { PageHeader, NoDatabaseNotice } from "@/components/ui"
import { SettingsClient } from "./SettingsClient"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
	const org = await getCurrentOrg()
	if (!org) {
		return (
			<>
				<PageHeader title="Settings" />
				<NoDatabaseNotice />
			</>
		)
	}
	const [keys, settings, customers] = await Promise.all([
		listApiKeys(org.id),
		getOrgSettings(org.id),
		listCustomersForDeletion(org.id),
	])
	return (
		<>
			<PageHeader title="Settings" subtitle={org.name} />
			<SettingsClient
				keys={keys.map((k) => ({
					id: k.id,
					name: k.name,
					publicKey: k.public_key,
					scopes: k.scopes,
					lastUsedAt: k.last_used_at,
				}))}
				retentionDays={settings.retention_days}
				customers={customers.map((c) => ({
					id: c.id,
					phoneHash: c.phone_hash,
					rtoCount: c.rto_count,
				}))}
			/>
		</>
	)
}

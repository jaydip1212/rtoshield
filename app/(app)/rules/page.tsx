import { getCurrentOrg } from "@/lib/session"
import { listRules } from "@/lib/queries"
import { PageHeader, NoDatabaseNotice } from "@/components/ui"
import { RulesForm } from "./RulesForm"

export const dynamic = "force-dynamic"

export default async function RulesPage() {
	const org = await getCurrentOrg()
	if (!org) {
		return (
			<>
				<PageHeader title="Risk rules" />
				<NoDatabaseNotice />
			</>
		)
	}
	const rules = await listRules(org.id)
	return (
		<>
			<PageHeader
				title="Risk rules"
				subtitle="Tune the weight of each signal. Positive adds risk, negative reduces it. Changes apply to future scoring."
			/>
			<RulesForm initial={rules} />
		</>
	)
}

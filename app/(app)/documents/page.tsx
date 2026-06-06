import { getCurrentOrg } from "@/lib/session"
import { listDocuments } from "@/lib/queries"
import { Card, PageHeader, NoDatabaseNotice } from "@/components/ui"

export const dynamic = "force-dynamic"

export default async function DocumentsPage() {
	const org = await getCurrentOrg()
	if (!org) {
		return (
			<>
				<PageHeader title="Knowledge" />
				<NoDatabaseNotice />
			</>
		)
	}
	const docs = await listDocuments(org.id)
	return (
		<>
			<PageHeader
				title="Knowledge base"
				subtitle="Policies and SOPs the AI agent grounds its recommendations on (RAG)."
			/>
			<div className="grid gap-4 sm:grid-cols-2">
				{docs.map((d) => (
					<Card key={d.id}>
						<div className="text-xs uppercase text-gray-400">{d.type.replace(/_/g, " ")}</div>
						<div className="mt-1 font-medium">{d.title}</div>
						<div className="mt-2 text-xs text-gray-500">{d.chunks} chunk(s) indexed</div>
					</Card>
				))}
				{docs.length === 0 && (
					<p className="text-sm text-gray-500">No documents yet. Seed loads a few sample policies.</p>
				)}
			</div>
			<Card className="mt-6 text-sm text-gray-600">
				Upload UI is on the backlog. For now, insert rows into <code>documents</code> and call{" "}
				<code>indexDocument()</code> from <code>lib/rag.ts</code> to embed them into pgvector.
			</Card>
		</>
	)
}

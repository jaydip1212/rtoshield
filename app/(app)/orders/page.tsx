import Link from "next/link"
import { getCurrentOrg } from "@/lib/session"
import { listOrdersWithRisk } from "@/lib/queries"
import { PageHeader, RiskBadge, ActionPill, NoDatabaseNotice, money, Card } from "@/components/ui"

export const dynamic = "force-dynamic"

export default async function OrdersPage({ searchParams }: { searchParams: { level?: string } }) {
	const org = await getCurrentOrg()
	if (!org) {
		return (
			<>
				<PageHeader title="Orders" />
				<NoDatabaseNotice />
			</>
		)
	}
	const level = searchParams.level
	const orders = await listOrdersWithRisk(org.id, { level })
	const levels = ["all", "low", "medium", "high", "critical"]
	return (
		<>
			<PageHeader title="Orders" subtitle={`${orders.length} order(s)`} />
			<div className="mb-4 flex gap-2">
				{levels.map((l) => (
					<Link
						key={l}
						href={l === "all" ? "/orders" : `/orders?level=${l}`}
						className={`rounded-full border px-3 py-1 text-xs capitalize ${(level ?? "all") === l ? "bg-black text-white" : "bg-white"}`}
					>
						{l}
					</Link>
				))}
			</div>
			<Card className="p-0">
				<table className="w-full text-sm">
					<thead className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
						<tr>
							<th className="px-4 py-3">Order</th>
							<th className="px-4 py-3">Payment</th>
							<th className="px-4 py-3">Value</th>
							<th className="px-4 py-3">City</th>
							<th className="px-4 py-3">Status</th>
							<th className="px-4 py-3">Recommended</th>
							<th className="px-4 py-3">Risk</th>
						</tr>
					</thead>
					<tbody className="divide-y">
						{orders.map((o) => (
							<tr key={o.id} className="hover:bg-gray-50">
								<td className="px-4 py-3">
									<Link href={`/orders/${o.id}`} className="font-medium text-blue-600 hover:underline">
										{o.external_id ?? o.id.slice(0, 8)}
									</Link>
								</td>
								<td className="px-4 py-3 uppercase">{o.payment_method}</td>
								<td className="px-4 py-3">{money(o.total, o.currency)}</td>
								<td className="px-4 py-3">{o.city ?? "—"}</td>
								<td className="px-4 py-3">{o.verified ? "✅ verified" : o.status}</td>
								<td className="px-4 py-3"><ActionPill action={o.recommended_action} /></td>
								<td className="px-4 py-3"><RiskBadge level={o.level} score={o.score} /></td>
							</tr>
						))}
						{orders.length === 0 && (
							<tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No orders. Run <code>npm run seed</code> to load demo data.</td></tr>
						)}
					</tbody>
				</table>
			</Card>
		</>
	)
}

import Link from "next/link"
import { notFound } from "next/navigation"
import { getCurrentOrg } from "@/lib/session"
import { getOrderDetail } from "@/lib/queries"
import { Card, DarkCard, PageHeader, RiskBadge, ActionPill, money } from "@/components/ui"
import { runDeterministicChecks } from "@/lib/geo-checker"
import { ActionButtons } from "./ActionButtons"

export const dynamic = "force-dynamic"

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
	const org = await getCurrentOrg()
	if (!org) notFound()
	const order = await getOrderDetail(org.id, params.id)
	if (!order) notFound()
	const checks = await runDeterministicChecks(org.id, params.id)

	return (
		<>
			<PageHeader
				title={`Order ${order.external_id ?? order.id.slice(0, 8)}`}
				subtitle={`${money(order.total, order.currency)} · ${order.payment_method.toUpperCase()} · ${order.city ?? "?"} ${order.pincode ?? ""}`}
				action={<Link href="/orders" className="text-sm text-blue-600 hover:underline">← All orders</Link>}
			/>

			<div className="grid gap-6 lg:grid-cols-3">
				<Card className="lg:col-span-1">
					<div className="text-sm text-gray-500">Risk score</div>
					<div className="mt-1 flex items-center gap-3">
						<span className="text-4xl font-extrabold">{order.score ?? "—"}</span>
						<RiskBadge level={order.level} />
					</div>
					<div className="mt-4 text-sm text-gray-500">Recommended action</div>
					<div className="mt-1"><ActionPill action={order.recommended_action} /></div>
					<p className="mt-3 text-xs text-gray-400">
						This is a recommendation only. RTOShield never auto-cancels — the decision below is yours.
					</p>
					<div className="mt-4 border-t pt-4">
						<div className="text-sm font-medium">Current status</div>
						<div className="mt-1 text-sm">{order.verified ? "✅ Verified" : order.status}</div>
					</div>
				</Card>

				<Card className="lg:col-span-2">
					<h2 className="font-semibold">Why this score</h2>
					{order.reasons.length === 0 ? (
						<p className="mt-2 text-sm text-gray-500">No risk signals fired — clean order.</p>
					) : (
						<table className="mt-3 w-full text-sm">
							<tbody className="divide-y">
								{order.reasons.map((r) => (
									<tr key={r.code}>
										<td className="py-2">{r.label}</td>
										<td className={`py-2 text-right font-mono ${r.weight >= 0 ? "text-red-600" : "text-green-600"}`}>
											{r.weight >= 0 ? "+" : ""}{r.weight}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
				</Card>
			</div>


			<DarkCard className="mt-6">
				<div className="text-sm uppercase text-white/50">Non-AI true / false checker</div>
				<h2 className="mt-2 text-3xl font-black">Geographic, pincode, device, and order-history cross-checks</h2>
				<div className="mt-5 grid gap-3 md:grid-cols-2">
					{checks.map((c) => (
						<div key={c.code} className="rounded-3xl bg-white p-4 text-black">
							<div className="flex items-center justify-between gap-2">
								<b>{c.label}</b>
								<span className={`rounded-full px-3 py-1 text-xs font-black ${c.severity === "fail" ? "bg-red-100 text-red-800" : c.severity === "watch" ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800"}`}>{c.severity}</span>
							</div>
							<p className="mt-2 text-sm text-gray-500">{c.detail}</p>
							<div className="mt-2 text-xs font-bold text-[#ff4f0f]">Weight {c.weight >= 0 ? "+" : ""}{c.weight}</div>
						</div>
					))}
				</div>
			</DarkCard>

			<Card className="mt-6">
				<h2 className="text-2xl font-black">Take action (human decision)</h2>
				<p className="mt-1 text-sm text-gray-500">Every action is recorded in the audit log.</p>
				<div className="mt-4"><ActionButtons orderId={order.id} /></div>
			</Card>

			{order.events.length > 0 && (
				<Card className="mt-6">
					<h2 className="font-semibold">Activity</h2>
					<ul className="mt-3 space-y-2 text-sm">
						{order.events.map((e, i) => (
							<li key={i} className="flex justify-between">
								<span>{e.type}</span>
								<span className="text-gray-400">{new Date(e.created_at).toLocaleString()}</span>
							</li>
						))}
					</ul>
				</Card>
			)}
		</>
	)
}

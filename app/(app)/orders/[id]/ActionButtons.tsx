"use client"
import { useTransition, useState } from "react"
import { applyManualAction } from "@/app/actions"

const ACTIONS: Array<{ key: "verify" | "request_prepaid" | "hold" | "ship" | "reset"; label: string; style: string }> = [
	{ key: "verify", label: "Mark verified", style: "bg-green-600 text-white" },
	{ key: "request_prepaid", label: "Request prepaid", style: "bg-yellow-500 text-white" },
	{ key: "ship", label: "Release to ship", style: "bg-blue-600 text-white" },
	{ key: "hold", label: "Hold order", style: "bg-red-600 text-white" },
	{ key: "reset", label: "Reset", style: "border bg-white text-gray-700" },
]

export function ActionButtons({ orderId }: { orderId: string }) {
	const [isPending, startTransition] = useTransition()
	const [done, setDone] = useState<string | null>(null)
	return (
		<div className="flex flex-wrap items-center gap-2">
			{ACTIONS.map((a) => (
				<button
					key={a.key}
					disabled={isPending}
					onClick={() =>
						startTransition(async () => {
							await applyManualAction(orderId, a.key)
							setDone(a.label)
						})
					}
					className={`rounded-md px-3 py-1.5 text-sm disabled:opacity-50 ${a.style}`}
				>
					{a.label}
				</button>
			))}
			{done && <span className="text-sm text-gray-500">Saved: {done}</span>}
		</div>
	)
}

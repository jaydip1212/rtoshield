"use client"
import { useState, useTransition } from "react"
import { saveRules } from "@/app/actions"

type Rule = { code: string; label: string; weight: number; enabled: boolean }

export function RulesForm({ initial }: { initial: Rule[] }) {
	const [rules, setRules] = useState<Rule[]>(initial)
	const [isPending, startTransition] = useTransition()
	const [saved, setSaved] = useState(false)

	function update(code: string, patch: Partial<Rule>) {
		setRules((rs) => rs.map((r) => (r.code === code ? { ...r, ...patch } : r)))
		setSaved(false)
	}

	return (
		<div className="rounded-xl border bg-white">
			<table className="w-full text-sm">
				<thead className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
					<tr>
						<th className="px-4 py-3">Signal</th>
						<th className="px-4 py-3 w-32">Weight</th>
						<th className="px-4 py-3 w-24">Enabled</th>
					</tr>
				</thead>
				<tbody className="divide-y">
					{rules.map((r) => (
						<tr key={r.code}>
							<td className="px-4 py-2">{r.label}</td>
							<td className="px-4 py-2">
								<input
									type="number"
									value={r.weight}
									min={-50}
									max={50}
									onChange={(e) => update(r.code, { weight: Number(e.target.value) })}
									className="w-20 rounded border px-2 py-1"
								/>
							</td>
							<td className="px-4 py-2">
								<input
									type="checkbox"
									checked={r.enabled}
									onChange={(e) => update(r.code, { enabled: e.target.checked })}
								/>
							</td>
						</tr>
					))}
				</tbody>
			</table>
			<div className="flex items-center gap-3 border-t p-4">
				<button
					disabled={isPending}
					onClick={() =>
						startTransition(async () => {
							await saveRules(rules.map(({ code, weight, enabled }) => ({ code, weight, enabled })))
							setSaved(true)
						})
					}
					className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
				>
					{isPending ? "Saving…" : "Save rules"}
				</button>
				{saved && <span className="text-sm text-green-600">Saved ✓</span>}
			</div>
		</div>
	)
}

"use client"
import { useState, useTransition } from "react"
import { createApiKey, revokeApiKey, updateRetention, requestDataDeletion } from "@/app/actions"
import { Card } from "@/components/ui"

type Key = { id: string; name: string | null; publicKey: string; scopes: string[]; lastUsedAt: string | null }
type Customer = { id: string; phoneHash: string | null; rtoCount: number }

const SCOPES = ["orders:read", "orders:write", "track:write"]

export function SettingsClient({
	keys,
	retentionDays,
	customers,
}: {
	keys: Key[]
	retentionDays: number
	customers: Customer[]
}) {
	const [isPending, start] = useTransition()
	const [name, setName] = useState("")
	const [scopes, setScopes] = useState<string[]>(["orders:read", "orders:write"])
	const [secret, setSecret] = useState<string | null>(null)
	const [retention, setRetention] = useState(retentionDays)

	return (
		<div className="space-y-6">
			<Card>
				<h2 className="font-semibold">API keys</h2>
				<p className="mt-1 text-sm text-gray-500">
					The public key goes in the SDK. The secret is shown once — store it securely.
				</p>
				{secret && (
					<div className="mt-3 rounded-md border border-green-300 bg-green-50 p-3 text-sm">
						New secret key (copy now): <code className="break-all">{secret}</code>
					</div>
				)}
				<div className="mt-3 divide-y">
					{keys.map((k) => (
						<div key={k.id} className="flex items-center justify-between py-2 text-sm">
							<div>
								<div className="font-medium">{k.name ?? "API key"}</div>
								<div className="text-xs text-gray-500">{k.publicKey} · {k.scopes.join(", ")}</div>
							</div>
							<button
								disabled={isPending}
								onClick={() => start(async () => { await revokeApiKey(k.id) })}
								className="text-xs text-red-600 hover:underline"
							>
								Revoke
							</button>
						</div>
					))}
					{keys.length === 0 && <p className="py-2 text-sm text-gray-500">No keys yet.</p>}
				</div>
				<div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
					<input
						placeholder="Key name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						className="rounded border px-2 py-1 text-sm"
					/>
					{SCOPES.map((s) => (
						<label key={s} className="flex items-center gap-1 text-xs">
							<input
								type="checkbox"
								checked={scopes.includes(s)}
								onChange={(e) =>
									setScopes((cur) => (e.target.checked ? [...cur, s] : cur.filter((x) => x !== s)))
								}
							/>
							{s}
						</label>
					))}
					<button
						disabled={isPending}
						onClick={() =>
							start(async () => {
								const res = await createApiKey(name, scopes)
								setSecret(res.secret)
								setName("")
							})
						}
						className="rounded-md bg-black px-3 py-1.5 text-sm text-white disabled:opacity-50"
					>
						Create key
					</button>
				</div>
			</Card>

			<Card>
				<h2 className="font-semibold">Data retention</h2>
				<p className="mt-1 text-sm text-gray-500">Raw signals beyond this window should be purged.</p>
				<div className="mt-3 flex items-center gap-2">
					<input
						type="number"
						value={retention}
						min={7}
						max={3650}
						onChange={(e) => setRetention(Number(e.target.value))}
						className="w-24 rounded border px-2 py-1 text-sm"
					/>
					<span className="text-sm text-gray-500">days</span>
					<button
						disabled={isPending}
						onClick={() => start(async () => { await updateRetention(retention) })}
						className="rounded-md border px-3 py-1.5 text-sm"
					>
						Save
					</button>
				</div>
			</Card>

			<Card>
				<h2 className="font-semibold">Data deletion</h2>
				<p className="mt-1 text-sm text-gray-500">
					Remove a customer's hashed identifiers and device signals on request.
				</p>
				<div className="mt-3 divide-y">
					{customers.map((c) => (
						<div key={c.id} className="flex items-center justify-between py-2 text-sm">
							<span className="font-mono text-xs">{c.phoneHash ? c.phoneHash.slice(0, 16) + "…" : "(already deleted)"}</span>
							<button
								disabled={isPending || !c.phoneHash}
								onClick={() => start(async () => { await requestDataDeletion(c.id) })}
								className="text-xs text-red-600 hover:underline disabled:text-gray-300"
							>
								Delete data
							</button>
						</div>
					))}
				</div>
			</Card>
		</div>
	)
}

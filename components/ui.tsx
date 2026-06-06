import Link from "next/link"
import type { ReactNode } from "react"

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
	return <div className={`card-glow rounded-[2rem] border border-white/70 bg-white p-6 ${className}`}>{children}</div>
}

export function DarkCard({ children, className = "" }: { children: ReactNode; className?: string }) {
	return <div className={`card-glow rounded-[2rem] bg-black p-6 text-white ${className}`}>{children}</div>
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
	return (
		<div className="mb-7 flex items-end justify-between gap-4">
			<div>
				<div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-cyan-600"><span className="h-2 w-2 rounded-full bg-cyan-500"/> RTOShield Command</div>
				<h1 className="max-w-4xl text-4xl font-black leading-[0.95] tracking-tight md:text-6xl">{title}</h1>
				{subtitle && <p className="mt-3 max-w-2xl text-sm text-gray-500 md:text-base">{subtitle}</p>}
			</div>
			{action}
		</div>
	)
}

const LEVEL_STYLES: Record<string, string> = {
	low: "bg-green-100 text-green-800",
	medium: "bg-yellow-100 text-yellow-800",
	high: "bg-orange-100 text-orange-800",
	critical: "bg-red-100 text-red-800",
}

export function RiskBadge({ level, score }: { level?: string | null; score?: number | null }) {
	if (!level) return <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-400">unscored</span>
	return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase ${LEVEL_STYLES[level] ?? "bg-gray-100 text-gray-700"}`}>{level}{typeof score === "number" ? ` · ${score}` : ""}</span>
}

export const ACTION_LABELS: Record<string, string> = {
	ship_normally: "Ship normally",
	verify_by_whatsapp: "Verify by WhatsApp",
	verify_by_call: "Verify by call",
	request_prepaid_deposit: "Request prepaid deposit",
	manual_review: "Manual review",
	hold_order: "Hold order",
}

export function ActionPill({ action }: { action?: string | null }) {
	if (!action) return null
	return <span className="inline-flex rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-bold text-gray-800 shadow-sm">{ACTION_LABELS[action] ?? action}</span>
}

export function ButtonLike({ children, tone = "dark" }: { children: ReactNode; tone?: "dark" | "orange" | "light" }) {
	const cls = tone === "orange" ? "bg-[#ff4f0f] text-white" : tone === "light" ? "bg-white text-black border" : "bg-black text-white"
	return <span className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-bold ${cls}`}>{children}</span>
}

export function EmptyState({ title, hint }: { title: string; hint?: ReactNode }) {
	return <Card className="text-center"><p className="font-bold">{title}</p>{hint && <div className="mt-2 text-sm text-gray-500">{hint}</div>}</Card>
}

export function NoDatabaseNotice() {
	return <EmptyState title="No data yet" hint={<>Connect <code>.env.local</code>, then run <code>npm run db:push</code> and <code>npm run seed</code>.</>} />
}

export function money(total: string | number, currency = "INR") {
	const n = typeof total === "string" ? Number(total) : total
	return `${currency} ${n.toLocaleString("en-IN")}`
}

export { Link }

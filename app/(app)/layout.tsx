import Link from "next/link"
import { getCurrentOrg, isDevMode } from "@/lib/session"

const NAV = [
	{ href: "/dashboard", label: "Dashboard", icon: "✦" },
	{ href: "/orders", label: "Orders", icon: "◉" },
	{ href: "/intelligence", label: "Intelligence", icon: "⌁" },
	{ href: "/analytics", label: "Analytics", icon: "📈" },
	{ href: "/brand", label: "Brand brain", icon: "◆" },
	{ href: "/rules", label: "Risk rules", icon: "◇" },
	{ href: "/webhooks", label: "Webhooks", icon: "↯" },
	{ href: "/documents", label: "Knowledge", icon: "▣" },
	{ href: "/settings", label: "API keys", icon: "⚙" },
]

export default async function AppLayout({ children }: { children: React.ReactNode }) {
	const org = await getCurrentOrg()
	return (
		<div className="mx-auto flex min-h-screen max-w-[1500px] gap-4 p-4 md:p-6">
			<aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-72 shrink-0 rounded-[2rem] bg-black p-5 text-white md:block">
				<Link href="/" className="mb-8 flex items-center justify-between border-b border-white/10 pb-5 text-xl font-black">
					<span>RTOShield</span><span className="rounded-full bg-[#ff4f0f] px-3 py-1 text-sm">AI</span>
				</Link>
				<nav className="space-y-2">
					{NAV.map((n) => (
						<Link key={n.href} href={n.href} className="group flex items-center justify-between rounded-full px-4 py-3 text-sm font-semibold text-white/75 hover:bg-white hover:text-black">
							<span className="flex items-center gap-3"><span className="text-[#ff4f0f] group-hover:text-black">{n.icon}</span>{n.label}</span>
							<span>↗</span>
						</Link>
					))}
				</nav>
				<div className="absolute bottom-5 left-5 right-5 rounded-[1.5rem] border border-white/10 bg-white/5 p-4 text-xs">
					<div className="font-bold text-white">{org?.name ?? "No organization"}</div>
					<div className="mt-1 text-white/50">Fake-order command center</div>
					{isDevMode() && <div className="mt-3 rounded-full bg-white px-3 py-1 font-bold text-black">Dev mode enabled</div>}
				</div>
			</aside>
			<main className="min-w-0 flex-1 rounded-[2.4rem] bg-[#eef1f7]/80 p-4 md:p-8">{children}</main>
		</div>
	)
}

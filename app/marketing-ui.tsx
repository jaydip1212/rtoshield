import Link from "next/link"

export function MarketingShell({ children }: { children: React.ReactNode }) {
	return (
		<main className="mx-auto max-w-[1400px] px-4 py-5 md:px-8">
			<header className="glass-panel sticky top-4 z-50 mb-6 flex items-center justify-between rounded-full px-5 py-3 shadow-xl shadow-slate-900/5">
				<Link href="/" className="text-xl font-black">RTOShield</Link>
				<nav className="hidden items-center gap-6 text-sm font-bold text-gray-600 md:flex">
					<Link href="/features">Features</Link>
					<Link href="/solutions/rto-prevention">RTO prevention</Link>
					<Link href="/solutions/fake-order-detection">Fake-order detection</Link>
					<Link href="/resources/rto-guide">RTO guide</Link>
					<Link href="/pricing">Pricing</Link>
				</nav>
				<Link href="/dashboard" className="rounded-full bg-black px-5 py-2 text-sm font-black text-white">Open app ↗</Link>
			</header>
			{children}
		</main>
	)
}

export function Hero({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
	return (
		<section className="blue-court grid-noise relative overflow-hidden rounded-[2.7rem] p-8 text-white md:p-14">
			<div className="orange-orb float-slow absolute -right-10 top-16 h-72 w-72 rounded-full" />
			<div className="relative z-10 max-w-4xl">
				<div className="mb-5 inline-flex rounded-full bg-white/15 px-4 py-2 text-xs font-black uppercase tracking-wide backdrop-blur">{eyebrow}</div>
				<h1 className="text-6xl font-black leading-[.9] tracking-[-.06em] md:text-8xl">{title}</h1>
				<p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/75">{body}</p>
				<div className="mt-8 flex flex-wrap gap-3"><Link href="/dashboard" className="rounded-full bg-[#ff4f0f] px-6 py-3 text-sm font-black text-white">Launch dashboard</Link><Link href="/brand" className="rounded-full bg-white px-6 py-3 text-sm font-black text-black">Train Brand Brain</Link></div>
			</div>
		</section>
	)
}

export function FeatureGrid({ items }: { items: Array<{ icon: string; title: string; body: string }> }) {
	return <section className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{items.map((x)=><div key={x.title} className="hover-lift rounded-[2rem] bg-white p-7 shadow-xl shadow-slate-900/5"><div className="icon-bubble grid h-14 w-14 place-items-center rounded-full bg-[#eef1f7] text-2xl">{x.icon}</div><h2 className="mt-6 text-2xl font-black">{x.title}</h2><p className="mt-3 text-sm leading-relaxed text-gray-500">{x.body}</p></div>)}</section>
}

export function SeoFAQ({ faqs }: { faqs: Array<{ q: string; a: string }> }) {
	return <section className="mt-7 rounded-[2.5rem] bg-black p-8 text-white md:p-12"><h2 className="text-5xl font-black">FAQ</h2><div className="mt-8 grid gap-4 md:grid-cols-2">{faqs.map((f)=><div key={f.q} className="rounded-[1.5rem] bg-white/10 p-5"><h3 className="font-black">{f.q}</h3><p className="mt-2 text-sm text-white/60">{f.a}</p></div>)}</div></section>
}

import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
	const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
	const pages = [
		"", "features", "pricing", "docs", "solutions/rto-prevention", "solutions/fake-order-detection", "resources/rto-guide",
	]
	return pages.map((p) => ({
		url: `${base}/${p}`.replace(/\/$/, "") || base,
		lastModified: new Date(),
		changeFrequency: p ? "weekly" : "daily",
		priority: p ? 0.8 : 1,
	}))
}

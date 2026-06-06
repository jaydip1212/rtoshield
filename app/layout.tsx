import type { Metadata } from "next"
import "./globals.css"

const title = "RTOShield — AI RTO Risk & Fake-Order Prevention for Ecommerce"
const description = "Privacy-first RTO risk scoring, fake COD order detection, pincode intelligence, Shopify/WooCommerce webhooks, and autonomous order verification for ecommerce brands."

export const metadata: Metadata = {
	metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
	title: { default: title, template: "%s | RTOShield" },
	description,
	keywords: [
		"RTO prevention", "fake order detection", "COD fraud prevention", "Shopify fraud detection",
		"WooCommerce fraud detection", "return to origin", "ecommerce risk scoring", "pincode RTO intelligence",
		"order verification", "AI fraud agent", "cash on delivery fraud",
	],
	applicationName: "RTOShield",
	authors: [{ name: "RTOShield" }],
	creator: "RTOShield",
	publisher: "RTOShield",
	openGraph: {
		type: "website",
		url: "/",
		title,
		description,
		siteName: "RTOShield",
	},
	twitter: {
		card: "summary_large_image",
		title,
		description,
	},
	robots: {
		index: true,
		follow: true,
		googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large", "max-video-preview": -1 },
	},
	alternates: { canonical: "/" },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	)
}

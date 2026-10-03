import type { Metadata } from "next"
import { Outfit, Geist_Mono } from "next/font/google"
import "./globals.css"

const appTitle = "Omra Facturation"
const appDescription = "Application de facturation Omrayanair / La Conciergerie / Horizon Solutions"

let resolvedSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000")

if (!resolvedSiteUrl.startsWith("http://") && !resolvedSiteUrl.startsWith("https://")) {
  resolvedSiteUrl = `https://${resolvedSiteUrl}`
}

let siteUrl: URL
try {
  siteUrl = new URL(resolvedSiteUrl)
} catch {
  siteUrl = new URL("https://nova-facture.vercel.app")
}

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: `${appTitle} - Gestion de facturation`,
  description: appDescription,
  openGraph: {
    title: appTitle,
    description: appDescription,
    type: "website",
    locale: "fr_FR",
    siteName: appTitle,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${appTitle} - Gestion de facturation`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: appTitle,
    description: appDescription,
    images: ["/twitter-image"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", type: "image/png" },
    ],
    shortcut: "/icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <body className={`${outfit.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}


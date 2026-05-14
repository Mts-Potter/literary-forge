import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Navbar } from "@/components/navigation/Navbar"
import { Footer } from "@/components/navigation/Footer"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme/ThemeProvider"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://literary-forge.vercel.app"

export const metadata: Metadata = {
  title: "The Franklin Method — Schreibstil lernen wie Franklin",
  description:
    "Eine Methode, die Benjamin Franklin sich selbst beibrachte (1722). Mit KI-Feedback optimiert: messbarer Stilabstand, Wort-für-Wort-Diff, qualitatives Lektorat.",
  authors: [{ name: "The Franklin Method" }],
  creator: "The Franklin Method",
  publisher: "The Franklin Method",
  metadataBase: new URL(siteUrl),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: siteUrl,
    siteName: "The Franklin Method",
    title: "The Franklin Method — Schreibstil lernen wie Franklin",
    description:
      "Eine Methode, die Benjamin Franklin sich selbst beibrachte (1722). Mit KI-Feedback optimiert: messbarer Stilabstand, Wort-für-Wort-Diff, qualitatives Lektorat.",
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "The Franklin Method",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Franklin Method — Schreibstil lernen wie Franklin",
    description:
      "Eine Methode, die Benjamin Franklin sich selbst beibrachte. Mit KI-Feedback optimiert.",
    images: [`${siteUrl}/og-image.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

/**
 * Root layout is intentionally HEADERS-FREE so marketing routes can be
 * statically rendered (CDN-cacheable on Vercel). The auth-route nonce is
 * set by middleware on the RESPONSE header — Next.js handles its own
 * framework scripts when the CSP carries a nonce. No layout-level nonce
 * read needed.
 *
 * Page-level JSON-LD: each route adds its own (WebApplication on /,
 * Person on /autoren/[slug], Book on /buecher/[slug]).
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <ThemeProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://literary-forge.vercel.app';

export const metadata: Metadata = {
  title: "The Franklin Method — Schreibstil lernen wie Franklin",
  description: "Eine Methode, die Benjamin Franklin sich selbst beibrachte (1722). Mit KI-Feedback optimiert: messbarer Stilabstand, Wort-für-Wort-Diff, qualitatives Lektorat.",
  authors: [{ name: "The Franklin Method" }],
  creator: "The Franklin Method",
  publisher: "The Franklin Method",
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: siteUrl,
    siteName: "The Franklin Method",
    title: "The Franklin Method — Schreibstil lernen wie Franklin",
    description: "Eine Methode, die Benjamin Franklin sich selbst beibrachte (1722). Mit KI-Feedback optimiert: messbarer Stilabstand, Wort-für-Wort-Diff, qualitatives Lektorat.",
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Literary Forge - KI Schreibtraining",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Franklin Method — Schreibstil lernen wie Franklin",
    description: "Eine Methode, die Benjamin Franklin sich selbst beibrachte. Mit KI-Feedback optimiert.",
    images: [`${siteUrl}/og-image.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Google Search Console verification kann hier später hinzugefügt werden
    // google: 'verification-code',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": `${siteUrl}/#webapp`,
        "name": "The Franklin Method",
        "description": "Schreibstil-Training basierend auf Benjamin Franklins Selbstlern-Methode, mit KI-Feedback und Spaced Repetition",
        "url": siteUrl,
        "applicationCategory": "EducationalApplication",
        "operatingSystem": "Web Browser",
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "EUR",
          "availability": "https://schema.org/InStock"
        },
        "featureList": [
          "KI-gestütztes Feedback",
          "Stilistische Analyse",
          "Personalisiertes Training",
          "Literatur-Bibliothek"
        ],
        "inLanguage": "de-DE"
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        "name": "The Franklin Method",
        "url": siteUrl,
        "logo": {
          "@type": "ImageObject",
          "url": `${siteUrl}/logo.png`
        },
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "customer support",
          "url": `${siteUrl}/kontakt`
        },
        "sameAs": []
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        "url": siteUrl,
        "name": "The Franklin Method",
        "description": "Schreibstil-Training basierend auf Benjamin Franklins Selbstlern-Methode",
        "publisher": {
          "@id": `${siteUrl}/#organization`
        },
        "inLanguage": "de-DE"
      }
    ]
  };

  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <ThemeProvider>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}

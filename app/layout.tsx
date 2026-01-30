import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

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
  title: "Literary Forge - KI-gestütztes Training für Literarischen Stil",
  description: "Trainiere deinen Schreibstil mit KI-Unterstützung. Literary Forge bietet stilistische Mimesis durch intelligentes Feedback und personalisiertes Training.",
  keywords: ["KI Schreibtraining", "literarischer Stil", "stilistische Mimesis", "Creative Writing", "AI Writing", "Schreibstil verbessern", "Literatur Training"],
  authors: [{ name: "Literary Forge" }],
  creator: "Literary Forge",
  publisher: "Literary Forge",
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
    languages: {
      'de-DE': '/de',
    },
  },
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: siteUrl,
    siteName: "Literary Forge",
    title: "Literary Forge - KI-gestütztes Training für Literarischen Stil",
    description: "Trainiere deinen Schreibstil mit KI-Unterstützung. Literary Forge bietet stilistische Mimesis durch intelligentes Feedback und personalisiertes Training.",
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
    title: "Literary Forge - KI-gestütztes Training für Literarischen Stil",
    description: "Trainiere deinen Schreibstil mit KI-Unterstützung. Stilistische Mimesis durch intelligentes Feedback.",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": `${siteUrl}/#webapp`,
        "name": "Literary Forge",
        "description": "KI-gestütztes Training für stilistische Mimesis und literarischen Schreibstil",
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
        "name": "Literary Forge",
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
        "name": "Literary Forge",
        "description": "KI-gestütztes Training für stilistische Mimesis",
        "publisher": {
          "@id": `${siteUrl}/#organization`
        },
        "inLanguage": "de-DE"
      }
    ]
  };

  return (
    <html lang="de">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Unbounded } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { KEYWORDS, SITE } from "@/lib/seo";

const display = Unbounded({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });
const sans = localFont({
  src: [
    { path: "../public/fonts/GoogleSans-Variable.ttf", style: "normal", weight: "100 900" },
    { path: "../public/fonts/GoogleSans-Variable-Italic.ttf", style: "italic", weight: "100 900" },
  ],
  variable: "--font-sans",
  display: "swap",
});

const TITLE = `${SITE.name} — ${SITE.tagline}`;

/* Root metadata: every page inherits this; service pages override the
   title (via the template), description, keywords and canonical.
   The share image comes from app/opengraph-image.tsx. */
export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: TITLE, template: `%s | ${SITE.name}` },
  description: SITE.description,
  keywords: KEYWORDS,
  applicationName: SITE.name,
  authors: [{ name: SITE.legalName, url: SITE.url }],
  creator: SITE.name,
  publisher: SITE.name,
  category: "technology",
  alternates: { canonical: "/", languages: { "en-IN": "/" } },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE.url,
    siteName: SITE.name,
    title: TITLE,
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: SITE.description,
  },
  formatDetection: { telephone: false },
  other: {
    "geo.region": "IN-WB",
    "geo.placename": "Kolkata",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#050403",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-IN" className={`${display.variable} ${mono.variable} ${sans.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}

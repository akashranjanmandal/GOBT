import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Unbounded } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "GOBT | Group of Blooming Technicians",
  description:
    "India's premier digital engineering studio. We build mobile apps, web platforms, and premium UI/UX for businesses that demand excellence.",
  keywords:
    "app development India, web development, UI UX design, React Native, Next.js, Figma, startup tech partner, GOBT, Group of Blooming Technicians, Kolkata",
  authors: [{ name: "GOBT", url: "https://gobt.in" }],
  creator: "GOBT",
  metadataBase: new URL("https://gobt.in"),
  alternates: { canonical: "/" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://gobt.in",
    siteName: "GOBT",
    title: "GOBT | Group of Blooming Technicians",
    description: "We build digital products that define the future.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "GOBT Studio" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "GOBT | Group of Blooming Technicians",
    description: "India's premier digital engineering studio.",
    images: ["/og.png"],
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
    <html lang="en" className={`${display.variable} ${mono.variable} ${sans.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GOBT — Group of Blooming Technicians",
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
    title: "GOBT — Group of Blooming Technicians",
    description: "We build digital products that define the future.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "GOBT Studio" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "GOBT — Group of Blooming Technicians",
    description: "India's premier digital engineering studio.",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#050507",
};

import Script from "next/script";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Inter:wght@300;400;500&family=Space+Mono&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Script src="/mailtoui.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}

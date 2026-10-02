import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SERVICE_PAGES, SITE } from "@/lib/seo";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${SITE.name} — service`;

export function generateStaticParams() {
  return SERVICE_PAGES.map((s) => ({ slug: s.slug }));
}

/* Per-service share card: the page's own headline on the brand card */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = SERVICE_PAGES.find((s) => s.slug === slug);
  const logo = await readFile(join(process.cwd(), "public/logo.png"));
  const src = `data:image/png;base64,${logo.toString("base64")}`;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "radial-gradient(ellipse at 78% 35%, #3a2a0c 0%, #0b0906 55%, #050403 100%)",
          color: "#f5eedb",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <img src={src} width={96} height={90} alt="" />
          <div style={{ display: "flex", fontSize: 26, letterSpacing: 6, color: "#e7b53c" }}>GOBT · {page?.name.toUpperCase()}</div>
        </div>
        <div style={{ display: "flex", fontSize: 72, fontWeight: 700, lineHeight: 1.06, letterSpacing: -2, maxWidth: 1000 }}>
          {page?.h1}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: "#928970" }}>
          <div style={{ display: "flex" }}>DPIIT Recognised Startup · Kolkata, India</div>
          <div style={{ display: "flex", color: "#e7b53c" }}>gobt.in</div>
        </div>
      </div>
    ),
    size
  );
}

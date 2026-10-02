import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SITE } from "@/lib/seo";

export const alt = `${SITE.name} — ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/* Share card for WhatsApp, LinkedIn, X and search previews */
export default async function Image() {
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
          <div style={{ display: "flex", fontSize: 26, letterSpacing: 6, color: "#e7b53c" }}>GROUP OF BLOOMING TECHNICIANS</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>
            Deep-Tech, AI &amp; Software
          </div>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2, color: "#f0c24e" }}>
            Development in India
          </div>
          <div style={{ display: "flex", fontSize: 28, color: "#c9bfa3", marginTop: 10 }}>
            Web · Mobile apps · Digital transformation · Custom software
          </div>
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

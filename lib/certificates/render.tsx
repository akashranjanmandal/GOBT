import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import { SIGNATORIES, words } from "./config";

/* Built from GOBT's own certificate artwork (lib/certificates/assets):
   the textured background with its blue border, the gold logo, the
   filigree dividers, the laurel wreath and the directors' signatures.
   Positions are in the sample's units (1310 × 924), scaled up K times
   so the PNG is sharp enough to print on A4. */
const W = 1310;
const H = 924;
const K = 1.6;
const u = (n: number) => Math.round(n * K * 100) / 100;

export const CERT_PX = { width: Math.round(W * K), height: Math.round(H * K) };

const NAVY = "#26287a";
const ROYAL = "#2b2bb0";
const INK = "#333333";
const BOLD_INK = "#1f1f1f";
const TAN = "#cf9f78";
const LINE_GOLD = "#d9b98a";

export type RenderInput = {
  certNo: string;
  title: string;
  body: string;
  note: string;
  verifyUrl: string;
  /* uploaded images; null uses GOBT's original artwork */
  signatures: (string | null)[];
  badge: string | null;
  revoked?: boolean;
  preview?: boolean;
};

/* ── assets, read once per server instance ── */
type Font = { name: string; data: Buffer; weight: 400 | 600 | 700; style: "normal" | "italic" };
type Assets = {
  fonts: Font[];
  background: string;
  logo: string;
  divider: string;
  wreath: string;
  badge: string;
  signatures: string[];
};
let assets: Assets | null = null;

const dataUrl = (buf: Buffer, type: string) => `data:${type};base64,${buf.toString("base64")}`;

export function certAssets(): Assets {
  if (assets) return assets;
  const dir = path.join(process.cwd(), "lib/certificates/assets");
  const f = (file: string) => readFileSync(path.join(dir, file));
  const png = (file: string) => dataUrl(f(file), "image/png");
  assets = {
    fonts: [
      { name: "Cinzel", data: f("cinzel-latin-700-normal.woff"), weight: 700, style: "normal" },
      { name: "Open Sans", data: f("open-sans-latin-400-normal.woff"), weight: 400, style: "normal" },
      { name: "Open Sans", data: f("open-sans-latin-600-normal.woff"), weight: 600, style: "normal" },
      { name: "Open Sans", data: f("open-sans-latin-700-normal.woff"), weight: 700, style: "normal" },
      { name: "Open Sans", data: f("open-sans-latin-400-italic.woff"), weight: 400, style: "italic" },
      { name: "Open Sans", data: f("open-sans-latin-600-italic.woff"), weight: 600, style: "italic" },
      { name: "Open Sans", data: f("open-sans-latin-700-italic.woff"), weight: 700, style: "italic" },
    ],
    background: dataUrl(f("background.jpg"), "image/jpeg"),
    logo: png("gobt-logo.png"),
    divider: png("divider.png"),
    wreath: png("wreath.png"),
    badge: png("dpiit.png"),
    signatures: SIGNATORIES.map((_, i) => png(`signature-${i}.png`)),
  };
  return assets;
}

/* the images a certificate uses when nothing has been uploaded */
export const defaultCertImages = () => {
  const a = certAssets();
  return { signatures: a.signatures, badge: a.badge };
};

async function qrDataUrl(url: string) {
  const svg = await QRCode.toString(url, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#000000", light: "#ffffff" } });
  return dataUrl(Buffer.from(svg), "image/svg+xml");
}

/* longer texts get a slightly smaller size so everything fits */
function textSize(body: string, note: string) {
  const len = body.replace(/\*\*/g, "").length + note.replace(/\*\*/g, "").length;
  if (len <= 560) return 18.5;
  return Math.max(13.5, Math.round(18.5 * Math.sqrt(560 / len) * 10) / 10);
}

function Paragraph({ text, size, color, bold, gap }: { text: string; size: number; color: string; bold: string; gap?: number }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        fontFamily: "Open Sans",
        fontStyle: "italic",
        fontSize: u(size),
        lineHeight: 1.42,
        color,
        marginTop: gap ? u(gap) : 0,
      }}
    >
      {words(text).map((x, i) => (
        <span key={i} style={{ fontWeight: x.bold ? 700 : 400, color: x.bold ? bold : color, marginRight: u(size * 0.26) }}>
          {x.w}
        </span>
      ))}
    </div>
  );
}

function Signature({ index, image, cx }: { index: number; image: string; cx: number }) {
  const s = SIGNATORIES[index];
  return (
    <div style={{ position: "absolute", left: u(cx - 160), top: u(598), width: u(320), display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ height: u(104), width: u(320), display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={image} style={{ maxHeight: u(100), maxWidth: u(300), objectFit: "contain" }} />
      </div>
      <div style={{ marginTop: u(4), width: u(226), height: u(1.4), background: LINE_GOLD, display: "flex" }} />
      <span style={{ marginTop: u(16), fontFamily: "Open Sans", fontSize: u(14.5), letterSpacing: u(3), color: INK }}>{s.name.toUpperCase()}</span>
      <span style={{ marginTop: u(6), fontFamily: "Open Sans", fontSize: u(14.5), letterSpacing: u(3), color: INK }}>{s.title}</span>
    </div>
  );
}

export async function renderCertificate(input: RenderInput) {
  const a = certAssets();
  const qr = await qrDataUrl(input.verifyUrl);
  const size = textSize(input.body, input.note);
  const signatures = SIGNATORIES.map((_, i) => input.signatures[i] ?? a.signatures[i]);
  const badge = input.badge ?? a.badge;
  const title = input.title.toUpperCase();
  const titleSize = title.length > 26 ? Math.max(30, Math.round((43 * 26) / title.length)) : 43;

  const el = (
    <div style={{ width: u(W), height: u(H), display: "flex", position: "relative", background: "#faf6f2" }}>
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
      <img src={a.background} width={u(W)} height={u(H)} style={{ position: "absolute", left: 0, top: 0 }} />

      {/* certificate number */}
      <div style={{ position: "absolute", left: u(118), top: u(122), width: u(270), display: "flex", flexDirection: "column", alignItems: "center", fontFamily: "Open Sans", color: ROYAL }}>
        <span style={{ fontWeight: 700, fontSize: u(22), letterSpacing: u(2.4) }}>CERTIFICATE NO:</span>
        <span style={{ marginTop: u(2), fontStyle: "italic", fontSize: u(14.5), letterSpacing: u(3.2) }}>{input.certNo}</span>
      </div>

      {/* GOBT logo */}
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
      <img src={a.logo} width={u(152)} height={u(141.4)} style={{ position: "absolute", left: u(W / 2 - 76), top: u(92) }} />

      {/* top-right logo (DPIIT / Startup India, or an uploaded one) */}
      <div style={{ position: "absolute", left: u(962), top: u(104), width: u(232), height: u(96), display: "flex", justifyContent: "center", alignItems: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={badge} style={{ maxWidth: u(232), maxHeight: u(96), objectFit: "contain" }} />
      </div>

      {/* title between two filigree dividers */}
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
      <img src={a.divider} width={u(497)} height={u(28.2)} style={{ position: "absolute", left: u(W / 2 - 248.5), top: u(257) }} />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: u(298),
          width: u(W),
          height: u(60),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Cinzel",
          fontWeight: 700,
          fontSize: u(titleSize),
          letterSpacing: u(titleSize * 0.13),
          color: NAVY,
        }}
      >
        {title}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
      <img src={a.divider} width={u(497)} height={u(28.2)} style={{ position: "absolute", left: u(W / 2 - 248.5), top: u(361) }} />

      {/* the text */}
      <div style={{ position: "absolute", left: u(100), top: u(404), width: u(1110), height: u(170), display: "flex", flexDirection: "column", justifyContent: "flex-start" }}>
        <Paragraph text={input.body} size={size} color={INK} bold={BOLD_INK} />
        {input.note.trim() && <Paragraph text={input.note} size={size} color={TAN} bold={TAN} gap={size * 0.65} />}
      </div>

      <Signature index={0} image={signatures[0]} cx={327} />
      <Signature index={1} image={signatures[1]} cx={985} />

      {/* QR code inside the laurel wreath ("Scan to Verify" is part of the wreath) */}
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
      <img src={a.wreath} width={u(308)} height={u(234)} style={{ position: "absolute", left: u(W / 2 - 154), top: u(578) }} />
      <div style={{ position: "absolute", left: u(W / 2 - 46), top: u(638), width: u(92), height: u(92), display: "flex", padding: u(3), background: "#ffffff" }}>
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={qr} width={u(86)} height={u(86)} />
      </div>

      {(input.revoked || input.preview) && (
        <div style={{ position: "absolute", left: 0, top: 0, width: u(W), height: u(H), display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div
            style={{
              display: "flex",
              transform: "rotate(-18deg)",
              padding: `${u(10)}px ${u(40)}px`,
              border: `${u(6)}px solid ${input.revoked ? "rgba(200,30,30,.7)" : "rgba(38,40,122,.16)"}`,
              color: input.revoked ? "rgba(200,30,30,.7)" : "rgba(38,40,122,.16)",
              fontFamily: "Cinzel",
              fontWeight: 700,
              fontSize: u(96),
              letterSpacing: u(10),
            }}
          >
            {input.revoked ? "REVOKED" : "PREVIEW"}
          </div>
        </div>
      )}
    </div>
  );

  return new ImageResponse(el, { ...CERT_PX, fonts: a.fonts });
}

export async function certificatePng(input: RenderInput) {
  const res = await renderCertificate(input);
  return Buffer.from(await res.arrayBuffer());
}

/* A4 landscape PDF with the certificate filling the page */
export async function certificatePdf(input: RenderInput, meta: { title: string; author: string }) {
  const { PDFDocument } = await import("pdf-lib");
  const png = await certificatePng(input);
  const doc = await PDFDocument.create();
  doc.setTitle(meta.title);
  doc.setAuthor(meta.author);
  doc.setCreator("GOBT");
  const img = await doc.embedPng(png);
  const pageW = 841.89;
  const pageH = 595.28;
  const page = doc.addPage([pageW, pageH]);
  const scale = Math.min(pageW / img.width, pageH / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  page.drawImage(img, { x: (pageW - w) / 2, y: (pageH - h) / 2, width: w, height: h });
  return Buffer.from(await doc.save());
}

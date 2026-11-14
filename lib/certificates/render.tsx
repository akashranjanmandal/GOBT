import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import { SIGNATORIES, words } from "./config";

/* The certificate is drawn in the sample's own units (1310 × 924) and
   scaled up K times, so the PNG is sharp enough to print on A4. */
const W = 1310;
const H = 924;
const K = 1.6;
const u = (n: number) => Math.round(n * K * 100) / 100;

export const CERT_PX = { width: Math.round(W * K), height: Math.round(H * K) };

const NAVY = "#1d2f6f";
const BLUE = "#2f4fa8";
const GOLD = "#b8892b";
const GOLD_LIGHT = "#d9b45a";
const INK = "#2a2a33";

export type RenderInput = {
  certNo: string;
  title: string;
  body: string;
  note: string;
  verifyUrl: string;
  signatures: (string | null)[];
  badge: string | null;
  revoked?: boolean;
  preview?: boolean;
};

/* ── assets, read once per server instance ── */
type Font = { name: string; data: Buffer; weight: 400 | 600 | 700; style: "normal" | "italic" };
let assets: { fonts: Font[]; logo: string } | null = null;

function loadAssets() {
  if (assets) return assets;
  const dir = path.join(process.cwd(), "lib/certificates/assets");
  const f = (file: string) => readFileSync(path.join(dir, file));
  assets = {
    fonts: [
      { name: "Cinzel", data: f("cinzel-latin-700-normal.woff"), weight: 700, style: "normal" },
      { name: "Open Sans", data: f("open-sans-latin-400-normal.woff"), weight: 400, style: "normal" },
      { name: "Open Sans", data: f("open-sans-latin-600-normal.woff"), weight: 600, style: "normal" },
      { name: "Open Sans", data: f("open-sans-latin-700-normal.woff"), weight: 700, style: "normal" },
      { name: "Open Sans", data: f("open-sans-latin-400-italic.woff"), weight: 400, style: "italic" },
      { name: "Open Sans", data: f("open-sans-latin-600-italic.woff"), weight: 600, style: "italic" },
      { name: "Open Sans", data: f("open-sans-latin-700-italic.woff"), weight: 700, style: "italic" },
      { name: "Great Vibes", data: f("great-vibes-latin-400-normal.woff"), weight: 400, style: "normal" },
    ],
    logo: `data:image/png;base64,${f("gobt-logo.png").toString("base64")}`,
  };
  return assets;
}

/* ── the frame: chain border, corner bullets, flourishes, laurel ── */

function chainEdge(x1: number, y1: number, x2: number, y2: number) {
  const horizontal = y1 === y2;
  const len = horizontal ? x2 - x1 : y2 - y1;
  const step = 15;
  const n = Math.floor(len / step);
  const gap = (len - n * step) / 2;
  let out = "";
  for (let i = 0; i < n; i++) {
    const t = gap + step / 2 + i * step;
    const cx = horizontal ? x1 + t : x1;
    const cy = horizontal ? y1 : y1 + t;
    if (i % 2 === 0) {
      /* a link seen flat */
      const [rx, ry] = horizontal ? [9.5, 5.2] : [5.2, 9.5];
      out += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${BLUE}" stroke-width="2.4"/>`;
    } else {
      /* a link seen edge-on */
      const [rx, ry] = horizontal ? [8, 1.8] : [1.8, 8];
      out += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${NAVY}"/>`;
    }
  }
  return out;
}

function flourish(dir: 1 | -1) {
  /* drawn for the right side, mirrored for the left */
  const t = dir === 1 ? "" : `transform="translate(${W} 0) scale(-1 1)"`;
  return `<g ${t} fill="none" stroke="${GOLD}" stroke-linecap="round">
    <path d="M1072 206 C 1100 188, 1128 222, 1158 204 S 1200 186, 1214 204" stroke-width="2.2"/>
    <path d="M1214 204 C 1222 214, 1210 226, 1200 218 C 1192 211, 1202 202, 1209 208" stroke-width="2"/>
    <path d="M1086 222 C 1112 236, 1140 214, 1168 224" stroke-width="1.4" opacity=".8"/>
    <path d="M1158 204 C 1162 192, 1176 190, 1180 199" stroke-width="1.6"/>
    <circle cx="1064" cy="207" r="3.4" fill="${GOLD}" stroke="none"/>
  </g>`;
}

function laurel(cx: number, cy: number, r: number) {
  let leaves = "";
  const side = (mirror: boolean) => {
    let g = "";
    const steps = 9;
    for (let i = 0; i < steps; i++) {
      /* from near the bottom (112°) round to the top (235°) on the left side */
      const a = ((112 + (i * 123) / (steps - 1)) * Math.PI) / 180;
      const x = cx + r * Math.cos(a);
      const y = cy + r * Math.sin(a);
      const tangent = (a * 180) / Math.PI + 90;
      const size = 1 - i * 0.045;
      g += `<ellipse cx="${(x - 7 * Math.cos(a)).toFixed(1)}" cy="${(y - 7 * Math.sin(a)).toFixed(1)}" rx="${(12 * size).toFixed(1)}" ry="${(4.6 * size).toFixed(1)}" transform="rotate(${(tangent - 35).toFixed(1)} ${(x - 7 * Math.cos(a)).toFixed(1)} ${(y - 7 * Math.sin(a)).toFixed(1)})" fill="${GOLD}"/>`;
      g += `<ellipse cx="${(x + 7 * Math.cos(a)).toFixed(1)}" cy="${(y + 7 * Math.sin(a)).toFixed(1)}" rx="${(11 * size).toFixed(1)}" ry="${(4.2 * size).toFixed(1)}" transform="rotate(${(tangent + 35).toFixed(1)} ${(x + 7 * Math.cos(a)).toFixed(1)} ${(y + 7 * Math.sin(a)).toFixed(1)})" fill="${GOLD_LIGHT}"/>`;
    }
    const a0 = (112 * Math.PI) / 180;
    const a1 = (235 * Math.PI) / 180;
    g += `<path d="M${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)} A ${r} ${r} 0 0 1 ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)}" fill="none" stroke="${GOLD}" stroke-width="2"/>`;
    return mirror ? `<g transform="translate(${2 * cx} 0) scale(-1 1)">${g}</g>` : g;
  };
  leaves += side(false) + side(true);
  return leaves;
}

function frameSvg() {
  const o = 24; // centre line of the chain
  const corners = [
    [o, o],
    [W - o, o],
    [o, H - o],
    [W - o, H - o],
  ];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" fill="#fffdf8"/>
    <rect x="8" y="8" width="${W - 16}" height="${H - 16}" fill="none" stroke="${NAVY}" stroke-width="2.5"/>
    ${chainEdge(o + 14, o, W - o - 14, o)}
    ${chainEdge(o + 14, H - o, W - o - 14, H - o)}
    ${chainEdge(o, o + 14, o, H - o - 14)}
    ${chainEdge(W - o, o + 14, W - o, H - o - 14)}
    <rect x="40" y="40" width="${W - 80}" height="${H - 80}" fill="none" stroke="${NAVY}" stroke-width="2"/>
    <rect x="47" y="47" width="${W - 94}" height="${H - 94}" fill="none" stroke="${GOLD}" stroke-width="1"/>
    ${corners
      .map(
        ([x, y]) => `<circle cx="${x}" cy="${y}" r="13" fill="${NAVY}"/>
        <circle cx="${x}" cy="${y}" r="9" fill="none" stroke="${GOLD_LIGHT}" stroke-width="2"/>
        <circle cx="${x}" cy="${y}" r="3.5" fill="${GOLD_LIGHT}"/>`
      )
      .join("")}
    ${flourish(1)}
    ${flourish(-1)}
    <line x1="545" y1="262" x2="636" y2="262" stroke="${GOLD}" stroke-width="1.4"/>
    <line x1="674" y1="262" x2="765" y2="262" stroke="${GOLD}" stroke-width="1.4"/>
    <path d="M655 252 L665 262 L655 272 L645 262 Z" fill="${GOLD}"/>
    <circle cx="640" cy="262" r="2.4" fill="${GOLD}"/>
    <circle cx="670" cy="262" r="2.4" fill="${GOLD}"/>
    ${laurel(655, 750, 82)}
    <line x1="150" y1="790" x2="410" y2="790" stroke="${INK}" stroke-width="1.2"/>
    <line x1="900" y1="790" x2="1160" y2="790" stroke="${INK}" stroke-width="1.2"/>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

let frame: string | null = null;

async function qrDataUrl(url: string) {
  const svg = await QRCode.toString(url, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: NAVY, light: "#ffffff" } });
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

/* longer texts get a slightly smaller size so everything fits */
function textSize(body: string, note: string) {
  const len = body.replace(/\*\*/g, "").length + note.replace(/\*\*/g, "").length * 1.1;
  if (len <= 520) return 22;
  return Math.max(15, Math.round(22 * Math.sqrt(520 / len) * 10) / 10);
}

function Paragraph({ text, size, color, gap }: { text: string; size: number; color: string; gap?: number }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        fontFamily: "Open Sans",
        fontStyle: "italic",
        fontSize: u(size),
        lineHeight: 1.62,
        color,
        marginTop: gap ? u(gap) : 0,
      }}
    >
      {words(text).map((x, i) => (
        <span key={i} style={{ fontWeight: x.bold ? 700 : 400, color: x.bold ? NAVY : color, marginRight: u(size * 0.27) }}>
          {x.w}
        </span>
      ))}
    </div>
  );
}

function Signature({ index, image, x }: { index: number; image: string | null; x: number }) {
  const s = SIGNATORIES[index];
  return (
    <div style={{ position: "absolute", left: u(x - 150), top: u(700), width: u(300), display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ height: u(86), width: u(300), display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
          <img src={image} style={{ maxHeight: u(80), maxWidth: u(240), objectFit: "contain" }} />
        ) : (
          <span style={{ fontFamily: "Great Vibes", fontSize: u(40), color: NAVY, lineHeight: 1 }}>{s.name}</span>
        )}
      </div>
      <span style={{ marginTop: u(10), fontFamily: "Open Sans", fontWeight: 700, fontSize: u(16), letterSpacing: u(1.2), color: INK }}>
        {s.name.toUpperCase()}
      </span>
      <span style={{ fontFamily: "Open Sans", fontStyle: "italic", fontSize: u(14), color: "#555" }}>{s.title}</span>
    </div>
  );
}

export async function renderCertificate(input: RenderInput) {
  const { fonts, logo } = loadAssets();
  frame ??= frameSvg();
  const qr = await qrDataUrl(input.verifyUrl);
  const size = textSize(input.body, input.note);

  const el = (
    <div style={{ width: u(W), height: u(H), display: "flex", position: "relative", background: "#fffdf8" }}>
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
      <img src={frame} width={u(W)} height={u(H)} style={{ position: "absolute", left: 0, top: 0 }} />

      {/* certificate number */}
      <div style={{ position: "absolute", left: u(76), top: u(72), display: "flex", fontFamily: "Open Sans", fontWeight: 700, fontSize: u(15), color: NAVY, letterSpacing: u(0.6) }}>
        CERTIFICATE NO: {input.certNo}
      </div>

      {/* GOBT logo */}
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
      <img src={logo} width={u(112)} height={u(104.5)} style={{ position: "absolute", left: u(W / 2 - 56), top: u(60) }} />

      {/* top-right logo (e.g. DPIIT / Startup India), uploaded by an admin */}
      {input.badge && (
        <div style={{ position: "absolute", right: u(72), top: u(58), width: u(250), height: u(108), display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
          <img src={input.badge} style={{ maxWidth: u(250), maxHeight: u(108), objectFit: "contain" }} />
        </div>
      )}

      {/* title */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: u(176),
          width: u(W),
          display: "flex",
          justifyContent: "center",
          fontFamily: "Cinzel",
          fontWeight: 700,
          fontSize: u(input.title.length > 28 ? 40 : 46),
          letterSpacing: u(2),
          color: NAVY,
        }}
      >
        {input.title.toUpperCase()}
      </div>

      {/* the text */}
      <div style={{ position: "absolute", left: u(150), top: u(288), width: u(1010), height: u(405), display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <Paragraph text={input.body} size={size} color={INK} />
        {input.note.trim() && <Paragraph text={input.note} size={size} color={GOLD} gap={size * 0.8} />}
      </div>

      <Signature index={0} image={input.signatures[0]} x={280} />
      <Signature index={1} image={input.signatures[1]} x={1030} />

      {/* QR code inside the wreath */}
      <div style={{ position: "absolute", left: u(655 - 52), top: u(750 - 52), display: "flex", padding: u(5), background: "#ffffff" }}>
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={qr} width={u(94)} height={u(94)} />
      </div>
      <div style={{ position: "absolute", left: u(555), top: u(846), width: u(200), display: "flex", justifyContent: "center", fontFamily: "Open Sans", fontWeight: 700, fontSize: u(13), letterSpacing: u(1.4), color: NAVY }}>
        SCAN TO VERIFY
      </div>

      {(input.revoked || input.preview) && (
        <div style={{ position: "absolute", left: 0, top: 0, width: u(W), height: u(H), display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div
            style={{
              display: "flex",
              transform: "rotate(-18deg)",
              padding: `${u(10)}px ${u(40)}px`,
              border: `${u(6)}px solid ${input.revoked ? "rgba(200,30,30,.7)" : "rgba(29,47,111,.18)"}`,
              color: input.revoked ? "rgba(200,30,30,.7)" : "rgba(29,47,111,.18)",
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

  return new ImageResponse(el, { ...CERT_PX, fonts });
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

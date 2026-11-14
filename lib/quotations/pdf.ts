import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { PDFDocument, degrees, rgb, type Color, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { MARK_NODE, SIGNATORY, computeQuote, inWords, inr, lines, quoteDateParts, quoteSubject, type QuoteData, type QuoteSign } from "./model";
import { PAGE_BREAK_NODE, PRICING_NODE, nodeText, type DocNode } from "./doc";

/* Draws a quotation as an A4 PDF in GOBT's letterhead: the header band
   with the gold logo, the faint logo watermark, the footer with the
   Make in India / GeM / Digital India / MSME / DPIIT strip, and the
   signatory block with the signature and stamp. Artwork comes from
   GOBT's own quotations (lib/quotations/assets). */

/* ── page geometry, in points (top-down; flipped when drawing) ── */
const W = 595.28;
const H = 841.89;
const LEFT = 36;
const RIGHT = 560;
const WIDTH = RIGHT - LEFT;
const TOP = 80;
const BOTTOM = 768;
const SIZE = 11;
const LH = 1.2;

const BLACK = rgb(0, 0, 0);
const RED = rgb(0.93, 0.05, 0.05);
const GREY_TEXT = rgb(0.33, 0.33, 0.33);
const DARK = rgb(0.239, 0.239, 0.239);
const YELLOW = rgb(0.957, 0.718, 0.192);
const MUTED = rgb(0.45, 0.45, 0.45);

type Style = { b?: boolean; i?: boolean; c?: Color; u?: boolean; sup?: boolean };
type Run = Style & { t: string };
type Align = "left" | "right" | "center" | "justify";

/* "a **b** c" → runs, with the bold parts marked */
function rich(text: string, base: Style = {}): Run[] {
  return text
    .split(/(\*\*[^*]+\*\*)/)
    .filter(Boolean)
    .map((part) => (part.startsWith("**") && part.endsWith("**") && part.length > 4 ? { ...base, b: true, t: part.slice(2, -2) } : { ...base, t: part }));
}

/* ── assets, read once per server instance ── */
type Raw = { fonts: Record<string, Buffer>; images: Record<string, Buffer>; latinCover: Map<string, Set<number>> };
let raw: Raw | null = null;

function loadRaw(): Raw {
  if (raw) return raw;
  const dir = path.join(process.cwd(), "lib/quotations/assets");
  const f = (n: string) => readFileSync(path.join(dir, n));
  const fonts: Record<string, Buffer> = {};
  const latinCover = new Map<string, Set<number>>();
  for (const key of ["400-normal", "700-normal", "400-italic", "700-italic"]) {
    fonts[key] = f(`arimo-latin-${key}.woff`);
    fonts[`ext-${key}`] = f(`arimo-latin-ext-${key}.woff`);
    const font = fontkit.create(fonts[key]) as unknown as { characterSet: number[] };
    latinCover.set(key, new Set(font.characterSet));
  }
  const images: Record<string, Buffer> = {};
  for (const n of ["watermark", "logo", "make-in-india", "gem", "digital-india", "msme", "dpiit", "signature", "for-gobt", "director", "stamp"]) {
    images[n] = f(`${n}.png`);
  }
  raw = { fonts, images, latinCover };
  return raw;
}

type Word = { pieces: { t: string; s: Style }[]; width: number };
type Line = { words: Word[]; width: number; hard: boolean };

class Writer {
  page!: PDFPage;
  y = TOP;
  /* lower edge for text; raised when a stamp sits in the corner of every page */
  bottom = BOTTOM;
  pageNo = 0;
  private fonts: Record<string, PDFFont> = {};
  private doc: PDFDocument;
  private r: Raw;
  private img: Record<string, PDFImage>;
  constructor(doc: PDFDocument, r: Raw, img: Record<string, PDFImage>) {
    this.doc = doc;
    this.r = r;
    this.img = img;
  }

  async init() {
    for (const [k, data] of Object.entries(this.r.fonts)) this.fonts[k] = await this.doc.embedFont(data, { subset: true });
  }

  /* ── text measuring with a fallback font for ₹ and other symbols ── */
  private key(s: Style) {
    return `${s.b ? 700 : 400}-${s.i ? "italic" : "normal"}`;
  }
  private segments(t: string, s: Style) {
    const key = this.key(s);
    const cover = this.r.latinCover.get(key)!;
    const out: { t: string; font: PDFFont }[] = [];
    for (const ch of t) {
      const font = cover.has(ch.codePointAt(0)!) ? this.fonts[key] : this.fonts[`ext-${key}`];
      const last = out[out.length - 1];
      if (last && last.font === font) last.t += ch;
      else out.push({ t: ch, font });
    }
    return out;
  }
  width(t: string, s: Style, size: number) {
    const sz = s.sup ? size * 0.62 : size;
    return this.segments(t, s).reduce((w, seg) => w + seg.font.widthOfTextAtSize(seg.t, sz), 0);
  }
  private draw(t: string, s: Style, size: number, x: number, baseline: number) {
    const sz = s.sup ? size * 0.62 : size;
    const yy = H - baseline + (s.sup ? size * 0.36 : 0);
    let cx = x;
    for (const seg of this.segments(t, s)) {
      this.page.drawText(seg.t, { x: cx, y: yy, size: sz, font: seg.font, color: s.c ?? BLACK });
      cx += seg.font.widthOfTextAtSize(seg.t, sz);
    }
    if (s.u) this.page.drawLine({ start: { x, y: yy - 1.4 }, end: { x: cx, y: yy - 1.4 }, thickness: 0.7, color: s.c ?? BLACK });
    return cx - x;
  }

  /* runs → wrapped lines */
  layout(runs: Run[], size: number, maxW: number): Line[] {
    const out: Line[] = [];
    const words: (Word | "br")[] = [];
    let cur: Word | null = null;
    for (const run of runs) {
      for (const tok of run.t.split(/(\n|[ \t]+)/)) {
        if (!tok) continue;
        if (tok === "\n") {
          if (cur) words.push(cur);
          cur = null;
          words.push("br");
        } else if (/^[ \t]+$/.test(tok)) {
          if (cur) words.push(cur);
          cur = null;
        } else {
          cur ??= { pieces: [], width: 0 };
          cur.pieces.push({ t: tok, s: run });
          cur.width += this.width(tok, run, size);
        }
      }
    }
    if (cur) words.push(cur);

    const space = this.width(" ", {}, size);
    let line: Line = { words: [], width: 0, hard: false };
    const push = (hard: boolean) => {
      line.hard = hard;
      out.push(line);
      line = { words: [], width: 0, hard: false };
    };
    for (const w of words) {
      if (w === "br") {
        push(true);
        continue;
      }
      /* a single word wider than the line (a long URL): split it by characters */
      if (w.width > maxW) {
        for (const p of w.pieces) {
          let chunk = "";
          for (const ch of p.t) {
            if (line.width + this.width(chunk + ch, p.s, size) > maxW && (chunk || line.words.length)) {
              if (chunk) line.words.push({ pieces: [{ t: chunk, s: p.s }], width: this.width(chunk, p.s, size) });
              line.width = maxW;
              push(false);
              chunk = "";
            }
            chunk += ch;
          }
          if (chunk) {
            const cw = this.width(chunk, p.s, size);
            line.words.push({ pieces: [{ t: chunk, s: p.s }], width: cw });
            line.width += cw;
          }
        }
        continue;
      }
      const add = (line.words.length ? space : 0) + w.width;
      if (line.words.length && line.width + add > maxW) push(false);
      line.width += (line.words.length ? space : 0) + w.width;
      line.words.push(w);
    }
    if (line.words.length || out.length === 0) push(true);
    return out;
  }

  drawLines(ls: Line[], size: number, x: number, maxW: number, top: number, align: Align) {
    const lh = size * LH;
    const space = this.width(" ", {}, size);
    ls.forEach((l, i) => {
      const baseline = top + size * 0.86 + i * lh;
      let gap = space;
      let cx = x;
      if (align === "right") cx = x + maxW - l.width;
      else if (align === "center") cx = x + (maxW - l.width) / 2;
      else if (align === "justify" && !l.hard && l.words.length > 1) gap = space + (maxW - l.width) / (l.words.length - 1);
      l.words.forEach((w, wi) => {
        if (wi) cx += gap;
        for (const p of w.pieces) cx += this.draw(p.t, p.s, size, cx, baseline);
      });
    });
    return ls.length * lh;
  }

  /* ── pages ── */
  newPage() {
    this.page = this.doc.addPage([W, H]);
    this.pageNo++;
    this.y = TOP;
    this.decorate();
  }
  ensure(h: number) {
    if (this.y + h > this.bottom) this.newPage();
  }
  private image(name: string, x: number, top: number, w: number, h: number, opacity = 1) {
    this.page.drawImage(this.img[name], { x, y: H - top - h, width: w, height: h, opacity });
  }
  private fit(name: string, x: number, top: number, boxW: number, boxH: number) {
    const im = this.img[name];
    const s = Math.min(boxW / im.width, boxH / im.height);
    const w = im.width * s;
    const h = im.height * s;
    this.image(name, x + (boxW - w) / 2, top + (boxH - h) / 2, w, h);
  }
  private decorate() {
    /* watermark behind everything */
    this.image("watermark", 68, 144, 590, 590, 0.42);
    /* header: dark band, yellow slant, gold logo and name */
    this.page.drawRectangle({ x: 0, y: H - 10, width: W, height: 10, color: DARK });
    this.page.drawSvgPath(`M363 10 L${W} 10 L${W} 41 L457 41 Z`, { x: 0, y: H, color: YELLOW });
    this.image("logo", 28.6, 12.5, 53.6, 58);
    this.draw("GOBT", { b: true, c: GREY_TEXT }, 14.5, 98, 38);
    this.draw("Group Of Blooming Technicians", { c: GREY_TEXT }, 12, 98, 55);
    /* footer: rule, logo strip, yellow corner, contact bar */
    this.page.drawRectangle({ x: 0, y: H - 786, width: W, height: 4, color: DARK });
    this.fit("make-in-india", 84, 795, 68, 31);
    this.fit("gem", 174, 795, 72, 31);
    this.fit("digital-india", 270, 795, 88, 31);
    this.fit("msme", 381, 795, 78, 31);
    this.fit("dpiit", 488, 795, 82, 31);
    this.page.drawSvgPath(`M0 814 L94 830.5 L0 830.5 Z`, { x: 0, y: H, color: YELLOW });
    this.page.drawRectangle({ x: 0, y: 0, width: W, height: H - 830.5, color: DARK });
    const white = { b: true, c: rgb(1, 1, 1) };
    this.draw("gobt.in", white, 7.6, 100, 839);
    this.draw(SIGNATORY.email, white, 7.6, W / 2 + 18 - this.width(SIGNATORY.email, white, 7.6) / 2, 839);
    this.draw(SIGNATORY.phone, white, 7.6, 568 - this.width(SIGNATORY.phone, white, 7.6), 839);
  }

  /* ── blocks ── */
  gap(h: number) {
    this.y += h;
  }
  paragraph(runs: Run[], opts: { align?: Align; size?: number; indent?: number; after?: number } = {}) {
    const size = opts.size ?? SIZE;
    const x = LEFT + (opts.indent ?? 0);
    const maxW = RIGHT - x;
    const ls = this.layout(runs, size, maxW);
    const lh = size * LH;
    /* split across pages line by line */
    let i = 0;
    while (i < ls.length) {
      const room = Math.max(1, Math.floor((this.bottom - this.y) / lh));
      if (room < 1 || this.y + lh > this.bottom) {
        this.newPage();
        continue;
      }
      const chunk = ls.slice(i, i + room);
      this.y += this.drawLines(chunk, size, x, maxW, this.y, opts.align ?? "left");
      i += chunk.length;
      if (i < ls.length) this.newPage();
    }
    this.y += opts.after ?? 7;
  }
  heading(text: string, opts: { caps?: boolean; before?: number } = {}) {
    this.y += opts.before ?? 8;
    this.ensure(SIZE * LH + 48);
    this.paragraph([{ t: opts.caps === false ? text : text.toUpperCase(), b: true }], { after: 8 });
  }
  list(items: Run[][], kind: "bullet" | "number") {
    items.forEach((runs, n) => this.listItem(runs, kind === "bullet" ? "•" : `${n + 1}.`));
    this.y += 4;
  }
  /* one list entry; level 1+ is a nested list. An empty mark continues the entry. */
  listItem(runs: Run[], mark: string, level = 0) {
    const indent = 40 + level * 18;
    const ls = this.layout(runs, SIZE, RIGHT - (LEFT + indent));
    this.ensure(Math.min(ls.length, 2) * SIZE * LH);
    if (mark) this.draw(mark, {}, SIZE, LEFT + 22 + level * 18, this.y + SIZE * 0.86);
    this.paragraph(runs, { indent, align: "justify", after: 3 });
  }

  /* bordered table; rows move to the next page whole, with the header repeated */
  table(cols: number[], rows: { cells: (Run[] | string)[]; bold?: boolean; align?: Align[] }[], header = 1) {
    const padX = 4.5;
    const padY = 3;
    const total = cols.reduce((a, b) => a + b, 0);
    const widths = cols.map((c) => (c / total) * WIDTH);
    const measure = (row: (typeof rows)[number]) =>
      row.cells.map((cell, ci) => {
        const runs = typeof cell === "string" ? [{ t: cell, b: row.bold }] : cell;
        return this.layout(runs, SIZE, widths[ci] - padX * 2);
      });
    const drawRow = (row: (typeof rows)[number]) => {
      const laid = measure(row);
      const h = Math.max(...laid.map((l) => l.length)) * SIZE * LH + padY * 2;
      let x = LEFT;
      laid.forEach((ls, ci) => {
        this.page.drawRectangle({ x, y: H - this.y - h, width: widths[ci], height: h, borderColor: BLACK, borderWidth: 0.6 });
        this.drawLines(ls, SIZE, x + padX, widths[ci] - padX * 2, this.y + padY, row.align?.[ci] ?? "left");
        x += widths[ci];
      });
      this.y += h;
      return h;
    };
    const heights = rows.map((r) => Math.max(...measure(r).map((l) => l.length)) * SIZE * LH + padY * 2);
    /* keep the header with at least the first row */
    this.ensure(heights.slice(0, header + 1).reduce((a, b) => a + b, 0));
    rows.forEach((row, ri) => {
      if (ri >= header && this.y + heights[ri] > this.bottom) {
        this.newPage();
        for (let hi = 0; hi < header; hi++) drawRow(rows[hi]);
      }
      drawRow(row);
    });
    this.y += 10;
  }

  /* an image fitted inside a box, centred */
  fitImage(im: PDFImage, x: number, top: number, boxW: number, boxH: number, opacity = 1) {
    const sc = Math.min(boxW / im.width, boxH / im.height);
    const w = im.width * sc;
    const h = im.height * sc;
    this.page.drawImage(im, { x: x + (boxW - w) / 2, y: H - top - (boxH + h) / 2, width: w, height: h, opacity });
  }
  markImage(id: string) {
    return this.img[`mark:${id}`] ?? null;
  }

  /* a signature or stamp placed in the document text */
  docMark(id: string, align: string, size: string) {
    const im = this.markImage(id);
    if (!im) return;
    const w = size === "s" ? 90 : size === "l" ? 190 : 135;
    const h = Math.min(150, (im.height / im.width) * w);
    const ww = (im.width / im.height) * h;
    this.ensure(h + 6);
    const x = align === "center" ? LEFT + (WIDTH - ww) / 2 : align === "right" ? RIGHT - ww : LEFT;
    this.page.drawImage(im, { x, y: H - this.y - h, width: ww, height: h });
    this.y += h + 8;
  }

  signatory(sign: QuoteSign) {
    const sig = sign.signature ? this.markImage(sign.signature) : null;
    const stamp = sign.stamp ? this.markImage(sign.stamp) : null;
    this.ensure(sig || (stamp && sign.place !== "corner" && sign.place !== "every") ? 168 : 110);
    this.y += 6;
    const top = this.y;
    this.draw("Authorized Signatory", { b: true }, SIZE, LEFT, top + 10);
    this.image("for-gobt", LEFT + 4, top + 18, 170, 30);
    if (sig) {
      /* the original has white space around it; uploads are fitted to the line */
      if (sign.signature === "default-signature") this.page.drawImage(sig, { x: LEFT - 16, y: H - top - 18 - 95, width: 153, height: 95 });
      else this.fitImage(sig, LEFT, top + 44, 150, 50);
      this.image("director", LEFT + 128, top + 68, 62, 12);
    }
    if (stamp && (sign.place === "beside" || sign.place === "over")) {
      const builtIn = sign.stamp === "default-stamp";
      if (sign.place === "beside") this.fitImage(stamp, 300, top - 14, 125, builtIn ? 79 : 95);
      else this.fitImage(stamp, LEFT + 40, top + 14, 120, 90, 0.92);
    }
    this.y = top + (sig ? 100 : 56);
    const rows: [string, Style][] = [
      [SIGNATORY.name, { b: true }],
      [SIGNATORY.title, { b: true }],
      [SIGNATORY.phone, { b: true, c: MUTED }],
      [SIGNATORY.email, { b: true, c: MUTED }],
    ];
    for (const [t, s] of rows) {
      this.draw(t, s, SIZE, LEFT, this.y + SIZE * 0.86);
      this.y += SIZE * 1.3;
    }
    /* stamp at the bottom-right corner of the last page, or of every page */
    if (stamp && (sign.place === "corner" || sign.place === "every")) {
      const pages = sign.place === "every" ? this.doc.getPages() : [this.page];
      const keep = this.page;
      for (const p of pages) {
        this.page = p;
        this.fitImage(stamp, 448, 670, 105, 92);
      }
      this.page = keep;
    }
  }

  draftMark() {
    for (const p of this.doc.getPages()) {
      p.drawText("PREVIEW", { x: 150, y: 300, size: 90, font: this.fonts["700-normal"], color: rgb(0.8, 0.15, 0.15), opacity: 0.08, rotate: degrees(35) });
    }
  }

  pageNumbers() {
    const pages = this.doc.getPages();
    pages.forEach((p, i) => {
      const t = `Page ${i + 1} of ${pages.length}`;
      this.page = p;
      this.draw(t, { c: MUTED }, 7.5, RIGHT - this.width(t, {}, 7.5), 776);
    });
  }
}

const listRuns = (text: string) => lines(text).map((l) => rich(l));

/* "Validity: This quotation…" → bold heading, normal text */
const termRuns = (line: string): Run[] => {
  const m = line.match(/^([^:]{2,60}):\s+(.+)$/);
  return m ? [{ t: `${m[1]}: `, b: true }, ...rich(m[2])] : rich(line);
};

/* "Quotation No.: …   Date: 28th August, 2026" and the underlined title */
function drawTop(w: Writer, quoteNo: string, date: string) {
  const d = quoteDateParts(date);
  w.paragraph([{ t: "Quotation No.: ", b: true }, { t: quoteNo }], { after: 0 });
  w.y -= SIZE * LH;
  w.paragraph([{ t: "Date: ", b: true }, { t: d.day }, { t: d.suffix, sup: true }, { t: d.rest }], { align: "right", after: 12 });
  w.paragraph([{ t: "Quotation", b: true, u: true }], { align: "center", size: 12, after: 12 });
}

/* cost breakdown, discount, GST, amount in words and the payment plan —
   always calculated, never typed */
function drawPricing(w: Writer, q: QuoteData, t: ReturnType<typeof computeQuote>) {
  const priced = q.items.filter((i) => i.module.trim() && i.amount > 0);
  w.heading("Detailed Cost Breakdown");
  w.table(
    [42, 392, 90],
    [
      { cells: ["S. No.", "Development Component", "Amount"], bold: true },
      ...priced.map((it, i) => ({ cells: [[{ t: String(i + 1), b: true }], rich(it.module.trim()), [{ t: inr(Math.round(it.amount * 100)) }]] })),
      { cells: [[{ t: "Total", b: true }], [{ t: inWords(t.subtotal), b: true, c: RED }], [{ t: inr(t.subtotal), b: true }]] },
    ]
  );

  if (t.discount > 0) {
    w.heading("Special Goodwill Discount");
    w.paragraph([{ t: "GOBT is pleased to offer a " }, { t: `special goodwill discount of ${t.discountLabel}`, b: true }, { t: " on the standard project value." }], { align: "justify", after: 8 });
    w.table(
      [360, 164],
      [
        { cells: ["Particular", "Amount"], bold: true },
        { cells: [[{ t: "Standard Project Value", b: true }], [{ t: inr(t.subtotal) }]] },
        { cells: [[{ t: "Special Goodwill Discount", b: true }], [{ t: `− ${inr(t.discount)}`, b: true }]] },
        { cells: [[{ t: "Discounted Project Value", b: true }], [{ t: inr(t.taxable), b: true }]] },
      ]
    );
  }

  const valueName = t.discount > 0 ? "Discounted Project Value" : "Project Value";
  const rate = Number(q.gstRate) || 0;
  if (rate > 0) {
    w.heading("GST & Final Commercial Value");
    w.paragraph([{ t: "GST will be calculated at " }, { t: `${rate}%`, b: true }, { t: ` on the ${valueName.toLowerCase()} of ${inr(t.taxable)}/-.` }], { after: 8 });
    w.table(
      [390, 134],
      [
        { cells: ["Particular", "Amount"], bold: true },
        { cells: [[{ t: valueName, b: true }], [{ t: inr(t.taxable) }]] },
        { cells: [[{ t: `GST @ ${rate}%`, b: true }], [{ t: inr(t.gst) }]] },
        { cells: [[{ t: "GRAND TOTAL INCLUDING GST", b: true }], [{ t: inr(t.grand), b: true }]] },
      ]
    );
  } else {
    w.heading("Final Commercial Value");
    w.table(
      [390, 134],
      [
        { cells: ["Particular", "Amount"], bold: true },
        { cells: [[{ t: "GRAND TOTAL", b: true }], [{ t: inr(t.grand), b: true }]] },
      ]
    );
  }
  w.paragraph([{ t: "Amount in Words: ", b: true }, { t: `${inWords(t.grand)}.`, b: true, c: RED }], { after: 6 });

  const gstWord = rate > 0 ? " including GST" : "";
  const both = q.payment === "both";
  if (both) {
    w.heading("Payment Options");
    w.paragraph([{ t: "The total payable amount of " }, { t: `${inr(t.grand)}/-${gstWord}`, b: true }, { t: " can be paid in either of the following two ways." }], { align: "justify", after: 4 });
  }
  if (q.payment !== "emi") {
    w.heading(both ? "Option 1: Milestone Payments" : "Payment Breakdown", { caps: !both, before: both ? 4 : 8 });
    if (!both) {
      w.paragraph([{ t: "The total payable amount of " }, { t: `${inr(t.grand)}/-${gstWord}`, b: true }, { t: " shall be paid according to the following project milestones:" }], { align: "justify", after: 8 });
    }
    const showGst = rate > 0;
    w.table(
      showGst ? [190, 62, 86, 86, 100] : [290, 90, 144],
      [
        { cells: showGst ? ["Milestone", "Payment %", "Base Amount", `GST @ ${rate}%`, "Total Payable"] : ["Milestone", "Payment %", "Amount"], bold: true },
        ...t.milestones.map((m) => ({
          cells: showGst
            ? [[{ t: m.name, b: true }], [{ t: `${m.percent}%` }], [{ t: inr(m.base) }], [{ t: inr(m.gst) }], [{ t: inr(m.total), b: true }]]
            : [[{ t: m.name, b: true }], [{ t: `${m.percent}%` }], [{ t: inr(m.total), b: true }]],
        })),
        { cells: showGst ? ["TOTAL", "100%", inr(t.taxable), inr(t.gst), inr(t.grand)] : ["TOTAL", "100%", inr(t.grand)], bold: true },
      ]
    );
  }
  if (q.payment !== "terms") {
    const months = t.emi.rows.length - (t.emi.down > 0 ? 1 : 0);
    w.heading(both ? "Option 2: Easy Monthly Instalments (EMI)" : "EMI Payment Plan", { caps: !both, before: both ? 4 : 8 });
    const intro: Run[] = [];
    if (!both) intro.push({ t: "The total payable amount of " }, { t: `${inr(t.grand)}/-${gstWord}`, b: true }, { t: " shall be paid in easy monthly instalments: " });
    else intro.push({ t: "Pay in easy monthly instalments: " });
    if (t.emi.down > 0) intro.push({ t: "a down payment of " }, { t: inr(t.emi.down), b: true }, { t: " at project initiation, followed by " });
    intro.push({ t: `${months} monthly instalment${months === 1 ? "" : "s"}`, b: true }, { t: ` of ${inr(t.emi.monthly)}.` });
    if (t.emi.charge > 0) intro.push({ t: ` This includes an EMI convenience charge of ${Number(q.emi.chargePercent.toFixed(2))}% (${inr(t.emi.charge)}).` });
    w.paragraph(intro, { align: "justify", after: 8 });
    w.table(
      [150, 224, 150],
      [
        { cells: ["Instalment", "Due", "Amount"], bold: true },
        ...t.emi.rows.map((row) => ({ cells: [[{ t: row.label, b: true }], [{ t: row.due }], [{ t: inr(row.amount) }]] })),
        { cells: ["TOTAL", "", inr(t.emi.payable)], bold: true },
      ]
    );
  }
}

/* the step-by-step form's quotation */
function drawForm(w: Writer, q: QuoteData, t: ReturnType<typeof computeQuote>) {
  w.paragraph([{ t: "To,", b: true }], { after: 1 });
  lines(q.to).forEach((l, i, all) => w.paragraph(rich(l), { after: i === all.length - 1 ? 9 : 0 }));
  w.paragraph([{ t: "Subject", b: true }, { t: ": " }, ...rich(q.subject.trim())], { after: 9 });
  w.paragraph(rich(q.salutation.trim()), { after: 9 });
  q.intro
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .forEach((p) => w.paragraph(rich(p.replace(/\s*\n\s*/g, " ")), { align: "justify", after: 8 }));

  for (const s of q.sections) {
    if (!s.heading.trim() && !s.body.trim()) continue;
    if (s.heading.trim()) w.heading(s.heading.trim());
    const bullets: Run[][] = [];
    const flush = () => {
      if (bullets.length) w.list(bullets.splice(0), "bullet");
    };
    for (const l of lines(s.body)) {
      if (/^[-•*]\s+/.test(l)) bullets.push(termRuns(l.replace(/^[-•*]\s+/, "")));
      else {
        flush();
        w.paragraph(rich(l), { align: "justify", after: 6 });
      }
    }
    flush();
  }

  const items = q.items.filter((i) => i.module.trim());
  w.heading("Scope of Work (SOW)");
  w.table(
    [42, 150, 332],
    [
      { cells: ["S. No.", "Module", "Key Deliverables"], bold: true },
      ...items.map((it, i) => ({ cells: [[{ t: String(i + 1) }], [{ t: it.module.trim(), b: true }], rich(it.details.trim())], align: ["left", "left", "justify"] as Align[] })),
    ]
  );
  drawPricing(w, q, t);

  if (lines(q.paymentTerms).length) {
    w.heading("Payment Terms", { caps: false, before: 2 });
    w.list(listRuns(q.paymentTerms), "bullet");
  }
  if (lines(q.inclusions).length) {
    w.heading("Inclusions (Complimentary)");
    w.table(
      [42, 352, 130],
      [{ cells: ["S. No.", "Service", "Status"], bold: true }, ...lines(q.inclusions).map((l, i) => ({ cells: [[{ t: String(i + 1) }], rich(l), [{ t: "Included Free", b: true }]] }))]
    );
  }
  if (lines(q.exclusions).length) {
    w.heading("Exclusions & Third-Party Charges");
    w.paragraph([{ t: "The following charges are " }, { t: "not included", b: true }, { t: " in the quoted project price and shall be borne separately by the client:" }], { align: "justify", after: 8 });
    w.table(
      [56, 368, 100],
      [{ cells: ["S. No.", "Services", "Charges Excluded"], bold: true }, ...lines(q.exclusions).map((l, i) => ({ cells: [[{ t: String(i + 1), b: true }], rich(l), [{ t: "Excluded", b: true }]] }))]
    );
  }
  if (lines(q.assumptions).length) {
    w.heading("Project Assumptions");
    w.list(listRuns(q.assumptions), "number");
  }
  if (lines(q.terms).length) {
    w.heading("General Terms and Conditions");
    w.list(lines(q.terms).map(termRuns), "bullet");
  }
  if (q.closing.trim()) w.paragraph(rich(q.closing.trim()), { align: "justify", after: 10 });
}

/* ── the Word-like document ── */

const BLUE_LINK = rgb(0.07, 0.3, 0.75);

/* inline editor nodes → runs; marks: bold, italic, underline, red */
function inlineRuns(nodes: DocNode[] | undefined, base: Style = {}): Run[] {
  const out: Run[] = [];
  for (const n of nodes ?? []) {
    if (n.type === "hardBreak") out.push({ ...base, t: "\n" });
    else if (n.type === "text" && n.text) {
      const s: Style = { ...base };
      for (const m of n.marks ?? []) {
        if (m.type === "bold") s.b = true;
        else if (m.type === "italic") s.i = true;
        else if (m.type === "underline") s.u = true;
        else if (m.type === "red") s.c = RED;
        else if (m.type === "link") s.c = s.c ?? BLUE_LINK;
      }
      out.push({ ...s, t: n.text });
    }
  }
  return out;
}

/* everything inside a table cell as one block of runs (paragraphs and list entries on new lines) */
function cellRuns(cell: DocNode, bold: boolean): Run[] {
  const out: Run[] = [];
  const base: Style = bold ? { b: true } : {};
  const walk = (n: DocNode, prefix = "") => {
    if (n.type === "paragraph" || n.type === "heading") {
      if (out.length) out.push({ t: "\n" });
      if (prefix) out.push({ ...base, t: prefix });
      out.push(...inlineRuns(n.content, n.type === "heading" ? { b: true } : base));
    } else if (n.type === "bulletList" || n.type === "orderedList") {
      const start = Number(n.attrs?.start ?? 1);
      (n.content ?? []).forEach((li, i) => (li.content ?? []).forEach((c, ci) => walk(c, ci === 0 ? (n.type === "bulletList" ? "• " : `${start + i}. `) : "")));
    } else (n.content ?? []).forEach((c) => walk(c));
  };
  (cell.content ?? []).forEach((c) => walk(c));
  return out;
}

/* column widths from how much text each column holds */
function columnWeights(rows: DocNode[]): number[] {
  const n = Math.max(...rows.map((r) => (r.content ?? []).reduce((s, c) => s + Number(c.attrs?.colspan ?? 1), 0)), 1);
  const longest = new Array(n).fill(3);
  for (const r of rows) {
    let col = 0;
    for (const c of r.content ?? []) {
      const span = Number(c.attrs?.colspan ?? 1);
      if (span === 1) {
        const len = Math.max(...nodeText(c).split("\n").map((l) => l.length), 0);
        longest[col] = Math.max(longest[col], len);
      }
      col += span;
    }
  }
  return longest.map((l) => Math.min(Math.max(l, 5), 80) + 3);
}

function drawDocTable(w: Writer, node: DocNode) {
  const rows = node.content ?? [];
  if (!rows.length) return;
  const weights = columnWeights(rows);
  const n = weights.length;
  /* merged cells are drawn as one cell per column (text in the first) */
  const tableRows = rows.map((r) => {
    const cells: Run[][] = [];
    let allHeader = true;
    for (const c of r.content ?? []) {
      const header = c.type === "tableHeader";
      allHeader &&= header;
      cells.push(cellRuns(c, header));
      for (let k = 1; k < Number(c.attrs?.colspan ?? 1); k++) cells.push([]);
    }
    while (cells.length < n) cells.push([]);
    return { cells: cells.map((c) => (c.length ? c : [{ t: "" }])), header: allHeader, align: new Array(n).fill("justify") as Align[] };
  });
  let header = 0;
  while (header < tableRows.length - 1 && tableRows[header].header) header++;
  w.table(weights, tableRows, header);
}

function drawDocList(w: Writer, node: DocNode, level: number) {
  const ordered = node.type === "orderedList";
  const start = Number(node.attrs?.start ?? 1);
  (node.content ?? []).forEach((li, i) => {
    let first = true;
    for (const c of li.content ?? []) {
      if (c.type === "bulletList" || c.type === "orderedList") drawDocList(w, c, level + 1);
      else {
        const mark = first ? (ordered ? `${start + i}.` : level % 2 ? "–" : "•") : "";
        w.listItem(inlineRuns(c.content, c.type === "heading" ? { b: true } : {}), mark, level);
        first = false;
      }
    }
  });
  if (level === 0) w.gap(4);
}

function drawDoc(w: Writer, q: QuoteData, t: ReturnType<typeof computeQuote>, doc: DocNode) {
  for (const n of doc.content ?? []) {
    switch (n.type) {
      case "paragraph": {
        const runs = inlineRuns(n.content);
        if (!runs.some((r) => r.t.trim())) w.gap(SIZE * LH * 0.7);
        else w.paragraph(runs, { align: "justify", after: 8 });
        break;
      }
      case "heading":
        w.heading(nodeText(n).trim() || " ");
        break;
      case "bulletList":
      case "orderedList":
        drawDocList(w, n, 0);
        break;
      case "table":
        drawDocTable(w, n);
        break;
      case PRICING_NODE:
        drawPricing(w, q, t);
        break;
      case MARK_NODE:
        w.docMark(String(n.attrs?.mark ?? ""), String(n.attrs?.align ?? "left"), String(n.attrs?.size ?? "m"));
        break;
      case PAGE_BREAK_NODE:
        if (w.y > TOP + 1) w.newPage();
        break;
      default:
        if (nodeText(n).trim()) w.paragraph([{ t: nodeText(n) }], { align: "justify" });
    }
  }
}

export type MarkImages = Record<string, { data: Buffer; type: "image/png" | "image/jpeg" }>;

export async function renderQuotePdf(input: { quoteNo: string; data: QuoteData; draft?: boolean; marks?: MarkImages }) {
  const q = input.data;
  const t = computeQuote(q);
  const r = loadRaw();
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(`Quotation ${input.quoteNo}`);
  doc.setAuthor("Group of Blooming Technicians (GOBT)");
  doc.setSubject(quoteSubject(q));
  doc.setCreator("GOBT");
  const img: Record<string, PDFImage> = {};
  for (const [k, data] of Object.entries(r.images)) img[k] = await doc.embedPng(data);
  for (const [id, m] of Object.entries(input.marks ?? {})) {
    try {
      img[`mark:${id}`] = m.type === "image/jpeg" ? await doc.embedJpg(m.data) : await doc.embedPng(m.data);
    } catch {
      /* a broken upload is skipped rather than failing the whole PDF */
    }
  }

  const w = new Writer(doc, r, img);
  await w.init();
  /* a stamp in the corner of every page: keep the text above it */
  if (q.sign.stamp && q.sign.place === "every") w.bottom = 660;
  w.newPage();
  drawTop(w, input.quoteNo, q.date);
  if (q.mode === "doc" && q.doc) drawDoc(w, q, t, q.doc);
  else drawForm(w, q, t);
  w.signatory(q.sign);
  w.pageNumbers();
  if (input.draft) w.draftMark();
  return Buffer.from(await doc.save());
}

/* The quotation as a document (the Word-like editor). The body is stored as
   editor JSON; money is never typed into it — a "price & payment" block in
   the document is drawn from the price panel, so totals are always right. */

import type { QuoteData } from "./model";

const lines = (t: string) =>
  t
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

export type Mark = { type: string; attrs?: Record<string, unknown> };
export type DocNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: DocNode[];
  text?: string;
  marks?: Mark[];
};

export const PRICING_NODE = "quotePricing";
export const PAGE_BREAK_NODE = "pageBreak";

/* ── building blocks ── */

const text = (t: string, marks?: Mark[]): DocNode => (marks?.length ? { type: "text", text: t, marks } : { type: "text", text: t });

/* "a **b** c" → text nodes, bold where starred */
function inline(s: string, extra: Mark[] = []): DocNode[] {
  return s
    .split(/(\*\*[^*]+\*\*)/)
    .filter(Boolean)
    .map((part) =>
      part.startsWith("**") && part.endsWith("**") && part.length > 4 ? text(part.slice(2, -2), [{ type: "bold" }, ...extra]) : text(part, extra)
    );
}
const para = (content: DocNode[]): DocNode => (content.length ? { type: "paragraph", content } : { type: "paragraph" });
const p = (s: string) => para(inline(s));
const heading = (s: string): DocNode => ({ type: "heading", attrs: { level: 2 }, content: [text(s)] });
const list = (type: "bulletList" | "orderedList", items: DocNode[][]): DocNode => ({
  type,
  content: items.map((c) => ({ type: "listItem", content: [para(c)] })),
});
const cell = (content: DocNode[], header = false): DocNode => ({ type: header ? "tableHeader" : "tableCell", attrs: { colspan: 1, rowspan: 1, colwidth: null }, content: [para(content)] });
const table = (head: string[], rows: DocNode[][][]): DocNode => ({
  type: "table",
  content: [{ type: "tableRow", content: head.map((h) => cell([text(h)], true)) }, ...rows.map((r) => ({ type: "tableRow", content: r.map((c) => cell(c)) }))],
});

/* "Validity: This quotation…" → bold label + text */
const termInline = (line: string) => {
  const m = line.match(/^([^:]{2,60}):\s+(.+)$/);
  return m ? [text(`${m[1]}: `, [{ type: "bold" }]), ...inline(m[2])] : inline(line);
};

/* a form-made quotation (or the blank template) turned into a document */
export function docFromQuote(q: QuoteData): DocNode {
  const c: DocNode[] = [];
  const to = lines(q.to);
  const toContent: DocNode[] = [text("To,", [{ type: "bold" }])];
  for (const l of to.length ? to : ["Client name,", "Address / phone / email"]) toContent.push({ type: "hardBreak" }, ...inline(l));
  c.push(para(toContent));
  c.push(para([text("Subject", [{ type: "bold" }]), text(": "), ...inline(q.subject.trim() || "Quotation for …")]));
  c.push(p(q.salutation.trim() || "Dear Sir/Madam,"));
  for (const block of q.intro.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean)) c.push(p(block.replace(/\s*\n\s*/g, " ")));

  for (const s of q.sections) {
    if (s.heading.trim()) c.push(heading(s.heading.trim()));
    let bullets: DocNode[][] = [];
    for (const l of lines(s.body)) {
      if (/^[-•*]\s+/.test(l)) bullets.push(termInline(l.replace(/^[-•*]\s+/, "")));
      else {
        if (bullets.length) c.push(list("bulletList", bullets));
        bullets = [];
        c.push(p(l));
      }
    }
    if (bullets.length) c.push(list("bulletList", bullets));
  }

  const items = q.items.filter((i) => i.module.trim());
  c.push(heading("Scope of Work (SOW)"));
  c.push(
    table(
      ["S. No.", "Module", "Key Deliverables"],
      (items.length ? items : [{ module: "Module name", details: "Key deliverables", amount: 0 }]).map((it, i) => [[text(String(i + 1))], [text(it.module.trim(), [{ type: "bold" }])], inline(it.details.trim())])
    )
  );
  c.push({ type: PRICING_NODE });

  if (lines(q.paymentTerms).length) {
    c.push(para([text("Payment Terms", [{ type: "bold" }])]));
    c.push(list("bulletList", lines(q.paymentTerms).map((l) => inline(l))));
  }
  if (lines(q.inclusions).length) {
    c.push(heading("Inclusions (Complimentary)"));
    c.push(table(["S. No.", "Service", "Status"], lines(q.inclusions).map((l, i) => [[text(String(i + 1))], inline(l), [text("Included Free", [{ type: "bold" }])]])));
  }
  if (lines(q.exclusions).length) {
    c.push(heading("Exclusions & Third-Party Charges"));
    c.push(para([text("The following charges are "), text("not included", [{ type: "bold" }]), text(" in the quoted project price and shall be borne separately by the client:")]));
    c.push(table(["S. No.", "Services", "Charges Excluded"], lines(q.exclusions).map((l, i) => [[text(String(i + 1))], inline(l), [text("Excluded", [{ type: "bold" }])]])));
  }
  if (lines(q.assumptions).length) {
    c.push(heading("Project Assumptions"));
    c.push(list("orderedList", lines(q.assumptions).map((l) => inline(l))));
  }
  if (lines(q.terms).length) {
    c.push(heading("General Terms and Conditions"));
    c.push(list("bulletList", lines(q.terms).map(termInline)));
  }
  if (q.closing.trim()) c.push(p(q.closing.trim()));
  return { type: "doc", content: c };
}

/* ── reading things back out of a document ── */

/* plain text of a node; hard breaks become new lines */
export function nodeText(n: DocNode | undefined): string {
  if (!n) return "";
  if (n.type === "text") return n.text ?? "";
  if (n.type === "hardBreak") return "\n";
  const inner = (n.content ?? []).map(nodeText);
  return ["paragraph", "heading", "listItem", "tableCell", "tableHeader"].includes(n.type) ? inner.join("") : inner.join("\n");
}

/* each line of a paragraph with the bold text found on it */
function paragraphLines(n: DocNode) {
  const out: { text: string; bold: string }[] = [{ text: "", bold: "" }];
  for (const c of n.content ?? []) {
    if (c.type === "hardBreak") out.push({ text: "", bold: "" });
    else if (c.type === "text") {
      const last = out[out.length - 1];
      last.text += c.text ?? "";
      if (c.marks?.some((m) => m.type === "bold")) last.bold += c.text ?? "";
    }
  }
  return out.map((l) => ({ text: l.text.trim(), bold: l.bold.trim() })).filter((l) => l.text);
}

const GENERIC = /^(to,?|the\s+)?(concerned\s+authority|sir|madam|team)\b/i;
const tidy = (s: string) => s.replace(/,\s*$/, "").replace(/\s+/g, " ").trim().slice(0, 160);

/* who it's for and the subject, read from the "To," block and the "Subject:" line */
export function docMeta(doc: DocNode | undefined): { client: string; subject: string } {
  const top = doc?.content ?? [];
  let client = "";
  let subject = "";
  for (let i = 0; i < Math.min(top.length, 30); i++) {
    const n = top[i];
    if (n.type !== "paragraph") continue;
    const t = nodeText(n).trim();
    if (!subject && /^subject\s*[:\-–]/i.test(t)) subject = tidy(t.replace(/^subject\s*[:\-–]\s*/i, ""));
    if (!client && /^to\s*,?/i.test(t)) {
      /* the address may be in the same paragraph (line breaks) or the next few */
      let ls = paragraphLines(n).slice(1);
      if (ls.length === 0) {
        for (let j = i + 1; j < Math.min(top.length, i + 5) && top[j].type === "paragraph"; j++) {
          const tt = nodeText(top[j]).trim();
          if (/^(subject|dear)\b/i.test(tt)) break;
          ls = ls.concat(paragraphLines(top[j]));
        }
      }
      const bold = ls.map((l) => l.bold).find((b) => b && !GENERIC.test(b));
      const plain = ls.map((l) => l.text).find((l) => !GENERIC.test(l));
      client = tidy(bold || plain || ls[0]?.text || "");
    }
  }
  return { client, subject };
}

/* the module names in the scope-of-work table (for filling the price list) */
export function scopeModules(doc: DocNode | undefined): string[] {
  const tables = (doc?.content ?? []).filter((n) => n.type === "table");
  for (const t of tables) {
    const rows = t.content ?? [];
    if (rows.length < 2) continue;
    const head = (rows[0].content ?? []).map((c) => nodeText(c).toLowerCase());
    let col = head.findIndex((h) => /module|component|item|service|work/.test(h));
    if (col < 0) col = head.length > 1 ? 1 : 0;
    if (head.some((h) => /deliverable|module|scope/.test(h))) {
      return rows
        .slice(1)
        .map((r) => nodeText(r.content?.[col]).replace(/\s+/g, " ").trim())
        .filter(Boolean);
    }
  }
  return [];
}

export const hasPricing = (doc: DocNode | undefined) => (doc?.content ?? []).some((n) => n.type === PRICING_NODE);

/* an empty document never saves */
export const docIsEmpty = (doc: DocNode | undefined) => nodeText(doc).replace(/\s+/g, "").length < 10;

/* defensive copy: only plain JSON shapes, bounded size */
export function cleanDoc(raw: unknown): DocNode | undefined {
  if (!raw || typeof raw !== "object" || (raw as DocNode).type !== "doc") return undefined;
  const json = JSON.stringify(raw);
  if (json.length > 400_000) return undefined;
  return JSON.parse(json) as DocNode;
}

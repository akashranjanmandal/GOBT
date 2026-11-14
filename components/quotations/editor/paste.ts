/* Turns whatever is pasted (Word, Google Docs, websites, ChatGPT, WhatsApp,
   email, Excel) into clean HTML the editor understands. The editor's schema
   then drops every other style, so pasted text always looks like GOBT's
   template: our font, our headings, our tables. */

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* **bold** and *italic* in plain text */
const inlineMd = (s: string) =>
  esc(s)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/(^|[\s(])\*([^*\s][^*]*)\*(?=[\s).,:;!?]|$)/g, "$1<em>$2</em>");

const BULLET = /^\s*(?:[-–•●▪◦*·]|o)\s+/;
const NUMBER = /^\s*(?:\d{1,3}|[a-zA-Z])[.)]\s+/;
const isCapsHeading = (l: string) => {
  const t = l.trim().replace(/[:：]$/, "");
  return t.length >= 4 && t.length <= 70 && /[A-Z]/.test(t) && t === t.toUpperCase() && /^[A-Z0-9&/(),.\-–' ]+$/.test(t) && t.split(/\s+/).length <= 9;
};
const mdTableRow = (l: string) => /^\s*\|.*\|\s*$/.test(l);
const mdTableRule = (l: string) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(l);

/* plain text → HTML with lists, headings and tables recognised */
export function textToHTML(text: string): string {
  const src = text.replace(/\r\n?/g, "\n").replace(/ /g, " ").split("\n");
  const out: string[] = [];
  let list: { tag: "ul" | "ol"; items: string[] } | null = null;
  let para: string[] = [];
  const flushPara = () => {
    if (para.length) out.push(`<p>${para.map(inlineMd).join("<br>")}</p>`);
    para = [];
  };
  const flushList = () => {
    if (list) out.push(`<${list.tag}>${list.items.map((i) => `<li><p>${inlineMd(i)}</p></li>`).join("")}</${list.tag}>`);
    list = null;
  };
  const flush = () => {
    flushPara();
    flushList();
  };

  for (let i = 0; i < src.length; i++) {
    const line = src[i];
    const t = line.trim();
    if (!t) {
      flush();
      continue;
    }
    /* | a | b | tables (ChatGPT, Markdown) */
    if (mdTableRow(t) && i + 1 < src.length && mdTableRule(src[i + 1])) {
      flush();
      const cells = (l: string) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      const head = cells(t);
      const rows: string[][] = [];
      i += 2;
      while (i < src.length && mdTableRow(src[i])) rows.push(cells(src[i++]));
      i--;
      out.push(`<table><tr>${head.map((h) => `<th><p>${inlineMd(h)}</p></th>`).join("")}</tr>${rows.map((r) => `<tr>${head.map((_, k) => `<td><p>${inlineMd(r[k] ?? "")}</p></td>`).join("")}</tr>`).join("")}</table>`);
      continue;
    }
    /* tab-separated rows (copied from Excel or a table) */
    if (line.includes("\t") && i + 1 < src.length && src[i + 1].includes("\t")) {
      flush();
      const rows: string[][] = [];
      while (i < src.length && src[i].includes("\t")) rows.push(src[i++].split("\t").map((c) => c.trim()));
      i--;
      const n = Math.max(...rows.map((r) => r.length));
      out.push(`<table>${rows.map((r, ri) => `<tr>${Array.from({ length: n }, (_, k) => (ri === 0 ? `<th><p>${inlineMd(r[k] ?? "")}</p></th>` : `<td><p>${inlineMd(r[k] ?? "")}</p></td>`)).join("")}</tr>`).join("")}</table>`);
      continue;
    }
    const md = t.match(/^#{1,6}\s+(.+)$/);
    if (md || isCapsHeading(t)) {
      flush();
      out.push(`<h2>${inlineMd((md ? md[1] : t).replace(/\*\*/g, "").replace(/[:：]$/, ""))}</h2>`);
      continue;
    }
    if (BULLET.test(line) && !/^\s*\*\*/.test(line)) {
      flushPara();
      if (list?.tag !== "ul") flushList();
      list ??= { tag: "ul", items: [] };
      list.items.push(t.replace(BULLET, ""));
      continue;
    }
    if (NUMBER.test(line)) {
      flushPara();
      if (list?.tag !== "ol") flushList();
      list ??= { tag: "ol", items: [] };
      list.items.push(t.replace(NUMBER, ""));
      continue;
    }
    /* a line that continues a list entry (wrapped text) */
    if (list && /^\s{2,}/.test(line)) {
      list.items[list.items.length - 1] += ` ${t}`;
      continue;
    }
    flushList();
    para.push(t);
  }
  flush();
  return out.join("");
}

/* does the plain text have any structure worth converting? */
export const textHasStructure = (text: string) =>
  /\n/.test(text.trim()) || BULLET.test(text) || NUMBER.test(text) || /\*\*[^*]+\*\*/.test(text) || /^#{1,6}\s/.test(text.trim());

const RED_NAMES = new Set(["red", "darkred", "crimson", "firebrick"]);

/* is this CSS colour clearly red? (only red survives a paste) */
export function isRed(color: string | null | undefined) {
  if (!color) return false;
  const c = color.trim().toLowerCase();
  if (RED_NAMES.has(c)) return true;
  let r = 0;
  let g = 0;
  let b = 0;
  const hex = c.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
  const rgb = c.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/);
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].replace(/./g, "$&$&") : hex[1];
    [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  } else if (rgb) [r, g, b] = [rgb[1], rgb[2], rgb[3]].map(Number);
  else return false;
  return r >= 170 && g <= 90 && b <= 90;
}

const LIST_MARK = /^[\s ]*(?:[·•●▪◦§o\-–]|\d{1,3}[.)]|[a-zA-Z][.)]|[ivxIVX]{1,4}[.)])[\s ]+/;

/* clean HTML from Word / Google Docs / web pages before the editor reads it */
export function cleanPastedHTML(html: string): string {
  if (typeof DOMParser === "undefined") return html;
  const doc = new DOMParser().parseFromString(html.replace(/<!--[\s\S]*?-->/g, ""), "text/html");
  const body = doc.body;

  /* Office junk: <o:p>, <style>, <meta>, images */
  body.querySelectorAll("style, meta, link, script, xml, img, svg, picture, video, iframe, object").forEach((n) => n.remove());
  body.querySelectorAll("*").forEach((el) => {
    if (el.tagName.includes(":")) el.replaceWith(...Array.from(el.childNodes));
  });

  /* every heading level becomes our one section heading */
  body.querySelectorAll("h1, h3, h4, h5, h6").forEach((h) => {
    const h2 = doc.createElement("h2");
    h2.innerHTML = h.innerHTML;
    h.replaceWith(h2);
  });

  /* Word lists are paragraphs with a typed bullet: turn them into real lists */
  const isWordListPara = (el: Element) =>
    el.tagName === "P" && (/MsoList/i.test(el.className) || /mso-list/i.test(el.getAttribute("style") ?? "")) && LIST_MARK.test(el.textContent ?? "");
  const paras = Array.from(body.querySelectorAll("p"));
  for (const p of paras) {
    if (!p.isConnected || !isWordListPara(p)) continue;
    const group: Element[] = [p];
    let next = p.nextElementSibling;
    while (next && isWordListPara(next)) {
      group.push(next);
      next = next.nextElementSibling;
    }
    const ordered = /^[\s ]*(\d{1,3}|[a-zA-Z]|[ivxIVX]{1,4})[.)]/.test(p.textContent ?? "");
    const list = doc.createElement(ordered ? "ol" : "ul");
    for (const item of group) {
      item.querySelectorAll('span[style*="mso-list:Ignore"], span[style*="mso-list: Ignore"]').forEach((s) => s.remove());
      const li = doc.createElement("li");
      const lp = doc.createElement("p");
      lp.innerHTML = item.innerHTML.replace(/^(\s|&nbsp;)*(?:[·•●▪◦§o\-–]|\d{1,3}[.)]|[a-zA-Z][.)])(\s|&nbsp;)+/, "");
      li.appendChild(lp);
      list.appendChild(li);
    }
    p.replaceWith(list);
    group.slice(1).forEach((g) => g.remove());
  }

  /* a table whose first row is all bold gets a proper header row */
  body.querySelectorAll("table").forEach((table) => {
    const first = table.querySelector("tr");
    if (!first) return;
    const cells = Array.from(first.children).filter((c) => c.tagName === "TD" || c.tagName === "TH");
    const bold = (c: Element) => {
      const text = (c.textContent ?? "").trim();
      if (!text) return true;
      const strong = Array.from(c.querySelectorAll("b, strong, [style*='font-weight']")).filter((b) => {
        const w = (b as HTMLElement).style?.fontWeight;
        return b.tagName === "B" || b.tagName === "STRONG" || w === "bold" || Number(w) >= 600;
      });
      return strong.map((s) => s.textContent ?? "").join("").replace(/\s+/g, "").length >= text.replace(/\s+/g, "").length * 0.8;
    };
    if (cells.length && cells.every((c) => c.tagName === "TH" || bold(c))) {
      cells.forEach((c) => {
        if (c.tagName === "TH") return;
        const th = doc.createElement("th");
        for (const a of ["colspan", "rowspan"]) if (c.getAttribute(a)) th.setAttribute(a, c.getAttribute(a)!);
        th.innerHTML = c.innerHTML;
        c.replaceWith(th);
      });
    }
  });

  /* Google Docs wraps everything in <b style="font-weight:normal"> — unwrap it */
  body.querySelectorAll('b[style*="font-weight:normal"], b[style*="font-weight: normal"]').forEach((b) => b.replaceWith(...Array.from(b.childNodes)));

  return body.innerHTML;
}

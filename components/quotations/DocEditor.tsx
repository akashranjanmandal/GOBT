"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import { MARK_NODE, STAMP_PLACES, markSrc, computeQuote, inWords, inr, quoteClient, quoteDateParts, quoteProblem, quoteSubject, type MarkInfo, type QuoteData, type QuoteItem } from "@/lib/quotations/model";
import { PRICING_NODE, scopeModules, type DocNode } from "@/lib/quotations/doc";
import { saveQuotationAction, type QuoteFormState } from "@/app/referral/(admin)/admin/quotations/actions";
import { PageBreak, Pricing, QuoteMark, Red, type PricingStore } from "./editor/extensions";
import SignSettings from "./SignSettings";
import { cleanPastedHTML, textHasStructure, textToHTML } from "./editor/paste";
import PriceSettings from "./PriceSettings";

type Props = { id?: number; initial: QuoteData; quoteNo: string; marks: MarkInfo[] };

const num = (v: string) => (v === "" ? 0 : Number(v));

/* a tiny store so the price block inside the document follows the panel */
function createStore(initial: QuoteData, focusPanel: () => void) {
  let value = initial;
  const subs = new Set<() => void>();
  return {
    get: () => value,
    set: (v: QuoteData) => {
      value = v;
      subs.forEach((s) => s());
    },
    subscribe: (cb: () => void) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    focusPanel,
  };
}

function Tool({ on, label, title, onClick, disabled }: { on?: boolean; label: React.ReactNode; title: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      className={`de-tool${on ? " is-on" : ""}`}
      title={title}
      aria-label={title}
      aria-pressed={on}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function Toolbar({ editor, marks }: { editor: Editor; marks: MarkInfo[] }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      let pricing = false;
      e.state.doc.forEach((n) => {
        if (n.type.name === PRICING_NODE) pricing = true;
      });
      return {
        bold: e.isActive("bold"),
        italic: e.isActive("italic"),
        underline: e.isActive("underline"),
        red: e.isActive("red"),
        heading: e.isActive("heading"),
        bullet: e.isActive("bulletList"),
        ordered: e.isActive("orderedList"),
        table: e.isActive("table"),
        undo: e.can().undo(),
        redo: e.can().redo(),
        pricing,
      };
    },
  });
  const c = () => editor.chain().focus();
  /* blocks (price tables, signatures) go after the paragraph the cursor is in, never inside it */
  const afterBlock = () => {
    const { $from } = editor.state.selection;
    return $from.depth >= 1 ? $from.after(1) : $from.pos;
  };
  const insertBlock = (content: Record<string, unknown>) => c().insertContentAt(afterBlock(), content).run();
  return (
    <div className="de-toolbar" role="toolbar" aria-label="Formatting">
      <div className="de-group">
        <Tool label="↶" title="Undo (Ctrl+Z)" onClick={() => c().undo().run()} disabled={!s.undo} />
        <Tool label="↷" title="Redo (Ctrl+Y)" onClick={() => c().redo().run()} disabled={!s.redo} />
      </div>
      <div className="de-group">
        <Tool label="Text" title="Normal text" on={!s.heading} onClick={() => c().setParagraph().run()} />
        <Tool label="HEADING" title="Section heading (bold capitals)" on={s.heading} onClick={() => c().toggleHeading({ level: 2 }).run()} />
      </div>
      <div className="de-group">
        <Tool label={<b>B</b>} title="Bold (Ctrl+B)" on={s.bold} onClick={() => c().toggleBold().run()} />
        <Tool label={<i>I</i>} title="Italic (Ctrl+I)" on={s.italic} onClick={() => c().toggleItalic().run()} />
        <Tool label={<u>U</u>} title="Underline (Ctrl+U)" on={s.underline} onClick={() => c().toggleUnderline().run()} />
        <Tool label={<span className="de-red">A</span>} title="Red text" on={s.red} onClick={() => c().toggleMark("red").run()} />
      </div>
      <div className="de-group">
        <Tool label="• List" title="Bullet list" on={s.bullet} onClick={() => c().toggleBulletList().run()} />
        <Tool label="1. List" title="Numbered list" on={s.ordered} onClick={() => c().toggleOrderedList().run()} />
      </div>
      <div className="de-group">
        {!s.table ? (
          <Tool label="▦ Table" title="Insert a table" onClick={() => c().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} />
        ) : (
          <>
            <Tool label="+ Row" title="Add a row below" onClick={() => c().addRowAfter().run()} />
            <Tool label="+ Column" title="Add a column on the right" onClick={() => c().addColumnAfter().run()} />
            <Tool label="− Row" title="Delete this row" onClick={() => c().deleteRow().run()} />
            <Tool label="− Column" title="Delete this column" onClick={() => c().deleteColumn().run()} />
            <Tool label="Header" title="Make the first row a bold header" onClick={() => c().toggleHeaderRow().run()} />
            <Tool label="✕ Table" title="Delete the whole table" onClick={() => c().deleteTable().run()} />
          </>
        )}
      </div>
      <div className="de-group">
        <Tool label="₹ Price tables" title="Put the price & payment tables here" disabled={s.pricing} onClick={() => insertBlock({ type: PRICING_NODE })} />
        <Tool label="⤓ Page break" title="Start a new page here in the PDF" onClick={() => c().insertContent({ type: "pageBreak" }).run()} />
        <select
          className="de-tool de-select"
          aria-label="Put a signature or stamp here"
          value=""
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => {
            const m = marks.find((x) => x.id === e.target.value);
            if (m) insertBlock({ type: MARK_NODE, attrs: { mark: m.id, align: m.kind === "stamp" ? "right" : "left", size: "m" } });
          }}
        >
          <option value="">✍ Signature / stamp…</option>
          {(["signature", "stamp"] as const).map((k) => (
            <optgroup key={k} label={k === "stamp" ? "Stamps" : "Signatures"}>
              {marks
                .filter((m) => m.kind === k && !m.hidden)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
        <Tool label="Clear style" title="Remove bold, colours and headings from the selection" onClick={() => c().unsetAllMarks().clearNodes().run()} />
      </div>
    </div>
  );
}

export default function DocEditor({ id, initial, quoteNo, marks }: Props) {
  const [state, action, pending] = useActionState<QuoteFormState, FormData>(saveQuotationAction, {});
  const [q, setQ] = useState<QuoteData>({ ...initial, mode: "doc" });
  const [tried, setTried] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const docRef = useRef<DocNode | undefined>(initial.doc);
  const dataRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Editor | null>(null);

  const store = useMemo(
    () =>
      createStore({ ...initial, mode: "doc" }, () => {
        panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        panelRef.current?.querySelector("input")?.focus({ preventScroll: true });
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  useEffect(() => store.set(q), [q, store]);

  const set = (patch: Partial<QuoteData>) => setQ((p) => ({ ...p, ...patch }));
  const setItem = (i: number, patch: Partial<QuoteItem>) => setQ((p) => ({ ...p, items: p.items.map((it, n) => (n === i ? { ...it, ...patch } : it)) }));

  /* the document lives in the editor; state copies it a moment after typing stops */
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2] },
        codeBlock: false,
        code: false,
        blockquote: false,
        horizontalRule: false,
        strike: false,
        link: false,
      }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Red,
      PageBreak,
      QuoteMark,
      Pricing.configure({ store: store as PricingStore }),
    ],
    content: initial.doc ?? { type: "doc", content: [{ type: "paragraph" }] },
    editorProps: {
      attributes: { class: "de-content", spellcheck: "true", "aria-label": "Quotation text" },
      transformPastedHTML: cleanPastedHTML,
      handlePaste: (_view, event) => {
        const dt = event.clipboardData;
        if (!dt || dt.getData("text/html")) return false;
        const text = dt.getData("text/plain");
        if (!text || !textHasStructure(text) || !editorRef.current) return false;
        editorRef.current.chain().focus().insertContent(textToHTML(text)).run();
        return true;
      },
    },
    onCreate: ({ editor: e }) => {
      editorRef.current = e;
    },
    onUpdate: ({ editor: e }) => {
      docRef.current = e.getJSON() as DocNode;
      if (syncTimer.current) clearTimeout(syncTimer.current);
      syncTimer.current = setTimeout(() => setQ((p) => ({ ...p, doc: docRef.current })), 400);
    },
  });

  const current = (): QuoteData => ({ ...q, mode: "doc", doc: docRef.current });
  const t = computeQuote(q);
  const live = current();
  const problem = quoteProblem(live);
  const client = quoteClient({ ...live, listName: "" });
  const subject = quoteSubject(live);
  const date = quoteDateParts(q.date);

  const fillFromScope = () => {
    const names = scopeModules(docRef.current);
    if (!names.length) return;
    setQ((p) => {
      const byName = new Map(p.items.map((i) => [i.module.trim().toLowerCase(), i.amount]));
      return { ...p, items: names.map((n) => ({ module: n, details: "", amount: byName.get(n.toLowerCase()) ?? 0 })) };
    });
  };

  const preview = async () => {
    const win = window.open("", "_blank");
    setPreviewing(true);
    try {
      const res = await fetch("/api/referral/admin/quotations/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: current(), id }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const url = URL.createObjectURL(await res.blob());
      if (win) win.location.href = url;
      else window.location.href = url;
    } catch {
      win?.close();
      alert("Couldn't make the preview. Check your connection and try again.");
    } finally {
      setPreviewing(false);
    }
  };

  return (
    <form
      action={action}
      className="de"
      onSubmit={(e) => {
        setTried(true);
        const data = current();
        if (quoteProblem(data)) {
          e.preventDefault();
          return;
        }
        if (dataRef.current) dataRef.current.value = JSON.stringify(data);
      }}
    >
      {id && <input type="hidden" name="id" value={id} />}
      <input type="hidden" name="data" ref={dataRef} defaultValue="" />

      <div className="de-main">
        {editor && <Toolbar editor={editor} marks={marks} />}
        <p className="de-tip">
          Type or paste straight into the page: from Word, Google Docs, ChatGPT, WhatsApp or email. Fonts and colours are cleaned into GOBT&apos;s style
          automatically. Prices go in the panel; the price tables in the page update by themselves.
        </p>

        <div className="de-paper">
          <div className="de-page">
            <div className="de-head" aria-hidden="true">
              <svg viewBox="0 0 595.28 75" preserveAspectRatio="none">
                <rect width="595.28" height="10" fill="#3d3d3d" />
                <path d="M363 10 L595.28 10 L595.28 41 L457 41 Z" fill="#f4b731" />
              </svg>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/quotation/logo.png" alt="" className="de-head-logo" />
              <span className="de-head-name">
                <b>GOBT</b>
                <span>Group Of Blooming Technicians</span>
              </span>
            </div>

            <div className="de-body">
              <div className="de-meta">
                <span>
                  <b>Quotation No.:</b> {quoteNo}
                </span>
                <label>
                  <b>Date:</b>{" "}
                  <span className="de-date-text">
                    {date.day}
                    <sup>{date.suffix}</sup>
                    {date.rest}
                  </span>
                  <input type="date" value={q.date} onChange={(e) => set({ date: e.target.value })} aria-label="Quotation date" />
                </label>
              </div>
              <p className="de-title">Quotation</p>

              <EditorContent editor={editor} />

              <div className="de-sign" aria-label="Signature block (added automatically)">
                <b>Authorized Signatory</b>
                <span className="de-sign-row">
                  <span className="de-sign-left">
                    <i className="de-sign-for">For Group of Blooming Technicians</i>
                    {q.sign.signature ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className={`de-sign-sig${q.sign.signature === "default-signature" ? " is-original" : ""}`} src={markSrc(q.sign.signature)} alt="Signature" />
                    ) : (
                      <span className="de-muted">(no signature)</span>
                    )}
                    {q.sign.stamp && q.sign.place === "over" && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="de-sign-stamp is-over" src={markSrc(q.sign.stamp)} alt="Stamp" />
                    )}
                  </span>
                  {q.sign.stamp && q.sign.place === "beside" && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="de-sign-stamp" src={markSrc(q.sign.stamp)} alt="Stamp" />
                  )}
                </span>
                {q.sign.stamp && (q.sign.place === "corner" || q.sign.place === "every") && (
                  <span className="de-muted de-sign-note">Stamp: {STAMP_PLACES.find((p) => p.id === q.sign.place)?.label.toLowerCase()} in the PDF.</span>
                )}
                <b>Suprime Mandal</b>
                <b>CEO, GOBT</b>
                <span className="de-muted">+91 89722 97093</span>
                <span className="de-muted">info@gobt.in</span>
              </div>
            </div>

            <div className="de-foot" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/quotation/footer-logos.png" alt="" />
              <div className="de-foot-bar">
                <span>gobt.in</span>
                <span>info@gobt.in</span>
                <span>+91 89722 97093</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <aside className="de-panel" ref={panelRef} aria-label="Price and payment">
        <section className="qf-card">
          <h2>Listed as</h2>
          <dl className="de-listed">
            <div>
              <dt>Client</dt>
              <dd>{q.listName?.trim() || client || <span className="ad-error">Write it after “To,”</span>}</dd>
            </div>
            <div>
              <dt>Subject</dt>
              <dd>{subject || <span className="de-muted">Add a line starting “Subject:”</span>}</dd>
            </div>
          </dl>
          <label className="ad-field">
            <span>Different name in the list? (optional)</span>
            <input value={q.listName ?? ""} onChange={(e) => set({ listName: e.target.value })} placeholder={client || "Client name"} />
          </label>
        </section>

        <section className="qf-card">
          <h2>Price list</h2>
          <p className="qf-help">Each line becomes a row of the cost table. Lines at ₹0 are left out of it.</p>
          <ol className="de-prices">
            {q.items.map((it, i) => (
              <li key={i}>
                <input aria-label={`Line ${i + 1} name`} value={it.module} onChange={(e) => setItem(i, { module: e.target.value })} placeholder="e.g. Admin Panel" />
                <label className="qf-money">
                  <span aria-hidden="true">₹</span>
                  <input
                    aria-label={`Line ${i + 1} amount in rupees`}
                    type="number"
                    min={0}
                    step="any"
                    inputMode="decimal"
                    value={it.amount ? String(it.amount) : ""}
                    placeholder="0"
                    onChange={(e) => setItem(i, { amount: Math.max(0, num(e.target.value)) })}
                  />
                </label>
                <button type="button" className="ad-link qf-danger" onClick={() => set({ items: q.items.filter((_, n) => n !== i) })} disabled={q.items.length === 1} aria-label={`Remove line ${i + 1}`}>
                  ✕
                </button>
              </li>
            ))}
          </ol>
          <div className="qf-add">
            <button type="button" className="ad-btn ad-btn-sm" onClick={() => set({ items: [...q.items, { module: "", details: "", amount: 0 }] })}>
              + Line
            </button>
            <button type="button" className="ad-link" onClick={fillFromScope} title="Use the module names from the Scope of Work table in the document">
              Copy names from the scope table
            </button>
          </div>
          <p className="qf-sum">
            Before discount: <b>{inr(t.subtotal)}</b>
            <small>{inWords(t.subtotal)}</small>
          </p>
        </section>

        <PriceSettings q={q} set={set} setQ={setQ} withTerms={false} />

        <SignSettings marks={marks} sign={q.sign} onChange={(sign) => set({ sign, signature: Boolean(sign.signature || sign.stamp) })} />

        <div className="qf-bar de-bar">
          <div className="qf-bar-total">
            <small>Grand total</small>
            <b>{inr(t.grand)}</b>
          </div>
          {((tried && problem) || state.error) && (
            <p className="ad-error" role="alert">
              {state.error && !(tried && problem) ? state.error : problem}
            </p>
          )}
          <button type="button" className="ad-btn" onClick={preview} disabled={previewing}>
            {previewing ? "Making PDF…" : "Preview PDF"}
          </button>
          <button className="ad-btn ad-btn-primary" disabled={pending}>
            {pending ? "Saving…" : id ? "Save changes" : "Save quotation"}
          </button>
        </div>
      </aside>
    </form>
  );
}

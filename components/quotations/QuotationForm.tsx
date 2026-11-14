"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_ASSUMPTIONS,
  DEFAULT_CLOSING,
  DEFAULT_EXCLUSIONS,
  DEFAULT_INTRO,
  DEFAULT_TERMS,
  MODULE_PRESETS,
  computeQuote,
  inWords,
  inr,
  quoteProblem,
  type QuoteData,
  type MarkInfo,
  type QuoteItem,
} from "@/lib/quotations/model";
import {
  saveQuotationAction,
  type QuoteFormState,
} from "@/app/referral/(admin)/admin/quotations/actions";
import PriceSettings from "./PriceSettings";
import SignSettings from "./SignSettings";

type Props = { id?: number; initial: QuoteData; quoteNo: string; marks: MarkInfo[] };

const num = (v: string) => (v === "" ? 0 : Number(v));
const shown = (n: number) => (n ? String(n) : "");


export default function QuotationForm({ id, initial, quoteNo, marks }: Props) {
  const [state, action, pending] = useActionState<QuoteFormState, FormData>(
    saveQuotationAction,
    {},
  );
  const [q, setQ] = useState<QuoteData>(initial);
  const [pdf, setPdf] = useState<string | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [tried, setTried] = useState(false);

  const t = useMemo(() => computeQuote(q), [q]);
  const problem = quoteProblem(q);
  const set = (patch: Partial<QuoteData>) => setQ((p) => ({ ...p, ...patch }));
  const setItem = (i: number, patch: Partial<QuoteItem>) =>
    setQ((p) => ({
      ...p,
      items: p.items.map((it, n) => (n === i ? { ...it, ...patch } : it)),
    }));
  const move = <T,>(list: T[], i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= list.length) return list;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  };

  /* redraw the PDF preview shortly after typing stops */
  useEffect(() => {
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setDrawing(true);
      try {
        const res = await fetch("/api/referral/admin/quotations/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: q, id }),
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error(String(res.status));
        const url = URL.createObjectURL(await res.blob());
        setPdf((old) => {
          if (old) URL.revokeObjectURL(old);
          return url;
        });
        setPreviewError(false);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setPreviewError(true);
      } finally {
        if (!ctrl.signal.aborted) setDrawing(false);
      }
    }, 900);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [q, id]);

  const reset = (
    label: string,
    value: string,
    apply: () => void,
    current: string,
  ) =>
    current.trim() !== value.trim() && (
      <button type="button" className="ad-link qf-reset" onClick={apply}>
        Use GOBT&apos;s standard {label}
      </button>
    );

  return (
    <div className="qf">
      <form
        action={action}
        className="qf-form"
        onSubmit={(e) => {
          setTried(true);
          if (problem) e.preventDefault();
        }}
      >
        {id && <input type="hidden" name="id" value={id} />}
        <input type="hidden" name="data" value={JSON.stringify(q)} />

        {/* 1. who it's for */}
        <section className="qf-card">
          <h2>
            <span>1</span> Client
          </h2>
          <div className="qf-row">
            <label className="ad-field">
              <span>Quotation no.</span>
              <input
                value={quoteNo}
                readOnly
                aria-readonly="true"
                className="qf-ro"
              />
              <small>
                {id
                  ? "Stays the same when you edit."
                  : "Given automatically when you save."}
              </small>
            </label>
            <label className="ad-field">
              <span>Date</span>
              <input
                type="date"
                value={q.date}
                onChange={(e) => set({ date: e.target.value })}
                required
              />
            </label>
          </div>
          <label className="ad-field">
            <span>To (one line each)</span>
            <textarea
              rows={4}
              value={q.to}
              onChange={(e) => set({ to: e.target.value })}
              placeholder={
                "The Concerned Authority,\n**Client Company Pvt. Ltd.**\nAddress, City – PIN\nEmail / Mobile"
              }
            />
            <small>
              The first line is used as the client&apos;s name in the list. Put
              **double stars** around words to make them bold.
            </small>
          </label>
          <label className="ad-field">
            <span>Subject</span>
            <input
              value={q.subject}
              onChange={(e) => set({ subject: e.target.value })}
              placeholder="Quotation for Development of …"
            />
          </label>
          <label className="ad-field qf-narrow">
            <span>Greeting</span>
            <select
              value={q.salutation}
              onChange={(e) => set({ salutation: e.target.value })}
            >
              {[
                "Dear Sir/Madam,",
                "Dear Sir,",
                "Dear Madam,",
                "Dear Team,",
              ].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
        </section>

        {/* 2. what we'll build and what it costs */}
        <section className="qf-card">
          <h2>
            <span>2</span> Scope of work &amp; price
          </h2>
          <p className="qf-help">
            Each module appears in the scope table with its deliverables, and in
            the cost table with its amount. Leave the amount at 0 for free items
            (like 1st-year maintenance).
          </p>
          <ol className="qf-items">
            {q.items.map((it, i) => (
              <li key={i} className="qf-item">
                <div className="qf-item-top">
                  <b className="qf-item-n">{i + 1}</b>
                  <input
                    aria-label={`Module ${i + 1} name`}
                    value={it.module}
                    onChange={(e) => setItem(i, { module: e.target.value })}
                    placeholder="Module name, e.g. Admin Panel"
                  />
                  <label className="qf-money">
                    <span aria-hidden="true">₹</span>
                    <input
                      aria-label={`Module ${i + 1} amount in rupees`}
                      type="number"
                      min={0}
                      step="any"
                      inputMode="decimal"
                      value={shown(it.amount)}
                      placeholder="0"
                      onChange={(e) =>
                        setItem(i, { amount: Math.max(0, num(e.target.value)) })
                      }
                    />
                  </label>
                </div>
                <textarea
                  aria-label={`Module ${i + 1} deliverables`}
                  rows={2}
                  value={it.details}
                  onChange={(e) => setItem(i, { details: e.target.value })}
                  placeholder="Key deliverables"
                />
                <div className="qf-item-tools">
                  <button
                    type="button"
                    className="ad-link"
                    onClick={() => set({ items: move(q.items, i, -1) })}
                    disabled={i === 0}
                    aria-label="Move up"
                  >
                    ↑ Up
                  </button>
                  <button
                    type="button"
                    className="ad-link"
                    onClick={() => set({ items: move(q.items, i, 1) })}
                    disabled={i === q.items.length - 1}
                    aria-label="Move down"
                  >
                    ↓ Down
                  </button>
                  <button
                    type="button"
                    className="ad-link qf-danger"
                    onClick={() =>
                      set({ items: q.items.filter((_, n) => n !== i) })
                    }
                    disabled={q.items.length === 1}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ol>
          <div className="qf-add">
            <select
              aria-label="Add a common module"
              value=""
              onChange={(e) => {
                const p = MODULE_PRESETS.find(
                  (m) => m.module === e.target.value,
                );
                if (!p) return;
                setQ((prev) => ({
                  ...prev,
                  items: [
                    ...prev.items.filter(
                      (x) => x.module.trim() || x.details.trim() || x.amount,
                    ),
                    { ...p },
                  ],
                }));
              }}
            >
              <option value="">+ Add a common module…</option>
              {MODULE_PRESETS.map((m) => (
                <option key={m.module} value={m.module}>
                  {m.module}
                  {m.amount
                    ? ` (₹${m.amount.toLocaleString("en-IN")})`
                    : " (free)"}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="ad-btn ad-btn-sm"
              onClick={() =>
                set({
                  items: [...q.items, { module: "", details: "", amount: 0 }],
                })
              }
            >
              + Blank module
            </button>
          </div>
          <p className="qf-sum">
            Total before discount: <b>{inr(t.subtotal)}</b>
            <small>{inWords(t.subtotal)}</small>
          </p>
        </section>

        <PriceSettings q={q} set={set} setQ={setQ} numbered />

        {/* 5. what's in, what's out, the fine print */}
        <section className="qf-card">
          <h2>
            <span>5</span> Inclusions, exclusions &amp; terms
          </h2>
          <label className="ad-field">
            <span>Included free (one per line, optional)</span>
            <textarea
              rows={2}
              value={q.inclusions}
              onChange={(e) => set({ inclusions: e.target.value })}
              placeholder={
                "Web Hosting First Year\nBasic Maintenance & Technical Support"
              }
            />
          </label>
          <label className="ad-field">
            <span>Not included / third-party charges (one per line)</span>
            <textarea
              rows={5}
              value={q.exclusions}
              onChange={(e) => set({ exclusions: e.target.value })}
            />
            {reset(
              "exclusions",
              DEFAULT_EXCLUSIONS,
              () => set({ exclusions: DEFAULT_EXCLUSIONS }),
              q.exclusions,
            )}
          </label>
          <label className="ad-field">
            <span>Project assumptions (one per line)</span>
            <textarea
              rows={4}
              value={q.assumptions}
              onChange={(e) => set({ assumptions: e.target.value })}
            />
            {reset(
              "assumptions",
              DEFAULT_ASSUMPTIONS,
              () => set({ assumptions: DEFAULT_ASSUMPTIONS }),
              q.assumptions,
            )}
          </label>
          <label className="ad-field">
            <span>
              General terms &amp; conditions (one per line, “Heading: text”)
            </span>
            <textarea
              rows={6}
              value={q.terms}
              onChange={(e) => set({ terms: e.target.value })}
            />
            {reset(
              "terms",
              DEFAULT_TERMS,
              () => set({ terms: DEFAULT_TERMS }),
              q.terms,
            )}
          </label>
        </section>

        {/* 6. rarely changed */}
        <details className="qf-card qf-more">
          <summary>
            <h2>
              <span>6</span> Introduction &amp; extra sections
            </h2>
            <small>
              Optional. GOBT&apos;s standard text is already filled in.
            </small>
          </summary>
          <label className="ad-field">
            <span>Introduction (blank line between paragraphs)</span>
            <textarea
              rows={8}
              value={q.intro}
              onChange={(e) => set({ intro: e.target.value })}
            />
            {reset(
              "introduction",
              DEFAULT_INTRO,
              () => set({ intro: DEFAULT_INTRO }),
              q.intro,
            )}
          </label>

          <div className="qf-sub">
            <h3>Extra sections</h3>
            <p className="qf-help">
              For things like a “User Experience &amp; Design Analysis”. They
              appear after the introduction. Lines starting with “- ” become
              bullet points.
            </p>
            {q.sections.map((s, i) => (
              <div key={i} className="qf-section">
                <input
                  aria-label={`Section ${i + 1} heading`}
                  value={s.heading}
                  placeholder="Section heading"
                  onChange={(e) =>
                    set({
                      sections: q.sections.map((x, n) =>
                        n === i ? { ...x, heading: e.target.value } : x,
                      ),
                    })
                  }
                />
                <textarea
                  aria-label={`Section ${i + 1} text`}
                  rows={5}
                  value={s.body}
                  placeholder={
                    "A short paragraph.\n- Enquiry-first design: every page guides the buyer to a clear call to action.\n- Fully responsive & fast-loading: …"
                  }
                  onChange={(e) =>
                    set({
                      sections: q.sections.map((x, n) =>
                        n === i ? { ...x, body: e.target.value } : x,
                      ),
                    })
                  }
                />
                <button
                  type="button"
                  className="ad-link qf-danger"
                  onClick={() =>
                    set({ sections: q.sections.filter((_, n) => n !== i) })
                  }
                >
                  Remove section
                </button>
              </div>
            ))}
            <button
              type="button"
              className="ad-btn ad-btn-sm"
              onClick={() =>
                set({ sections: [...q.sections, { heading: "", body: "" }] })
              }
            >
              + Add a section
            </button>
          </div>

          <label className="ad-field">
            <span>Closing paragraph</span>
            <textarea
              rows={3}
              value={q.closing}
              onChange={(e) => set({ closing: e.target.value })}
            />
            {reset(
              "closing",
              DEFAULT_CLOSING,
              () => set({ closing: DEFAULT_CLOSING }),
              q.closing,
            )}
          </label>

        </details>

        <SignSettings marks={marks} sign={q.sign} onChange={(sign) => set({ sign, signature: Boolean(sign.signature || sign.stamp) })} />

        <div className="qf-bar">
          <div className="qf-bar-total">
            <small>Grand total</small>
            <b>{inr(t.grand)}</b>
          </div>
          {((tried && problem) || state.error) && (
            <p className="ad-error" role="alert">
              {state.error && !(tried && problem) ? state.error : problem}
            </p>
          )}
          <button className="ad-btn ad-btn-primary" disabled={pending}>
            {pending ? "Saving…" : id ? "Save changes" : "Save quotation"}
          </button>
        </div>
      </form>

      <aside className="qf-preview" aria-label="Preview">
        <div className="qf-preview-head">
          <span>Preview</span>
          <small>
            {drawing
              ? "Updating…"
              : previewError
                ? "Couldn't draw the preview"
                : "Updates as you type"}
          </small>
          {pdf && (
            <a
              href={pdf}
              target="_blank"
              rel="noopener noreferrer"
              className="ad-link"
            >
              Open large ↗
            </a>
          )}
        </div>
        <div className={`qf-preview-frame${drawing ? " is-busy" : ""}`}>
          {pdf ? (
            <iframe
              src={`${pdf}#toolbar=0&navpanes=0&view=FitH`}
              title="Quotation preview"
            />
          ) : (
            <span>Drawing the preview…</span>
          )}
        </div>
      </aside>
    </div>
  );
}

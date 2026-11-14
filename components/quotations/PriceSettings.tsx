"use client";

import type { Dispatch, SetStateAction } from "react";
import {
  DEFAULT_MILESTONES,
  DEFAULT_PAYMENT_TERMS,
  EMI_PAYMENT_TERM,
  computeQuote,
  inr,
  type PaymentMode,
  type QuoteData,
} from "@/lib/quotations/model";

/* Discount, GST and how the client pays — shared by the step-by-step form
   and the document editor's side panel. */

const num = (v: string) => (v === "" ? 0 : Number(v));
const shown = (n: number) => (n ? String(n) : "");

const PAYMENT_OPTIONS: { id: PaymentMode; title: string; hint: string }[] = [
  {
    id: "terms",
    title: "Payment in terms",
    hint: "Milestones, e.g. 40% / 30% / 30%",
  },
  { id: "emi", title: "EMI", hint: "Down payment + monthly instalments" },
  { id: "both", title: "Both", hint: "Client chooses milestones or EMI" },
];

type Props = {
  q: QuoteData;
  set: (patch: Partial<QuoteData>) => void;
  setQ: Dispatch<SetStateAction<QuoteData>>;
  numbered?: boolean;
  /* the document editor keeps payment terms in the document itself */
  withTerms?: boolean;
};

export default function PriceSettings({
  q,
  set,
  setQ,
  numbered = false,
  withTerms = true,
}: Props) {
  const t = computeQuote(q);
  const setPayment = (payment: PaymentMode) =>
    setQ((p) => {
      const next = { ...p, payment };
      /* add the EMI line to the payment terms once, when EMI is first chosen */
      if (payment !== "terms" && !p.paymentTerms.includes(EMI_PAYMENT_TERM))
        next.paymentTerms =
          `${p.paymentTerms.trim()}\n${EMI_PAYMENT_TERM}`.trim();
      if (payment === "terms")
        next.paymentTerms = p.paymentTerms
          .replace(`\n${EMI_PAYMENT_TERM}`, "")
          .replace(EMI_PAYMENT_TERM, "")
          .trim();
      return next;
    });

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
    <>
      {/* 3. discount and GST */}
      <section className="qf-card">
        <h2>{numbered ? <span>3</span> : null} Discount &amp; GST</h2>
        <div
          className="qf-chips"
          role="radiogroup"
          aria-label="Goodwill discount"
        >
          {(
            [
              ["none", "No discount"],
              ["percent", "Discount in %"],
              ["amount", "Discount in ₹"],
            ] as const
          ).map(([v, label]) => (
            <label key={v} className={q.discount.type === v ? "is-on" : ""}>
              <input
                type="radio"
                name="discountType"
                checked={q.discount.type === v}
                onChange={() => set({ discount: { ...q.discount, type: v } })}
              />
              {label}
            </label>
          ))}
        </div>
        <div className="qf-row">
          {q.discount.type !== "none" && (
            <label className="ad-field">
              <span>
                {q.discount.type === "percent"
                  ? "Discount (%)"
                  : "Discount (₹)"}
              </span>
              <input
                type="number"
                min={0}
                step="any"
                inputMode="decimal"
                value={shown(q.discount.value)}
                onChange={(e) =>
                  set({
                    discount: {
                      ...q.discount,
                      value: Math.max(0, num(e.target.value)),
                    },
                  })
                }
              />
              <small>
                Shown as a “Special Goodwill Discount” of{" "}
                {t.discountLabel || "—"}
              </small>
            </label>
          )}
          <label className="ad-field">
            <span>GST (%)</span>
            <input
              type="number"
              min={0}
              max={50}
              step="any"
              value={String(q.gstRate)}
              onChange={(e) =>
                set({ gstRate: Math.max(0, num(e.target.value)) })
              }
            />
            <small>18% for software services. Put 0 to leave GST out.</small>
          </label>
        </div>
        <dl className="qf-totals">
          <div>
            <dt>Project value</dt>
            <dd>{inr(t.subtotal)}</dd>
          </div>
          {t.discount > 0 && (
            <div>
              <dt>Discount</dt>
              <dd>− {inr(t.discount)}</dd>
            </div>
          )}
          {t.gst > 0 && (
            <div>
              <dt>GST @ {q.gstRate}%</dt>
              <dd>{inr(t.gst)}</dd>
            </div>
          )}
          <div className="qf-grand">
            <dt>Grand total</dt>
            <dd>{inr(t.grand)}</dd>
          </div>
        </dl>
      </section>

      {/* 4. how the client pays */}
      <section className="qf-card">
        <h2>{numbered ? <span>4</span> : null} Payment</h2>
        <div className="qf-pay" role="radiogroup" aria-label="Payment type">
          {PAYMENT_OPTIONS.map((p) => (
            <label key={p.id} className={q.payment === p.id ? "is-on" : ""}>
              <input
                type="radio"
                name="payment"
                checked={q.payment === p.id}
                onChange={() => setPayment(p.id)}
              />
              <b>{p.title}</b>
              <small>{p.hint}</small>
            </label>
          ))}
        </div>

        {q.payment !== "emi" && (
          <div className="qf-sub">
            <h3>Milestones</h3>
            <ol className="qf-ms">
              {q.milestones.map((m, i) => (
                <li key={i}>
                  <input
                    aria-label={`Milestone ${i + 1} name`}
                    value={m.name}
                    onChange={(e) =>
                      set({
                        milestones: q.milestones.map((x, n) =>
                          n === i ? { ...x, name: e.target.value } : x,
                        ),
                      })
                    }
                    placeholder="Milestone"
                  />
                  <label className="qf-pct">
                    <input
                      aria-label={`Milestone ${i + 1} percent`}
                      type="number"
                      min={0}
                      max={100}
                      step="any"
                      value={shown(m.percent)}
                      onChange={(e) =>
                        set({
                          milestones: q.milestones.map((x, n) =>
                            n === i
                              ? { ...x, percent: num(e.target.value) }
                              : x,
                          ),
                        })
                      }
                    />
                    <span aria-hidden="true">%</span>
                  </label>
                  <span className="qf-ms-amt">
                    {inr(t.milestones[i]?.total ?? 0)}
                  </span>
                  <button
                    type="button"
                    className="ad-link qf-danger"
                    onClick={() =>
                      set({
                        milestones: q.milestones.filter((_, n) => n !== i),
                      })
                    }
                    aria-label={`Remove milestone ${i + 1}`}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ol>
            <div className="qf-add">
              <button
                type="button"
                className="ad-btn ad-btn-sm"
                onClick={() =>
                  set({
                    milestones: [...q.milestones, { name: "", percent: 0 }],
                  })
                }
              >
                + Milestone
              </button>
              <button
                type="button"
                className="ad-link"
                onClick={() =>
                  set({ milestones: DEFAULT_MILESTONES.map((m) => ({ ...m })) })
                }
              >
                Use 40 / 30 / 30
              </button>
              <span
                className={`qf-pctsum${Math.abs(t.milestonePercent - 100) > 0.001 ? " is-bad" : ""}`}
              >
                Adds up to {Number(t.milestonePercent.toFixed(2))}%
              </span>
            </div>
          </div>
        )}

        {q.payment !== "terms" && (
          <div className="qf-sub">
            <h3>EMI plan</h3>
            <div className="qf-row qf-row-3">
              <label className="ad-field">
                <span>Down payment (%)</span>
                <input
                  type="number"
                  min={0}
                  max={90}
                  step="any"
                  value={String(q.emi.downPercent)}
                  onChange={(e) =>
                    set({ emi: { ...q.emi, downPercent: num(e.target.value) } })
                  }
                />
              </label>
              <label className="ad-field">
                <span>Monthly instalments</span>
                <input
                  type="number"
                  min={1}
                  max={36}
                  step={1}
                  value={String(q.emi.months)}
                  onChange={(e) =>
                    set({
                      emi: {
                        ...q.emi,
                        months: Math.round(num(e.target.value)),
                      },
                    })
                  }
                />
              </label>
              <label className="ad-field">
                <span>EMI charge (%)</span>
                <input
                  type="number"
                  min={0}
                  max={30}
                  step="any"
                  value={String(q.emi.chargePercent)}
                  onChange={(e) =>
                    set({
                      emi: { ...q.emi, chargePercent: num(e.target.value) },
                    })
                  }
                />
              </label>
            </div>
            <p className="qf-emi">
              {t.emi.down > 0 && (
                <>
                  Down payment <b>{inr(t.emi.down)}</b>, then{" "}
                </>
              )}
              <b>
                {t.emi.rows.length - (t.emi.down > 0 ? 1 : 0)} ×{" "}
                {inr(t.emi.monthly)}
              </b>{" "}
              a month. Total <b>{inr(t.emi.payable)}</b>
              {t.emi.charge > 0 && (
                <> (includes {inr(t.emi.charge)} EMI charge)</>
              )}
              .
            </p>
          </div>
        )}

        {withTerms && (
          <label className="ad-field">
            <span>Payment terms (one per line)</span>
            <textarea
              rows={3}
              value={q.paymentTerms}
              onChange={(e) => set({ paymentTerms: e.target.value })}
            />
            {reset(
              "payment terms",
              q.payment === "terms"
                ? DEFAULT_PAYMENT_TERMS
                : `${DEFAULT_PAYMENT_TERMS}\n${EMI_PAYMENT_TERM}`,
              () =>
                set({
                  paymentTerms:
                    q.payment === "terms"
                      ? DEFAULT_PAYMENT_TERMS
                      : `${DEFAULT_PAYMENT_TERMS}\n${EMI_PAYMENT_TERM}`,
                }),
              q.paymentTerms,
            )}
          </label>
        )}
      </section>
    </>
  );
}

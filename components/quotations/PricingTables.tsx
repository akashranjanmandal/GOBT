import { computeQuote, inWords, inr, type QuoteData } from "@/lib/quotations/model";

/* The price & payment tables as they appear in the PDF: cost breakdown,
   goodwill discount, GST, amount in words, milestones and/or EMI. */
export default function PricingTables({ q }: { q: QuoteData }) {
  const t = computeQuote(q);
  const priced = q.items.filter((i) => i.module.trim() && i.amount > 0);
  const rate = Number(q.gstRate) || 0;
  const valueName = t.discount > 0 ? "Discounted Project Value" : "Project Value";
  const gstWord = rate > 0 ? " including GST" : "";
  const both = q.payment === "both";
  const months = t.emi.rows.length - (t.emi.down > 0 ? 1 : 0);

  return (
    <div className="pt">
      <h2>Detailed Cost Breakdown</h2>
      <table>
        <thead>
          <tr>
            <th style={{ width: "8%" }}>S. No.</th>
            <th>Development Component</th>
            <th style={{ width: "18%" }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {priced.length === 0 && (
            <tr>
              <td colSpan={3} className="pt-empty">
                Add prices in the panel on the right →
              </td>
            </tr>
          )}
          {priced.map((it, i) => (
            <tr key={i}>
              <td>
                <b>{i + 1}</b>
              </td>
              <td>{it.module}</td>
              <td>{inr(Math.round(it.amount * 100))}</td>
            </tr>
          ))}
          <tr>
            <td>
              <b>Total</b>
            </td>
            <td>
              <b className="pt-red">{inWords(t.subtotal)}</b>
            </td>
            <td>
              <b>{inr(t.subtotal)}</b>
            </td>
          </tr>
        </tbody>
      </table>

      {t.discount > 0 && (
        <>
          <h2>Special Goodwill Discount</h2>
          <p>
            GOBT is pleased to offer a <b>special goodwill discount of {t.discountLabel}</b> on the standard project value.
          </p>
          <table>
            <thead>
              <tr>
                <th>Particular</th>
                <th style={{ width: "31%" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <b>Standard Project Value</b>
                </td>
                <td>{inr(t.subtotal)}</td>
              </tr>
              <tr>
                <td>
                  <b>Special Goodwill Discount</b>
                </td>
                <td>
                  <b>− {inr(t.discount)}</b>
                </td>
              </tr>
              <tr>
                <td>
                  <b>Discounted Project Value</b>
                </td>
                <td>
                  <b>{inr(t.taxable)}</b>
                </td>
              </tr>
            </tbody>
          </table>
        </>
      )}

      <h2>{rate > 0 ? "GST & Final Commercial Value" : "Final Commercial Value"}</h2>
      {rate > 0 && (
        <p>
          GST will be calculated at <b>{rate}%</b> on the {valueName.toLowerCase()} of {inr(t.taxable)}/-.
        </p>
      )}
      <table>
        <thead>
          <tr>
            <th>Particular</th>
            <th style={{ width: "26%" }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {rate > 0 && (
            <>
              <tr>
                <td>
                  <b>{valueName}</b>
                </td>
                <td>{inr(t.taxable)}</td>
              </tr>
              <tr>
                <td>
                  <b>GST @ {rate}%</b>
                </td>
                <td>{inr(t.gst)}</td>
              </tr>
            </>
          )}
          <tr>
            <td>
              <b>{rate > 0 ? "GRAND TOTAL INCLUDING GST" : "GRAND TOTAL"}</b>
            </td>
            <td>
              <b>{inr(t.grand)}</b>
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        <b>Amount in Words: </b>
        <b className="pt-red">{inWords(t.grand)}.</b>
      </p>

      {both && (
        <>
          <h2>Payment Options</h2>
          <p>
            The total payable amount of{" "}
            <b>
              {inr(t.grand)}/-{gstWord}
            </b>{" "}
            can be paid in either of the following two ways.
          </p>
        </>
      )}
      {q.payment !== "emi" && (
        <>
          {both ? <h3>Option 1: Milestone Payments</h3> : <h2>Payment Breakdown</h2>}
          {!both && (
            <p>
              The total payable amount of{" "}
              <b>
                {inr(t.grand)}/-{gstWord}
              </b>{" "}
              shall be paid according to the following project milestones:
            </p>
          )}
          <table>
            <thead>
              <tr>
                <th>Milestone</th>
                <th>Payment %</th>
                {rate > 0 && <th>Base Amount</th>}
                {rate > 0 && <th>GST @ {rate}%</th>}
                <th>{rate > 0 ? "Total Payable" : "Amount"}</th>
              </tr>
            </thead>
            <tbody>
              {t.milestones.map((m, i) => (
                <tr key={i}>
                  <td>
                    <b>{m.name}</b>
                  </td>
                  <td>{m.percent}%</td>
                  {rate > 0 && <td>{inr(m.base)}</td>}
                  {rate > 0 && <td>{inr(m.gst)}</td>}
                  <td>
                    <b>{inr(m.total)}</b>
                  </td>
                </tr>
              ))}
              <tr>
                <td>
                  <b>TOTAL</b>
                </td>
                <td>
                  <b className={Math.abs(t.milestonePercent - 100) > 0.001 ? "pt-red" : ""}>{Number(t.milestonePercent.toFixed(2))}%</b>
                </td>
                {rate > 0 && (
                  <td>
                    <b>{inr(t.taxable)}</b>
                  </td>
                )}
                {rate > 0 && (
                  <td>
                    <b>{inr(t.gst)}</b>
                  </td>
                )}
                <td>
                  <b>{inr(t.grand)}</b>
                </td>
              </tr>
            </tbody>
          </table>
        </>
      )}
      {q.payment !== "terms" && (
        <>
          {both ? <h3>Option 2: Easy Monthly Instalments (EMI)</h3> : <h2>EMI Payment Plan</h2>}
          <p>
            {both ? (
              "Pay in easy monthly instalments: "
            ) : (
              <>
                The total payable amount of{" "}
                <b>
                  {inr(t.grand)}/-{gstWord}
                </b>{" "}
                shall be paid in easy monthly instalments:{" "}
              </>
            )}
            {t.emi.down > 0 && (
              <>
                a down payment of <b>{inr(t.emi.down)}</b> at project initiation, followed by{" "}
              </>
            )}
            <b>
              {months} monthly instalment{months === 1 ? "" : "s"}
            </b>{" "}
            of {inr(t.emi.monthly)}.
            {t.emi.charge > 0 && ` This includes an EMI convenience charge of ${Number(q.emi.chargePercent.toFixed(2))}% (${inr(t.emi.charge)}).`}
          </p>
          <table>
            <thead>
              <tr>
                <th>Instalment</th>
                <th>Due</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {t.emi.rows.map((r) => (
                <tr key={r.label}>
                  <td>
                    <b>{r.label}</b>
                  </td>
                  <td>{r.due}</td>
                  <td>{inr(r.amount)}</td>
                </tr>
              ))}
              <tr>
                <td>
                  <b>TOTAL</b>
                </td>
                <td />
                <td>
                  <b>{inr(t.emi.payable)}</b>
                </td>
              </tr>
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

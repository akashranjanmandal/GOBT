import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/referral/auth";
import { QUOTE_STATUSES, computeQuote, inr, inWords, quoteDateText } from "@/lib/quotations/model";
import { quotationById, quotationVersions } from "@/lib/quotations/store";
import { PageHead, StatusChip } from "@/components/referral/adminui";
import { Card, fmtTime } from "@/components/referral/ui";
import { PAYMENT_LABEL, quoteStatusTone } from "@/components/quotations/labels";
import { setQuotationStatusAction } from "../actions";

export const metadata: Metadata = { title: "Quotation" };

export default async function QuotationPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const admin = await requireAdmin();
  const q = await quotationById(Number((await params).id));
  if (!q) notFound();
  const { saved } = await searchParams;
  const t = computeQuote(q.data);
  const superadmin = admin.role === "superadmin";
  const versions = superadmin ? await quotationVersions(q.id) : [];
  const pdf = `/api/referral/admin/quotations/${q.id}/pdf`;

  return (
    <>
      <PageHead title={q.quoteNo} help={`${q.client} · ${q.subject}`}>
        <div className="ad-inline">
          <a href={`${pdf}?download=1`} className="ad-btn ad-btn-primary">
            Download PDF
          </a>
          <Link href={`/referral/admin/quotations/${q.id}/edit`} className="ad-btn">
            Edit
          </Link>
          <Link href={`/referral/admin/quotations/new?from=${q.id}`} className="ad-btn">
            Make a copy
          </Link>
        </div>
      </PageHead>

      {saved && (
        <p className="ad-ok cf-saved" role="status">
          {saved === "new" ? `Saved as ${q.quoteNo}. Download the PDF and send it to the client.` : `Saved. This is now version ${q.version}.`}
        </p>
      )}

      <div className="qv">
        <div className="qv-side">
          <Card title="Summary">
            <dl className="qv-facts">
              <div>
                <dt>Client</dt>
                <dd>{q.client}</dd>
              </div>
              <div>
                <dt>Date</dt>
                <dd>{quoteDateText(q.date)}</dd>
              </div>
              <div>
                <dt>Payment</dt>
                <dd>
                  {PAYMENT_LABEL[q.data.payment]}
                  {q.data.payment !== "emi" && <small>{t.milestones.map((m) => `${m.percent}%`).join(" / ")}</small>}
                  {q.data.payment !== "terms" && (
                    <small>
                      EMI: {t.emi.down > 0 ? `${inr(t.emi.down)} down + ` : ""}
                      {t.emi.rows.length - (t.emi.down > 0 ? 1 : 0)} × {inr(t.emi.monthly)}
                    </small>
                  )}
                </dd>
              </div>
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
                  <dt>GST @ {q.data.gstRate}%</dt>
                  <dd>{inr(t.gst)}</dd>
                </div>
              )}
              <div className="qv-grand">
                <dt>Grand total</dt>
                <dd>
                  {inr(t.grand)}
                  <small>{inWords(t.grand)}</small>
                </dd>
              </div>
              <div>
                <dt>Made by</dt>
                <dd>
                  {q.createdBy}
                  <small>{fmtTime(q.createdAt)}</small>
                </dd>
              </div>
              {q.version > 1 && (
                <div>
                  <dt>Last edited</dt>
                  <dd>
                    {q.updatedBy}
                    <small>
                      {fmtTime(q.updatedAt)} · version {q.version}
                    </small>
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          <Card title="Status" help="Mark whether the client accepted. Accepted quotations count in the dashboard.">
            <div className="ad-inline">
              <StatusChip status={quoteStatusTone[q.status]} label={QUOTE_STATUSES.find((s) => s.id === q.status)!.label} />
              {QUOTE_STATUSES.filter((s) => s.id !== q.status).map((s) => (
                <form key={s.id} action={setQuotationStatusAction}>
                  <input type="hidden" name="id" value={q.id} />
                  <input type="hidden" name="status" value={s.id} />
                  <button className="ad-btn ad-btn-sm">Mark {s.label.toLowerCase()}</button>
                </form>
              ))}
            </div>
          </Card>
        </div>

        <Card title="The PDF" className="qv-pdf">
          <iframe src={`${pdf}#view=FitH`} title={`Quotation ${q.quoteNo}`} />
        </Card>
      </div>

      {superadmin && (
        <Card title="Edit history" help="Every saved version, newest first. Only the superadmin sees this. Open any version to see exactly what was sent.">
          <table className="rt">
            <thead>
              <tr>
                <th>Version</th>
                <th>What changed</th>
                <th>Total</th>
                <th>By</th>
                <th>PDF</th>
              </tr>
            </thead>
            <tbody>
              {versions.map((v) => (
                <tr key={v.version}>
                  <td data-label="Version">
                    <b>v{v.version}</b>
                    {v.version === q.version && <small>current</small>}
                  </td>
                  <td data-label="What changed">{v.changes}</td>
                  <td data-label="Total">{inr(v.grand)}</td>
                  <td data-label="By">
                    {v.editedBy}
                    <small>{fmtTime(v.editedAt)}</small>
                  </td>
                  <td data-label="PDF">
                    <a className="ad-btn ad-btn-sm" href={`${pdf}?version=${v.version}`} target="_blank" rel="noopener noreferrer">
                      Open
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}

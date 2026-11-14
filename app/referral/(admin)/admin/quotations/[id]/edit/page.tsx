import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/referral/auth";
import { docFromQuote } from "@/lib/quotations/doc";
import { quotationById } from "@/lib/quotations/store";
import { listMarks } from "@/lib/quotations/marks";
import { PageHead } from "@/components/referral/adminui";
import QuotationForm from "@/components/quotations/QuotationForm";
import DocEditor from "@/components/quotations/DocEditor";

export const metadata: Metadata = { title: "Edit quotation" };

/* opens in the editor it was made with; ?doc=1 moves a form-made quotation into the document editor */
export default async function EditQuotation({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ doc?: string }> }) {
  await requireAdmin();
  const q = await quotationById(Number((await params).id));
  if (!q) notFound();
  const { doc } = await searchParams;
  const asDoc = q.data.mode === "doc" || doc === "1";
  const initial = asDoc && (q.data.mode !== "doc" || !q.data.doc) ? { ...q.data, mode: "doc" as const, doc: docFromQuote(q.data) } : q.data;

  const marks = await listMarks({ includeHidden: true });

  return (
    <>
      <PageHead title={`Edit ${q.quoteNo}`} help={`${q.client} · version ${q.version}. Saving makes version ${q.version + 1}; earlier versions are kept.`}>
        <div className="ad-inline">
          {!asDoc && (
            <Link href={`/referral/admin/quotations/${q.id}/edit?doc=1`} className="ad-btn">
              Switch to the document editor
            </Link>
          )}
          <Link href={`/referral/admin/quotations/${q.id}`} className="ad-btn">
            ← Back
          </Link>
        </div>
      </PageHead>
      {asDoc ? <DocEditor id={q.id} initial={initial} quoteNo={q.quoteNo} marks={marks} /> : <QuotationForm id={q.id} initial={q.data} quoteNo={q.quoteNo} marks={marks} />}
    </>
  );
}

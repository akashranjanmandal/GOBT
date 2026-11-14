import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/referral/auth";
import { blankQuote, quoteNumber, type QuoteData } from "@/lib/quotations/model";
import { docFromQuote } from "@/lib/quotations/doc";
import { nextSeq, quotationById } from "@/lib/quotations/store";
import { listMarks } from "@/lib/quotations/marks";
import { PageHead } from "@/components/referral/adminui";
import QuotationForm from "@/components/quotations/QuotationForm";
import DocEditor from "@/components/quotations/DocEditor";

export const metadata: Metadata = { title: "New quotation" };

const todayIST = () => new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10);

/* the document editor by default; ?form=1 for the step-by-step form;
   ?from=ID starts from a copy of an earlier quotation (new number, today's date) */
export default async function NewQuotation({ searchParams }: { searchParams: Promise<{ from?: string; form?: string }> }) {
  await requireAdmin();
  const { from, form } = await searchParams;
  const today = todayIST();
  const source = from ? await quotationById(Number(from)) : null;
  const useForm = form === "1" && !source;

  let initial: QuoteData = source ? { ...source.data, date: today, listName: "" } : blankQuote(today);
  if (!useForm && (initial.mode !== "doc" || !initial.doc)) initial = { ...initial, mode: "doc", doc: docFromQuote(initial) };
  const quoteNo = `${quoteNumber(initial.date || today, await nextSeq())} (expected)`;

  const marks = await listMarks({ includeHidden: true });

  return (
    <>
      <PageHead
        title={source ? `New quotation from ${source.quoteNo}` : "New quotation"}
        help={
          source
            ? "A copy of the earlier quotation with a new number and today's date. Change the client and whatever else is different, then save."
            : useForm
              ? "Fill in the sections from top to bottom. The preview shows the PDF exactly as the client will get it."
              : "GOBT's template is already on the page. Replace the client details, paste your scope and terms, put the prices in the panel, and save."
        }
      >
        <div className="ad-inline">
          {!source &&
            (useForm ? (
              <Link href="/referral/admin/quotations/new" className="ad-btn">
                Use the document editor
              </Link>
            ) : (
              <Link href="/referral/admin/quotations/new?form=1" className="ad-btn">
                Use the step-by-step form
              </Link>
            ))}
          <Link href="/referral/admin/quotations" className="ad-btn">
            ← All quotations
          </Link>
        </div>
      </PageHead>
      {useForm ? <QuotationForm initial={initial} quoteNo={quoteNo} marks={marks} /> : <DocEditor initial={initial} quoteNo={quoteNo} marks={marks} />}
    </>
  );
}

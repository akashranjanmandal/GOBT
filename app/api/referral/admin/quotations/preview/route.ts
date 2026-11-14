import { currentAdmin } from "@/lib/referral/auth";
import { normaliseQuote, quoteNumber } from "@/lib/quotations/model";
import { renderQuotePdf } from "@/lib/quotations/pdf";
import { marksFor } from "@/lib/quotations/marks";
import { nextSeq, quotationById } from "@/lib/quotations/store";

export const dynamic = "force-dynamic";

/* draws the quotation being typed, marked PREVIEW (nothing is saved) */
export async function POST(req: Request) {
  if (!(await currentAdmin())) return new Response("Not logged in", { status: 401 });
  const body = (await req.json().catch(() => null)) as { data?: unknown; id?: number } | null;
  if (!body) return new Response("Bad request", { status: 400 });
  const today = new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10);
  const data = normaliseQuote(body.data, today);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) data.date = today;
  const existing = body.id ? await quotationById(Number(body.id)) : null;
  const quoteNo = existing?.quoteNo ?? quoteNumber(data.date, await nextSeq());
  const pdf = await renderQuotePdf({ quoteNo, data, draft: true, marks: await marksFor(data) });
  return new Response(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Cache-Control": "no-store" } });
}

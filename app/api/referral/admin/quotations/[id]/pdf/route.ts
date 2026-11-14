import { currentAdmin } from "@/lib/referral/auth";
import { audit } from "@/lib/referral/audit";
import { renderQuotePdf } from "@/lib/quotations/pdf";
import { marksFor } from "@/lib/quotations/marks";
import { quotationById, quotationVersionData } from "@/lib/quotations/store";

export const dynamic = "force-dynamic";

const fileName = (quoteNo: string, client: string, version?: number) =>
  `${quoteNo.replace(/\//g, "_")}-${client.replace(/[^A-Za-z0-9]+/g, " ").trim().slice(0, 60) || "Quotation"}${version ? ` (v${version})` : ""}.pdf`;

/* the saved quotation as a PDF. ?download=1 saves it; ?version=N (superadmin) shows an older version */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await currentAdmin();
  if (!admin) return new Response("Not logged in", { status: 401 });
  const q = await quotationById(Number((await params).id));
  if (!q) return new Response("Quotation not found", { status: 404 });

  const url = new URL(req.url);
  const version = Number(url.searchParams.get("version")) || 0;
  let data = q.data;
  if (version && version !== q.version) {
    if (admin.role !== "superadmin") return new Response("Only the superadmin can open older versions", { status: 403 });
    const old = await quotationVersionData(q.id, version, q.date);
    if (!old) return new Response("Version not found", { status: 404 });
    data = old;
  }
  const pdf = await renderQuotePdf({ quoteNo: q.quoteNo, data, marks: await marksFor(data) });
  const download = url.searchParams.has("download");
  if (download) {
    await audit(admin, "quotation.downloaded", `Downloaded ${q.quoteNo} (${q.client})${version && version !== q.version ? `, version ${version}` : ""}`, `quotation:${q.id}`);
  }
  const name = fileName(q.quoteNo, q.client, version && version !== q.version ? version : undefined);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${name.replace(/"/g, "")}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}

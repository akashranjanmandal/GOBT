import { certificateBySlug } from "@/lib/certificates/store";
import { certificatePdf } from "@/lib/certificates/render";
import { fileName, pdfMeta, renderInputFor } from "@/lib/certificates/output";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const cert = await certificateBySlug((await params).slug);
  if (!cert) return new Response("Certificate not found", { status: 404 });
  const pdf = await certificatePdf(await renderInputFor(cert), pdfMeta(cert));
  const download = new URL(req.url).searchParams.has("download");
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${fileName(cert, "pdf")}"`,
      "Cache-Control": "private, max-age=300",
      "X-Robots-Tag": "noindex",
    },
  });
}

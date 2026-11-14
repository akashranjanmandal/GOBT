import { certificateBySlug } from "@/lib/certificates/store";
import { certificatePng } from "@/lib/certificates/render";
import { fileName, renderInputFor } from "@/lib/certificates/output";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const cert = await certificateBySlug((await params).slug);
  if (!cert) return new Response("Certificate not found", { status: 404 });
  const png = await certificatePng(await renderInputFor(cert));
  const download = new URL(req.url).searchParams.has("download");
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${fileName(cert, "png")}"`,
      "Cache-Control": "private, max-age=300",
      "X-Robots-Tag": "noindex",
    },
  });
}

import { currentAdmin } from "@/lib/referral/auth";
import { markImage } from "@/lib/quotations/marks";

export const dynamic = "force-dynamic";

/* a saved signature or stamp, for the admin screens only */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await currentAdmin())) return new Response("Not logged in", { status: 401 });
  const m = await markImage((await params).id);
  if (!m) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(m.data), { headers: { "Content-Type": m.type, "Cache-Control": "private, max-age=86400", "X-Robots-Tag": "noindex" } });
}

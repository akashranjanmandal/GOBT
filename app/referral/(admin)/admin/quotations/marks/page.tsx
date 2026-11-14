import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/referral/auth";
import { listMarks } from "@/lib/quotations/marks";
import { PageHead } from "@/components/referral/adminui";
import { Card, fmtDate } from "@/components/referral/ui";
import MarkUpload from "@/components/quotations/MarkUpload";
import { markSrc } from "@/lib/quotations/model";
import { setMarkHiddenAction } from "../actions";

export const metadata: Metadata = { title: "Signatures & stamps" };

export default async function Marks() {
  await requireAdmin();
  const marks = await listMarks({ includeHidden: true });
  const groups = [
    { kind: "signature", title: "Signatures" },
    { kind: "stamp", title: "Stamps & seals" },
  ] as const;

  return (
    <>
      <PageHead
        title="Signatures & stamps"
        help="Upload a signature or stamp once and anyone can use it on quotations: choose it in the “Signature & stamp” box, or place it anywhere in the document with ✍ Signature / stamp. Images can be hidden but never deleted, so old quotations always print the same."
      >
        <Link href="/referral/admin/quotations" className="ad-btn">
          ← Quotations
        </Link>
      </PageHead>

      <div className="ad-grid2">
        <Card title="Add a signature or stamp">
          <MarkUpload />
        </Card>
        <div className="mk-groups">
          {groups.map((g) => (
            <Card key={g.kind} title={g.title}>
              <ul className="mk-list">
                {marks
                  .filter((m) => m.kind === g.kind)
                  .map((m) => (
                    <li key={m.id} className={m.hidden ? "is-hidden" : ""}>
                      <span className="mk-img">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={markSrc(m.id)} alt={m.name} loading="lazy" />
                      </span>
                      <b>{m.name}</b>
                      <small>{m.builtIn ? "From GOBT's original documents" : `Added by ${m.createdBy} · ${fmtDate(m.createdAt ?? 0)}`}</small>
                      {m.hidden && <small className="ad-error">Hidden from the pickers</small>}
                      {!m.builtIn && (
                        <form action={setMarkHiddenAction}>
                          <input type="hidden" name="id" value={m.id} />
                          <input type="hidden" name="hidden" value={m.hidden ? "0" : "1"} />
                          <button className="ad-link">{m.hidden ? "Show again" : "Hide"}</button>
                        </form>
                      )}
                    </li>
                  ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { requireSuperadmin } from "@/lib/referral/auth";
import { AUDIT_GROUPS, adminDirectory, auditRows } from "@/lib/referral/audit";
import { PageHead } from "@/components/referral/adminui";
import { Card, Empty, ago, fmtTime } from "@/components/referral/ui";

export const metadata: Metadata = { title: "Logs" };

/* "Mozilla/5.0 (iPhone; …) … Safari" → "iPhone · Safari" */
function device(ua: string) {
  if (!ua) return "";
  const os = /iPhone|iPad/.test(ua) ? "iPhone/iPad" : /Android/.test(ua) ? "Android" : /Mac OS X/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "";
  const br = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "";
  return [os, br].filter(Boolean).join(" · ");
}

const LINKS: Record<string, string> = { quotation: "/referral/admin/quotations/", certificate: "/referral/admin/certificates/", referrer: "/referral/admin/referrers/" };
const targetLink = (target: string) => {
  const [kind, id] = target.split(":");
  return LINKS[kind] && id ? `${LINKS[kind]}${id}` : null;
};

export default async function Logs({ searchParams }: { searchParams: Promise<{ who?: string; group?: string; q?: string; before?: string }> }) {
  await requireSuperadmin();
  const sp = await searchParams;
  const [{ rows, more }, admins] = await Promise.all([auditRows({ who: sp.who, group: sp.group, q: sp.q, before: Number(sp.before) || undefined }), adminDirectory()]);
  const qs = (extra: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ who: sp.who, group: sp.group, q: sp.q, ...extra })) if (v) p.set(k, v);
    return `/referral/admin/logs?${p.toString()}`;
  };

  return (
    <>
      <PageHead title="Logs" help="Everything admins do: logins (and failed attempts), quotations made, edited and downloaded, certificates, payouts and lead changes. Only you (superadmin) can see this page. Logs can't be edited or deleted." />

      <Card title="Admins">
        <table className="rt">
          <thead>
            <tr>
              <th>Admin</th>
              <th>Role</th>
              <th>Last login</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.id}>
                <td data-label="Admin">
                  <b>{a.name}</b>
                  <small>{a.email}</small>
                </td>
                <td data-label="Role">{a.role === "superadmin" ? "Superadmin" : "Admin"}</td>
                <td data-label="Last login">
                  {a.lastLogin ? fmtTime(a.lastLogin) : "Never"}
                  {a.locked && <small className="ad-error">Locked after wrong passwords</small>}
                </td>
                <td data-label="">
                  <Link className="ad-btn ad-btn-sm" href={qs({ who: a.email, before: undefined })}>
                    Their activity
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card
        title="Activity log"
        action={
          <form className="ad-inline qd-filter" action="/referral/admin/logs">
            <select name="who" defaultValue={sp.who ?? ""} aria-label="Admin">
              <option value="">Everyone</option>
              {admins.map((a) => (
                <option key={a.id} value={a.email}>
                  {a.name}
                </option>
              ))}
            </select>
            <select name="group" defaultValue={sp.group ?? ""} aria-label="Type">
              <option value="">Everything</option>
              {AUDIT_GROUPS.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
            <input name="q" defaultValue={sp.q ?? ""} placeholder="Search, e.g. GOBT/Q/" aria-label="Search the log" />
            <button className="ad-btn ad-btn-sm">Filter</button>
            {(sp.who || sp.group || sp.q) && (
              <Link className="ad-link" href="/referral/admin/logs">
                Clear
              </Link>
            )}
          </form>
        }
      >
        {rows.length === 0 ? (
          <Empty>Nothing logged{sp.who || sp.group || sp.q ? " for this filter" : " yet"}.</Empty>
        ) : (
          <table className="rt">
            <thead>
              <tr>
                <th>When</th>
                <th>Who</th>
                <th>What happened</th>
                <th>From</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const link = r.target ? targetLink(r.target) : null;
                return (
                  <tr key={r.id} className={r.action === "login.failed" ? "lg-warn" : ""}>
                    <td data-label="When">
                      {fmtTime(r.at)}
                      <small>{ago(r.at)}</small>
                    </td>
                    <td data-label="Who">
                      <b>{r.adminName || "Unknown"}</b>
                      <small>{r.adminEmail}</small>
                    </td>
                    <td data-label="What happened">
                      <span className="lg-action">{r.action.replace(".", " · ").replace(/_/g, " ")}</span>
                      {link ? <Link href={link}>{r.detail}</Link> : r.detail}
                    </td>
                    <td data-label="From">
                      {r.ip || "—"}
                      <small>{device(r.userAgent)}</small>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {more && (
          <p className="lg-more">
            <Link className="ad-btn ad-btn-sm" href={qs({ before: String(rows[rows.length - 1].id) })}>
              Older entries →
            </Link>
          </p>
        )}
      </Card>
    </>
  );
}

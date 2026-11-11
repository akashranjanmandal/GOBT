import type { Metadata } from "next";
import { requireAdmin } from "@/lib/referral/auth";
import { recentActivity } from "@/lib/referral/stats";
import { PageHead } from "@/components/referral/adminui";
import { Card, Empty, fmtTime } from "@/components/referral/ui";

export const metadata: Metadata = { title: "Activity" };

const KINDS: Record<string, string> = {
  joined: "Sign-ups",
  profile: "Profiles",
  share: "Shares",
  lead: "Leads",
  lead_status: "Lead updates",
  payment: "Client payments",
  commission: "Commissions",
  redeem: "Redemption requests",
  redemption: "Redemptions",
  blocked: "Suspensions",
  unblocked: "Suspensions",
  admin_login: "Admin logins",
};

type Props = { searchParams: Promise<{ kind?: string }> };

export default async function Activity({ searchParams }: Props) {
  await requireAdmin();
  const { kind } = await searchParams;
  const all = await recentActivity(400);
  const rows = kind ? all.filter((a) => a.kind === kind || KINDS[a.kind] === KINDS[kind]) : all;
  const kinds = [...new Set(all.map((a) => KINDS[a.kind] ?? a.kind))];

  return (
    <>
      <PageHead title="Activity" help="A timeline of everything that happens in the program: sign-ups, shares, leads, admin updates and payments." />
      <nav className="ad-filter" aria-label="Filter activity">
        <a href="/referral/admin/activity" className={!kind ? "is-active" : ""}>
          Everything
        </a>
        {kinds.map((label) => {
          const k = Object.keys(KINDS).find((x) => KINDS[x] === label) ?? label;
          return (
            <a key={label} href={`/referral/admin/activity?kind=${k}`} className={kind && KINDS[kind] === label ? "is-active" : ""}>
              {label}
            </a>
          );
        })}
      </nav>
      <Card title={`${rows.length} events`} help="Latest first. Times are Indian Standard Time.">
        {rows.length === 0 ? (
          <Empty>Nothing has happened yet.</Empty>
        ) : (
          <ul className="ad-feed ad-feed-lg">
            {rows.map((f) => (
              <li key={f.id}>
                <span className={`ad-dot ad-dot-${f.kind}`} aria-hidden="true" />
                <span>
                  {f.detail}
                  <small>
                    {fmtTime(f.at)} · {KINDS[f.kind] ?? f.kind}
                  </small>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

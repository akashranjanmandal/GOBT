import type { Metadata } from "next";
import { requireAdmin } from "@/lib/referral/auth";
import { adminAccounts } from "@/lib/referral/stats";
import { PageHead } from "@/components/referral/adminui";
import { ChangePasswordForm } from "@/components/referral/AdminForms";
import { Card, ago } from "@/components/referral/ui";

export const metadata: Metadata = { title: "My account" };

export default async function Account() {
  const admin = await requireAdmin();
  const admins = await adminAccounts();
  return (
    <>
      <PageHead title="My account" help={`Logged in as ${admin.name} (${admin.email}). You stay logged in for 12 hours.`} />
      <div className="ad-grid2">
        <Card title="Change my password" help="Everyone starts with the same password. Please change yours to one only you know.">
          <ChangePasswordForm />
        </Card>
        <Card title="Admin accounts" help="These people can open this admin panel. Referrers can never log in here.">
          <ul className="ad-admins">
            {admins.map((a) => (
              <li key={a.id}>
                <b>
                  {a.name}
                  {a.id === admin.id && <span className="ad-chip ad-chip-won">You</span>}
                </b>
                <small>
                  {a.email} · last login {ago(a.lastLoginAt)}
                </small>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { currentAdmin } from "@/lib/referral/auth";
import { attention } from "@/lib/referral/stats";
import AdminNav from "@/components/referral/AdminNav";
import { adminLogoutAction } from "./admin/actions";

export const metadata: Metadata = { title: { default: "Admin", template: "%s | GOBT Referral Admin" }, robots: { index: false } };

/* The admin panel's own chrome: a sidebar on desktop, a scrollable tab
   bar on phones. Not logged in → just the page (the login form). */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await currentAdmin();
  if (!admin) return <div className="ad ad-bare">{children}</div>;

  const a = await attention();
  const badges = {
    "/referral/admin/leads": a.newLeads,
    "/referral/admin/money": a.pendingCommissions + a.redemptionRequests,
  };

  return (
    <div className="ad">
      <aside className="ad-side">
        <Link href="/referral/admin" className="ad-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" width={389} height={363} />
          <span>
            Referral admin
            <small>GOBT</small>
          </span>
        </Link>
        <AdminNav badges={badges} />
        <div className="ad-me">
          <span>
            {admin.name}
            <small>{admin.email}</small>
          </span>
          <form action={adminLogoutAction}>
            <button className="ad-link">Log out</button>
          </form>
        </div>
      </aside>
      <main className="ad-main">{children}</main>
    </div>
  );
}

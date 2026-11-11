import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/referral/auth";
import { AdminLoginForm } from "@/components/referral/AdminForms";

export const metadata: Metadata = { title: "Admin login" };

export default async function AdminLogin() {
  if (await currentAdmin()) redirect("/referral/admin");
  return (
    <div className="ad-login">
      <div className="ad-login-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="GOBT" width={389} height={363} className="ad-login-logo" />
        <h1>Referral program admin</h1>
        <p>For GOBT staff only. Referrers log in at gobt.in/referral/login.</p>
        <AdminLoginForm />
      </div>
    </div>
  );
}

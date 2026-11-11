import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/referral/auth";
import LoginForm from "@/components/referral/LoginForm";

export const metadata: Metadata = {
  title: "Log in or join",
  robots: { index: false },
};

export default async function LoginPage() {
  if (await currentUser()) redirect("/referral/dashboard");
  return (
    <main className="rf-main rf-wrap rf-auth">
      <div className="rf-auth-card">
        <span className="rf-sticker rf-sticker-mint">Join or log in</span>
        <h1 className="rf-h2">Start referring in 30 seconds.</h1>
        <LoginForm />
      </div>
    </main>
  );
}

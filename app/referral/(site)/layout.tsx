import Link from "next/link";
import type { ReactNode } from "react";
import { currentUser } from "@/lib/referral/auth";
import { logoutAction } from "../actions";

/* The referral programme's public chrome: a chunky header and a small
   footer, instead of the main site's nav and footer. */
export default async function SiteLayout({ children }: { children: ReactNode }) {
  const user = await currentUser();
  return (
    <div className="rf">
      <header className="rf-head">
        <Link href="/referral" className="rf-brand" aria-label="GOBT Referral Program home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" width={389} height={363} />
          <span className="rf-brand-pill">Referral</span>
        </Link>
        <nav className="rf-nav" aria-label="Referral program">
          <Link href="/referral#how">How it works</Link>
          <Link href="/referral#rewards">Rewards</Link>
          <Link href="/referral#faq">FAQ</Link>
          <Link href="/referral/terms">Rules</Link>
        </nav>
        <div className="rf-head-actions">
          {user ? (
            <>
              <Link href="/referral/dashboard" className="rf-btn rf-btn-gold rf-btn-sm">
                My dashboard
              </Link>
              <form action={logoutAction}>
                <button className="rf-link" type="submit">
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/referral/login" className="rf-link">
                Log in
              </Link>
              <Link href="/referral/login" className="rf-btn rf-btn-gold rf-btn-sm">
                Join free
              </Link>
            </>
          )}
        </div>
      </header>

      {children}

      <footer className="rf-foot">
        <span>© {new Date().getFullYear()} GOBT, Group Of Blooming Technicians, Kolkata</span>
        <nav aria-label="Footer">
          <Link href="/">gobt.in</Link>
          <Link href="/referral/terms">Program rules</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/#contact">Contact</Link>
        </nav>
      </footer>
    </div>
  );
}

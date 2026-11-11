import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./referral.css";
import "./dashboards.css";

export const metadata: Metadata = {
  title: { default: "Referral Program: Earn 5% for Every Client You Refer", template: "%s | GOBT Referral Program" },
};

/* The public referral pages and the admin panel have their own chrome
   (see the (site) and (admin) groups); this layout only loads the styles. */
export default function ReferralRootLayout({ children }: { children: ReactNode }) {
  return children;
}

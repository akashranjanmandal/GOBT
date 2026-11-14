"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/referral/admin", label: "Overview", icon: "◎" },
  { href: "/referral/admin/referrers", label: "Referrers", icon: "☺" },
  { href: "/referral/admin/leads", label: "Leads", icon: "✉" },
  { href: "/referral/admin/money", label: "Payouts", icon: "₹" },
  { href: "/referral/admin/traffic", label: "Link traffic", icon: "↗" },
  { href: "/referral/admin/activity", label: "Activity", icon: "≡" },
  { href: "/referral/admin/academy", label: "Academy", icon: "✎" },
  { href: "/referral/admin/certificates", label: "Certificates", icon: "✦" },
  { href: "/referral/admin/account", label: "My account", icon: "⚙" },
];

export default function AdminNav({ badges }: { badges: Record<string, number> }) {
  const path = usePathname();
  return (
    <nav className="ad-nav" aria-label="Admin sections">
      {LINKS.map((l) => {
        const active = l.href === "/referral/admin" ? path === l.href : path.startsWith(l.href);
        const badge = badges[l.href];
        return (
          <Link key={l.href} href={l.href} className={active ? "is-active" : ""} aria-current={active ? "page" : undefined}>
            <span className="ad-nav-icon" aria-hidden="true">
              {l.icon}
            </span>
            {l.label}
            {badge > 0 && <span className="ad-badge">{badge}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

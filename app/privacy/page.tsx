import type { Metadata } from "next";
import LegalPage from "@/components/ui/LegalPage";
import { SITE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How GOBT (Group Of Blooming Technicians) collects, uses and protects information submitted through gobt.in.",
  alternates: { canonical: "/privacy" },
};

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated="2 October 2026">
      <p>
        This policy explains how {SITE.legalName} (&ldquo;GOBT&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;), based in {SITE.city},{" "}
        {SITE.region}, India, handles personal information collected through {SITE.url.replace("https://", "")}.
      </p>
      <h2>Information we collect</h2>
      <p>
        When you use our contact form we collect the details you enter: your name, email address, company name (optional)
        and your message. If you email or message us on WhatsApp, we receive the details you send. If analytics are enabled
        on the site, we also collect anonymous usage data such as pages visited, device type and approximate location.
      </p>
      <h2>How we use it</h2>
      <ul>
        <li>To reply to your enquiry and discuss your project.</li>
        <li>To prepare proposals, estimates and contracts you ask for.</li>
        <li>To understand how the website is used so we can improve it.</li>
      </ul>
      <p>We do not sell your personal information or use it for unrelated marketing.</p>
      <h2>Sharing</h2>
      <p>
        Your enquiry is delivered to our team by email through our email provider. We share information with service providers
        only as needed to operate the website and respond to you, or where required by law.
      </p>
      <h2>Retention</h2>
      <p>We keep enquiry details for as long as needed to respond and manage our relationship with you, then delete them.</p>
      <h2>Your rights</h2>
      <p>
        In line with the Digital Personal Data Protection Act, 2023, you can ask us to access, correct or delete the personal
        information we hold about you, or withdraw consent, by emailing <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
      </p>
      <h2>Cookies</h2>
      <p>
        The site uses only what is needed to work. If analytics are enabled, they may set cookies to measure visits; you can
        block cookies in your browser settings.
      </p>
      <h2>Contact</h2>
      <p>
        Questions about this policy: <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
      </p>
    </LegalPage>
  );
}

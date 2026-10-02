import type { Metadata } from "next";
import LegalPage from "@/components/ui/LegalPage";
import { SITE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms for using the GOBT (Group Of Blooming Technicians) website, gobt.in.",
  alternates: { canonical: "/terms" },
};

export default function Terms() {
  return (
    <LegalPage title="Terms of Use" updated="2 October 2026">
      <p>
        These terms govern your use of {SITE.url.replace("https://", "")}, operated by {SITE.legalName}, {SITE.city}, India. By
        using the website you agree to them.
      </p>
      <h2>Use of the website</h2>
      <p>
        You may browse the site and contact us for business purposes. You agree not to misuse it — for example by attempting
        to disrupt it, access it without authorisation, or submit unlawful or misleading information.
      </p>
      <h2>Content and intellectual property</h2>
      <p>
        The website&apos;s design, text, graphics and code belong to GOBT unless stated otherwise. Client names, logos and
        project screenshots belong to their respective owners and are shown to describe our work.
      </p>
      <h2>Estimates and information</h2>
      <p>
        Timelines and estimates shown on the website, including the project estimator, are indicative only. A binding scope,
        price and timeline are agreed in a written proposal or contract.
      </p>
      <h2>Third-party links</h2>
      <p>Links to client websites and other services are provided for reference; we are not responsible for their content.</p>
      <h2>Liability</h2>
      <p>
        The website is provided &ldquo;as is&rdquo;. To the extent permitted by law, GOBT is not liable for losses arising from its use.
      </p>
      <h2>Governing law</h2>
      <p>These terms are governed by the laws of India, with courts in Kolkata, West Bengal having jurisdiction.</p>
      <h2>Contact</h2>
      <p>
        Questions about these terms: <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
      </p>
    </LegalPage>
  );
}

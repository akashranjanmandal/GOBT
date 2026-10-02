import { HOME_FAQS } from "@/lib/seo";
import SectionHead from "@/components/ui/SectionHead";

/* Visible FAQ — mirrors the FAQPage structured data on the homepage */
export default function Faq() {
  return (
    <section id="faq" className="faq-section">
      <div className="wrap">
        <SectionHead title="Questions, *answered.*" lede="What businesses usually ask before they start a project with us." />
        <div className="faq" data-reveal="stagger">
          {HOME_FAQS.map((f) => (
            <details className="faq-item" key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

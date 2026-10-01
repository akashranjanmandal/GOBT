import Experience from "@/components/Experience";
import Hero from "@/components/sections/Hero";
import Services from "@/components/sections/Services";
import Work from "@/components/sections/Work";
import Clients from "@/components/sections/Clients";
import Process from "@/components/sections/Process";
import Why from "@/components/sections/Why";
import Security from "@/components/sections/Security";
import Estimate from "@/components/sections/Estimate";
import Testimonials from "@/components/sections/Testimonials";
import Team from "@/components/sections/Team";
import Careers from "@/components/sections/Careers";
import Contact from "@/components/sections/Contact";
import Footer from "@/components/sections/Footer";

/* Sections render on the server for real HTML (SEO, first paint);
   motion and WebGL attach on the client inside Experience. */
export default function Page() {
  return (
    <Experience>
      <Hero />
      <Services />
      <Work />
      <Clients />
      <Process />
      <Why />
      <Security />
      <Estimate />
      <Testimonials />
      <Team />
      <Careers />
      <Contact />
      <Footer />
    </Experience>
  );
}

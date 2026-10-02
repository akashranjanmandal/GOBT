/* ──────────────────────────────────────────
   SEO DATA
   Site identity for metadata + structured data, and the content of
   the per-service landing pages (/services/[slug]). Each page owns
   one search intent ("web development company in India", …) so it
   can rank for it, instead of the homepage trying to rank for all.
────────────────────────────────────────── */

export const SITE = {
  url: "https://gobt.in",
  name: "GOBT",
  legalName: "GOBT — Group Of Blooming Technicians",
  tagline: "Deep-Tech, AI & Software Development Company in India",
  description:
    "GOBT (Group Of Blooming Technicians) is a DPIIT-recognised deep-tech company in Kolkata, India, delivering AI solutions, digital transformation, web development, mobile app development and custom software for businesses across India.",
  email: "info@gobt.in",
  phone: "+91-8972297093",
  city: "Kolkata",
  region: "West Bengal",
  country: "IN",
  sameAs: ["https://www.instagram.com/gobt.in/", "https://www.facebook.com/profile.php?id=61561011544267"],
};

export const KEYWORDS = [
  "deep tech company in India",
  "deep tech startup India",
  "AI development company India",
  "digital transformation company India",
  "web development company India",
  "web development company Kolkata",
  "mobile app development company India",
  "app development company Kolkata",
  "custom software development company India",
  "software development company Kolkata",
  "IoT development company India",
  "UI UX design agency India",
  "Next.js development India",
  "React Native app development India",
  "DPIIT recognised startup",
  "GOBT",
  "Group Of Blooming Technicians",
];

export type Faq = { q: string; a: string };

export type ServicePage = {
  slug: string;
  name: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  h1: string;
  lede: string;
  overview: string[];
  offerings: { t: string; d: string }[];
  stack: string[];
  /* WORKS ids to show as proof */
  work: number[];
  faqs: Faq[];
};

export const SERVICE_PAGES: ServicePage[] = [
  {
    slug: "deep-tech-ai-solutions",
    name: "Deep-Tech & AI Solutions",
    metaTitle: "Deep-Tech & AI Development Company in India",
    metaDescription:
      "DPIIT-recognised deep-tech company in India building AI solutions, intelligent automation, recommendation engines and cyber-physical systems. Talk to GOBT, Kolkata.",
    keywords: ["deep tech company India", "AI development company India", "AI solutions India", "machine learning company Kolkata", "AI automation services"],
    h1: "Deep-tech & AI development company in India",
    lede: "We are a DPIIT-recognised deep-tech startup that builds AI that does real work — automating decisions, recommending, predicting and connecting software to the physical world.",
    overview: [
      "Deep-tech is where research meets production. At GOBT we take AI, robotics (ROS), IoT, AR/VR and digital twins out of the lab and into products that businesses use every day — engineered to be reliable, measurable and owned by you.",
      "Our work is aligned with the vision of Make in India and Atmanirbhar Bharat: building intelligent, cyber-physical systems in India, for Indian businesses and for the world.",
    ],
    offerings: [
      { t: "AI-powered automation", d: "Workflows that remove repetitive work — document handling, routing, scheduling and decision support." },
      { t: "Recommendation engines", d: "Personalised product and content recommendations, like the AI gifting engine we built for GFTD." },
      { t: "Predictive analytics", d: "Models that forecast demand, churn or failures from the data you already collect." },
      { t: "Computer vision & 3D", d: "Real-time 3D and visual experiences, such as the WebGL product inspector built for Tata Communications." },
      { t: "Cyber-physical systems", d: "Software connected to sensors, devices and robots (ROS), with digital twins to monitor them." },
      { t: "AI integration", d: "Adding AI capabilities to your existing website, app or internal tools without rebuilding them." },
    ],
    stack: ["Python", "Go", "Node.js", "Three.js", "WebGL", "ROS", "PostgreSQL", "AWS"],
    work: [19, 3],
    faqs: [
      { q: "What is a deep-tech company?", a: "A deep-tech company builds products on substantial engineering or scientific advances — AI, robotics, IoT, AR/VR and digital twins — rather than only assembling existing tools. GOBT is a DPIIT-recognised deep-tech startup based in Kolkata." },
      { q: "Can you add AI to our existing software?", a: "Yes. Most of our AI work plugs into systems clients already run — a recommendation engine for an e-commerce store, automation inside a dashboard, or analytics on existing data." },
      { q: "Do you work with businesses outside Kolkata?", a: "Yes. We work with clients across India and remotely, with the same weekly previews and direct access to the engineers building your product." },
    ],
  },
  {
    slug: "digital-transformation",
    name: "Digital Transformation",
    metaTitle: "Digital Transformation Company in India",
    metaDescription:
      "End-to-end digital transformation for Indian businesses — websites, apps, dashboards, automation and AI that modernise how you sell and operate. GOBT, Kolkata.",
    keywords: ["digital transformation company India", "digital transformation services Kolkata", "business digitisation India", "digital transformation for SMEs"],
    h1: "Digital transformation company in India",
    lede: "We take businesses from paper, spreadsheets and phone calls to software that sells, serves and runs operations — one measurable step at a time.",
    overview: [
      "Digital transformation is not a new logo or a website on its own. It is the moment your customers can find you, buy from you and get served without friction — and your team stops doing by hand what software can do.",
      "We have delivered complete digital transformations for engineering consultancies, educational institutions, retail brands and service marketplaces across India: corporate presence, booking and e-commerce platforms, internal dashboards and mobile apps, delivered as one connected system.",
    ],
    offerings: [
      { t: "Digital strategy & scoping", d: "A short brief that maps where time and revenue are lost today and what to build first." },
      { t: "Websites & customer portals", d: "Fast, SEO-ready websites and portals that turn visitors into enquiries and customers." },
      { t: "Operations dashboards", d: "Internal tools that replace spreadsheets — orders, inventory, bookings, staff and reporting." },
      { t: "Mobile apps", d: "Customer and field apps with live tracking, booking and payments." },
      { t: "Automation & AI", d: "Automating repetitive processes and adding intelligence where it pays off." },
      { t: "Training & handover", d: "You own the code and the system, and your team knows how to run it." },
    ],
    stack: ["Next.js", "React Native", "Node.js", "Go", "PostgreSQL", "Firebase", "AWS"],
    work: [2, 18, 17],
    faqs: [
      { q: "Where should a small business start its digital transformation?", a: "With the process that costs the most time or loses the most customers — usually enquiries, bookings or order handling. We scope that first, ship a working version within weeks, and expand from there." },
      { q: "How long does a digital transformation project take?", a: "A first phase such as a website or dashboard typically takes 2–8 weeks depending on scope. Larger transformations are delivered in phases, with working previews every few days." },
      { q: "Do we own what you build?", a: "Yes. You get the full source code and ownership of every system we deliver, with no lock-in to a proprietary platform." },
    ],
  },
  {
    slug: "web-development",
    name: "Web Development",
    metaTitle: "Web Development Company in India | Kolkata",
    metaDescription:
      "High-performance, SEO-optimised websites, web apps, e-commerce and dashboards built with Next.js. A web development company in Kolkata serving all of India.",
    keywords: ["web development company India", "web development company Kolkata", "website development services India", "Next.js development company", "e-commerce website development India"],
    h1: "Web development company in India",
    lede: "Websites, web apps and e-commerce platforms that load fast, rank on Google and convert visitors into customers — built in Kolkata for businesses across India.",
    overview: [
      "Every website we ship is engineered for three things: speed, search visibility and conversion. We build with Next.js and modern, maintainable stacks, so your site scores well on Core Web Vitals and stays easy to grow.",
      "From corporate sites for engineering consultancies to luxury e-commerce, booking platforms and marketplaces, we have launched 25+ products — with SEO and performance baked in from day one, not added later.",
    ],
    offerings: [
      { t: "Corporate & business websites", d: "Premium, fast company websites that build trust and generate enquiries." },
      { t: "E-commerce development", d: "Online stores with payments (Razorpay, Stripe), inventory and order management." },
      { t: "Web applications", d: "Booking systems, portals and SaaS products with secure accounts and real-time data." },
      { t: "Admin dashboards", d: "Internal dashboards for operations, reporting and client management." },
      { t: "Website redesign", d: "Modernising slow or outdated sites without losing existing search rankings." },
      { t: "Performance & SEO engineering", d: "Technical SEO, structured data and Core Web Vitals optimisation." },
    ],
    stack: ["Next.js", "React", "Node.js", "Tailwind", "PostgreSQL", "MongoDB", "Shopify", "GSAP"],
    work: [1, 2, 6, 5, 11],
    faqs: [
      { q: "How much does website development cost in India?", a: "It depends on scope. A focused business website typically takes 2–4 weeks; web apps and e-commerce platforms take 4–8 weeks. Use the estimator on our homepage for a starting point, then we give a fixed quote after a short call." },
      { q: "Will my website be SEO-friendly?", a: "Yes. Every site ships with semantic structure, metadata, structured data, sitemaps and fast loading — the technical foundations Google ranks on." },
      { q: "Which technology do you use for websites?", a: "Mostly Next.js and React for speed and SEO, with Node.js or Go on the backend and Shopify where it fits e-commerce needs." },
    ],
  },
  {
    slug: "mobile-app-development",
    name: "Mobile App Development",
    metaTitle: "Mobile App Development Company in India",
    metaDescription:
      "Android and iOS app development with React Native — booking, delivery, marketplace and business apps with live tracking and payments. GOBT, Kolkata, India.",
    keywords: ["mobile app development company India", "app development company Kolkata", "React Native app development India", "Android app development India", "iOS app development India"],
    h1: "Mobile app development company in India",
    lede: "Android and iOS apps with live tracking, real-time booking and payments — built once with React Native, shipped to both stores.",
    overview: [
      "We build mobile apps that people keep on their phones: fast, reliable and designed around real user journeys. Using React Native, one codebase serves Android and iOS, which keeps delivery quick and maintenance affordable.",
      "Our apps include a food-ordering app with live tracking, POS integration and driver dispatch, and an on-demand home-services marketplace connecting customers with 500+ technicians in real time.",
    ],
    offerings: [
      { t: "Android & iOS apps", d: "Cross-platform apps with native performance using React Native." },
      { t: "On-demand & marketplace apps", d: "Booking, dispatch and live-tracking apps for services and delivery." },
      { t: "E-commerce & ordering apps", d: "Catalogues, carts, payments and order tracking." },
      { t: "Business & field apps", d: "Apps for staff, sales teams and field operations." },
      { t: "Backend & APIs", d: "Secure, scalable backends with Node.js, Go and Firebase." },
      { t: "Launch & maintenance", d: "Store submission, monitoring and ongoing improvements after launch." },
    ],
    stack: ["React Native", "Firebase", "Node.js", "Go", "Maps API", "Socket.io", "MongoDB"],
    work: [7, 8, 18],
    faqs: [
      { q: "How long does it take to build a mobile app?", a: "A focused first version usually takes 4–8 weeks, depending on features. You see working builds every few days during development." },
      { q: "Do you build for both Android and iOS?", a: "Yes. We use React Native to ship one codebase to both platforms, which reduces cost and keeps the apps in sync." },
      { q: "Can you add live tracking and payments?", a: "Yes — live location tracking, real-time updates and payment gateways are standard parts of the apps we build." },
    ],
  },
  {
    slug: "custom-software-development",
    name: "Custom Software Development",
    metaTitle: "Custom Software Development Company in India",
    metaDescription:
      "Bespoke software, APIs, microservices and internal tools engineered around how your business works. Custom software development by GOBT, Kolkata, India.",
    keywords: ["custom software development company India", "software development company Kolkata", "bespoke software India", "microservices development India", "software solutions company India"],
    h1: "Custom software development company in India",
    lede: "When off-the-shelf tools don't fit, we engineer software around how your business actually works — platforms, APIs, microservices and internal tools.",
    overview: [
      "Custom software pays off when it removes work that generic tools force on your team. We start from your processes, design the simplest architecture that fits, and build it to scale — with clean code you own outright.",
      "Our engineers build backend systems in Go and Node.js on PostgreSQL and cloud infrastructure (AWS, Azure), with microservice architectures where the scale needs them and monoliths where it doesn't.",
    ],
    offerings: [
      { t: "Business platforms & SaaS", d: "Multi-user platforms with roles, billing and integrations." },
      { t: "APIs & integrations", d: "Connecting your systems — payments, ERPs, CRMs and third-party services." },
      { t: "Microservices & backends", d: "Scalable, maintainable backends in Go and Node.js." },
      { t: "Internal tools & dashboards", d: "Software that replaces spreadsheets and manual processes." },
      { t: "Data pipelines", d: "Capturing, cleaning and structuring the data your decisions run on." },
      { t: "Cloud & DevOps", d: "Deployment, monitoring and reliable infrastructure on AWS or Azure." },
    ],
    stack: ["Go", "Node.js", "PostgreSQL", "MongoDB", "Redis", "AWS", "Azure", "Docker"],
    work: [10, 3, 18],
    faqs: [
      { q: "Is custom software better than off-the-shelf tools?", a: "When your process is a competitive advantage or generic tools force workarounds, yes. When a standard tool fits, we will tell you — and integrate it instead of rebuilding it." },
      { q: "Who owns the source code?", a: "You do. Every project includes full source code and ownership, with no proprietary lock-in." },
      { q: "Do you provide support after launch?", a: "Yes. Post-launch support is included, and we plan improvements with you after go-live." },
    ],
  },
  {
    slug: "ui-ux-design",
    name: "UI/UX Design",
    metaTitle: "UI/UX Design Agency in India",
    metaDescription:
      "Research-led UI/UX design for websites, apps and dashboards — wireframes, Figma prototypes and design systems that convert. GOBT design studio, Kolkata.",
    keywords: ["UI UX design agency India", "UI UX design company Kolkata", "Figma design services India", "app UI design India", "website UX design"],
    h1: "UI/UX design agency in India",
    lede: "Interfaces designed around your users and prototyped in Figma before a single line of code is written.",
    overview: [
      "Good design is how your product earns trust in the first few seconds. We research who your users are and what they need, then design clear, beautiful interfaces that guide them to act.",
      "Because the same team designs and builds, what you approve in Figma is exactly what ships — no lost-in-translation handovers.",
    ],
    offerings: [
      { t: "User research & flows", d: "Understanding users and mapping the journeys that matter." },
      { t: "Wireframes & prototypes", d: "Clickable Figma prototypes you can test before development." },
      { t: "Visual & interface design", d: "Premium, on-brand interfaces for web, mobile and dashboards." },
      { t: "Design systems", d: "Reusable components that keep products consistent as they grow." },
      { t: "UX audits", d: "Finding and fixing what makes users drop off." },
      { t: "Branding", d: "Identity systems — logo, colour, type and voice." },
    ],
    stack: ["Figma", "Prototyping", "Design systems", "Tailwind", "GSAP"],
    work: [1, 6, 5],
    faqs: [
      { q: "Do you design and develop, or only design?", a: "Both. The same team designs and builds, so the shipped product matches the approved design exactly." },
      { q: "Can you redesign our existing app or website?", a: "Yes. We audit what exists, keep what works, and redesign the parts that cost you users." },
      { q: "Which design tool do you use?", a: "Figma, with interactive prototypes you can click through and share with your team." },
    ],
  },
  {
    slug: "iot-smart-devices",
    name: "IoT & Smart Devices",
    metaTitle: "IoT Development Company in India | Digital Twin & ROS",
    metaDescription:
      "IoT solutions, connected devices, ROS robotics software and digital twins — cyber-physical systems built in India by DPIIT-recognised deep-tech startup GOBT.",
    keywords: ["IoT development company India", "IoT solutions Kolkata", "digital twin India", "ROS development India", "smart devices development"],
    h1: "IoT & smart device development in India",
    lede: "Connecting the physical and digital worlds — sensors, devices, robots and the software that monitors and controls them.",
    overview: [
      "IoT turns machines and spaces into sources of real-time data and control. We build the full stack: device integration, secure data pipelines, cloud backends, dashboards and apps.",
      "As a deep-tech startup working with ROS, AR/VR and digital twins, we design cyber-physical systems where a live digital model mirrors the real one — for monitoring, prediction and automation.",
    ],
    offerings: [
      { t: "Connected device software", d: "Firmware integration and secure device-to-cloud communication." },
      { t: "Real-time dashboards", d: "Live monitoring and alerts for devices, machines and sites." },
      { t: "Digital twins", d: "Virtual models of physical systems for simulation and prediction." },
      { t: "Robotics software (ROS)", d: "Control and integration software for robotic systems." },
      { t: "Mobile control apps", d: "Apps to monitor and control devices from anywhere." },
      { t: "Data & analytics", d: "Turning sensor data into decisions and automation." },
    ],
    stack: ["ROS", "MQTT", "Go", "Node.js", "Three.js", "PostgreSQL", "AWS IoT"],
    work: [19],
    faqs: [
      { q: "What is a digital twin?", a: "A live digital model of a physical object or system, fed by real sensor data, used to monitor it, simulate changes and predict problems before they happen." },
      { q: "Do you build both the hardware integration and the software?", a: "We build the software stack end to end — device integration, cloud, dashboards and apps — and work with your hardware or partners for the devices themselves." },
    ],
  },
  {
    slug: "cyber-security",
    name: "Cyber Security & QA",
    metaTitle: "Cyber Security & Software Testing Services in India",
    metaDescription:
      "Security audits, penetration testing and QA for websites, apps and software — we find vulnerabilities before your users do. GOBT, Kolkata, India.",
    keywords: ["cyber security services India", "penetration testing India", "website security audit India", "software testing company Kolkata", "QA testing services India"],
    h1: "Cyber security & QA services in India",
    lede: "Every build goes through a security and QA pass before launch — and we can audit the software you already run.",
    overview: [
      "Most breaches exploit ordinary mistakes: injectable queries, exposed secrets, weak access rules and outdated dependencies. We find and fix them before attackers or customers do.",
      "Security and QA are part of how we deliver every product, and we also offer them as a standalone service for existing websites, apps and APIs.",
    ],
    offerings: [
      { t: "Security audits", d: "Reviewing code, configuration and infrastructure for vulnerabilities." },
      { t: "Penetration testing", d: "Testing your application the way an attacker would." },
      { t: "Dependency & secret scanning", d: "Finding vulnerable libraries and exposed keys." },
      { t: "QA & testing", d: "Functional, regression and device testing before every release." },
      { t: "Performance testing", d: "Making sure systems stay fast under real load." },
      { t: "Remediation", d: "Fixing what we find, not just reporting it." },
    ],
    stack: ["OWASP", "Static analysis", "Dependency scanning", "Automated testing"],
    work: [17],
    faqs: [
      { q: "Can you audit a website or app you didn't build?", a: "Yes. We audit existing websites, apps and APIs and help your team fix what we find." },
      { q: "What do you check in a security audit?", a: "Common vulnerability classes such as injection, cross-site scripting, broken access control, exposed secrets and outdated dependencies, plus configuration and infrastructure." },
    ],
  },
  {
    slug: "digital-growth-seo",
    name: "Digital Growth & SEO",
    metaTitle: "SEO & Digital Growth Services in India",
    metaDescription:
      "Technical SEO, performance optimisation and conversion funnels that turn traffic into enquiries. Data-driven digital growth services from GOBT, Kolkata.",
    keywords: ["SEO services India", "SEO company Kolkata", "technical SEO India", "conversion rate optimisation India", "digital growth agency"],
    h1: "SEO & digital growth services in India",
    lede: "Search visibility, speed and conversion funnels that turn traffic into qualified enquiries.",
    overview: [
      "Ranking starts with engineering: fast pages, clean structure and structured data that search engines understand. On top of that we build landing pages and funnels designed to convert.",
      "For a Government e-Marketplace (GeM) consulting portal we built a conversion-focused funnel with targeted SEO; the client reported their inquiry rate tripled in the first month.",
    ],
    offerings: [
      { t: "Technical SEO", d: "Site structure, metadata, structured data, sitemaps and indexing." },
      { t: "Core Web Vitals", d: "Speed optimisation that improves rankings and conversions." },
      { t: "Local SEO", d: "Visibility for searches in your city and region." },
      { t: "Landing pages & funnels", d: "Pages built around one search intent and one action." },
      { t: "Analytics & tracking", d: "Measuring what works so budget goes where it pays." },
      { t: "Content structure", d: "Service and FAQ content organised the way people search." },
    ],
    stack: ["Next.js", "Structured data", "Search Console", "Analytics", "Core Web Vitals"],
    work: [17, 2],
    faqs: [
      { q: "How long does SEO take to show results?", a: "Technical fixes can show impact within weeks; competitive rankings usually build over several months, depending on competition, content and backlinks." },
      { q: "Can you improve the SEO of my existing website?", a: "Yes. We audit technical SEO and performance, fix what holds the site back and restructure content around how your customers search." },
    ],
  },
  {
    slug: "ar-vr-game-development",
    name: "AR/VR & 3D Experiences",
    metaTitle: "AR/VR, 3D & Game Development Company in India",
    metaDescription:
      "Real-time 3D, WebGL, AR/VR and interactive experiences for products, training and marketing. 3D web and game development by GOBT, Kolkata, India.",
    keywords: ["AR VR development company India", "3D web development India", "WebGL development India", "game development company Kolkata", "interactive 3D experiences"],
    h1: "AR/VR, 3D & game development in India",
    lede: "Real-time 3D and immersive experiences that people want to explore — in the browser, on mobile and in AR/VR.",
    overview: [
      "Interactive 3D sells products and explains complex things better than any photo. We build real-time 3D experiences with Three.js and WebGL that run in the browser, with no app install required.",
      "For a Tata Communications initiative we built an immersive 3D eyewear fitting and inspection tool with real-time 360° rotation, frame specs and multi-model switching.",
    ],
    offerings: [
      { t: "3D product configurators", d: "Explore, rotate and customise products in real time." },
      { t: "WebGL experiences", d: "Immersive, interactive brand and marketing experiences." },
      { t: "AR/VR applications", d: "Augmented and virtual reality for training, retail and demos." },
      { t: "Games & gamification", d: "Interactive games for engagement, learning and campaigns." },
      { t: "Digital twins & visualisation", d: "3D views of spaces, machines and data." },
      { t: "Performance optimisation", d: "Smooth 3D on everyday phones and laptops." },
    ],
    stack: ["Three.js", "WebGL", "React", "GSAP", "Blender"],
    work: [19],
    faqs: [
      { q: "Do 3D experiences work on mobile phones?", a: "Yes. We optimise models, textures and rendering so experiences run smoothly in mobile browsers without an app." },
      { q: "Can customers try products in 3D on our website?", a: "Yes — 3D product viewers and configurators can be embedded directly into your website or store." },
    ],
  },
];

export const HOME_FAQS: Faq[] = [
  { q: "What does GOBT do?", a: "GOBT (Group Of Blooming Technicians) is a DPIIT-recognised deep-tech company in Kolkata that builds AI solutions, websites, web apps, mobile apps, custom software, IoT systems and 3D experiences for businesses across India." },
  { q: "Is GOBT a web development and app development company?", a: "Yes. We design and develop websites, e-commerce platforms, dashboards and Android/iOS apps, alongside deep-tech work in AI, IoT and AR/VR." },
  { q: "Do you work with clients across India?", a: "Yes. We are based in Kolkata and work with businesses across India, with weekly working previews and direct access to the engineers building your product." },
  { q: "How long does a project take?", a: "A website typically takes 2–4 weeks and a web or mobile app 4–8 weeks, depending on scope. You see working previews every few days." },
  { q: "Do we own the source code?", a: "Yes. You get the full source code and ownership of everything we build, with no lock-in to a proprietary platform, and post-launch support is included." },
];

export const servicePath = (slug: string) => `/services/${slug}`;

/* JSON for <script type="application/ld+json">, with "<" escaped so a
   string can never close the script tag */
export const jsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");

export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Organization", "ProfessionalService"],
        "@id": `${SITE.url}/#organization`,
        name: SITE.name,
        legalName: SITE.legalName,
        alternateName: "Group Of Blooming Technicians",
        url: SITE.url,
        logo: `${SITE.url}/logo.png`,
        image: `${SITE.url}/opengraph-image`,
        description: SITE.description,
        email: SITE.email,
        telephone: SITE.phone,
        address: { "@type": "PostalAddress", addressLocality: SITE.city, addressRegion: SITE.region, addressCountry: SITE.country },
        areaServed: { "@type": "Country", name: "India" },
        sameAs: SITE.sameAs,
        knowsAbout: ["Artificial intelligence", "Digital transformation", "Web development", "Mobile app development", "Custom software development", "Internet of things", "Digital twin", "Robot Operating System", "UI/UX design", "Cyber security", "Augmented reality", "Virtual reality"],
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Software & deep-tech services",
          itemListElement: SERVICE_PAGES.map((s) => ({
            "@type": "Offer",
            itemOffered: { "@type": "Service", name: s.name, url: `${SITE.url}${servicePath(s.slug)}` },
          })),
        },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE.url}/#website`,
        url: SITE.url,
        name: SITE.name,
        publisher: { "@id": `${SITE.url}/#organization` },
        inLanguage: "en-IN",
      },
    ],
  };
}

export function faqLd(faqs: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

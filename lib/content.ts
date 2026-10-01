/* ──────────────────────────────────────────
   SITE CONTENT
   Every section reads its copy and data from here, so wording can
   change without touching layout or animation code.
────────────────────────────────────────── */

/* Section links — used by the footer (the header carries only the CTA) */
export const NAV_ITEMS = [
  { label: "Services", id: "services" },
  { label: "Work", id: "work" },
  { label: "Process", id: "process" },
  { label: "Why GOBT", id: "why" },
  { label: "Estimate", id: "estimate" },
  { label: "Team", id: "team" },
  { label: "Careers", id: "careers" },
  { label: "Contact", id: "contact" },
] as const;

export const CONTACT = {
  email: "info@gobt.in",
  whatsapp: "https://wa.me/918972297093",
  location: "Kolkata, India",
  coords: "22.5726° N · 88.3639° E",
};

export const SOCIALS = [
  { label: "Instagram", href: "https://www.instagram.com/gobt.in/" },
  { label: "Facebook", href: "https://www.facebook.com/profile.php?id=61561011544267" },
  { label: "WhatsApp", href: "https://wa.me/918972297093" },
  { label: "LinkedIn", href: "https://linkedin.com" },
];

export const HERO = {
  eyebrow: "Group Of Blooming Technicians",
  badge: { title: "DPIIT Recognised Startup", sub: "Government of India" },
  lede: "A deep-tech AI startup recognised by DPIIT, exploring cutting-edge technology to integrate cyber-physical systems, aligned with the vision of Make in India and Atmanirbhar Bharat.",
  chips: ["AI", "ROS", "Software Development", "IoT", "AR / VR", "Digital Twin"],
};

export type Client = {
  name: string;
  url: string;
  type: string;
  since: string;
  desc: string;
  logo: string;
  /* "mono" logos read best as a white silhouette on black; "color"
     ones are detailed emblems that collapse into a blob as a
     silhouette, so they get desaturated instead */
  logoMode: "mono" | "color";
  /* whether the original colours hold up on black when hovered */
  hoverColor: boolean;
};

export const CLIENTS: Client[] = [
  {
    name: "Tata Communications",
    url: "gobtxtata.gobt.in",
    type: "Telecom / Enterprise",
    since: "2025",
    desc: "3D eyewear fitting and inspection experience built for a Tata Communications initiative",
    logo: "/tata.png",
    logoMode: "mono",
    hoverColor: true,
  },
  {
    name: "Navaru",
    url: "navaru.in",
    type: "Corporate",
    since: "2024",
    desc: "Business website and brand presence",
    logo: "/naavru.png",
    logoMode: "mono",
    hoverColor: false,
  },
  {
    name: "AGILE Engineering",
    url: "agileengcon.in",
    type: "Civil & Mechanical Consulting",
    since: "2024",
    desc: "Premier engineering consultant in Kolkata with complete digital transformation, corporate site & SEO",
    logo: "/agile-logo.png",
    logoMode: "mono",
    hoverColor: true,
  },
  {
    name: "Mohini Printers",
    url: "mohiniprintshop.org",
    type: "Design",
    since: "2024",
    desc: "create stunning graphics for any platform",
    logo: "/mohini.png",
    logoMode: "mono",
    hoverColor: false,
  },
  {
    name: "PizzaHap",
    url: "pizzahap.com",
    type: "Food & Beverage",
    since: "2024",
    desc: "Crafted Fire. Real Flavor. Brand identity, website & mobile app",
    logo: "/pizzahap-logo.png",
    logoMode: "color",
    hoverColor: true,
  },
  {
    name: "GFTD",
    url: "gftd.in",
    type: "E-Commerce / Gifting",
    since: "2023",
    desc: "The Art of Gifting end-to-end e-commerce platform with AI recommendations & Razorpay integration",
    logo: "/gftd-logo.png",
    logoMode: "mono",
    hoverColor: true,
  },
  {
    name: "RKMVVM",
    url: "rkmvvm.org",
    type: "Education & Institution",
    since: "2024",
    desc: "Prestigious Kolkata institution featuring full portal redesign, digital transformation & student management",
    logo: "/rkm-logo.png",
    logoMode: "color",
    hoverColor: true,
  },
  {
    name: "Accurate Astro",
    url: "accurateastro.in",
    type: "Astrology Platform",
    since: "2024",
    desc: "Premium astrology consultation platform with live session booking & Vedic calendar integration",
    logo: "/accurateastro-logo.png",
    logoMode: "mono",
    hoverColor: true,
  },
  {
    name: "Al-Taqwa",
    url: "altaqwa.in",
    type: "Luxury Lifestyle",
    since: "2024",
    desc: "Where Luxury Meets Elegance: brand identity, luxury e-commerce & premium UX design",
    logo: "/aitqwa-logo.png",
    logoMode: "mono",
    hoverColor: true,
  },
  {
    name: "Gharkamali",
    url: "gharkamali.com",
    type: "Home Services",
    since: "2022",
    desc: "On-demand home services marketplace with 500+ technicians, web platform and React Native app",
    logo: "/gkm-logo.png",
    logoMode: "mono",
    hoverColor: true,
  },
];

export type Work = {
  id: number;
  title: string;
  tag: string;
  desc: string;
  tech: string[];
  accent: string;
  category: "Web" | "App";
  live: string;
  image: string;
  featured?: boolean;
};

export const WORKS: Work[] = [
  {
    id: 19,
    title: "Tata Communications",
    tag: "3D Product Experience",
    desc: "Immersive 3D eyewear fitting and inspection tool with real-time 360° rotation, frame specs and multi-model switching.",
    tech: ["Next.js", "Three.js", "WebGL"],
    accent: "#22d3ee",
    category: "Web",
    live: "gobtxtata.gobt.in",
    image: "/img/tatacom.png",
    featured: true,
  },
  {
    id: 1,
    title: "PizzaHap",
    tag: "Web + Branding",
    desc: "Fire-themed brand identity, high-conversion website and mobile app for Uttarakhand's boldest food brand.",
    tech: ["Next.js", "Figma", "Tailwind"],
    accent: "#e84040",
    category: "Web",
    live: "pizzahap.com",
    image: "/img/pizzahap.png",
    featured: true,
  },
  {
    id: 2,
    title: "AGILE Engineering",
    tag: "Corporate Web",
    desc: "Enterprise-grade corporate presence for Kolkata's premier engineering consultant with responsive, SEO-optimised architecture.",
    tech: ["Next.js", "SEO", "GSAP"],
    accent: "#4060ff",
    category: "Web",
    live: "agileengcon.in",
    image: "/img/AgileEnginnerng.png",
    featured: true,
  },
  {
    id: 3,
    title: "GFTD",
    tag: "E-Commerce Platform",
    desc: "The Art of Gifting full e-commerce with AI recommendations, Razorpay, real-time inventory.",
    tech: ["Next.js", "Node.js", "PostgreSQL"],
    accent: "#7c3aed",
    category: "Web",
    live: "gftd.in",
    image: "/img/GFTD.png",
    featured: true,
  },
  {
    id: 10,
    title: "Mohini Printers",
    tag: "Dashboard System",
    desc: "Modern print management dashboard with design workflow & client handling system.",
    tech: ["Next.js", "Dashboard UI", "Node.js"],
    accent: "#ff6a2b",
    category: "Web",
    live: "mohiniprintshop.org",
    image: "/img/mohini.png",
  },
  {
    id: 5,
    title: "Accurate Astro",
    tag: "Booking Platform",
    desc: "Premium astrology consultation with live session booking, astrologer profiles & Vedic calendar.",
    tech: ["React", "Node.js", "Stripe"],
    accent: "#d97706",
    category: "Web",
    live: "accurateastro.in",
    image: "/img/AccurateAstro.png",
  },
  {
    id: 6,
    title: "Al-Taqwa",
    tag: "Luxury E-Commerce",
    desc: "Where Luxury Meets Elegance: curated fashion store with immersive product photography & UX.",
    tech: ["Next.js", "Shopify", "Figma"],
    accent: "#c2810a",
    category: "Web",
    live: "altaqwa.in",
    image: "/img/altaqwa.png",
    featured: true,
  },
  {
    id: 11,
    title: "Navaru",
    tag: "Corporate Web",
    desc: "Business website and brand presence.",
    tech: ["Next.js"],
    accent: "#b47e11",
    category: "Web",
    live: "navaru.in",
    image: "/img/navaru-image.png",
  },
  {
    id: 12,
    title: "Oasis Elevators",
    tag: "Corporate Web",
    desc: "Website for an elevator and lift installation & servicing company.",
    tech: ["Next.js"],
    accent: "#3b82f6",
    category: "Web",
    live: "oasiselevators.in",
    image: "/img/oasis-image.png",
  },
  {
    id: 13,
    title: "Mastermind Abacus Odisha",
    tag: "Education",
    desc: "Website for an abacus and mental-math training institute.",
    tech: ["Next.js"],
    accent: "#a855f7",
    category: "Web",
    live: "mastermindabacusodisha.com",
    image: "/img/mma-image.png",
  },
  {
    id: 14,
    title: "Idea Shapers",
    tag: "Corporate Web",
    desc: "Organisation website.",
    tech: ["Next.js"],
    accent: "#22c55e",
    category: "Web",
    live: "ideashapers.org",
    image: "/img/ideashapers-image.png",
  },
  {
    id: 17,
    title: "SureGeM India",
    tag: "GeM Consulting Portal",
    desc: "Government e-Marketplace (GeM) consulting portal with a conversion-focused funnel that tripled inbound inquiries in month one.",
    tech: ["Next.js", "SEO"],
    accent: "#0891b2",
    category: "Web",
    live: "",
    image: "/img/Suregem.png",
  },
  {
    id: 7,
    title: "PizzaHap App",
    tag: "Mobile Application",
    desc: "Full-stack food ordering app with live tracking, POS integration & driver dispatch.",
    tech: ["React Native", "Node.js", "Firebase"],
    accent: "#ef4444",
    category: "App",
    live: "",
    image: "/img/pizzahap.png",
  },
  {
    id: 18,
    title: "Gharkamali",
    tag: "Marketplace Web Platform",
    desc: "On-demand home services marketplace connecting 500+ verified technicians with customers across the city.",
    tech: ["React", "Node.js", "MongoDB"],
    accent: "#0ea5e9",
    category: "Web",
    live: "gharkamali.com",
    image: "/img/gkm-image.png",
    featured: true,
  },
  {
    id: 8,
    title: "Gharkamali App",
    tag: "Mobile Application",
    desc: "On-demand home services marketplace with 500+ skilled technicians and real-time booking.",
    tech: ["React Native", "Maps API", "Socket.io"],
    accent: "#0ea5e9",
    category: "App",
    live: "gharkamali.com",
    image: "/img/Gharkamali.png",
  },
];

/* photo: a background-removed, head-to-chest cutout (transparent
   PNG/WebP) that the team section turns into a particle portrait.
   Leave it out and the card shows the GOBT mark in particles instead. */
export const TEAM: { name: string; title: string; quote: string; photo?: string }[] = [
  {
    name: "Suprime Mondal",
    title: "CEO & Founder",
    quote: "We don't build websites, we engineer outcomes. Every pixel, every line of code is a business decision.",
    photo: "/team/suprime.webp",
  },
  {
    name: "Subhodeep Ghosh",
    title: "CTO",
    quote: "Technology should be invisible. The best systems are the ones users never have to think about.",
    photo: "/team/subhodeep.webp",
  },
  {
    name: "Souvik Ghosh",
    title: "Lead Architect",
    quote: "Architecture is not about complexity, it's about making the complex elegantly simple and scalable.",
    photo: "/team/souvik.webp",
  },
  {
    name: "Akash Ranjan Mandal",
    title: "DevOps Lead",
    quote: "Deployment is just the beginning. True reliability is built through discipline, not luck.",
    photo: "/team/akash.webp",
  },
];

export const TESTIMONIALS = [
  {
    text: "GOBT built our entire engineering firm's digital presence from scratch. They understood civil engineering, something other agencies just Googled. The SEO results and inquiry rates exceeded every expectation.",
    name: "AGILE Engineering",
    role: "Premier Consulting Firm, Kolkata",
    init: "A",
  },
  {
    text: "The PizzaHap website captures exactly what our brand is — bold, fiery, and unapologetic. Customers compliment the site as much as the food. GOBT turned a brief into a statement.",
    name: "PizzaHap Team",
    role: "Food Brand, Uttarakhand",
    init: "P",
  },
  {
    text: "We needed a GeM consulting portal that actually converted. Clean navigation, strong CTAs, and targeted SEO. Our inquiry rate tripled in the first month. Genuinely impressive work.",
    name: "SureGeM India",
    role: "Government E-Marketplace Consultants",
    init: "S",
  },
  {
    text: "Working with GOBT was an absolute pleasure. They delivered a world-class platform that reflects the prestige our institution deserves. Every detail was thoughtfully crafted.",
    name: "RKMVVM",
    role: "Educational Institution, Kolkata",
    init: "R",
  },
  {
    text: "From concept to launch in record time. The luxury e-commerce experience they built for Al-Taqwa perfectly matches our brand ethos. Customer engagement has soared since launch.",
    name: "Al-Taqwa",
    role: "Luxury Lifestyle Brand",
    init: "T",
  },
  {
    text: "GOBT delivered our booking platform ahead of schedule with a UX our clients constantly compliment. Rare to find a dev partner this precise and this fast.",
    name: "Accurate Astro",
    role: "Astrology Consultation Platform",
    init: "A",
  },
];

export type Job = {
  id: string;
  title: string;
  experience: string;
  type: string;
  location: string;
  description: string;
};

export const JOBS: Job[] = [
  {
    id: "sde",
    title: "Software Developer",
    experience: "0–2 Years",
    type: "Contract (1.5 Yrs)",
    location: "On-site / Hybrid",
    description: `
      <p>GOBT (Group Of Blooming Technicians) is seeking a motivated and technically sound Software Developer to join our growing engineering team on a 1.5-year contract basis. This role is ideal for freshers or early-career developers (0–2 years of experience) with strong programming fundamentals, sharp logical reasoning, and a passion for building scalable, microservice-based backend systems. The candidate will work closely with senior engineers on real-world product development, cloud infrastructure, and database-driven applications.</p>

      <h4>Technical Requirements</h4>
      <ul>
        <li><strong>Go (Golang) — Highly Preferred:</strong> Strong understanding of Go's concurrency model, goroutines, channels, and idiomatic Go patterns. Proficiency in building RESTful APIs and microservices using Go.</li>
        <li><strong>JavaScript:</strong> Working knowledge of modern JavaScript (ES6+), including asynchronous programming, event-driven patterns, and modular code structure.</li>
        <li><strong>Backend & Runtime:</strong> Familiarity with Node.js for server-side scripting, API development, and integration.</li>
        <li><strong>System Architecture:</strong> Basic understanding of system architecture principles. Exposure to microservice-based architecture.</li>
        <li><strong>Databases:</strong> Proficiency in SQL (PostgreSQL, MySQL) and awareness of NoSQL (MongoDB, Redis). Sound knowledge of DBMS concepts.</li>
        <li><strong>Cloud Platforms:</strong> Working knowledge of AWS (EC2, S3, RDS) or Microsoft Azure.</li>
        <li><strong>Reasoning & Problem-Solving:</strong> Demonstrated ability to think critically, break down complex problems, and engineer efficient solutions.</li>
      </ul>

      <h4>Key Responsibilities</h4>
      <ul>
        <li>Design, develop, test, and maintain backend services and APIs in Go and/or Node.js.</li>
        <li>Contribute to microservice architecture decisions and implementation.</li>
        <li>Write optimized SQL/NoSQL queries and manage database schemas.</li>
        <li>Deploy and manage services on cloud infrastructure; assist in monitoring and troubleshooting.</li>
        <li>Participate in code reviews, technical discussions, and sprint planning.</li>
      </ul>

      <h4>What We Look For</h4>
      <ul>
        <li>Exceptional logical reasoning, mathematical aptitude, and creative problem-solving ability.</li>
        <li>A learner's mindset — proactive in upskilling.</li>
        <li>Ability to work independently and collaboratively within an agile team.</li>
        <li>Clear verbal and written communication skills.</li>
      </ul>
    `,
  },
  {
    id: "sales",
    title: "Sales Executive (B2B IT Solutions)",
    experience: "0–2 Years",
    type: "Full-Time",
    location: "On-site / Hybrid",
    description: `
      <p>GOBT is looking for a dynamic and results-driven Sales Executive to expand our B2B client base. We engineer high-end digital products, and we need someone who can articulate our technical value proposition to modern businesses. If you are a fresher or early-career professional with excellent communication skills, a knack for negotiation, and a passion for technology sales, this role is perfect for you.</p>

      <h4>Key Responsibilities</h4>
      <ul>
        <li><strong>Lead Generation:</strong> Identify and prospect potential B2B clients through cold calling, networking, and digital outreach.</li>
        <li><strong>Client Engagement:</strong> Conduct meetings and product demonstrations to understand client needs and present GOBT's solutions.</li>
        <li><strong>Sales Pipeline:</strong> Manage the end-to-end sales cycle from initial contact to negotiation and closing.</li>
        <li><strong>Market Research:</strong> Analyze market trends, competitor offerings, and identify new business opportunities.</li>
        <li><strong>Relationship Management:</strong> Build and maintain strong, long-lasting relationships with key decision-makers.</li>
      </ul>

      <h4>What We Look For</h4>
      <ul>
        <li><strong>Communication:</strong> Exceptional verbal and written communication skills, with the ability to pitch technical products clearly to non-technical stakeholders.</li>
        <li><strong>Drive & Ambition:</strong> Highly motivated, target-driven, and resilient mindset.</li>
        <li><strong>Tech Savvy:</strong> An interest in software, web development, and digital solutions (technical background is a plus but not mandatory).</li>
        <li><strong>Interpersonal Skills:</strong> Ability to build rapport quickly and negotiate effectively.</li>
      </ul>
    `,
  },
  {
    id: "frontend",
    title: "Frontend Developer (React/Next.js)",
    experience: "0–2 Years",
    type: "Contract (1.5 Yrs)",
    location: "On-site / Hybrid",
    description: `
      <p>GOBT is seeking a passionate Frontend Developer to create immersive, high-performance web experiences. You will be transforming high-fidelity Figma designs into pixel-perfect React / Next.js interfaces. If you love CSS, fluid animations, and modern web architecture, this is for you.</p>

      <h4>Technical Requirements</h4>
      <ul>
        <li><strong>React & Next.js:</strong> Strong proficiency in modern React.js and Next.js App Router paradigms.</li>
        <li><strong>Styling Architectures:</strong> Deep understanding of modern CSS, responsive design principles, and layout mechanisms (Grid/Flexbox).</li>
        <li><strong>Animations:</strong> Experience with Framer Motion, GSAP, or native CSS animations to bring interfaces to life.</li>
        <li><strong>Performance:</strong> Knowledge of core web vitals, state management, and browser optimization techniques.</li>
        <li><strong>Collaboration:</strong> Familiarity with Git, component-driven design, and working closely with UX designers.</li>
      </ul>

      <h4>Key Responsibilities</h4>
      <ul>
        <li>Implement responsive, accessible, and highly interactive user interfaces from scratch.</li>
        <li>Collaborate with backend developers to integrate APIs seamlessly.</li>
        <li>Ensure pixel-perfect translation of Figma prototypes into functional code.</li>
        <li>Optimize applications for maximum speed, scalability, and device compatibility.</li>
      </ul>

      <h4>What We Look For</h4>
      <ul>
        <li>Exceptional attention to detail and a strong eye for UI aesthetics.</li>
        <li>A proactive learner who stays ahead of modern web standards.</li>
        <li>Strong communication skills and a strict dedication to delivering bug-free code.</li>
      </ul>
    `,
  },
  {
    id: "blockchain",
    title: "Blockchain Developer",
    experience: "3+ Years",
    type: "Full-Time",
    location: "Remote / Hybrid",
    description: `
      <p>We are looking for an experienced Blockchain Developer to lead our Web3 and decentralized applications initiatives. You will be responsible for designing, implementing, and supporting a distributed blockchain-based network.</p>

      <h4>Technical Requirements</h4>
      <ul>
        <li><strong>Solidity:</strong> Expert-level proficiency in Smart Contract development on Ethereum/EVM.</li>
        <li><strong>Web3 Libraries:</strong> Experience with Ethers.js or Web3.js for frontend integration.</li>
        <li><strong>Frameworks:</strong> Proficiency with Hardhat, Foundry, or Truffle.</li>
        <li><strong>Security:</strong> Deep understanding of Smart Contract security best practices and common vulnerabilities.</li>
        <li><strong>L2 Solutions:</strong> Experience with Layer 2 scaling solutions (Polygon, Arbitrum, Optimism).</li>
        <li><strong>Backend Integration:</strong> Ability to connect blockchain events with traditional backend systems using Node.js/Go.</li>
      </ul>

      <h4>Key Responsibilities</h4>
      <ul>
        <li>Design and develop secure, audited Smart Contracts for DeFi, NFT, or DAO protocols.</li>
        <li>Architect decentralized systems and bridge solutions.</li>
        <li>Optimize contract gas efficiency and execution logic.</li>
        <li>Collaborate with the security team for rigorous audits and formal verification.</li>
        <li>Lead technical research on new EIPs and emerging blockchain protocols.</li>
      </ul>

      <h4>What We Look For</h4>
      <ul>
        <li>Proven track record of deploying complex protocols on Mainnet.</li>
        <li>Strong understanding of cryptography and consensus algorithms.</li>
        <li>Autonomous worker capable of leading technical projects from whitepaper to production.</li>
      </ul>
    `,
  },
];

/* One-line descriptors and tags give each capability something to
   say when it takes the spotlight in the orbit; they are drawn from
   the stacks and outcomes already shown in the work section. */
export const SERVICES = [
  {
    label: "Websites & Web Dashboards",
    desc: "High-performance websites, portals and admin dashboards: fast, SEO-ready and built to convert.",
    tags: ["Next.js", "SEO", "Dashboards"],
  },
  {
    label: "Mobile Apps",
    desc: "Android and iOS apps with live tracking, real-time booking and payments built in.",
    tags: ["React Native", "Firebase", "Maps"],
  },
  {
    label: "UI/UX Design",
    desc: "Research-led interfaces and design systems, prototyped in Figma before a line of code is written.",
    tags: ["Figma", "Prototyping", "Design Systems"],
  },
  {
    label: "Digital Growth",
    desc: "SEO, performance and conversion funnels that turn traffic into enquiries.",
    tags: ["SEO", "Analytics", "Funnels"],
  },
  {
    label: "Custom Software",
    desc: "Bespoke platforms, APIs and microservices engineered around how your business actually works.",
    tags: ["Go", "Node.js", "PostgreSQL"],
  },
  {
    label: "Smart Devices & IoT",
    desc: "Connected devices and cyber-physical systems that bridge the physical and the digital.",
    tags: ["IoT", "ROS", "Digital Twin"],
  },
  {
    label: "AI Solutions",
    desc: "Applied AI: recommendations, automation and intelligent workflows that do real work.",
    tags: ["AI", "Automation", "Recommendations"],
  },
  {
    label: "Branding",
    desc: "Identity systems (logo, voice and visual language) that make a brand unmistakable.",
    tags: ["Identity", "Logo", "Guidelines"],
  },
  {
    label: "Data Collection",
    desc: "Pipelines that capture, clean and structure the data your decisions run on.",
    tags: ["Pipelines", "APIs", "Reporting"],
  },
  {
    label: "Cyber Security",
    desc: "Security audits and QA passes on every build, before your users ever see it.",
    tags: ["Audits", "Pen-testing", "QA"],
  },
  {
    label: "Game Development",
    desc: "Real-time 3D, WebGL and AR/VR experiences that people want to play with.",
    tags: ["Three.js", "WebGL", "AR/VR"],
  },
];

/* Stacks named across the work and careers sections, orbiting the
   capability core as an inner ring */
export const TECH_RING = [
  "Next.js", "React Native", "Three.js", "Go", "Node.js", "PostgreSQL",
  "Figma", "Firebase", "WebGL", "MongoDB", "AWS", "GSAP",
];

export const GOBT_STATS = [
  { val: 9, sup: "+", label: "Active Clients" },
  { val: 25, sup: "+", label: "Products Launched" },
  { val: 4, sup: "yr", label: "Years Active" },
  { val: 7, sup: "+", label: "Industries Served" },
  { val: 3, sup: "x", label: "Faster Delivery" },
  { val: 100, sup: "%", label: "Client Retention" },
];

export const PROCESS_STEPS = [
  {
    title: "Brief",
    desc: "A short call to understand your business, your users and what success looks like. We scope the real problem before touching a single pixel.",
  },
  {
    title: "Build",
    desc: "Design and development run in tight loops — you see working previews every few days, not a single reveal at the end of the project.",
  },
  {
    title: "Launch & Grow",
    desc: "We ship, monitor and iterate. Every product we hand over comes with the code, the ownership, and a plan for what comes next.",
  },
];

export const COMPARE_ROWS = [
  { feature: "You own the full source code", agency: false, gobt: true },
  { feature: "Direct access to the people building it", agency: false, gobt: true },
  { feature: "Fixed scope, fixed price — no surprise invoices", agency: false, gobt: true },
  { feature: "Working preview within days, not months", agency: false, gobt: true },
  { feature: "Post-launch support included", agency: false, gobt: true },
  { feature: "Built on modern, maintainable stacks", agency: false, gobt: true },
  { feature: "SEO & performance baked in from day one", agency: false, gobt: true },
  { feature: "No lock-in to a proprietary platform", agency: false, gobt: true },
];

export const ESTIMATE_TYPES = ["Website", "Web App", "Mobile App"] as const;
export const ESTIMATE_SCOPES = ["Essential", "Momentum", "Full-Scale"] as const;

export type EstimateType = (typeof ESTIMATE_TYPES)[number];
export type EstimateScope = (typeof ESTIMATE_SCOPES)[number];

export const ESTIMATE_TIMELINES: Record<EstimateType, Record<EstimateScope, string>> = {
  Website: { Essential: "2 weeks", Momentum: "3 weeks", "Full-Scale": "4 weeks" },
  "Web App": { Essential: "4–5 weeks", Momentum: "6 weeks", "Full-Scale": "7–8 weeks" },
  "Mobile App": { Essential: "4–5 weeks", Momentum: "6 weeks", "Full-Scale": "7–8 weeks" },
};

/* [firm weeks, upper-bound weeks] for the week-grid readout */
export const ESTIMATE_WEEKS: Record<EstimateType, Record<EstimateScope, [number, number]>> = {
  Website: { Essential: [2, 2], Momentum: [3, 3], "Full-Scale": [4, 4] },
  "Web App": { Essential: [4, 5], Momentum: [6, 6], "Full-Scale": [7, 8] },
  "Mobile App": { Essential: [4, 5], Momentum: [6, 6], "Full-Scale": [7, 8] },
};

export const ESTIMATE_TEAM: Record<EstimateScope, string> = {
  Essential: "1–2 engineers",
  Momentum: "2–3 engineers + 1 designer",
  "Full-Scale": "Full squad — design, backend, mobile & QA",
};

/* Role chips for the team readout; optional seats render dimmed */
export const ESTIMATE_ROLES: Record<EstimateScope, { role: string; optional?: boolean }[]> = {
  Essential: [{ role: "Engineer" }, { role: "Engineer", optional: true }],
  Momentum: [{ role: "Engineer" }, { role: "Engineer" }, { role: "Engineer", optional: true }, { role: "Designer" }],
  "Full-Scale": [{ role: "Design" }, { role: "Backend" }, { role: "Mobile" }, { role: "QA" }],
};

export const MARQUEE_WORDS = [
  "Digital Transformation", "Deep-Tech AI", "IoT", "AR / VR", "Digital Twin",
  "ROS", "Web Platforms", "Mobile Apps", "Cyber Security",
];

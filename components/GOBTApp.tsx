"use client";

console.log("GOBTApp component loaded");

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";

/* ──────────────────────────────────────────
   STATIC DATA
────────────────────────────────────────── */
const CLIENTS = [
  {
    name: "AGILE Engineering",
    url: "agileengcon.in",
    type: "Civil & Mechanical Consulting",
    since: "2024",
    desc: "Premier engineering consultant in Kolkata — complete digital transformation, corporate site & SEO",
    logo: "/agile-logo.png",
  },
  {
    name: "PizzaHap",
    url: "pizzahap.com",
    type: "Food & Beverage",
    since: "2024",
    desc: "Crafted Fire. Real Flavor. — brand identity, website & mobile app (launching soon)",
    logo: "/pizzahap-logo.png",
  },
  {
    name: "SureGeM India",
    url: "suregem.in",
    type: "Government E-Marketplace",
    since: "2025",
    desc: "GeM consulting platform — complete web build, vendor onboarding & catalogue management system",
    logo: null,
  },
  {
    name: "GFTD",
    url: "gftd.in",
    type: "E-Commerce / Gifting",
    since: "2023",
    desc: "The Art of Gifting — end-to-end e-commerce platform with AI recommendations & Razorpay integration",
    logo: "/gftd-logo.png",
  },
  {
    name: "RKMVVM",
    url: "rkmvvm.org",
    type: "Education & Institution",
    since: "2024",
    desc: "Prestigious Kolkata institution — full portal redesign, digital transformation & student management",
    logo: "/rkm-logo.png",
  },
  {
    name: "Accurate Astro",
    url: "accurateastro.in",
    type: "Astrology Platform",
    since: "2024",
    desc: "Premium astrology consultation platform with live session booking & Vedic calendar integration",
    logo: "/accurateastro-logo.png",
  },
  {
    name: "Al-Taqwa",
    url: "altaqwa.in",
    type: "Luxury Lifestyle",
    since: "2024",
    desc: "Where Luxury Meets Elegance — brand identity, luxury e-commerce & premium UX design",
    logo: "/aitqwa-logo.png",
  },
  {
    name: "Math Coders",
    url: "mathcoders.org",
    type: "EdTech / STEM",
    since: "2025",
    desc: "Robotics & STEM education platform — franchise system, school programs, shop & events",
    logo: "/mathcoder-logo.png",
  },
  {
    name: "Gharkamali",
    url: "gkmapp.netlify.app",
    type: "Home Services",
    since: "2022",
    desc: "On-demand home services marketplace — 500+ technicians, React Native app launching soon",
    logo: "/gkm-logo.png",
  },
];

const WORKS = [
  {
    id: 1,
    title: "PizzaHap",
    tag: "Web + Branding",
    desc: "Fire-themed brand identity, high-conversion website and mobile app for Uttarakhand's boldest food brand.",
    tech: ["Next.js", "Figma", "Tailwind"],
    bg: "#140a08",
    accent: "#e84040",
    category: "Web",
    live: "pizzahap.com",
    soon: false,
    image: "/img/pizzahap.png",
  },
  {
    id: 2,
    title: "AGILE Engineering",
    tag: "Corporate Web",
    desc: "Enterprise-grade corporate presence for Kolkata's premier engineering consultant — responsive, SEO-optimised.",
    tech: ["Next.js", "SEO", "GSAP"],
    bg: "#080c18",
    accent: "#4060ff",
    category: "Web",
    live: "agileengcon.in",
    soon: false,
    image: "/img/AgileEnginnerng.png",
  },
  {
    id: 3,
    title: "GFTD",
    tag: "E-Commerce Platform",
    desc: "The Art of Gifting — full e-commerce with AI recommendations, Razorpay, real-time inventory.",
    tech: ["Next.js", "Node.js", "PostgreSQL"],
    bg: "#0f0818",
    accent: "#7c3aed",
    category: "Web",
    live: "gftd.in",
    soon: false,
    image: "/img/GFTD.png",
  },
  {
    id: 4,
    title: "Math Coders",
    tag: "EdTech Platform",
    desc: "STEM & Robotics platform for schools across India — franchise, programs, kit shop & events.",
    tech: ["WordPress", "WooCommerce", "PHP"],
    bg: "#070f08",
    accent: "#16a34a",
    category: "Web",
    live: "mathcoders.org",
    soon: false,
    image: "/img/Mathcoders.png",
  },
  {
    id: 5,
    title: "Accurate Astro",
    tag: "Booking Platform",
    desc: "Premium astrology consultation with live session booking, astrologer profiles & Vedic calendar.",
    tech: ["React", "Node.js", "Stripe"],
    bg: "#130e04",
    accent: "#d97706",
    category: "Web",
    live: "accurateastro.in",
    soon: false,
    image: "/img/AccurateAstro.png",
  },
  {
    id: 6,
    title: "Al-Taqwa",
    tag: "Luxury E-Commerce",
    desc: "Where Luxury Meets Elegance — curated fashion store with immersive product photography & UX.",
    tech: ["Next.js", "Shopify", "Figma"],
    bg: "#100808",
    accent: "#c2810a",
    category: "Web",
    live: "altaqwa.in",
    soon: false,
    image: "/img/altaqwa.png",
  },
  {
    id: 7,
    title: "SureGeM India",
    tag: "Consulting Platform",
    desc: "GeM consulting portal with vendor registration, catalogue management & telephonic support system.",
    tech: ["WordPress", "SEO", "CRM"],
    bg: "#060f0c",
    accent: "#0891b2",
    category: "Web",
    live: "suregem.in",
    soon: false,
    image: "/img/Suregem.png",
  },
  {
    id: 8,
    title: "PizzaHap App",
    tag: "Mobile Application",
    desc: "Full-stack food ordering app with live tracking, POS integration & driver dispatch. Launching on Play Store.",
    tech: ["React Native", "Node.js", "Firebase"],
    bg: "#140808",
    accent: "#ef4444",
    category: "App",
    live: "",
    soon: true,
    image: "/img/pizzahap.png",
  },
  {
    id: 9,
    title: "Gharkamali App",
    tag: "Mobile Application",
    desc: "On-demand home services marketplace — 500+ skilled technicians, real-time booking. Launching soon.",
    tech: ["React Native", "Maps API", "Socket.io"],
    bg: "#07101a",
    accent: "#0ea5e9",
    category: "App",
    live: "gkmapp.netlify.app",
    soon: true,
    image: "/img/Gharkamali.png",
  },
];

const TEAM = [
  {
    name: "Suprime Mondal",
    title: "CEO & Founder",
    num: "01",
    quote: "We don't build websites — we engineer outcomes. Every pixel, every line of code is a business decision.",
  },
  {
    name: "Subhodeep Ghosh",
    title: "CTO",
    num: "02",
    quote: "Technology should be invisible. The best systems are the ones users never have to think about.",
  },
  {
    name: "Souvik Ghosh",
    title: "Lead Architect",
    num: "03",
    quote: "Architecture is not about complexity — it's about making the complex elegantly simple and scalable.",
  },
  {
    name: "Akash Ranjan Mandal",
    title: "DevOps Lead",
    num: "04",
    quote: "Deployment is just the beginning. True reliability is built through discipline, not luck.",
  },
];

const TESTIMONIALS = [
  {
    text: "GOBT built our entire engineering firm's digital presence from scratch. They understood civil engineering — something other agencies just Googled. The SEO results and inquiry rates exceeded every expectation.",
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
];

const JOBS = [
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
    `
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
    `
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
    `
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
    `
  }
];

const SERVICES = [
  { label: "Web Development", highlight: false },
  { label: "App Development", highlight: true },
  { label: "Figma Design", highlight: false },
  { label: "UI/UX Design", highlight: false },
  { label: "SEO & Growth", highlight: true },
  { label: "Software Dev", highlight: false },
  { label: "IoT Systems", highlight: false },
  { label: "AI & ML", highlight: true },
  { label: "Branding", highlight: false },
  { label: "E-Commerce", highlight: false },
];

const GOBT_STATS = [
  { val: 9, sup: "+", label: "Active Clients" },
  { val: 25, sup: "+", label: "Products Launched" },
  { val: 4, sup: "yr", label: "Years Active" },
  { val: 7, sup: "+", label: "Industries Served" },
  { val: 3, sup: "x", label: "Faster Delivery" },
  { val: 100, sup: "%", label: "Client Retention" },
];

/* Orb positions — galaxy-style spread */
const CLIENT_ORB_CONFIG = [
  { left: "6%", top: "12%", size: "lg", drift: 0 },
  { left: "70%", top: "7%", size: "md", drift: 1 },
  { left: "84%", top: "40%", size: "sm", drift: 2 },
  { left: "71%", top: "75%", size: "md", drift: 3 },
  { left: "33%", top: "86%", size: "md", drift: 0 },
  { left: "4%", top: "70%", size: "sm", drift: 1 },
  { left: "3%", top: "37%", size: "lg", drift: 2 },
  { left: "24%", top: "4%", size: "md", drift: 3 },
  { left: "60%", top: "18%", size: "sm", drift: 0 },
] as const;

/* ───────────────────────────────────────────
   TYPEWRITER HOOK — smooth & precise
─────────────────────────────────────────── */
function useTypewriter(
  words: string[],
  typeSpeed = 45,
  pause = 1800,
  deleteSpeed = 22
) {
  const [display, setDisplay] = useState("");
  const [wordIdx, setWordIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return;
    const current = words[wordIdx];
    let timer: ReturnType<typeof setTimeout>;

    if (!deleting && charIdx < current.length) {
      timer = setTimeout(() => setCharIdx((i) => i + 1), typeSpeed + Math.random() * 15);
    } else if (!deleting && charIdx === current.length) {
      if (wordIdx === words.length - 1) {
        setDone(true);
        return;
      }
      timer = setTimeout(() => setDeleting(true), pause);
    } else if (deleting && charIdx > 0) {
      timer = setTimeout(() => setCharIdx((i) => i - 1), deleteSpeed);
    } else {
      setDeleting(false);
      setWordIdx((i) => i + 1);
    }

    setDisplay(current.slice(0, charIdx));
    return () => clearTimeout(timer);
  }, [charIdx, deleting, wordIdx, done, words, typeSpeed, pause, deleteSpeed]);

  return { display, done };
}

/* ──────────────────────────────────────────
   WORK VISUAL COMPONENT — fallback placeholder
────────────────────────────────────────── */
function WorkVisual({ work }: { work: (typeof WORKS)[0] }) {
  /* If a real image is provided, show it */
  if (work.image) {
    return (
      <img
        src={work.image}
        alt={work.title}
        className="work-card-img"
      />
    );
  }

  /* Otherwise render the futuristic placeholder */
  const base: React.CSSProperties = {
    width: "100%",
    height: "100%",
    background: `linear-gradient(145deg, ${work.bg} 0%, ${work.bg}ee 100%)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1.5rem",
    minHeight: "220px",
    position: "relative",
    overflow: "hidden",
  };

  /* Scanline overlay */
  const scanlines: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 4px)",
    pointerEvents: "none",
    zIndex: 2,
  };

  /* Gradient accent top-right */
  const glowAccent: React.CSSProperties = {
    position: "absolute",
    top: 0,
    right: 0,
    width: "60%",
    height: "60%",
    background: `radial-gradient(ellipse at 100% 0%, ${work.accent}30 0%, transparent 70%)`,
    pointerEvents: "none",
    zIndex: 1,
  };

  if (work.category === "App") {
    return (
      <div style={base}>
        <div style={scanlines} />
        <div style={glowAccent} />
        {/* HUD label */}
        <div style={{ position: "absolute", top: "0.8rem", left: "1rem", fontFamily: "var(--f-mono)", fontSize: "0.5rem", letterSpacing: "0.2em", color: `${work.accent}80`, textTransform: "uppercase", zIndex: 3 }}>
          {work.tag}
        </div>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: "18%",
              aspectRatio: "9/19",
              borderRadius: "14px",
              background: `linear-gradient(180deg, ${work.accent}10 0%, rgba(0,0,0,0.2) 100%)`,
              border: `1px solid ${work.accent}45`,
              margin: "0 0.5rem",
              transform:
                i === 1
                  ? "translateY(-18px)"
                  : i === 2
                    ? "translateY(10px)"
                    : "none",
              display: "flex",
              flexDirection: "column" as const,
              overflow: "hidden",
              flexShrink: 0,
              position: "relative" as const,
              zIndex: 3,
              boxShadow: `0 8px 30px ${work.accent}20`,
            }}
          >
            <div style={{ height: "8%", background: `${work.accent}25`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: "26%", height: "3px", borderRadius: "3px", background: `${work.accent}90` }} />
            </div>
            <div style={{ flex: 1, padding: "5px", display: "flex", flexDirection: "column" as const, gap: "4px" }}>
              <div style={{ height: "32%", borderRadius: "4px", background: `${work.accent}35` }} />
              <div style={{ height: "6px", borderRadius: "3px", background: "rgba(255,255,255,0.1)", width: "75%" }} />
              <div style={{ height: "5px", borderRadius: "3px", background: "rgba(255,255,255,0.06)", width: "55%" }} />
              <div style={{ marginTop: "auto", height: "18%", borderRadius: "4px", background: work.accent }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={base}>
      <div style={scanlines} />
      <div style={glowAccent} />
      {/* HUD label */}
      <div style={{ position: "absolute", top: "0.8rem", left: "1rem", fontFamily: "var(--f-mono)", fontSize: "0.5rem", letterSpacing: "0.2em", color: `${work.accent}80`, textTransform: "uppercase", zIndex: 3 }}>
        {work.tag}
      </div>
      {/* Corner marks */}
      <div style={{ position: "absolute", top: "0.6rem", right: "0.6rem", width: "10px", height: "10px", borderTop: `1.5px solid ${work.accent}60`, borderRight: `1.5px solid ${work.accent}60`, zIndex: 3 }} />
      <div style={{ position: "absolute", bottom: "0.6rem", left: "0.6rem", width: "10px", height: "10px", borderBottom: `1.5px solid ${work.accent}60`, borderLeft: `1.5px solid ${work.accent}60`, zIndex: 3 }} />
      <div
        style={{
          width: "100%",
          borderRadius: "8px",
          background: `linear-gradient(180deg, ${work.accent}08 0%, rgba(0,0,0,0.3) 100%)`,
          border: `1px solid ${work.accent}30`,
          overflow: "hidden",
          position: "relative",
          zIndex: 3,
          boxShadow: `0 4px 40px ${work.accent}15`,
        }}
      >
        {/* Browser bar */}
        <div style={{ padding: "7px 10px", background: `${work.accent}12`, display: "flex", alignItems: "center", gap: "5px", borderBottom: `1px solid ${work.accent}20` }}>
          {["#ff5f57", "#febc2e", "#28c840"].map((c, i) => (
            <div key={i} style={{ width: "7px", height: "7px", borderRadius: "50%", background: c, opacity: 0.8 }} />
          ))}
          <div style={{ flex: 1, height: "12px", borderRadius: "3px", background: "rgba(255,255,255,0.06)", marginLeft: "5px" }} />
          <div style={{ width: "28px", height: "12px", borderRadius: "3px", background: `${work.accent}30` }} />
        </div>
        {/* Content */}
        <div style={{ padding: "1.2rem", display: "flex", flexDirection: "column" as const, gap: "9px" }}>
          <div style={{ height: "9px", borderRadius: "3px", background: work.accent, width: "38%" }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "7px" }}>
            {[1, 2, 3].map((j) => (
              <div key={j} style={{ height: "52px", borderRadius: "6px", background: `${work.accent}${j === 1 ? "45" : "18"}` }} />
            ))}
          </div>
          <div style={{ height: "6px", borderRadius: "3px", background: "rgba(255,255,255,0.09)", width: "82%" }} />
          <div style={{ height: "6px", borderRadius: "3px", background: "rgba(255,255,255,0.05)", width: "62%" }} />
          <div style={{ display: "flex", gap: "7px", marginTop: "4px" }}>
            <div style={{ height: "26px", borderRadius: "20px", background: work.accent, width: "85px" }} />
            <div style={{ height: "26px", borderRadius: "20px", background: "rgba(255,255,255,0.04)", border: `1px solid ${work.accent}30`, width: "70px" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   CONTACT FORM
────────────────────────────────────────── */
function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  if (sent) {
    return (
      <div style={{ padding: "3rem 2.2rem", background: "var(--surface)", border: "1px solid rgba(255,106,43,0.2)", borderRadius: "16px" }}>
        <div
          style={{
            fontFamily: "var(--f-display)",
            fontSize: "clamp(2.5rem, 5vw, 4rem)",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 0.92,
            background: "linear-gradient(135deg, var(--orange) 0%, var(--accent2) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            marginBottom: "1.2rem",
          }}
        >
          Message<br />received.
        </div>
        <p style={{ fontSize: "1rem", color: "var(--fg2)", lineHeight: 1.8, fontWeight: 300 }}>
          We respond within 24 hours. For faster response, reach us on WhatsApp.
        </p>
      </div>
    );
  }

  return (
    <div className="contact-form">
      {[
        ["Full Name", "name", "text", "Your full name"],
        ["Email Address", "email", "email", "hello@yourcompany.com"],
        ["Company (Optional)", "company", "text", "Company name"],
      ].map(([label, key, type, placeholder]) => (
        <div key={key} className="form-field">
          <label className="form-label" htmlFor={`f-${key}`}>
            {label}
          </label>
          <input
            id={`f-${key}`}
            className="form-input"
            type={type}
            placeholder={placeholder}
            value={(form as Record<string, string>)[key]}
            onChange={(e) =>
              setForm((p) => ({ ...p, [key]: e.target.value }))
            }
          />
        </div>
      ))}
      <div className="form-field">
        <label className="form-label" htmlFor="f-message">
          Project Brief
        </label>
        <textarea
          id="f-message"
          className="form-textarea"
          rows={5}
          placeholder="Tell us about your project, goals and timeline..."
          value={form.message}
          onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
        />
      </div>
      <button
        className="btn-primary"
        style={{ marginTop: "0.5rem", width: "100%", justifyContent: "center" }}
        disabled={loading}
        onClick={async () => {
          if (form.name && form.email && form.message) {
            setLoading(true);
            try {
              const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
              });
              if (res.ok) setSent(true);
            } catch (err) {
              console.error(err);
            } finally {
              setLoading(false);
            }
          }
        }}
      >
        <span>{loading ? "Sending..." : "Send Message"}</span>
        <span style={{ fontSize: "0.9rem" }}>→</span>
      </button>
    </div>
  );
}

/* ──────────────────────────────────────────
   MAIN APP
────────────────────────────────────────── */
export default function GOBTApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worksTrackRef = useRef<HTMLDivElement>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [filter, setFilter] = useState("All");
  const [activeJob, setActiveJob] = useState<typeof JOBS[0] | null>(null);
  const isMobile = useRef(false);

  /* Smooth typewriter */
  const { display: twText, done: twDone } = useTypewriter(
    ["Digital Products.", "Mobile Apps.", "Web Platforms.", "Memorable Interfaces."],
    28,
    2600,
    14
  );

  const filteredWorks =
    filter === "All" ? WORKS : WORKS.filter((w) => w.category === filter);


  useEffect(() => {
    if (worksTrackRef.current) {
      worksTrackRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }
  }, [filter]);

  /* Re-initialize MailtoUI when dynamic content changes (like modals) */
  useEffect(() => {
    // @ts-ignore
    if (typeof window !== "undefined" && window.mailtouiApp) {
      // @ts-ignore
      window.mailtouiApp.run();
    }
  }, [activeJob, menuOpen]);

  /* Lock body scroll when menu or modal is open */
  useEffect(() => {
    if (menuOpen || activeJob) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [menuOpen, activeJob]);

  /* Auto-scroll timer removed - replaced by marquee CSS */

  const goto = (id: string) => {
    setMenuOpen(false);
    setTimeout(
      () => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }),
      80
    );
  };

  /* ── Universe background init ── */
  useEffect(() => {
    const starsEl = document.getElementById("universe-stars");
    if (!starsEl) return;

    const starCount = window.innerWidth < 768 ? 100 : 250;
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < starCount; i++) {
      const star = document.createElement("div");
      star.className = "star";
      const size = Math.random() * 2.5 + 0.5;
      const maxOpacity = Math.random() * 0.75 + 0.1;
      const dur = Math.random() * 4 + 2;
      const delay = Math.random() * 6;
      star.style.cssText = `
        width:${size}px; height:${size}px;
        left:${Math.random() * 100}%;
        top:${Math.random() * 100}%;
        --dur:${dur}s; --delay:${delay}s;
        --max-opacity:${maxOpacity};
        animation-delay:${delay}s;
      `;
      fragment.appendChild(star);
    }

    const blobColors = [
      "rgba(60,80,200,0.12)",
      "rgba(100,50,200,0.1)",
      "rgba(255,80,20,0.06)",
      "rgba(80,40,160,0.09)",
      "rgba(255,106,43,0.05)",
    ];
    blobColors.forEach((color, i) => {
      const blob = document.createElement("div");
      blob.className = "nebula-blob";
      const size = 300 + i * 130;
      blob.style.cssText = `
        width:${size}px; height:${size}px;
        background:${color};
        left:${[10, 55, 80, 20, 65][i]}%;
        top:${[10, 30, 60, 70, 15][i]}%;
        --dur:${12 + i * 3}s;
        --tx:${(i % 2 === 0 ? 1 : -1) * (20 + i * 10)}px;
        --ty:${(i % 3 === 0 ? -1 : 1) * (15 + i * 8)}px;
        pointer-events:none;
      `;
      fragment.appendChild(blob);
    });

    if (window.innerWidth >= 768) {
      for (let i = 0; i < 6; i++) {
        const ss = document.createElement("div");
        ss.className = "shooting-star";
        ss.style.cssText = `
          left:${15 + i * 14}%;
          top:${4 + i * 7}%;
          --dur:${9 + i * 2}s;
          --delay:${i * 2.5}s;
          animation-delay:${i * 2.5}s;
        `;
        fragment.appendChild(ss);
      }
    }

    starsEl.appendChild(fragment);
    return () => { starsEl.innerHTML = ""; };
  }, []);

  useEffect(() => {
    isMobile.current = window.innerWidth < 768;

    const loadScript = (src: string) =>
      new Promise<void>((resolve, reject) => {
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
          const checkReady = setInterval(() => {
            const w = window as any;
            if (src.includes("ScrollTrigger") && w.ScrollTrigger) {
              clearInterval(checkReady);
              resolve();
            } else if (!src.includes("ScrollTrigger") && src.includes("gsap") && w.gsap) {
              clearInterval(checkReady);
              resolve();
            } else if (src.includes("three") && w.THREE) {
              clearInterval(checkReady);
              resolve();
            } else if (!src.includes("gsap") && !src.includes("three")) {
              clearInterval(checkReady);
              resolve();
            }
          }, 50);
          setTimeout(() => { clearInterval(checkReady); resolve(); }, 3000);
          return;
        }
        const s = document.createElement("script");
        s.src = src;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(s);
      });

    (async () => {
      try {
        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js");
        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js");
        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js");

        const w = window as any;
        const { gsap } = w;
        const ScrollTrigger = w.ScrollTrigger;
        const THREE = w.THREE;

        if (!gsap || !ScrollTrigger) {
          console.warn("GSAP or ScrollTrigger not loaded");
          document
            .querySelectorAll(".r-up,.r-left,.r-right,.r-fade,.r-scale")
            .forEach((el) => {
              (el as HTMLElement).style.cssText += ";opacity:1;transform:none";
            });
          return;
        }

        gsap.registerPlugin(ScrollTrigger);

        runPreloader(gsap, () => {
          runHeroEntrance(gsap);
          if (!isMobile.current && THREE) runThreeJS(THREE, gsap);
          runScrollAnims(gsap, ScrollTrigger);
          runStatsCounter(gsap, ScrollTrigger);
          runNav();
        });
      } catch (err) {
        console.error("Script loading error:", err);
        document
          .querySelectorAll(".r-up,.r-left,.r-right,.r-fade,.r-scale,.hero-eyebrow,.hero-h1-inner,.hero-bottom,.hero-scroll-hint")
          .forEach((el) => {
            (el as HTMLElement).style.cssText += ";opacity:1;transform:none";
          });
      }
    })();
  }, []);

  /* ═════════════════════════════════════
     PRELOADER — GOBT text animation
     ═════════════════════════════════════ */
  function runPreloader(gsap: any, onDone: () => void) {
    const tl = gsap.timeline({ onComplete: onDone });
    const chars = document.querySelectorAll(".pl-logo-char");

    tl
      .to(chars, {
        y: 0,
        duration: 1.0,
        ease: "power4.out",
        stagger: 0.08,
      })
      .to(".pl-sub", { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, "-=0.4")
      .to(".pl-curtain.top", {
        scaleY: 0,
        duration: 1.1,
        ease: "power4.inOut",
        delay: 0.9,
        transformOrigin: "top center",
      })
      .to(".pl-curtain.bottom", {
        scaleY: 0,
        duration: 1.1,
        ease: "power4.inOut",
        transformOrigin: "bottom center",
      }, "<")
      .to("#preloader", { opacity: 0, duration: 0.3, pointerEvents: "none" });
  }

  /* ═════════════════════════════════════
     HERO ENTRANCE
     ═════════════════════════════════════ */
  function runHeroEntrance(gsap: any) {
    if (isMobile.current) {
      document
        .querySelectorAll(".hero-eyebrow, .hero-h1-inner, .hero-bottom, .hero-scroll-hint")
        .forEach((el) => {
          (el as HTMLElement).style.cssText += ";opacity:1;transform:none";
        });
      return;
    }

    const tl = gsap.timeline({ delay: 0.15 });
    tl.to(".hero-eyebrow", { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" })
      .to(
        ".hero-h1-inner",
        { y: 0, duration: 1.3, ease: "power4.out", stagger: 0.14 },
        "-=0.55"
      )
      .to(
        ".hero-bottom",
        { opacity: 1, y: 0, duration: 1.1, ease: "power3.out" },
        "-=0.6"
      )
      .to(".hero-scroll-hint", { opacity: 1, duration: 0.7 }, "-=0.3")
      .to("#hero-canvas", { opacity: 1, duration: 1.8, ease: "power2.out" }, 0.6);
  }

  /* ═════════════════════════════════════
     THREE.JS HERO PARTICLES — orange + blue + white
     ═════════════════════════════════════ */
  function runThreeJS(THREE: any, gsap: any) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      canvas.offsetWidth / canvas.offsetHeight,
      0.1,
      100
    );
    camera.position.z = 7;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    /* particles — orange (30%), blue (50%), white (20%) */
    const N = 1200;
    const positions = new Float32Array(N * 3);
    const colors = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 24;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 15;
      const rand = Math.random();
      if (rand < 0.3) {
        /* orange */
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.42 + Math.random() * 0.2;
        colors[i * 3 + 2] = 0.17;
      } else if (rand < 0.8) {
        /* blue */
        colors[i * 3] = 0.22 + Math.random() * 0.15;
        colors[i * 3 + 1] = 0.36 + Math.random() * 0.15;
        colors[i * 3 + 2] = 1.0;
      } else {
        /* white/light */
        const v = 0.7 + Math.random() * 0.3;
        colors[i * 3] = v;
        colors[i * 3 + 1] = v;
        colors[i * 3 + 2] = v;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({ size: 0.028, vertexColors: true, transparent: true, opacity: 0.55 });
    const pts = new THREE.Points(geo, mat);
    scene.add(pts);

    /* main orb — orange */
    const orbMat = new THREE.MeshBasicMaterial({ color: 0xff6a2b, transparent: true, opacity: 0 });
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.42, 32, 32), orbMat);
    orb.position.set(3.2, 1.5, 0);
    scene.add(orb);

    /* halo ring */
    const haloMat = new THREE.MeshBasicMaterial({ color: 0xff8f5a, transparent: true, opacity: 0, wireframe: true });
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.007, 8, 64), haloMat);
    orb.add(halo);

    /* secondary orb — blue */
    const orb2Mat = new THREE.MeshBasicMaterial({ color: 0x4d6bff, transparent: true, opacity: 0 });
    const orb2 = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), orb2Mat);
    orb2.position.set(-2.8, -1.2, 0);
    scene.add(orb2);

    /* third tiny orb — orange */
    const orb3Mat = new THREE.MeshBasicMaterial({ color: 0xff6a2b, transparent: true, opacity: 0 });
    const orb3 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), orb3Mat);
    orb3.position.set(-1.5, 2.5, -1);
    scene.add(orb3);

    /* grid lines */
    const lineMat = new THREE.LineBasicMaterial({ color: 0x4d6bff, transparent: true, opacity: 0.04 });
    for (let i = 0; i < 6; i++) {
      const pts2 = [];
      for (let j = 0; j < 3; j++) {
        pts2.push(new THREE.Vector3(
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 16,
          (Math.random() - 0.5) * 7
        ));
      }
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts2), lineMat));
    }

    gsap.to(orbMat, { opacity: 0.22, duration: 2.2, ease: "power2.out", delay: 1.8 });
    gsap.to(haloMat, { opacity: 0.35, duration: 2.8, ease: "power2.out", delay: 2.1 });
    gsap.to(orb2Mat, { opacity: 0.18, duration: 2.2, ease: "power2.out", delay: 2.3 });
    gsap.to(orb3Mat, { opacity: 0.14, duration: 2.0, ease: "power2.out", delay: 2.5 });

    let mx = 0, my = 0;
    const onMouseMove = (e: MouseEvent) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 0.5;
      my = (e.clientY / window.innerHeight - 0.5) * 0.5;
    };
    window.addEventListener("mousemove", onMouseMove);

    let rafId: number;
    const tick = () => {
      rafId = requestAnimationFrame(tick);
      const t = Date.now() * 0.0006;

      pts.rotation.y = t * 0.032 + mx * 0.22;
      pts.rotation.x = t * 0.020 - my * 0.15;

      orb.position.x = 3.2 + Math.sin(t * 0.6) * 0.5 + mx * 1.1;
      orb.position.y = 1.5 + Math.cos(t * 0.4) * 0.4 - my * 0.7;
      halo.rotation.z = t * 0.3;
      halo.rotation.x = t * 0.1;

      orb2.position.x = -2.8 + Math.cos(t * 0.5) * 0.4 + mx * 0.6;
      orb2.position.y = -1.2 + Math.sin(t * 0.7) * 0.3 - my * 0.4;

      orb3.position.x = -1.5 + Math.sin(t * 0.8) * 0.6;
      orb3.position.y = 2.5 + Math.cos(t * 0.55) * 0.4;

      camera.position.x += (mx * 0.35 - camera.position.x) * 0.04;
      camera.position.y += (-my * 0.35 - camera.position.y) * 0.04;

      renderer.render(scene, camera);
    };
    tick();

    const onResize = () => {
      if (!canvas) return;
      camera.aspect = canvas.offsetWidth / canvas.offsetHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
    };
  }

  /* ═════════════════════════════════════
     SCROLL ANIMATIONS
     ═════════════════════════════════════ */
  function runScrollAnims(gsap: any, ST: any) {
    if (isMobile.current) {
      document
        .querySelectorAll(".r-up,.r-left,.r-right,.r-fade,.r-scale")
        .forEach((el) => {
          (el as HTMLElement).style.cssText += ";opacity:1;transform:none";
        });
      return;
    }

    const reveal = (selector: string, from: object, extra: object = {}) => {
      document.querySelectorAll(selector).forEach((el) => {
        gsap.fromTo(el, from, {
          opacity: 1, x: 0, y: 0, scale: 1,
          duration: 0.95, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%" },
          ...extra,
        });
      });
    };

    reveal(".r-up", { opacity: 0, y: 50 });
    reveal(".r-left", { opacity: 0, x: -50 });
    reveal(".r-right", { opacity: 0, x: 50 });
    reveal(".r-fade", { opacity: 0 });
    reveal(".r-scale", { opacity: 0, scale: 0.92 });

    document.querySelectorAll(".section-h2").forEach((el) => {
      gsap.fromTo(el, { opacity: 0, y: 55 }, {
        opacity: 1, y: 0, duration: 1.0, ease: "power4.out",
        scrollTrigger: { trigger: el, start: "top 86%" },
      });
    });

    gsap.fromTo(".team-card", { opacity: 0, y: 55 }, {
      opacity: 1, y: 0, duration: 0.75, ease: "power3.out", stagger: 0.07,
      scrollTrigger: { trigger: "#know-us", start: "top 80%" },
    });

    gsap.to("#hero-canvas", {
      y: "16%", ease: "none",
      scrollTrigger: { trigger: "#home", start: "top top", end: "bottom top", scrub: true },
    });

    gsap.fromTo(".contact-watermark", { x: 80, opacity: 0 }, {
      x: 0, opacity: 1, duration: 1.2, ease: "power3.out",
      scrollTrigger: { trigger: "#contact", start: "top 80%" },
    });
  }

  /* ═════════════════════════════════════
     STATS COUNTER
     ═════════════════════════════════════ */
  function runStatsCounter(gsap: any, ST: any) {
    if (isMobile.current || !ST || typeof ST.create !== "function") {
      document.querySelectorAll(".stat-val").forEach((el) => {
        el.textContent = (el as HTMLElement).dataset.target || "0";
      });
      return;
    }

    const statValues = document.querySelectorAll(".stat-val");
    if (!statValues.length) return;

    gsap.fromTo(
      ".stat-card",
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.1,
        scrollTrigger: {
          trigger: "#stats",
          start: "top 80%",
        },
      }
    );

    statValues.forEach((el) => {
      const target = parseInt((el as HTMLElement).dataset.target || "0");
      const obj = { val: 0 };
      gsap.to(obj, {
        val: target,
        duration: 2,
        ease: "power2.out",
        scrollTrigger: {
          trigger: "#stats",
          start: "top 80%",
        },
        onUpdate: () => {
          el.textContent = String(Math.floor(obj.val));
        },
      });
    });
  }

  /* ═════════════════════════════════════
     NAV SCROLL STATE
     ═════════════════════════════════════ */
  function runNav() {
    const nav = document.getElementById("nav");
    if (!nav) return;
    window.addEventListener("scroll", () =>
      nav.classList.toggle("scrolled", window.scrollY > 60)
    );
  }

  /* ══════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════ */
  return (
    <>
      {/* ── UNIVERSE BACKGROUND ── */}
      <div id="universe-bg" aria-hidden="true" />
      <div id="universe-stars" aria-hidden="true" />

      {/* ── CURSOR (hidden — using normal cursor) ── */}
      <div id="cursor-dot" />
      <div id="cursor-outer" />

      {/* ── PRELOADER — GOBT text ── */}
      <div id="preloader">
        <div className="pl-curtain top" />
        <div className="pl-curtain bottom" />
        <div style={{ textAlign: "center", position: "relative", zIndex: 3 }}>
          <div className="pl-logo" aria-hidden="true">
            <span className="pl-logo-char">G</span>
            <span className="pl-logo-char">O</span>
            <span className="pl-logo-char orange">B</span>
            <span className="pl-logo-char orange">T</span>
          </div>
          <div className="pl-sub">
            Group of <span className="accent">Blooming</span> Technicians
          </div>
        </div>
      </div>

      {/* ── MOBILE NAV ── */}
      <div id="mobile-nav" className={menuOpen ? "open" : ""}>
        <button className="mobile-close" onClick={() => setMenuOpen(false)}>✕</button>
        {[
          ["home", "Home"],
          ["about", "About"],
          ["works", "Works"],
          ["clients", "Clients"],
          ["know-us", "Know Us"],
          ["testimonials", "Testimonials"],
          ["careers", "Careers"],
          ["contact", "Contact"],
        ].map(([id, label]) => (
          <a
            key={id}
            href="#"
            className="mobile-link"
            data-label={label}
            onClick={(e) => { e.preventDefault(); goto(id); }}
          >
            {label}
          </a>
        ))}
        <div className="mobile-nav-bottom">
          <a href="https://wa.me/918972297093" target="_blank" rel="noreferrer">WhatsApp</a>
          <a href="mailto:info@gobt.in">Email</a>
          <a href="https://gobt.in" target="_blank" rel="noreferrer">gobt.in</a>
        </div>
      </div>

      {/* ── NAV ── */}
      <nav id="nav" role="navigation" aria-label="Main navigation">
        <a href="#" className="nav-logo" onClick={(e) => { e.preventDefault(); goto("home"); }}>
          <img src="/logo.png" alt="GOBT" style={{ height: "44px", width: "auto" }} />
        </a>
        <ul className="nav-links">
          {[
            ["about", "About"],
            ["works", "Works"],
            ["clients", "Clients"],
            ["know-us", "Know Us"],
            ["testimonials", "Testimonials"],
            ["careers", "Careers"],
            ["contact", "Contact"],
          ].map(([id, label]) => (
            <li key={id}>
              <a href="#" onClick={(e) => { e.preventDefault(); goto(id); }}>
                {label}
              </a>
            </li>
          ))}
        </ul>
        <a
          href="https://wa.me/918972297093?text=Hi%20GOBT"
          target="_blank"
          rel="noreferrer"
          className="nav-cta"
        >
          <span>Let&apos;s Talk</span>
        </a>
        <button
          className={`nav-hamburger ${menuOpen ? "open" : ""}`}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      {/* ══════════════════════════════════
          HOME
         ══════════════════════════════════ */}
      <section id="home" aria-label="Hero section">
        <canvas ref={canvasRef} id="hero-canvas" aria-hidden="true" />
        <div className="hero-noise" aria-hidden="true" />
        <div className="hero-gradient" aria-hidden="true" />
        <div className="hero-inner">
          <div className="hero-eyebrow">
            Group of Blooming Technicians — Est. 2022
          </div>
          <h1 className="hero-h1">
            <span className="hero-h1-line">
              <span className="hero-h1-inner">We Build</span>
            </span>
            <span className="hero-h1-line">
              <span className="hero-h1-inner orange" aria-live="polite">
                {twText}
                <span
                  className="tw-cursor"
                  style={{ opacity: twDone ? 0 : 1 }}
                />
              </span>
            </span>
          </h1>
          <div className="hero-bottom">
            <div>
              <p className="hero-desc">
                Engineering studio building apps, platforms, and interfaces that
                convert. Your technical co-founders — from idea to scale.
              </p>
              <div className="hero-actions">
                <a
                  href="https://wa.me/918972297093?text=Hi%20GOBT%2C%20I%20want%20to%20start%20a%20project"
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary"
                >
                  <span>Start a Project</span>
                  <span style={{ fontSize: "0.9rem" }}>→</span>
                </a>
                <a
                  href="#"
                  className="btn-ghost"
                  onClick={(e) => { e.preventDefault(); goto("works"); }}
                >
                  View Works
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-scroll-hint" aria-hidden="true">
          <div className="scroll-track" />
          <div className="scroll-label">Scroll</div>
        </div>
      </section>

      {/* ══════════════════════════════════
          SERVICES MARQUEE
         ══════════════════════════════════ */}
      <div className="services-marquee-section" aria-label="What we offer">
        <div className="services-marquee-label">What We Offer</div>
        <div className="marquee-wrapper" style={{ marginBottom: "1.2rem" }}>
          <div className="marquee-track">
            {[...SERVICES, ...SERVICES].map((s, i) => (
              <div key={i} className={`marquee-item${s.highlight ? " highlight" : ""}`}>
                <div className="marquee-dot" />
                <span className="marquee-item-text">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="marquee-wrapper">
          <div className="marquee-track reverse">
            {[...SERVICES.slice().reverse(), ...SERVICES.slice().reverse()].map((s, i) => (
              <div key={i} className={`marquee-item${s.highlight ? "" : " highlight"}`}>
                <span className="marquee-item-text">{s.label}</span>
                <div className="marquee-dot" style={{ background: "rgba(255,255,255,0.1)", boxShadow: "none" }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════
          ABOUT
         ══════════════════════════════════ */}
      <section id="about" aria-label="About GOBT">
        <div className="about-grid">
          <div className="about-headline-block r-left">
            <div className="section-tag" style={{ marginBottom: "1.5rem" }}>About GOBT</div>
            <h2 className="section-h2">
              Not just a<br />
              dev shop.
              <br />
              <span className="accent">Your technical</span>
              <br />
              co-founders.
            </h2>
          </div>
          <div className="r-right">
            <p className="about-body">
              GOBT — Group of Blooming Technicians — is an advanced engineering
              studio based in Kolkata, India. We merge startup thinking with
              engineering excellence to build digital products that are
              profitable, scalable, and conversion-ready. We analyze your
              business before writing a single line of code.
            </p>
            <div className="about-pillars">
              {[
                { n: "01", t: "Product Thinking", d: "Revenue models, user journeys and pain points analyzed before any development begins." },
                { n: "02", t: "Fast Execution", d: "Agile sprints. Weekly deliverables. MVPs shipped in weeks, not quarters." },
                { n: "03", t: "Premium Design", d: "Every pixel intentional. Interfaces that convert, delight, and reinforce your brand." },
                { n: "04", t: "Lasting Partnership", d: "We do not disappear after launch. We monitor, optimize, and scale with you." },
              ].map((p) => (
                <div key={p.n} className="pillar-card">
                  <div className="pillar-num">{p.n}</div>
                  <div className="pillar-title">{p.t}</div>
                  <div className="pillar-desc">{p.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          WORKS — image-ready cards
         ══════════════════════════════════ */}
      <section id="works" aria-label="Selected works">
        <div className="works-header">
          <div>
            <div className="section-tag r-fade" style={{ marginBottom: "1.2rem" }}>Selected Works</div>
            <h2 className="section-h2">
              What we&apos;ve
              <br />
              <span className="accent">built</span> so far.
            </h2>
            <p className="section-body" style={{ marginTop: "1rem", maxWidth: "600px", color: "var(--fg2)" }}>
              ...and many more bespoke solutions accelerating businesses worldwide.
            </p>
          </div>
          <div className="works-filters">
            {["All", "App", "Web"].map((f) => (
              <button
                key={f}
                className={`filter-pill ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="works-slider-wrap">
          <div className="works-track" ref={worksTrackRef}>
            {[...filteredWorks, ...filteredWorks].map((work, idx) => (
              <article key={idx} className="work-card" onClick={() => work.live && window.open(`https://${work.live}`, "_blank")}>
                {work.soon && <div className="work-coming-soon">Launching Soon</div>}
                <div className="work-card-visual">
                  <div className="work-card-visual-inner">
                    <WorkVisual work={work} />
                  </div>
                </div>
                <div className="work-card-body">
                  <div className="work-card-tag">{work.tag}</div>
                  <div className="work-card-name">{work.title}</div>
                  <div className="work-card-desc">{work.desc}</div>
                  <div className="work-card-footer">
                    <div className="work-techs">
                      {work.tech.map((t) => (
                        <span key={t} className="work-tech">{t}</span>
                      ))}
                    </div>
                    {work.live ? (
                      <a
                        href={`https://${work.live}`}
                        target="_blank"
                        rel="noreferrer"
                        className="work-arrow"
                        aria-label={`Visit ${work.title}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        ↗
                      </a>
                    ) : (
                      <div className="work-arrow">→</div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          CLIENTS
         ══════════════════════════════════ */}
      <section id="clients" aria-label="Our clients">
        <div className="section-tag r-fade" style={{ marginBottom: "1.5rem", justifyContent: "center", display: "flex", margin: "0 auto 1.5rem" }}>Our Clients</div>
        <h2 className="section-h2" style={{ textAlign: "center", marginBottom: "4rem" }}>
          Businesses that<br />
          trust <span className="accent">GOBT.</span>
        </h2>

        <div className="logo-marquee-wrapper" aria-label="Client logos">
          <div className="logo-marquee-track">
            {/* Double mapping for infinite seamless loop */}
            {[...CLIENTS, ...CLIENTS].map((c, i) => (
              <div key={i} className="client-logo-card">
                {c.logo ? (
                  <img src={c.logo} alt={c.name} />
                ) : (
                  <div className="text-logo">{c.name}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          STATS
         ══════════════════════════════════ */}
      <section id="stats" aria-label="Our Impact">
        <div className="stats-container">
          <div className="stats-header">
            <h2 className="section-h2">
              Building for the <span className="accent">builders.</span>
            </h2>
            <p className="section-body" style={{ maxWidth: "500px" }}>
              Our impact measured in numbers. From deep technical implementations to rapid feature scaling.
            </p>
          </div>
          <div className="stats-grid">
            {GOBT_STATS.map((s) => (
              <div key={s.label} className="stat-card">
                <div className="stat-number">
                  <span className="stat-val" data-target={String(s.val)}>0</span>
                  <span className="stat-sup">{s.sup}</span>
                </div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="stats-outro" style={{ textAlign: "center", marginTop: "5rem" }}>
          <p className="r-fade" style={{ fontFamily: "var(--f-mono)", fontSize: "0.62rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--fg3)", marginBottom: "1.5rem" }}>
            Ready to join them?
          </p>
          <a href="https://wa.me/918972297093" target="_blank" rel="noreferrer" className="btn-primary" style={{ display: "inline-flex", justifyContent: "center" }}>
            <span>Start Your Project</span>
            <span style={{ fontSize: "0.9rem" }}>→</span>
          </a>
        </div>
      </section>

      {/* ══════════════════════════════════
          KNOW US
         ══════════════════════════════════ */}
      <section id="know-us" aria-label="Our team">
        <div className="know-intro">
          <div className="section-tag r-fade" style={{ marginBottom: "1.5rem" }}>Know Us</div>
          <h2 className="section-h2">
            The people
            <br />
            behind <span className="accent">GOBT.</span>
          </h2>
          <p className="r-up" style={{ marginTop: "1.2rem", fontSize: "clamp(0.92rem,1.3vw,1.08rem)", fontWeight: 300, color: "var(--fg2)", maxWidth: "460px", lineHeight: 1.85 }}>
            Hover a card to see their portfolio scroll. Each role, each specialization — built to ship.
          </p>
        </div>

        <div className="know-grid">
          {TEAM.map((m) => (
            <div key={m.name} className="team-card" aria-label={m.name}>
              <div className="team-card-num">{m.num}</div>
              <p className="team-card-quote">
                <span className="team-card-openquote">&ldquo;</span>
                {m.quote}
                <span className="team-card-closequote">&rdquo;</span>
              </p>
              <div className="team-card-divider" />
              <div className="team-name">{m.name}</div>
              <div className="team-title">{m.title}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════
          TESTIMONIALS
         ══════════════════════════════════ */}
      <section id="testimonials" aria-label="Client testimonials">
        <div className="testimonials-header">
          <div className="section-tag r-fade" style={{ marginBottom: "1.5rem" }}>Testimonials</div>
          <h2 className="section-h2">
            What our clients
            <br />
            say about <span className="accent">GOBT.</span>
          </h2>
        </div>
        <div className="testi-marquee-wrapper">
          <div className="testi-marquee-track">
            {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
              <article key={i} className="testi-marquee-card">
                <div className="testi-quote-icon">&ldquo;</div>
                <p className="testi-text">{t.text}</p>
                <div className="testi-author">
                  <div className="testi-avatar">{t.init}</div>
                  <div>
                    <div className="testi-name">{t.name}</div>
                    <div className="testi-role">{t.role}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          CAREERS
         ══════════════════════════════════ */}
      <section id="careers" aria-label="Career Opportunities">
        <div className="careers-container">
          <div className="section-tag r-fade" style={{ marginBottom: "1.2rem", justifyContent: "center", display: "flex", margin: "0 auto 1.2rem" }}>Join GOBT</div>
          <h2 className="section-h2 r-up" style={{ textAlign: "center", marginBottom: "3rem" }}>
            Build the <span className="accent">Future</span> with us.
          </h2>

          <div className="careers-grid">
            {JOBS.map((job) => (
              <div key={job.id} className="career-card" onClick={() => setActiveJob(job)}>
                <div className="career-card-header">
                  <h3>{job.title}</h3>
                  <span className="career-arrow">↗</span>
                </div>
                <div className="career-meta">
                  <span>{job.experience}</span>
                  <span>•</span>
                  <span>{job.type}</span>
                  <span>•</span>
                  <span>{job.location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* JOB MODAL */}
      <div className={`job-modal-overlay ${activeJob ? "open" : ""}`} onClick={() => setActiveJob(null)}>
        <div className="job-modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="job-modal-close" onClick={() => setActiveJob(null)}>✕</button>
          {activeJob && (
            <>
              <div className="job-modal-header">
                <h2>{activeJob.title}</h2>
                <div className="job-modal-meta">
                  <span>{activeJob.experience}</span>
                  <span>{activeJob.type}</span>
                  <span>{activeJob.location}</span>
                </div>
              </div>
              <div
                className="job-modal-body"
                dangerouslySetInnerHTML={{ __html: activeJob.description }}
              />
              <div className="job-modal-footer">
                <a
                  href={`mailto:career@gobt.in?subject=Application – ${activeJob.title}`}
                  className="btn-primary mailtoui"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  <span>Apply via Email</span>
                  <span style={{ fontSize: "0.9rem" }}>→</span>
                </a>
                <p style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.85rem", color: "var(--fg3)", letterSpacing: "0.02em" }}>
                  Or send your resume directly to career@gobt.in
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════
          CONTACT
         ══════════════════════════════════ */}
      <section id="contact" aria-label="Contact GOBT">
        <div className="contact-watermark" aria-hidden="true">GOBT</div>
        <div className="contact-grid">
          <div className="r-left">
            <div className="section-tag" style={{ marginBottom: "1.5rem" }}>Get In Touch</div>
            <h2 className="section-h2">
              Ready to build
              <br />
              something{" "}
              <span className="accent">great?</span>
            </h2>
            <p className="contact-body">
              Whether you have a fully specced brief or just a rough idea —
              let&apos;s talk. No pitch decks, no agency fluff.
            </p>
            <div className="contact-links">
              {[
                { label: "WhatsApp", value: "+91 89722 97093", href: "https://wa.me/918972297093" },
                { label: "Email", value: "info@gobt.in", href: "mailto:info@gobt.in" },
                { label: "Website", value: "gobt.in", href: "https://gobt.in" },
              ].map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  target={l.href.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  className={`contact-link-row ${l.href.startsWith("mailto") ? "mailtoui" : ""}`}
                >
                  <div>
                    <div className="contact-link-label">{l.label}</div>
                    <div className="contact-link-value">{l.value}</div>
                  </div>
                  <span className="contact-arrow">→</span>
                </a>
              ))}
            </div>
          </div>
          <div className="r-right">
            <ContactForm />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          FOOTER
         ══════════════════════════════════ */}
      <footer role="contentinfo">
        <div className="footer-glow" />
        <div className="footer-top">
          {/* Brand column — logo.png */}
          <div className="footer-brand">
            <a href="#" className="footer-brand-logo" onClick={(e) => { e.preventDefault(); goto("home"); }}>
              <img src="/logo.png" alt="GOBT" />
            </a>
            <p className="footer-brand-desc">
              Group of Blooming Technicians. Advanced engineering studio based in
              Kolkata, India. We build digital products that convert.
            </p>
            <div className="footer-socials">
              <a href="https://www.linkedin.com/company/group-of-bluetechnicians/" target="_blank" rel="noreferrer" className="footer-social-link" aria-label="LinkedIn" title="LinkedIn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect x="2" y="9" width="4" height="12" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
              <a href="https://wa.me/918972297093" target="_blank" rel="noreferrer" className="footer-social-link" aria-label="WhatsApp" title="WhatsApp">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
              <a href="mailto:info@gobt.in" className="footer-social-link" aria-label="Email" title="Email">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <div className="footer-col-title">Quick Links</div>
            <div className="footer-col-links">
              {[
                ["about", "About GOBT"],
                ["works", "Our Works"],
                ["clients", "Clients"],
                ["know-us", "The Team"],
                ["contact", "Contact Us"],
              ].map(([id, label]) => (
                <a key={id} href="#" onClick={(e) => { e.preventDefault(); goto(id); }}>
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <div className="footer-col-title">Services</div>
            <div className="footer-col-links">
              {["Web Development", "App Development", "UI/UX Design", "Figma Design", "SEO & Growth", "AI & ML Solutions"].map((s) => (
                <a key={s} href="#about">{s}</a>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <div className="footer-col-title">Get In Touch</div>
            <div className="footer-contact-item">
              <div className="footer-contact-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>
              <div>
                <div className="footer-contact-label">WhatsApp</div>
                <div className="footer-contact-value">
                  <a href="https://wa.me/918972297093" target="_blank" rel="noreferrer">+91 89722 97093</a>
                </div>
              </div>
            </div>
            <div className="footer-contact-item">
              <div className="footer-contact-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <div>
                <div className="footer-contact-label">Email</div>
                <div className="footer-contact-value">
                  <a href="mailto:info@gobt.in">info@gobt.in</a>
                </div>
              </div>
            </div>
            <div className="footer-contact-item">
              <div className="footer-contact-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
              <div>
                <div className="footer-contact-label">Website</div>
                <div className="footer-contact-value">
                  <a href="https://gobt.in" target="_blank" rel="noreferrer">gobt.in</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="f-copy" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div>&copy; 2025 Group of Blooming Technicians. All rights reserved.</div>
            <div style={{ opacity: 0.5, fontSize: '0.75rem' }}>Formally known as Group of Blue Technicians</div>
          </div>
          <div className="f-links">
            <a href="https://gobt.in" target="_blank" rel="noreferrer">Website</a>
            <a href="https://wa.me/918972297093" target="_blank" rel="noreferrer">WhatsApp</a>
            <a href="mailto:hello@gobt.in">Email</a>
          </div>
        </div>
      </footer>
    </>
  );
}

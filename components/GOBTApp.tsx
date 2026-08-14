"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import * as THREE from "three";

/* ──────────────────────────────────────────
   STATIC DATA
────────────────────────────────────────── */
const TYPEWRITER_WORDS = ["Digital Products.", "Mobile Apps.", "Web Platforms."];

const CLIENTS = [
  {
    name: "AGILE Engineering",
    url: "agileengcon.in",
    type: "Civil & Mechanical Consulting",
    since: "2024",
    desc: "Premier engineering consultant in Kolkata with complete digital transformation, corporate site & SEO",
    logo: "/agile-logo.png",
  },
  {
    name: "Mohini Printers",
    url: "mohiniprintshop.org",
    type: "Design",
    since: "2024",
    desc: "create stunning graphics for any platform",
    logo: "/mohini.png",
    darkLogo: true,
  },
  {
    name: "PizzaHap",
    url: "pizzahap.com",
    type: "Food & Beverage",
    since: "2024",
    desc: "Crafted Fire. Real Flavor. Brand identity, website & mobile app launching soon",
    logo: "/pizzahap-logo.png",
  },
  {
    name: "GFTD",
    url: "gftd.in",
    type: "E-Commerce / Gifting",
    since: "2023",
    desc: "The Art of Gifting end-to-end e-commerce platform with AI recommendations & Razorpay integration",
    logo: "/gftd-logo.png",
  },
  {
    name: "RKMVVM",
    url: "rkmvvm.org",
    type: "Education & Institution",
    since: "2024",
    desc: "Prestigious Kolkata institution featuring full portal redesign, digital transformation & student management",
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
    desc: "Where Luxury Meets Elegance: brand identity, luxury e-commerce & premium UX design",
    logo: "/aitqwa-logo.png",
  },
  {
    name: "Gharkamali",
    url: "gkmapp.netlify.app",
    type: "Home Services",
    since: "2022",
    desc: "On-demand home services marketplace with 500+ technicians, React Native app launching soon",
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
    desc: "Enterprise-grade corporate presence for Kolkata's premier engineering consultant with responsive, SEO-optimised architecture.",
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
    desc: "The Art of Gifting full e-commerce with AI recommendations, Razorpay, real-time inventory.",
    tech: ["Next.js", "Node.js", "PostgreSQL"],
    bg: "#0f0818",
    accent: "#7c3aed",
    category: "Web",
    live: "gftd.in",
    soon: false,
    image: "/img/GFTD.png",
  },
  {
    id: 10,
    title: "Mohini Printers",
    tag: "Dashboard System",
    desc: "Modern print management dashboard with design workflow & client handling system.",
    tech: ["Next.js", "Dashboard UI", "Node.js"],
    bg: "#0a0a0a",
    accent: "#ff6a2b",
    category: "Web",
    live: "mohiniprintshop.org",
    soon: false,
    image: "/img/mohini.png",
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
    desc: "Where Luxury Meets Elegance: curated fashion store with immersive product photography & UX.",
    tech: ["Next.js", "Shopify", "Figma"],
    bg: "#100808",
    accent: "#c2810a",
    category: "Web",
    live: "altaqwa.in",
    soon: false,
    image: "/img/altaqwa.png",
  },
  /* tag/desc/tech below are placeholders — not currently rendered by the
     web card (text was removed per an earlier design pass) but kept for
     when/if a text view returns; replace with real project details */
  {
    id: 11,
    title: "Navaru",
    tag: "Corporate Web",
    desc: "Business website and brand presence.",
    tech: ["Next.js"],
    bg: "#0a0a0a",
    accent: "#b47e11",
    category: "Web",
    live: "navaru.in",
    soon: false,
    image: "",
  },
  {
    id: 12,
    title: "Oasis Elevators",
    tag: "Corporate Web",
    desc: "Website for an elevator and lift installation & servicing company.",
    tech: ["Next.js"],
    bg: "#0a0e12",
    accent: "#3b82f6",
    category: "Web",
    live: "oasiselevators.co.in",
    soon: false,
    image: "",
  },
  {
    id: 13,
    title: "Mastermind Abacus Odisha",
    tag: "Education",
    desc: "Website for an abacus and mental-math training institute.",
    tech: ["Next.js"],
    bg: "#120a12",
    accent: "#a855f7",
    category: "Web",
    live: "mastermindabacusodisha.com",
    soon: false,
    image: "",
  },
  {
    id: 14,
    title: "Idea Shapers",
    tag: "Corporate Web",
    desc: "Organisation website.",
    tech: ["Next.js"],
    bg: "#0a1210",
    accent: "#22c55e",
    category: "Web",
    live: "ideashapers.org",
    soon: false,
    image: "",
  },
  {
    id: 7,
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
    id: 8,
    title: "Gharkamali App",
    tag: "Mobile Application",
    desc: "On-demand home services marketplace with 500+ skilled technicians, real-time booking. Launching soon.",
    tech: ["React Native", "Maps API", "Socket.io"],
    bg: "#07101a",
    accent: "#0ea5e9",
    category: "App",
    live: "gkmapp.netlify.app",
    soon: true,
    image: "/img/Gharkamali.png",
  },
  {
    id: 9,
    title: "Taskify",
    tag: "Mobile Application",
    desc: "GOBT's in-house task and project management app for teams. Image coming soon.",
    tech: ["React Native", "Node.js"],
    bg: "#0a0a14",
    accent: "#b47e11",
    category: "App",
    live: "",
    soon: true,
    image: "",
  },
  {
    id: 15,
    title: "Messmate",
    tag: "Mobile Application",
    desc: "Mess and food management app. Image coming soon.",
    tech: ["React Native", "Node.js"],
    bg: "#0a0f14",
    accent: "#22c55e",
    category: "App",
    live: "",
    soon: true,
    image: "",
  },
  {
    id: 16,
    title: "Gharkamali Gardener",
    tag: "Mobile Application",
    desc: "On-demand gardening services booking app. Image coming soon.",
    tech: ["React Native", "Node.js"],
    bg: "#0a140a",
    accent: "#4ade80",
    category: "App",
    live: "",
    soon: true,
    image: "",
  },
];

const TEAM = [
  {
    name: "Suprime Mondal",
    title: "CEO & Founder",
    quote: "We don't build websites, we engineer outcomes. Every pixel, every line of code is a business decision.",
  },
  {
    name: "Subhodeep Ghosh",
    title: "CTO",
    quote: "Technology should be invisible. The best systems are the ones users never have to think about.",
  },
  {
    name: "Souvik Ghosh",
    title: "Lead Architect",
    quote: "Architecture is not about complexity, it's about making the complex elegantly simple and scalable.",
  },
  {
    name: "Akash Ranjan Mandal",
    title: "DevOps Lead",
    quote: "Deployment is just the beginning. True reliability is built through discipline, not luck.",
  },
];

const TESTIMONIALS = [
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

/* Client-facing labels — plain language over technical jargon, since
   this grid is read by non-technical clients deciding what to hire us
   for, not by other developers. Cards use the same cast-gold texture
   as the buttons, so no per-card color is needed. */
const SERVICES = [
  { label: "Websites & Web Dashboards" },
  { label: "Mobile Apps" },
  { label: "UI/UX Design" },
  { label: "Digital Growth" },
  { label: "Custom Software" },
  { label: "Smart Devices & IoT" },
  { label: "AI Solutions" },
  { label: "Branding" },
  { label: "Data Collection" },
  { label: "Cyber Security" },
  { label: "Game Development" },
];

const SERVICE_ICONS = [
  /* Websites & Web Dashboards */
  <svg key="web" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="M3 8.5h18" stroke="currentColor" strokeWidth="1.6" /><path d="M7 13l-2 2 2 2M11 13l2 2-2 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  /* Mobile Apps */
  <svg key="app" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="2.5" width="12" height="19" rx="2.2" stroke="currentColor" strokeWidth="1.6" /><path d="M10.5 18.2h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>,
  /* UI/UX Design */
  <svg key="uiux" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 3l9 16 2-6 6-2-17-8z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>,
  /* Digital Growth */
  <svg key="growth" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 19V5M4 19h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /><path d="M7 15l4-4 3 3 5-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  /* Custom Software */
  <svg key="sw" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 8l-4 4 4 4M16 8l4 4-4 4M14 4l-4 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  /* Smart Devices & IoT */
  <svg key="iot" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="8" width="8" height="8" rx="1.4" stroke="currentColor" strokeWidth="1.6" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>,
  /* AI Solutions */
  <svg key="ai" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3l1.8 4.6L18 9l-4.2 1.4L12 15l-1.8-4.6L6 9l4.2-1.4L12 3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><path d="M18.5 15l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9.9-2.1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /></svg>,
  /* Branding */
  <svg key="brand" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 3l9 9-8 8-9-9V4h7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><circle cx="8" cy="8" r="1.4" stroke="currentColor" strokeWidth="1.6" /></svg>,
  /* Data Collection */
  <svg key="data" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="12" cy="5.5" rx="8" ry="3" stroke="currentColor" strokeWidth="1.6" /><path d="M4 5.5v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" stroke="currentColor" strokeWidth="1.6" /><path d="M4 11.5v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" stroke="currentColor" strokeWidth="1.6" /></svg>,
  /* Cyber Security */
  <svg key="security" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  /* Game Development */
  <svg key="game" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 8h10a4 4 0 014 4v3a3 3 0 01-5.4 1.8L14 15h-4l-1.6 1.8A3 3 0 013 15v-3a4 4 0 014-4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><path d="M7.5 10.5v3M6 12h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><circle cx="16" cy="11" r="0.9" fill="currentColor" /><circle cx="18" cy="13" r="0.9" fill="currentColor" /></svg>,
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

  useEffect(() => {
    const current = words[wordIdx];
    let timer: ReturnType<typeof setTimeout>;

    if (!deleting && charIdx < current.length) {
      timer = setTimeout(() => setCharIdx((i) => i + 1), typeSpeed);
    } else if (!deleting && charIdx === current.length) {
      timer = setTimeout(() => setDeleting(true), pause);
    } else if (deleting && charIdx > 0) {
      timer = setTimeout(() => setCharIdx((i) => i - 1), deleteSpeed);
    } else {
      setDeleting(false);
      setWordIdx((i) => (i + 1) % words.length);
    }

    setDisplay(current.slice(0, charIdx));
    return () => clearTimeout(timer);
  }, [charIdx, deleting, wordIdx, words, typeSpeed, pause, deleteSpeed]);

  return { display };
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
        <input
          key={key}
          id={`f-${key}`}
          className="form-input"
          type={type}
          aria-label={label}
          placeholder={placeholder}
          value={(form as Record<string, string>)[key]}
          onChange={(e) =>
            setForm((p) => ({ ...p, [key]: e.target.value }))
          }
        />
      ))}
      <textarea
        id="f-message"
        className="form-textarea"
        rows={5}
        aria-label="Project Brief"
        placeholder="Tell us about your project, goals and timeline..."
        value={form.message}
        onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
      />
      <button
        className="btn-primary"
        style={{ marginTop: "-1px", width: "100%", justifyContent: "center", borderRadius: 0 }}
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
   TRANSFORM STAGE — 8 uneven spiral lines fan in from the left edge,
   each with its own curl, radius and length, converging on a plain
   "DIGITALISATION" box at different, uneven angles (>100° spread);
   a traveling flare rides each spiral on its own independent timing.
   Past the box, everything straightens into a single clean 180° line
   flowing out to the right edge.
────────────────────────────────────────── */
function TransformStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const boxCenter = useRef({ x: 0, y: 0 });

  /* Each spiral is generated once (stable per mount) with its own
     random-but-fixed shape so every one of the 8 looks genuinely
     different, not 8 copies offset by y — and its own flare speed
     and phase offset so the highlights never move in lockstep. */
  type Spiral = {
    startY: number;
    approachAngle: number; /* radians, angle of final approach into the box — uneven per spiral */
    curl: number; /* how many extra turns the spiral takes before straightening in */
    curlRadius: number; /* how wide the curl loops out */
    bulge: number; /* vertical bow of the initial run-in from the edge */
    flareSpeed: number;
    flarePhase: number;
    hue: number; /* slight per-spiral color variance so they don't read as identical */
  };
  const spirals = useRef<Spiral[]>(
    Array.from({ length: 8 }, (_, i) => {
      const t = (i + 0.5) / 8;
      return {
        startY: 0.5 + t, /* placeholder, resolved against actual band height at draw time */
        approachAngle: (-70 + Math.random() * 150) * (Math.PI / 180), /* uneven, >100deg spread across the set */
        curl: 0.6 + Math.random() * 1.8,
        curlRadius: 14 + Math.random() * 30,
        bulge: (Math.random() - 0.5) * 60,
        flareSpeed: 0.00045 + Math.random() * 0.0009,
        flarePhase: Math.random(),
        hue: Math.random(),
      };
    })
  );

  useEffect(() => {
    let raf = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const wrap = wrapRef.current;
      if (!wrap || !canvas) return;
      const rect = wrap.getBoundingClientRect();
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
    };
    resize();
    window.addEventListener("resize", resize);

    const measure = () => {
      const wrap = wrapRef.current;
      const box = boxRef.current;
      if (!wrap || !box) return;
      const rect = wrap.getBoundingClientRect();
      const br = box.getBoundingClientRect();
      boxCenter.current = { x: br.left - rect.left + br.width / 2, y: br.top - rect.top + br.height / 2 };
    };

    /* Builds the same wobbling spiral path twice — once to stroke it,
       once (in the flare pass) to find the point at parameter `at` —
       so the traveling highlight always sits exactly on the visible line. */
    const spiralPoint = (s: Spiral, cc: { x: number; y: number }, startY: number, at: number) => {
      const approachLen = 90; /* short straight final run into the box, uniform-ish direction */
      const bodyEnd = { x: cc.x - Math.cos(s.approachAngle) * approachLen, y: cc.y - Math.sin(s.approachAngle) * approachLen };

      if (at > 0.82) {
        /* final approach segment: straight, converging on the box */
        const tt = (at - 0.82) / 0.18;
        return { x: bodyEnd.x + (cc.x - bodyEnd.x) * tt, y: bodyEnd.y + (cc.y - bodyEnd.y) * tt };
      }

      const tt = at / 0.82;
      const turns = s.curl * Math.PI * 2;
      const angle = turns * tt;
      const radius = s.curlRadius * (1 - tt * 0.85);
      const baseX = 0 + (bodyEnd.x - s.curlRadius) * tt;
      const baseY = startY + s.bulge * Math.sin(tt * Math.PI);
      return {
        x: baseX + Math.cos(angle) * radius * tt,
        y: baseY + Math.sin(angle) * radius * tt,
      };
    };

    const draw = () => {
      raf = requestAnimationFrame(draw);
      if (!canvas) return;
      measure();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(2, 2);

      const cc = boxCenter.current;
      const canvasW = canvas.width / 2;
      const rect = wrapRef.current?.getBoundingClientRect();
      const h = rect?.height ?? 300;
      const now = Date.now();

      if (cc.x > 0) {
        /* soft hub glow anchoring the box */
        const glowR = 58;
        const hub = ctx.createRadialGradient(cc.x, cc.y, 0, cc.x, cc.y, glowR);
        hub.addColorStop(0, "rgba(254, 210, 110, 0.22)");
        hub.addColorStop(1, "rgba(254, 210, 110, 0)");
        ctx.fillStyle = hub;
        ctx.beginPath();
        ctx.arc(cc.x, cc.y, glowR, 0, Math.PI * 2);
        ctx.fill();

        /* 8 uneven spirals fanning in from the left */
        const bandTop = h * 0.22;
        const bandH = h * 0.56;
        spirals.current.forEach((s, i) => {
          const startY = bandTop + ((i + 0.5) / 8) * bandH;
          const steps = 64;
          ctx.beginPath();
          for (let k = 0; k <= steps; k++) {
            const p = spiralPoint(s, cc, startY, k / steps);
            if (k === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          }
          const r = Math.round(200 - s.hue * 40);
          const g = Math.round(140 + s.hue * 30);
          const b = Math.round(40 + s.hue * 50);
          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.4)`;
          ctx.lineWidth = 1.2;
          ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.45)`;
          ctx.shadowBlur = 3.5;
          ctx.stroke();
          ctx.shadowBlur = 0;

          /* traveling flare — own speed + phase per spiral */
          const at = (now * s.flareSpeed + s.flarePhase) % 1;
          const fp = spiralPoint(s, cc, startY, at);
          const fade = at > 0.9 ? (1 - at) / 0.1 : 1;
          ctx.beginPath();
          ctx.arc(fp.x, fp.y, 2.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 235, 190, ${0.85 * fade})`;
          ctx.shadowColor = "rgba(254, 210, 110, 0.8)";
          ctx.shadowBlur = 6;
          ctx.fill();
          ctx.shadowBlur = 0;
        });

        /* single clean line out the right edge, uniform 180° */
        {
          const endX = canvasW;
          ctx.beginPath();
          ctx.moveTo(cc.x, cc.y);
          ctx.lineTo(endX, cc.y);
          ctx.strokeStyle = "rgba(254, 210, 110, 0.55)";
          ctx.lineWidth = 1.8;
          ctx.shadowColor = "rgba(254, 210, 110, 0.5)";
          ctx.shadowBlur = 8;
          ctx.stroke();
          ctx.shadowBlur = 0;

          const travel = (now * 0.0006) % 1;
          const hx = cc.x + (endX - cc.x) * travel;
          ctx.beginPath();
          ctx.arc(hx, cc.y, 2.4, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255, 240, 200, 0.85)";
          ctx.fill();
        }
      }

      ctx.restore();
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="tf-stage" aria-label="8 uneven signal spirals converging into a digitalisation process">
      <div className="tf-divider" aria-hidden="true" />
      <div className="tf-storyboard" ref={wrapRef}>
        <canvas ref={canvasRef} className="tf-canvas" aria-hidden="true" />
        <div className="tf-cart">
          <div className="tf-box" ref={boxRef}>
            <div className="tf-box-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="5" cy="12" r="2" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="19" cy="6" r="2" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="19" cy="18" r="2" stroke="currentColor" strokeWidth="1.6" />
                <path d="M7 11.2L17 6.8M7 12.8L17 17.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </div>
            <div className="tf-box-text">
              <span className="tf-box-eyebrow">Process</span>
              <span className="tf-box-title">Digitalisation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   BUG SCAN LAPTOP
   A laptop mockup whose screen is a canvas: hovering it sweeps a
   circular "AI lens" that inverts to a light scan view and reveals
   hidden virus/threat glyphs wherever the lens passes over them —
   ported from a magnifying-glass vulnerability-scan demo.
────────────────────────────────────────── */
function BugScanLaptop() {
  const cardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    const canvas = canvasRef.current;
    const statusEl = statusRef.current;
    if (!card || !canvas || !statusEl) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const LENS_R = 55;
    let mouseX = 0, mouseY = 0;
    let lensX = 0, lensY = 0;
    let isInside = false;
    let rafId = 0;
    let threatCount = 0;
    let W = 0, H = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const virusPositions = [
      { rx: 0.22, ry: 0.28 },
      { rx: 0.72, ry: 0.55 },
      { rx: 0.45, ry: 0.72 },
    ];

    const resize = () => {
      const rect = card.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
    };

    /* Unmistakably a bug: oval body + round head, curved antennae,
       three legs splayed off each side — not an abstract starburst */
    const drawVirus = (cx: number, cy: number, size: number, color: string) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 1.6;
      ctx.lineCap = "round";

      const bodyRx = size * 0.24;
      const bodyRy = size * 0.34;
      const headR = size * 0.14;
      const headCy = cy - bodyRy - headR * 0.6;

      // legs — 3 per side, splayed from the body's midline
      for (let i = -1; i <= 1; i++) {
        const legY = cy + i * bodyRy * 0.55;
        const spread = size * 0.34;
        [-1, 1].forEach((side) => {
          ctx.beginPath();
          ctx.moveTo(cx + side * bodyRx * 0.7, legY);
          ctx.lineTo(cx + side * (bodyRx + spread), legY + i * size * 0.1);
          ctx.stroke();
        });
      }

      // antennae
      ctx.beginPath();
      ctx.moveTo(cx - headR * 0.5, headCy - headR * 0.6);
      ctx.quadraticCurveTo(cx - size * 0.22, headCy - size * 0.32, cx - size * 0.28, headCy - size * 0.42);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + headR * 0.5, headCy - headR * 0.6);
      ctx.quadraticCurveTo(cx + size * 0.22, headCy - size * 0.32, cx + size * 0.28, headCy - size * 0.42);
      ctx.stroke();

      // body (oval) + spine line
      ctx.beginPath();
      ctx.ellipse(cx, cy, bodyRx, bodyRy, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx, cy - bodyRy * 0.7);
      ctx.lineTo(cx, cy + bodyRy * 0.7);
      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // head
      ctx.beginPath();
      ctx.arc(cx, headCy, headR, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      ctx.restore();
    };

    const drawGrid = (color: string, gs: number) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      for (let x = 0; x <= W; x += gs) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y <= H; y += gs) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
    };

    const drawFrame = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      ctx.fillStyle = "#0d0d0d";
      ctx.fillRect(0, 0, W, H);
      drawGrid("rgba(255,255,255,0.035)", 28);

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = "500 11px -apple-system, BlinkMacSystemFont, Inter, sans-serif";
      ctx.fillText("TARGET SOFTWARE", W / 2, H / 2);
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.font = "400 9px -apple-system, BlinkMacSystemFont, Inter, sans-serif";
      ctx.fillText("v4.2.1 · secure · verified", W / 2, H / 2 + 18);

      if (!isInside) return;

      const lx = lensX, ly = lensY;

      ctx.save();
      ctx.beginPath();
      ctx.arc(lx, ly, LENS_R, 0, Math.PI * 2);
      ctx.clip();

      ctx.fillStyle = "#f0f0f0";
      ctx.fillRect(0, 0, W, H);
      drawGrid("rgba(0,0,0,0.08)", 28);

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(0,0,0,0.9)";
      ctx.font = "500 11px -apple-system, BlinkMacSystemFont, Inter, sans-serif";
      ctx.fillText("TARGET SOFTWARE", W / 2, H / 2);
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.font = "400 9px -apple-system, BlinkMacSystemFont, Inter, sans-serif";
      ctx.fillText("v4.2.1 · secure · verified", W / 2, H / 2 + 18);

      virusPositions.forEach((p) => {
        const vx = p.rx * W;
        const vy = p.ry * H;
        const d = Math.hypot(lx - vx, ly - vy);
        if (d < LENS_R - 10) drawVirus(vx, vy, 30, "#cc2200");
      });

      ctx.restore();

      ctx.beginPath();
      ctx.arc(lx, ly, LENS_R, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(lx, ly, LENS_R + 8, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    const animate = () => {
      if (!isInside) return;
      lensX += (mouseX - lensX) * 0.14;
      lensY += (mouseY - lensY) * 0.14;
      drawFrame();

      let found = 0;
      virusPositions.forEach((p) => {
        const vx = p.rx * W;
        const vy = p.ry * H;
        if (Math.hypot(lensX - vx, lensY - vy) < LENS_R - 10) found++;
      });

      if (found !== threatCount) {
        threatCount = found;
        if (found > 0) {
          statusEl.textContent = found + " THREAT" + (found > 1 ? "S" : "") + " DETECTED";
          statusEl.style.color = "rgba(220,60,40,0.85)";
        } else {
          statusEl.textContent = "SCANNING";
          statusEl.style.color = "rgba(255,255,255,0.25)";
        }
      }

      rafId = requestAnimationFrame(animate);
    };

    const onEnter = (e: PointerEvent) => {
      isInside = true;
      const rect = card.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      lensX = mouseX;
      lensY = mouseY;
      statusEl.textContent = "SCANNING";
      statusEl.style.color = "rgba(255,255,255,0.25)";
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(animate);
    };
    const onMove = (e: PointerEvent) => {
      const rect = card.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };
    const onLeave = () => {
      isInside = false;
      cancelAnimationFrame(rafId);
      statusEl.textContent = "IDLE";
      statusEl.style.color = "rgba(255,255,255,0.12)";
      threatCount = 0;
      drawFrame();
    };

    resize();
    drawFrame();
    window.addEventListener("resize", resize);
    card.addEventListener("pointerenter", onEnter);
    card.addEventListener("pointermove", onMove);
    card.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      card.removeEventListener("pointerenter", onEnter);
      card.removeEventListener("pointermove", onMove);
      card.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div className="bugscan-laptop">
      <div className="bugscan-laptop-screen">
        <div className="bugscan-laptop-bezel">
          <div className="bugscan-card" ref={cardRef}>
            <canvas ref={canvasRef} />
            <div className="bugscan-status" ref={statusRef}>IDLE</div>
          </div>
        </div>
        <div className="bugscan-laptop-cam" />
      </div>
      <div className="bugscan-laptop-base">
        <div className="bugscan-laptop-notch" />
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   VR GALLERY
   Fullscreen overlay entered via "Switch to VR" on a carousel: a real
   Three.js scene, cards laid out as a gently curved row in 3D space
   floating in front of the camera. Hovering the left/right edges or
   either bottom corner scrubs the row continuously toward that end
   (clamped, eases to a stop at the last/first card); the top of the
   screen is inert. A floating HTML "Close VR" button exits.
────────────────────────────────────────── */
function VRGallery({ category, onClose }: { category: "Web" | "App"; onClose: () => void }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    /* Corner-hover auto-scroll happens inside the VR view itself, so
       normal page scroll must be fully blocked while it's open — not
       just visually hidden, or a trackpad/wheel event can still creep
       the page behind the overlay. */
    const blockScroll = (e: Event) => e.preventDefault();
    const prevOverflow = document.body.style.overflow;
    const prevPosition = document.body.style.position;
    const scrollY = window.scrollY;

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    window.addEventListener("keydown", onKey);
    window.addEventListener("wheel", blockScroll, { passive: false });
    window.addEventListener("touchmove", blockScroll, { passive: false });

    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", blockScroll);
      window.removeEventListener("touchmove", blockScroll);
      document.body.style.overflow = prevOverflow;
      document.body.style.position = prevPosition;
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, scrollY);
    };
  }, [onClose]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const works = WORKS.filter((w) => w.category === category);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050403, 0.045);

    const camera = new THREE.PerspectiveCamera(50, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 0.3, 10.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xfff4e0, 0.55));
    const key = new THREE.PointLight(0xffd06a, 2.2, 40, 2);
    key.position.set(0, 3, 7);
    scene.add(key);
    const rim = new THREE.PointLight(0x8fb4ff, 0.9, 40, 2);
    rim.position.set(-5, -2, -5);
    scene.add(rim);
    const rim2 = new THREE.PointLight(0xff8a3c, 0.6, 40, 2);
    rim2.position.set(5, -1, -4);
    scene.add(rim2);

    /* soft reflective floor — grid fading into the fog, grounds the
       row of cards in a "space" instead of floating on pure black */
    const floorGeo = new THREE.PlaneGeometry(80, 80);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0a0806,
      roughness: 0.35,
      metalness: 0.6,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.6;
    scene.add(floor);

    const grid = new THREE.GridHelper(80, 60, 0xc8860c, 0x2a2216);
    grid.position.y = -2.59;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.22;
    scene.add(grid);

    /* slow-drifting dust motes for depth/atmosphere */
    const DUST_COUNT = 140;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(DUST_COUNT * 3);
    for (let i = 0; i < DUST_COUNT; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 30;
      dustPos[i * 3 + 1] = (Math.random() - 0.5) * 12;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 20 - 4;
    }
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0xffd58a,
      size: 0.045,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);

    /* each card's face is drawn onto an offscreen canvas and used as
       a texture — same visual language (title, accent bg) as the
       flat DOM cards, just rendered into 3D space */
    const CARD_W = 3.1;
    const CARD_H = category === "App" ? 2.4 : 1.95;
    const GAP = 1.15;

    const makeCardTexture = (work: (typeof WORKS)[number]) => {
      const cw = 640, ch = category === "App" ? 500 : 400;
      const c = document.createElement("canvas");
      c.width = cw;
      c.height = ch;
      const cctx = c.getContext("2d")!;
      cctx.fillStyle = work.bg || "#141414";
      cctx.fillRect(0, 0, cw, ch);
      cctx.fillStyle = `${work.accent}22`;
      cctx.fillRect(0, 0, cw, 6);

      const draw2D = (img: HTMLImageElement | null) => {
        cctx.clearRect(0, 0, cw, ch);
        cctx.fillStyle = work.bg || "#141414";
        cctx.fillRect(0, 0, cw, ch);
        if (img) {
          const scale = Math.max(cw / img.width, ch / img.height);
          const iw = img.width * scale;
          const ih = img.height * scale;
          cctx.drawImage(img, (cw - iw) / 2, (ch - ih) / 2, iw, ih);
          const grad = cctx.createLinearGradient(0, ch * 0.6, 0, ch);
          grad.addColorStop(0, "rgba(0,0,0,0)");
          grad.addColorStop(1, "rgba(0,0,0,0.72)");
          cctx.fillStyle = grad;
          cctx.fillRect(0, 0, cw, ch);
        } else {
          cctx.fillStyle = work.accent;
          cctx.globalAlpha = 0.14;
          cctx.beginPath();
          cctx.arc(cw / 2, ch / 2, ch * 0.32, 0, Math.PI * 2);
          cctx.fill();
          cctx.globalAlpha = 1;
        }
        cctx.fillStyle = "rgba(255,255,255,0.94)";
        cctx.font = "700 34px var(--f-display), sans-serif";
        cctx.textBaseline = "bottom";
        cctx.fillText(work.title, 28, ch - 26);
        cctx.fillStyle = work.accent;
        cctx.font = "600 15px var(--f-mono), monospace";
        cctx.fillText(work.tag || work.category, 28, ch - 2);
        tex.needsUpdate = true;
      };

      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      draw2D(null);

      if (work.image) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => draw2D(img);
        img.src = work.image;
      }
      return tex;
    };

    const cards: THREE.Mesh[] = works.map((work, i) => {
      const tex = makeCardTexture(work);
      const geo = new THREE.PlaneGeometry(CARD_W, CARD_H, 1, 1);
      const mat = new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.55,
        metalness: 0.1,
        emissive: new THREE.Color(work.accent || "#000000"),
        emissiveIntensity: 0.06,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.userData.baseX = i * (CARD_W + GAP);
      scene.add(mesh);
      return mesh;
    });

    const totalSpan = Math.max(0, (cards.length - 1) * (CARD_W + GAP));

    /* scroll offset along the row — 0 = first card centered,
       totalSpan = last card centered; camera-relative curve applied
       per-card each frame based on distance from current offset */
    let offset = 0;
    let velocity = 0;

    /* corner/edge hover zones drive a target velocity; releasing
       decays it back to 0 instead of stopping instantly */
    const HOVER_SPEED = 0.11;
    let hoverDir = 0; /* -1 = scroll toward first card, 1 = toward last */

    const zones = Array.from(mount.parentElement?.querySelectorAll<HTMLElement>(".vr-zone") ?? []);
    const leftZones = zones.filter((z) => z.classList.contains("vr-zone-left") || z.classList.contains("vr-zone-bl"));
    const rightZones = zones.filter((z) => z.classList.contains("vr-zone-right") || z.classList.contains("vr-zone-br"));

    const setDirLeft = () => { hoverDir = -1; };
    const setDirRight = () => { hoverDir = 1; };
    const clearDir = () => { hoverDir = 0; };
    leftZones.forEach((z) => {
      z.addEventListener("pointerenter", setDirLeft);
      z.addEventListener("pointerleave", clearDir);
    });
    rightZones.forEach((z) => {
      z.addEventListener("pointerenter", setDirRight);
      z.addEventListener("pointerleave", clearDir);
    });

    let raf = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const now = clock.elapsedTime;

      velocity += (hoverDir * HOVER_SPEED - velocity) * 0.08;
      offset += velocity * dt * 60;
      offset = Math.max(0, Math.min(totalSpan, offset));
      if (offset === 0 || offset === totalSpan) velocity *= 0.5;

      cards.forEach((mesh) => {
        const localX = mesh.userData.baseX - offset;
        mesh.position.x = localX;
        /* gentle curve: cards further from center recede in z and
           yaw slightly, so the row reads as a shallow VR arc, not a
           flat strip */
        const t = localX / 6;
        mesh.position.z = -Math.abs(t) * 0.9;
        mesh.rotation.y = -t * 0.22;
        const dist = Math.abs(localX);
        const s = dist < 4 ? 1 : Math.max(0.72, 1 - (dist - 4) * 0.05);
        mesh.scale.setScalar(s);
        const mat = mesh.material as THREE.MeshStandardMaterial;
        /* the centered card breathes with a slow glow pulse so it
           reads as the "focused" one in the row */
        const focus = Math.max(0, 1 - dist / 2);
        const pulse = 0.5 + 0.5 * Math.sin(now * 1.6);
        mat.emissiveIntensity = 0.05 + focus * (0.12 + pulse * 0.06);
      });

      /* slow parallax drift on the dust field, plus a gentle
         camera sway so the scene never feels perfectly static */
      dust.rotation.y = now * 0.012;
      camera.position.x = Math.sin(now * 0.15) * 0.15;
      camera.position.y = 0.3 + Math.cos(now * 0.12) * 0.08;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      leftZones.forEach((z) => {
        z.removeEventListener("pointerenter", setDirLeft);
        z.removeEventListener("pointerleave", clearDir);
      });
      rightZones.forEach((z) => {
        z.removeEventListener("pointerenter", setDirRight);
        z.removeEventListener("pointerleave", clearDir);
      });
      cards.forEach((mesh) => {
        mesh.geometry.dispose();
        (mesh.material as THREE.MeshStandardMaterial).map?.dispose();
        (mesh.material as THREE.MeshStandardMaterial).dispose();
      });
      floorGeo.dispose();
      floorMat.dispose();
      (grid.material as THREE.Material).dispose();
      dustGeo.dispose();
      dustMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement);
    };
  }, [category]);

  return (
    <div className="vr-overlay" role="dialog" aria-modal="true" aria-label={`VR view — ${category === "Web" ? "Web Platforms" : "Mobile Apps"}`}>
      <div className="vr-scene-mount" ref={mountRef} aria-hidden="true" />

      {/* corner scroll zones — top edge stays inert on purpose */}
      <div className="vr-zone vr-zone-left" />
      <div className="vr-zone vr-zone-right" />
      <div className="vr-zone vr-zone-bl" />
      <div className="vr-zone vr-zone-br" />

      <div className="vr-label">{category === "Web" ? "Web Platforms" : "Mobile Apps"} · VR</div>

      <button className="vr-close-btn" onClick={onClose} aria-label="Close VR view">
        <span>✕</span> Close VR
      </button>
    </div>
  );
}

/* ──────────────────────────────────────────
   MAIN APP
────────────────────────────────────────── */
export default function GOBTApp() {
  const worksTrackRef = useRef<HTMLDivElement>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [filter, setFilter] = useState("All");
  const [activeJob, setActiveJob] = useState<typeof JOBS[0] | null>(null);
  const [vrCategory, setVrCategory] = useState<"Web" | "App" | null>(null);
  const isMobile = useRef(false);

  /* Smooth typewriter — loops continuously through the word list */
  const { display: twText } = useTypewriter(
    TYPEWRITER_WORDS,
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


  useEffect(() => {
    isMobile.current = window.innerWidth < 768;

    /* #preloader is a fixed, fully-opaque, z-index:100000 overlay that
       covers the whole page until GSAP's timeline explicitly hides it.
       If the CDN scripts are slow/blocked or anything in that chain
       fails, the site is stuck behind a black screen forever — so every
       exit path (including a hard timeout) must be able to remove it. */
    let preloaderHidden = false;
    const hidePreloader = () => {
      if (preloaderHidden) return;
      preloaderHidden = true;
      const el = document.getElementById("preloader");
      if (el) el.style.cssText += ";opacity:0;pointer-events:none";
    };
    /* last-resort fallback: if GSAP never finishes the reveal chain for
       any reason, force everything visible directly via inline style so
       the page can't get stuck hidden — normal loads never reach this,
       since runPreloader/runHeroEntrance clear this timer once they run */
    const forceRevealAll = () => {
      hidePreloader();
      document
        .querySelectorAll(".r-up,.r-left,.r-right,.r-fade,.r-scale,.hero-eyebrow,.hero-h1-inner,.hero-bottom")
        .forEach((el) => {
          (el as HTMLElement).style.cssText += ";opacity:1;transform:none";
        });
    };
    const safetyTimer = setTimeout(forceRevealAll, 4500);

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

        const w = window as any;
        const { gsap } = w;
        const ScrollTrigger = w.ScrollTrigger;

        if (!gsap || !ScrollTrigger) {
          console.warn("GSAP or ScrollTrigger not loaded");
          clearTimeout(safetyTimer);
          forceRevealAll();
          return;
        }

        gsap.registerPlugin(ScrollTrigger);

        runPreloader(gsap, () => {
          clearTimeout(safetyTimer);
          preloaderHidden = true; /* runPreloader's own timeline already faded it out */
          runHeroEntrance(gsap);
          runScrollAnims(gsap, ScrollTrigger);
          runStatsCounter(gsap, ScrollTrigger);
          runNav();
        });
      } catch (err) {
        console.error("Script loading error:", err);
        clearTimeout(safetyTimer);
        forceRevealAll();
      }
    })();

    return () => clearTimeout(safetyTimer);
  }, []);

  /* ═════════════════════════════════════
     PRELOADER — GOBT text animation
     ═════════════════════════════════════ */
  function runPreloader(gsap: any, onDone: () => void) {
    const tl = gsap.timeline({ onComplete: onDone });
    tl.to("#preloader", { opacity: 0, duration: 0.5, delay: 1.3, pointerEvents: "none", ease: "power2.out" });
  }

  /* ═════════════════════════════════════
     HERO ENTRANCE
     ═════════════════════════════════════ */
  function runHeroEntrance(gsap: any) {
    if (isMobile.current) {
      document
        .querySelectorAll(".hero-eyebrow, .hero-h1-inner, .hero-bottom")
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
      );
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
    let lastY = window.scrollY;
    window.addEventListener("scroll", () => {
      const y = window.scrollY;
      nav.classList.toggle("scrolled", y > 60);
      if (y > lastY && y > 120) {
        nav.classList.add("nav-hidden");
      } else {
        nav.classList.remove("nav-hidden");
      }
      lastY = y;
    }, { passive: true });
  }

  /* ══════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════ */
  return (
    <>
      {/* ── CURSOR (hidden — using normal cursor) ── */}
      <div id="cursor-dot" />
      <div id="cursor-outer" />

      {/* ── PRELOADER — crystal loader (Uiverse.io by Juanes200122) ── */}
      <div id="preloader">
        <svg xmlns="http://www.w3.org/2000/svg" height="200" width="200" aria-hidden="true">
          <g>
            <polygon transform="rotate(45 100 100)" strokeWidth="1" stroke="#d3a410" fill="none" points="70,70 148,50 130,130 50,150" id="pl-bounce" />
            <polygon transform="rotate(45 100 100)" strokeWidth="1" stroke="#d3a410" fill="none" points="70,70 148,50 130,130 50,150" id="pl-bounce2" />
            <polygon transform="rotate(45 100 100)" strokeWidth="2" stroke="" fill="#414750" points="70,70 150,50 130,130 50,150" />
            <polygon strokeWidth="2" stroke="" fill="url(#pl-gradiente)" points="100,70 150,100 100,130 50,100" />
            <defs>
              <linearGradient y2="100%" x2="10%" y1="0%" x1="0%" id="pl-gradiente">
                <stop style={{ stopColor: "#1e2026", stopOpacity: 1 }} offset="20%" />
                <stop style={{ stopColor: "#414750", stopOpacity: 1 }} offset="60%" />
              </linearGradient>
            </defs>
            <polygon transform="translate(20, 31)" strokeWidth="2" stroke="" fill="#b7870f" points="80,50 80,75 80,99 40,75" />
            <polygon transform="translate(20, 31)" strokeWidth="2" stroke="" fill="url(#pl-gradiente2)" points="40,-40 80,-40 80,99 40,75" />
            <defs>
              <linearGradient y2="100%" x2="0%" y1="-17%" x1="10%" id="pl-gradiente2">
                <stop style={{ stopColor: "#d3a51000", stopOpacity: 1 }} offset="20%" />
                <stop style={{ stopColor: "#d3a51054", stopOpacity: 1 }} offset="100%" id="pl-animatedStop" />
              </linearGradient>
            </defs>
            <polygon transform="rotate(180 100 100) translate(20, 20)" strokeWidth="2" stroke="" fill="#d3a410" points="80,50 80,75 80,99 40,75" />
            <polygon transform="rotate(0 100 100) translate(60, 20)" strokeWidth="2" stroke="" fill="url(#pl-gradiente3)" points="40,-40 80,-40 80,85 40,110.2" />
            <defs>
              <linearGradient y2="100%" x2="10%" y1="0%" x1="0%" id="pl-gradiente3">
                <stop style={{ stopColor: "#d3a51000", stopOpacity: 1 }} offset="20%" />
                <stop style={{ stopColor: "#d3a51054", stopOpacity: 1 }} offset="100%" id="pl-animatedStop2" />
              </linearGradient>
            </defs>
            <polygon transform="rotate(45 100 100) translate(80, 95)" strokeWidth="2" stroke="" fill="#ffe4a1" points="5,0 5,5 0,5 0,0" className="pl-particles" />
            <polygon transform="rotate(45 100 100) translate(80, 55)" strokeWidth="2" stroke="" fill="#ccb069" points="6,0 6,6 0,6 0,0" className="pl-particles" />
            <polygon transform="rotate(45 100 100) translate(70, 80)" strokeWidth="2" stroke="" fill="#fff" points="2,0 2,2 0,2 0,0" className="pl-particles" />
            <polygon strokeWidth="2" stroke="" fill="#292d34" points="29.5,99.8 100,142 100,172 29.5,130" />
            <polygon transform="translate(50, 92)" strokeWidth="2" stroke="" fill="#1f2127" points="50,50 120.5,8 120.5,35 50,80" />
          </g>
        </svg>
      </div>

      {/* ── MOBILE NAV ── */}
      <div id="mobile-nav" className={menuOpen ? "open" : ""}>
        <button className="mobile-close" onClick={() => setMenuOpen(false)}>✕</button>
        {[
          ["home", "Home"],
          ["about", "About"],
          ["works", "Works"],
          ["clients", "Clients"],
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
      </div>

      {/* ── NAV ── */}
      <nav id="nav" role="navigation" aria-label="Main navigation">
        <a href="#" className="nav-logo" onClick={(e) => { e.preventDefault(); goto("home"); }}>
          <img src="/logo.png" alt="GOBT" style={{ height: "60px", width: "auto" }} />
        </a>
        <button
          className="nav-dots"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          aria-expanded={menuOpen}
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
        <div className="hero-aurora" aria-hidden="true">
          <span className="hero-aurora-blob b1" />
          <span className="hero-aurora-blob b2" />
          <span className="hero-aurora-blob b3" />
          <span className="hero-aurora-blob b4" />
        </div>
        <div className="hero-noise" aria-hidden="true" />
        <div className="hero-vignette" aria-hidden="true" />
        <div className="hero-inner hero-inner-centered">
          <div className="hero-text-col hero-text-col-centered">
            <div className="hero-eyebrow">
              Group of Blooming Technicians (Est. 2022)
            </div>
            <h1 className="hero-h1">
              <span className="hero-h1-line">
                <span className="hero-h1-inner">
                  We Build{" "}
                  <span className="hero-h1-tw orange" aria-live="polite">
                    {twText}
                    <span className="tw-cursor" />
                  </span>
                </span>
              </span>
            </h1>
            <div className="hero-bottom hero-bottom-centered">
              <p className="hero-desc">
                Engineering studio building apps, platforms, and interfaces that convert.
                We partner as your technical co-founders from first idea to full-scale
                product, design, and deployment.
              </p>
              <div className="hero-actions">
                <a
                  href="https://wa.me/918972297093?text=Hi%20GOBT%2C%20I%20want%20to%20start%20a%20project"
                  target="_blank"
                  rel="noreferrer"
                  className="golden-button"
                >
                  <span className="golden-text">Start a Project →</span>
                </a>
                <a
                  href="#"
                  className="btn-ghost"
                  onClick={(e) => { e.preventDefault(); goto("works"); }}
                >
                  <span>View Works</span>
                </a>
              </div>
            </div>
          </div>
        </div>
        <TransformStage />
      </section>

      {/* ══════════════════════════════════
          SERVICES
         ══════════════════════════════════ */}
      <section className="services-section" aria-label="What we offer">
        <div className="section-tag" style={{ marginBottom: "1.2rem" }}>What We Offer</div>
        <h2 className="services-h2">Tech domains we work in</h2>
        <div className="services-grid">
          {SERVICES.map((s, i) => (
            <div key={s.label} className="service-card">
              <div className="service-card-icon">{SERVICE_ICONS[i % SERVICE_ICONS.length]}</div>
              <div className="service-card-title">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════
          BUG DETECTION
         ══════════════════════════════════ */}
      <section className="bugscan-section" aria-label="AI-enabled threat detection">
        <div className="bugscan-grid">
          <div className="bugscan-copy">
            <div className="section-tag" style={{ marginBottom: "1.5rem" }}>GOBT Security Platform</div>
            <h2 className="section-h2">
              AI-enabled
              <br />
              <span className="accent">Threat Detection.</span>
            </h2>
            <p className="bugscan-body">
              Our in-house AI system, &ldquo;CuriOS&rdquo;, scans your software
              for vulnerabilities and ranks every threat by risk before it
              becomes a breach.
            </p>
          </div>
          <div className="bugscan-visual">
            <div className="bugscan-label">Hover the screen to scan</div>
            <BugScanLaptop />
            <p className="bugscan-callout">
              &ldquo;Do not let your hard-earned business revenue be plundered
              by cyber pirates. Subscribe to GOBT today to fortify your
              digital world.&rdquo;
            </p>
          </div>
        </div>
      </section>

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
              GOBT (Group of Blooming Technicians) is an advanced engineering
              studio based in Kolkata, India. We merge startup thinking with
              engineering excellence to build digital products that are
              profitable, scalable, and conversion-ready. We analyze your
              business before writing a single line of code.
            </p>
            <div className="about-pillars">
              {[
                { t: "Product Thinking", d: "Revenue models, user journeys and pain points analyzed before any development begins." },
                { t: "Fast Execution", d: "Agile sprints. Weekly deliverables. MVPs shipped in weeks, not quarters." },
                { t: "Premium Design", d: "Every pixel intentional. Interfaces that convert, delight, and reinforce your brand." },
                { t: "Lasting Partnership", d: "We do not disappear after launch. We monitor, optimize, and scale with you." },
              ].map((p) => (
                <div key={p.t} className="pillar-card">
                  <div className="pillar-title">{p.t}</div>
                  <div className="pillar-desc">{p.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          WORKS
         ══════════════════════════════════ */}
      <section id="works" aria-label="Selected works">
        {/* Centered header */}
        <div className="works-header-center">
          <div className="section-tag r-fade" style={{ marginBottom: "1.2rem", justifyContent: "center" }}>Selected Works</div>
          <h2 className="section-h2 r-up" style={{ textAlign: "center" }}>
            What we&apos;ve <span className="accent">built</span> so far.
          </h2>
          <p className="section-body r-up" style={{ textAlign: "center", marginTop: "1rem", color: "var(--fg2)" }}>
            Real products. Real clients. Real impact worldwide.
          </p>
        </div>

        {/* ── Web Platforms Carousel ── */}
        <div className="works-carousel-block">
          <div className="works-carousel-header">
            <div className="works-category-label">
              <span className="works-cat-dot" />
              Web Platforms
            </div>
            <button className="vr-switch-btn" onClick={() => setVrCategory("Web")}>
              <span className="vr-switch-dot" />
              Switch to VR
            </button>
          </div>
          <div className="works-carousel-wrap">
            <button className="carousel-btn carousel-btn-left" aria-label="Previous web project"
              onClick={() => { const el = document.getElementById("web-carousel"); if (el) el.scrollBy({ left: -360, behavior: "smooth" }); }}>
              ←
            </button>
            <button className="carousel-btn carousel-btn-right" aria-label="Next web project"
              onClick={() => { const el = document.getElementById("web-carousel"); if (el) el.scrollBy({ left: 360, behavior: "smooth" }); }}>
              →
            </button>
            <div className="works-carousel-track" id="web-carousel">
            {WORKS.filter((w) => w.category === "Web").map((work) => (
              <article key={work.id} className="work-browser-card"
                onClick={() => work.live && window.open(`https://${work.live}`, "_blank")}>
                <div className="browser-chrome">
                  <div className="browser-traffic-lights">
                    <span className="tl tl-red" /><span className="tl tl-yellow" /><span className="tl tl-green" />
                  </div>
                  <div className="browser-url-bar">
                    <span className="browser-lock">🔒</span>
                    <span className="browser-url-text">{work.live || "gobt.in"}</span>
                  </div>
                </div>
                <div className="browser-viewport">
                  {work.image ? (
                    <img src={work.image} alt={work.title} className="browser-screenshot" />
                  ) : (
                    <div className="browser-placeholder" style={{ background: work.bg }}>
                      <div className="browser-placeholder-icon" style={{ color: work.accent }}>
                        <svg viewBox="0 0 24 24" fill="none" width="34" height="34">
                          <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
                          <path d="M3 8.5h18" stroke="currentColor" strokeWidth="1.6" />
                        </svg>
                      </div>
                      <div className="browser-placeholder-label">{work.title}</div>
                    </div>
                  )}
                  <div className="browser-overlay" />
                </div>
              </article>
            ))}
            </div>
          </div>
        </div>

        {/* ── Mobile Apps Carousel ── */}
        <div className="works-carousel-block">
          <div className="works-carousel-header">
            <div className="works-category-label">
              <span className="works-cat-dot" />
              Mobile Apps
            </div>
            <button className="vr-switch-btn" onClick={() => setVrCategory("App")}>
              <span className="vr-switch-dot" />
              Switch to VR
            </button>
          </div>
          <div className="works-carousel-wrap">
            <button className="carousel-btn carousel-btn-left" aria-label="Previous app project"
              onClick={() => { const el = document.getElementById("app-carousel"); if (el) el.scrollBy({ left: -300, behavior: "smooth" }); }}>
              ←
            </button>
            <button className="carousel-btn carousel-btn-right" aria-label="Next app project"
              onClick={() => { const el = document.getElementById("app-carousel"); if (el) el.scrollBy({ left: 300, behavior: "smooth" }); }}>
              →
            </button>
            <div className="works-carousel-track" id="app-carousel">
            {WORKS.filter((w) => w.category === "App").map((work) => (
              <article key={work.id} className="work-phone-card" aria-label={work.title}
                onClick={() => work.live && window.open(`https://${work.live}`, "_blank")}>
                <div className="phone-frame">
                  <div className="phone-top-bar"><div className="phone-notch" /></div>
                  <div className="phone-screen">
                    {work.image ? (
                      <img src={work.image} alt={work.title} className="phone-screenshot" />
                    ) : (
                      <div className="phone-placeholder" style={{ background: work.bg }}>
                        <div className="phone-placeholder-icon" style={{ color: work.accent }}>
                          <svg viewBox="0 0 24 24" fill="none" width="60" height="60">
                            <rect x="6" y="2.5" width="12" height="19" rx="2.2" stroke="currentColor" strokeWidth="1.4" />
                            <path d="M10.5 18.2h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="phone-bottom-bar"><div className="phone-home-indicator" /></div>
                </div>
              </article>
            ))}
            </div>
          </div>
        </div>
      </section>

      {vrCategory && (
        <VRGallery category={vrCategory} onClose={() => setVrCategory(null)} />
      )}

      {/* ══════════════════════════════════
          CLIENTS
         ══════════════════════════════════ */}
      <section id="clients" aria-label="Our clients">
        <div className="section-tag r-fade" style={{ marginBottom: "1.5rem", justifyContent: "center", display: "flex", margin: "0 auto 1.5rem" }}>Our Clients</div>
        <h2 className="section-h2" style={{ textAlign: "center", marginBottom: "4rem" }}>
          Businesses that<br />
          trust <span className="accent">GOBT.</span>
        </h2>

        <div className="client-logo-grid" aria-label="Client logos">
          {CLIENTS.map((c, i) => (
            <div key={i} className="client-logo-card">
              {c.logo ? (
                <img src={c.logo} alt={c.name} className={c.darkLogo ? "logo-invert" : undefined} />
              ) : (
                <div className="text-logo">{c.name}</div>
              )}
            </div>
          ))}
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
          <p className="r-fade" style={{ fontFamily: "var(--f-display)", fontWeight: 700, fontSize: "clamp(1.3rem, 2.2vw, 1.8rem)", letterSpacing: "-0.01em", textTransform: "none", color: "var(--fg)", marginBottom: "1.5rem" }}>
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
      {/* KNOW US — hidden for now, revisiting later
      <section id="know-us" aria-label="Our team">
        <div className="know-intro" style={{ textAlign: "center" }}>
          <div className="section-tag r-fade" style={{ marginBottom: "1.5rem", justifyContent: "center", display: "flex", margin: "0 auto 1.5rem" }}>Know Us</div>
          <h2 className="section-h2" style={{ textAlign: "center" }}>
            The people
            <br />
            behind <span className="accent">GOBT.</span>
          </h2>
          <p className="r-up" style={{ marginTop: "1.2rem", fontSize: "clamp(1rem, 1.4vw, 1.15rem)", fontWeight: 400, color: "var(--fg2)", maxWidth: "480px", lineHeight: 1.8, marginLeft: "auto", marginRight: "auto" }}>
            Our engineering leadership team. Scalable architecture, production discipline, and conversion-focused product design.
          </p>
        </div>

        <div className="know-grid">
          {TEAM.map((m) => (
            <div key={m.name} className="team-card" aria-label={m.name}>
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
      */}

      {/* ══════════════════════════════════
          TESTIMONIALS
         ══════════════════════════════════ */}
      <section id="testimonials" aria-label="Client testimonials">
        <div className="testimonials-header" style={{ textAlign: "center" }}>
          <div className="section-tag r-fade" style={{ marginBottom: "1.5rem", justifyContent: "center", display: "flex", margin: "0 auto 1.5rem" }}>Testimonials</div>
          <h2 className="section-h2" style={{ textAlign: "center" }}>
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
            {JOBS.filter((job) => job.id !== "blockchain").map((job) => (
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
        <div className="footer-aurora" aria-hidden="true" />
        <nav className="footer-nav" aria-label="Footer navigation">
          {[
            ["about", "About"],
            ["works", "Works"],
            ["clients", "Clients"],
            ["testimonials", "Testimonials"],
            ["careers", "Careers"],
            ["contact", "Contact"],
          ].map(([id, label]) => (
            <a key={id} href="#" onClick={(e) => { e.preventDefault(); goto(id); }}>
              {label}
            </a>
          ))}
        </nav>

        <button
          className="footer-wordmark-btn"
          onClick={() => goto("home")}
          aria-label="Back to top"
        >
          <span className="footer-wordmark">GOBT</span>
        </button>

        <div className="footer-bottom">
          <div className="footer-socials">
            <a href="https://www.linkedin.com/company/group-of-bluetechnicians/" target="_blank" rel="noreferrer" className="footer-social-link" aria-label="LinkedIn" title="LinkedIn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                <rect x="2" y="9" width="4" height="12" />
                <circle cx="4" cy="4" r="2" />
              </svg>
            </a>
            <a href="https://www.instagram.com/gobt.in" target="_blank" rel="noreferrer" className="footer-social-link" aria-label="Instagram" title="Instagram">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="4.5" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
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
          <div className="f-copy">
            <div>&copy; 2025 Group of Blooming Technicians. All rights reserved.</div>
            <div style={{ opacity: 0.5, fontSize: '0.75rem' }}>Formally known as Group of Blue Technicians</div>
          </div>
        </div>
      </footer>
    </>
  );
}

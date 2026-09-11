"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type CSSProperties,
} from "react";
import * as THREE from "three";
import Lenis from "lenis";

/* ──────────────────────────────────────────
   STATIC DATA
────────────────────────────────────────── */
const NAV_ITEMS = [
  { n: "01", label: "Services", id: "services" },
  { n: "02", label: "Process", id: "process" },
  { n: "03", label: "Estimate", id: "estimate" },
  { n: "04", label: "Why GOBT", id: "why" },
  { n: "05", label: "Team", id: "team" },
  { n: "06", label: "Contact", id: "contact" },
];

const CLIENTS = [
  {
    name: "Tata Communications",
    url: "gobtxtata.gobt.in",
    type: "Telecom / Enterprise",
    since: "2025",
    desc: "3D eyewear fitting and inspection experience built for a Tata Communications initiative",
    logo: "/tata.png",
  },
  {
    name: "Navaru",
    url: "navaru.in",
    type: "Corporate",
    since: "2024",
    desc: "Business website and brand presence",
    logo: "/naavru.png",
  },
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
    desc: "Crafted Fire. Real Flavor. Brand identity, website & mobile app",
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
    url: "gharkamali.com",
    type: "Home Services",
    since: "2022",
    desc: "On-demand home services marketplace with 500+ technicians, web platform and React Native app",
    logo: "/gkm-logo.png",
  },
];

const WORKS = [
  {
    id: 19,
    title: "Tata Communications",
    tag: "3D Product Experience",
    desc: "Immersive 3D eyewear fitting and inspection tool with real-time 360° rotation, frame specs and multi-model switching.",
    tech: ["Next.js", "Three.js", "WebGL"],
    accent: "#22d3ee",
    category: "Web",
    live: "gobtxtata.gobt.in",
    soon: false,
    image: "/img/tatacom.png",
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
    soon: false,
    image: "/img/pizzahap.png",
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
    soon: false,
    image: "/img/AgileEnginnerng.png",
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
    soon: false,
    image: "/img/GFTD.png",
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
    soon: false,
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
    soon: false,
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
    soon: false,
    image: "/img/altaqwa.png",
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
    soon: false,
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
    live: "oasiselevators.co.in",
    soon: false,
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
    soon: false,
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
    soon: false,
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
    soon: false,
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
    soon: false,
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
    soon: false,
    image: "/img/gkm-image.png",
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
    soon: false,
    image: "/img/Gharkamali.png",
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
  {
    text: "GOBT delivered our booking platform ahead of schedule with a UX our clients constantly compliment. Rare to find a dev partner this precise and this fast.",
    name: "Accurate Astro",
    role: "Astrology Consultation Platform",
    init: "A",
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
  <svg key="web" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="M3 8.5h18" stroke="currentColor" strokeWidth="1.6" /><path d="M7 13l-2 2 2 2M11 13l2 2-2 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  <svg key="app" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="2.5" width="12" height="19" rx="2.2" stroke="currentColor" strokeWidth="1.6" /><path d="M10.5 18.2h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>,
  <svg key="uiux" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 3l9 16 2-6 6-2-17-8z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>,
  <svg key="growth" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 19V5M4 19h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /><path d="M7 15l4-4 3 3 5-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  <svg key="sw" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 8l-4 4 4 4M16 8l4 4-4 4M14 4l-4 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  <svg key="iot" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="8" width="8" height="8" rx="1.4" stroke="currentColor" strokeWidth="1.6" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>,
  <svg key="ai" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3l1.8 4.6L18 9l-4.2 1.4L12 15l-1.8-4.6L6 9l4.2-1.4L12 3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><path d="M18.5 15l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9.9-2.1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /></svg>,
  <svg key="brand" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 3l9 9-8 8-9-9V4h7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><circle cx="8" cy="8" r="1.4" stroke="currentColor" strokeWidth="1.6" /></svg>,
  <svg key="data" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="12" cy="5.5" rx="8" ry="3" stroke="currentColor" strokeWidth="1.6" /><path d="M4 5.5v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" stroke="currentColor" strokeWidth="1.6" /><path d="M4 11.5v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" stroke="currentColor" strokeWidth="1.6" /></svg>,
  <svg key="security" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>,
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

const PROCESS_STEPS = [
  {
    title: "Brief",
    desc: "A short call to understand your business, your users and what success looks like. We scope the real problem before touching a single pixel.",
    image: "/img/AgileEnginnerng.png",
    icon: (
      <svg viewBox="0 0 24 24" fill="none"><path d="M4 5.5A1.5 1.5 0 015.5 4h10.5l4 4v10.5a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 18.5v-13z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><path d="M16 4v3.5A1.5 1.5 0 0017.5 9H21M8 12h8M8 15.5h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
    ),
  },
  {
    title: "Build",
    desc: "Design and development run in tight loops — you see working previews every few days, not a single reveal at the end of the project.",
    image: "/img/GFTD.png",
    icon: (
      <svg viewBox="0 0 24 24" fill="none"><path d="M8 8l-4 4 4 4M16 8l4 4-4 4M14 4l-4 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
    ),
  },
  {
    title: "Launch & Grow",
    desc: "We ship, monitor and iterate. Every product we hand over comes with the code, the ownership, and a plan for what comes next.",
    image: "/img/pizzahap.png",
    icon: (
      <svg viewBox="0 0 24 24" fill="none"><path d="M12 2.5c2.5 2.4 4 6 4 9.5 0 1.4-.3 2.7-.8 4H8.8c-.5-1.3-.8-2.6-.8-4 0-3.5 1.5-7.1 4-9.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><circle cx="12" cy="10.5" r="1.6" stroke="currentColor" strokeWidth="1.5" /><path d="M8.5 16.5L6 21l3.5-1.2M15.5 16.5L18 21l-3.5-1.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
    ),
  },
];

const COMPARE_ROWS = [
  { feature: "You own the full source code", agency: false, gobt: true },
  { feature: "Direct access to the people building it", agency: false, gobt: true },
  { feature: "Fixed scope, fixed price — no surprise invoices", agency: false, gobt: true },
  { feature: "Working preview within days, not months", agency: false, gobt: true },
];

const COMPARE_ROWS_MORE = [
  { feature: "Post-launch support included", agency: false, gobt: true },
  { feature: "Built on modern, maintainable stacks", agency: false, gobt: true },
  { feature: "SEO & performance baked in from day one", agency: false, gobt: true },
  { feature: "No lock-in to a proprietary platform", agency: false, gobt: true },
];

const ESTIMATE_TYPES = ["Website", "Web App", "Mobile App"] as const;
const ESTIMATE_SCOPES = ["Essential", "Momentum", "Full-Scale"] as const;

type EstimateType = (typeof ESTIMATE_TYPES)[number];
type EstimateScope = (typeof ESTIMATE_SCOPES)[number];

const ESTIMATE_TIMELINES: Record<EstimateType, Record<EstimateScope, string>> = {
  Website: { Essential: "2 weeks", Momentum: "3 weeks", "Full-Scale": "4 weeks" },
  "Web App": { Essential: "4–5 weeks", Momentum: "6 weeks", "Full-Scale": "7–8 weeks" },
  "Mobile App": { Essential: "4–5 weeks", Momentum: "6 weeks", "Full-Scale": "7–8 weeks" },
};

const ESTIMATE_TEAM: Record<EstimateScope, string> = {
  Essential: "1–2 engineers",
  Momentum: "2–3 engineers + 1 designer",
  "Full-Scale": "Full squad — design, backend, mobile & QA",
};

/* ──────────────────────────────────────────
   SCROLL REVEAL — IntersectionObserver
────────────────────────────────────────── */
function useScrollReveal() {
  useEffect(() => {
    const els = Array.from(
      document.querySelectorAll(".r-up,.r-left,.r-right,.r-fade,.r-scale")
    );
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in-view"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* ──────────────────────────────────────────
   SCRAMBLE TEXT — scroll-triggered decode reveal. Letters render
   from a shuffled charset and settle into the real string over
   ~700ms once the element enters the viewport, GOBT's equivalent
   of the reference site's headline-decode motion signature.
────────────────────────────────────────── */
const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function ScrambleText({ text, as: Tag = "span", className }: { text: string; as?: any; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  const [display, setDisplay] = useState(text);
  const rafRef = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let played = false;

    const runScramble = () => {
      const duration = 700;
      const start = performance.now();

      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / duration);
        const revealCount = Math.floor(p * text.length);
        let out = "";
        for (let i = 0; i < text.length; i++) {
          const ch = text[i];
          if (ch === " " || i < revealCount) out += ch;
          else out += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        }
        setDisplay(out);
        if (p < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          setDisplay(text);
          cancelAnimationFrame(rafRef.current);
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !played) {
            played = true;
            io.unobserve(entry.target);
            runScramble();
          }
        });
      },
      { threshold: 0.4 }
    );
    io.observe(el);

    return () => {
      io.disconnect();
      cancelAnimationFrame(rafRef.current);
      setDisplay(text);
    };
  }, [text]);

  return (
    <Tag ref={ref} className={className}>
      {display}
    </Tag>
  );
}

/* ──────────────────────────────────────────
   ANIMATED COUNTER
────────────────────────────────────────── */
function useCountUp(target: number, active: boolean, duration = 1400) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setVal(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);
  return val;
}

function StatCard({ stat }: { stat: (typeof GOBT_STATS)[number] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setActive(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const val = useCountUp(stat.val, active);
  return (
    <div className="stat-card" ref={ref}>
      <div className="stat-number">
        {val}
        <span className="stat-sup">{stat.sup}</span>
      </div>
      <div className="stat-label">{stat.label}</div>
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
      <div>
        <div className="contact-success-title">Message received.</div>
        <p className="contact-success-body">
          We respond within 24 hours. For a faster response, reach us directly on WhatsApp.
        </p>
      </div>
    );
  }

  const field = (label: string, key: keyof typeof form, type: string, placeholder: string) => (
    <div className="form-field">
      <label className="form-label" htmlFor={`f-${key}`}>{label}</label>
      <input
        id={`f-${key}`}
        className="form-input"
        type={type}
        placeholder={placeholder}
        value={form[key]}
        onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
      />
    </div>
  );

  return (
    <div className="contact-form">
      <div className="form-row">
        {field("Full Name", "name", "text", "Your full name")}
        {field("Email Address", "email", "email", "hello@yourcompany.com")}
      </div>
      {field("Company (Optional)", "company", "text", "Company name")}
      <div className="form-field">
        <label className="form-label" htmlFor="f-message">Project Brief</label>
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
        className="btn btn-gold"
        style={{ width: "100%" }}
        disabled={loading}
        onClick={async () => {
          if (form.name && form.email && form.message) {
            setLoading(true);
            try {
              const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
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
      </button>
    </div>
  );
}

/* ──────────────────────────────────────────
   SCOPE ESTIMATOR
────────────────────────────────────────── */
function ScopeEstimator({ onQuote }: { onQuote: () => void }) {
  const [type, setType] = useState<EstimateType>("Website");
  const [scopeIdx, setScopeIdx] = useState(1);
  const scope = ESTIMATE_SCOPES[scopeIdx];

  return (
    <div className="estimator glass-panel">
      <div className="estimator-controls">
        <div>
          <label className="estimator-group-label">What are you building?</label>
          <div className="estimator-options">
            {ESTIMATE_TYPES.map((t) => (
              <button
                key={t}
                className={`estimator-pill${type === t ? " active" : ""}`}
                onClick={() => setType(t)}
                type="button"
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="estimator-group-label">How complex is the scope?</label>
          <input
            type="range"
            min={0}
            max={2}
            step={1}
            value={scopeIdx}
            onChange={(e) => setScopeIdx(Number(e.target.value))}
            className="estimator-slider"
            aria-label="Scope complexity"
          />
          <div className="estimator-slider-labels">
            {ESTIMATE_SCOPES.map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="estimator-result">
        <div className="estimator-result-row">
          <span className="estimator-result-label">Product</span>
          <span className="estimator-result-value">
            <span className="accent">{type}</span> · {scope}
          </span>
        </div>
        <div className="estimator-result-row">
          <span className="estimator-result-label">Estimated Timeline</span>
          <span className="estimator-result-value">{ESTIMATE_TIMELINES[type][scope]}</span>
        </div>
        <div className="estimator-result-row">
          <span className="estimator-result-label">Team Involved</span>
          <span className="estimator-result-value">{ESTIMATE_TEAM[scope]}</span>
        </div>
        <button className="btn btn-primary estimator-cta" onClick={onQuote} type="button">
          <span>Get a custom quote</span>
        </button>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   PROCESS — scroll-hijacked horizontal pass: a tall wrapper holds a
   viewport-pinned sticky panel showing exactly one card at a time.
   Its scroll range is divided into N equal slots (N = step count);
   whichever slot the scroll position currently sits in becomes the
   active, centred card — snapping discretely (CSS transition does
   the easing) rather than following raw scroll pixel-for-pixel, so
   a card is always either fully in frame or fully out, never half
   visible mid-scroll.
────────────────────────────────────────── */
function ProcessSticky() {
  const [active, setActive] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;

      const rect = wrapper.getBoundingClientRect();
      const scrollable = wrapper.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return;

      const raw = -rect.top / scrollable;
      const p = Math.min(0.999, Math.max(0, raw));

      const idx = Math.floor(p * PROCESS_STEPS.length);
      setActive(Math.min(PROCESS_STEPS.length - 1, Math.max(0, idx)));
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="process-scroller" ref={wrapperRef}>
      <div className="process-scroller-sticky">
        <div className="process-carousel">
          <div
            className="process-carousel-track"
            style={{ transform: `translateX(-${active * 100}%)` }}
          >
            {PROCESS_STEPS.map((step, i) => (
              <div className="process-carousel-slot" key={step.title}>
                <div className={`process-carousel-step glass-panel${active === i ? " active" : ""}`}>
                  <span className="process-carousel-num">{String(i + 1).padStart(2, "0")}</span>
                  <div className="process-carousel-icon">{step.icon}</div>
                  <h3 className="process-step-title">{step.title}</h3>
                  <p className="process-step-desc">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   WHY GOBT COMPARISON
────────────────────────────────────────── */
function CheckIcon({ yes }: { yes: boolean }) {
  if (yes) {
    return (
      <svg className="compare-icon yes" viewBox="0 0 24 24" fill="none">
        <path d="M4 12.5l5 5L20 6.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg className="compare-icon no" viewBox="0 0 24 24" fill="none">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function WhyGOBT() {
  const [open, setOpen] = useState(false);
  return (
    <div className="compare-table glass-panel">
      <div className="compare-row">
        <div className="compare-cell feature">Feature</div>
        <div className="compare-cell">Typical Agency</div>
        <div className="compare-cell">GOBT</div>
      </div>
      {COMPARE_ROWS.map((row) => (
        <div className="compare-row" key={row.feature}>
          <div className="compare-cell feature">{row.feature}</div>
          <div className="compare-cell">
            <CheckIcon yes={row.agency} />
          </div>
          <div className="compare-cell gobt">
            <CheckIcon yes={row.gobt} />
          </div>
        </div>
      ))}
      <div className={`compare-hidden-rows${open ? " open" : ""}`}>
        <div className="compare-hidden-rows-inner">
          {COMPARE_ROWS_MORE.map((row) => (
            <div className="compare-row" key={row.feature}>
              <div className="compare-cell feature">{row.feature}</div>
              <div className="compare-cell">
                <CheckIcon yes={row.agency} />
              </div>
              <div className="compare-cell gobt">
                <CheckIcon yes={row.gobt} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="compare-toggle">
        <button onClick={() => setOpen((o) => !o)} type="button">
          {open ? "Show less" : "Show all features"}
        </button>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   WORK CARD
────────────────────────────────────────── */
function WorkCard({ work }: { work: (typeof WORKS)[number] }) {
  return (
    <div className="work-card">
      <div className="browser-chrome">
        <div className="browser-traffic-lights">
          <span className="tl tl-red" /><span className="tl tl-yellow" /><span className="tl tl-green" />
        </div>
        <div className="browser-url-bar">
          <span className="browser-lock">🔒</span>
          <span className="browser-url-text">{work.live || "gobt.in"}</span>
        </div>
      </div>
      <div className="work-card-media browser-viewport">
        {work.image ? (
          <img src={work.image} alt={work.title} loading="lazy" className="browser-screenshot" />
        ) : (
          <div
            className="work-card-media-placeholder"
            style={{ color: work.accent }}
          >
            {work.title.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="browser-overlay" />
        {work.soon && <div className="work-card-soon">Coming Soon</div>}
      </div>
      <div className="work-card-body">
        <span className="work-card-tag">{work.tag}</span>
        <span className="work-card-title">{work.title}</span>
        <p className="work-card-desc">{work.desc}</p>
        <div className="work-card-tech">
          {work.tech.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
        {work.live && (
          <a
            className="work-card-link"
            href={`https://${work.live}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Visit site <span className="btn-arrow">→</span>
          </a>
        )}
      </div>
    </div>
  );
}


/* ──────────────────────────────────────────
   BUG SCAN LAPTOP
   A laptop mockup whose screen is a canvas: hovering it sweeps a
   circular "AI lens" that inverts to a light scan view and reveals
   hidden virus/threat glyphs wherever the lens passes over them.
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

      ctx.beginPath();
      ctx.moveTo(cx - headR * 0.5, headCy - headR * 0.6);
      ctx.quadraticCurveTo(cx - size * 0.22, headCy - size * 0.32, cx - size * 0.28, headCy - size * 0.42);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + headR * 0.5, headCy - headR * 0.6);
      ctx.quadraticCurveTo(cx + size * 0.22, headCy - size * 0.32, cx + size * 0.28, headCy - size * 0.42);
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(cx, cy, bodyRx, bodyRy, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx, cy - bodyRy * 0.7);
      ctx.lineTo(cx, cy + bodyRy * 0.7);
      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();

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
   Fullscreen overlay: work cards laid out as a gently curved row in
   3D space. Hovering the left/right edges or either bottom corner
   scrubs the row continuously toward that end.
────────────────────────────────────────── */
function VRGallery({ category, onClose }: { category: "Web" | "App"; onClose: () => void }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
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

    const CARD_W = 3.1;
    const CARD_H = category === "App" ? 2.4 : 1.95;
    const GAP = 1.15;

    const makeCardTexture = (work: (typeof WORKS)[number]) => {
      const cw = 640, ch = category === "App" ? 500 : 400;
      const c = document.createElement("canvas");
      c.width = cw;
      c.height = ch;
      const cctx = c.getContext("2d")!;
      cctx.fillStyle = work.accent ? `${work.accent}22` : "#141414";
      cctx.fillRect(0, 0, cw, ch);

      const draw2D = (img: HTMLImageElement | null) => {
        cctx.clearRect(0, 0, cw, ch);
        cctx.fillStyle = "#141414";
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
        cctx.font = "700 34px Arial, sans-serif";
        cctx.textBaseline = "bottom";
        cctx.fillText(work.title, 28, ch - 26);
        cctx.fillStyle = work.accent;
        cctx.font = "600 15px Arial, sans-serif";
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

    let offset = 0;
    let velocity = 0;

    const HOVER_SPEED = 0.11;
    let hoverDir = 0;

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
        const t = localX / 6;
        mesh.position.z = -Math.abs(t) * 0.9;
        mesh.rotation.y = -t * 0.22;
        const dist = Math.abs(localX);
        const s = dist < 4 ? 1 : Math.max(0.72, 1 - (dist - 4) * 0.05);
        mesh.scale.setScalar(s);
        const mat = mesh.material as THREE.MeshStandardMaterial;
        const focus = Math.max(0, 1 - dist / 2);
        const pulse = 0.5 + 0.5 * Math.sin(now * 1.6);
        mat.emissiveIntensity = 0.05 + focus * (0.12 + pulse * 0.06);
      });

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [filter, setFilter] = useState<"All" | "Web" | "App">("All");
  const [activeJob, setActiveJob] = useState<(typeof JOBS)[0] | null>(null);
  const [activeNav, setActiveNav] = useState("services");
  const [vrCategory, setVrCategory] = useState<"Web" | "App" | null>(null);
  const [loading, setLoading] = useState(true);
  const lenisRef = useRef<Lenis | null>(null);

  useScrollReveal();

  /* Preloader — hide once the page has settled, with a hard cap so a
     slow asset can never leave it stuck on screen */
  useEffect(() => {
    const minDelay = new Promise((resolve) => setTimeout(resolve, 1200));
    const ready =
      document.readyState === "complete"
        ? Promise.resolve()
        : new Promise((resolve) => window.addEventListener("load", resolve, { once: true }));

    Promise.all([minDelay, ready]).then(() => setLoading(false));

    const hardCap = setTimeout(() => setLoading(false), 4000);
    return () => clearTimeout(hardCap);
  }, []);

  useEffect(() => {
    document.body.style.overflow = loading ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [loading]);

  /* Lenis smooth scroll */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenisRef.current = lenis;

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  /* Pause Lenis while a modal/overlay traps scroll, so it doesn't
     fight the manual overflow lock below */
  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return;
    if (menuOpen || activeJob || vrCategory) lenis.stop();
    else lenis.start();
  }, [menuOpen, activeJob, vrCategory]);

  const filteredWorks = filter === "All" ? WORKS : WORKS.filter((w) => w.category === filter);

  /* Lock body scroll when menu or modal is open */
  useEffect(() => {
    if (menuOpen || activeJob) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen, activeJob]);

  /* Nav scroll state + scroll-spy */
  useEffect(() => {
    const onScroll = () => {
      const nav = document.getElementById("nav");
      if (nav) nav.classList.toggle("scrolled", window.scrollY > 40);

      const offsets = NAV_ITEMS.map((item) => {
        const el = document.getElementById(item.id);
        if (!el) return { id: item.id, top: Infinity };
        return { id: item.id, top: Math.abs(el.getBoundingClientRect().top - 120) };
      });
      offsets.sort((a, b) => a.top - b.top);
      if (offsets[0]) setActiveNav(offsets[0].id);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goto = useCallback((id: string) => {
    setMenuOpen(false);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (!el) return;
      if (lenisRef.current) lenisRef.current.scrollTo(el, { offset: -90 });
      else el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  }, []);

  const scrollToTop = useCallback(() => {
    if (lenisRef.current) lenisRef.current.scrollTo(0);
    else window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <>
      {/* ── PRELOADER — crystal loader (Uiverse.io by Juanes200122) ── */}
      <div id="preloader" style={{ opacity: loading ? 1 : 0, pointerEvents: loading ? "auto" : "none" }}>
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

      <div className="page-canvas" aria-hidden="true" />
      <div className="page-grid" aria-hidden="true" />

      {/* ── NAV ── */}
      <nav id="nav">
        <div className="wrap nav-inner">
          <a
            href="#home"
            className="nav-logo"
            onClick={(e) => {
              e.preventDefault();
              scrollToTop();
            }}
          >
            <img src="/logo.png" alt="GOBT" />
          </a>

          <ul className="nav-links">
            {NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <a
                  className={`nav-link${activeNav === item.id ? " active" : ""}`}
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    goto(item.id);
                  }}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="nav-right">
            <button
              className={`nav-burger${menuOpen ? " open" : ""}`}
              aria-label="Toggle menu"
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </nav>

      {/* ── MOBILE MENU ── */}
      <div id="mobile-nav" className={menuOpen ? "open" : ""}>
        {NAV_ITEMS.map((item) => (
          <a
            key={item.id}
            className="mobile-link"
            href={`#${item.id}`}
            onClick={(e) => {
              e.preventDefault();
              goto(item.id);
            }}
          >
            <span className="n">{item.n}</span> {item.label}
          </a>
        ))}
        <button className="btn btn-gold mobile-cta" onClick={() => goto("contact")}>
          Start a project <span className="btn-arrow">→</span>
        </button>
      </div>

      {/* ── HERO ── */}
      <section id="home">
        <div className="hero-glow" aria-hidden="true" />
        <div className="hero-grain" aria-hidden="true" />

        <div className="wrap hero-grid">
          <div className="hero-inner">
            <span className="hero-eyebrow">Group Of Blooming Technicians</span>
            <h1 className="hero-h1 r-up in-view">
              We pioneer <span className="tw">Deep-Tech AI </span> that Automates.
            </h1>
            <p className="hero-desc r-up in-view">
              We are a deep tech AI startup, recognised by DIIT, exploring AI and promulgating, ros, software development, IoT, AR/VR, digital twin and other cutting edge technologies for the greater goal of integrating cyber physical systems aligned with the vision of make in India and Atmanirbhar Bharat.
            </p>
            <div className="hero-actions r-up in-view">
              <button className="btn btn-primary" onClick={() => goto("contact")}>
                Start a project
              </button>
              <button className="btn btn-ghost" onClick={() => goto("work")}>
                See our work
              </button>
            </div>
          </div>

          <div className="hero-showcase r-fade in-view" aria-hidden="true">
            <div className="hero-shot hero-shot-back">
              <img src="/img/Gharkamali.png" alt="" loading="eager" />
            </div>
            <div className="hero-shot hero-shot-mid">
              <img src="/img/navaru-image.png" alt="" loading="eager" />
            </div>
            <div className="hero-shot hero-shot-front">
              <div className="hero-shot-chrome">
                <span /><span /><span />
              </div>
              <img src="/img/tatacom.png" alt="" loading="eager" />
            </div>
            <div className="hero-shot-badge">
              <span className="hero-shot-badge-dot" />
              Live product
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-visual-inner">
            <div className="hero-visual-cell">
              <div className="hero-visual-num">9<span className="unit">+</span></div>
              <div className="hero-visual-label">Active clients</div>
            </div>
            <div className="hero-visual-cell">
              <div className="hero-visual-num">25<span className="unit">+</span></div>
              <div className="hero-visual-label">Products launched</div>
            </div>
            <div className="hero-visual-cell">
              <div className="hero-visual-num">4<span className="unit">yr</span></div>
              <div className="hero-visual-label">Years active</div>
            </div>
            <div className="hero-visual-cell">
              <div className="hero-visual-num">100<span className="unit">%</span></div>
              <div className="hero-visual-label">Client retention</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 01 SERVICES ── */}
      <section id="services" className="section section-border-top">
        <div className="wrap">
          <div className="section-head">
            <div className="r-up">
              <span className="section-num-tag"><span className="num">01</span> Solution</span>
              <h2 className="section-h2">Everything you need to <span className="accent">go digital</span>, under one roof.</h2>
              <p className="section-lede">
                From first sketch to shipped product — GOBT covers the full stack of what a
                modern business needs to show up online and run better.
              </p>
            </div>
          </div>
          <div className="services-grid r-fade">
            {SERVICES.map((s, i) => (
              <div className="service-card glass-panel" key={s.label}>
                <div className="service-card-icon">{SERVICE_ICONS[i]}</div>
                <span className="service-card-title">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 02 PROCESS ── */}
      <section id="process" className="section-border-top process-section">
        <div className="wrap process-section-head-wrap">
          <div className="section-head">
            <div className="r-up">
              <span className="section-num-tag"><span className="num">02</span> Process</span>
              <h2 className="section-h2">Three steps. No black box.</h2>
              <p className="section-lede">
                You always know what stage your project is at, and you always see it working
                before it's finished.
              </p>
            </div>
          </div>
        </div>
        <ProcessSticky />
      </section>

      {/* ── 03 ESTIMATE ── */}
      <section id="estimate" className="section section-border-top">
        <div className="wrap">
          <div className="section-head">
            <div className="r-up">
              <span className="section-num-tag"><span className="num">03</span> Estimate</span>
              <h2 className="section-h2">Get a feel for your project.</h2>
              <p className="section-lede">
                Adjust the sliders — this is a starting estimate, your custom quote comes after
                a quick call.
              </p>
            </div>
          </div>
          <div className="r-fade">
            <ScopeEstimator onQuote={() => goto("contact")} />
          </div>
        </div>
      </section>

      {/* ── 04 WHY GOBT ── */}
      <section id="why" className="section section-border-top">
        <div className="wrap">
          <div className="section-head">
            <div className="r-up">
              <span className="section-num-tag"><span className="num">04</span> Why Us</span>
              <ScrambleText as="h2" className="section-h2" text="What you get that a typical agency won't give you." />
              <p className="section-lede">
                No lock-in, no black-box billing, no disappearing after launch.
              </p>
            </div>
          </div>
          <div className="r-fade">
            <WhyGOBT />
          </div>
        </div>
      </section>

      {/* ── CLIENTS ── */}
      <section id="stats" className="section section-border-top">
        <div className="wrap">
          <div className="section-head">
            <div className="r-up">
              <span className="section-num-tag">Clients</span>
              <h2 className="section-h2">Businesses we've helped go digital.</h2>
            </div>
          </div>
          <div className="client-logo-grid r-fade">
            {CLIENTS.map((c) => (
              <div className="client-logo-card" key={c.name}>
                {c.logo ? (
                  <img src={c.logo} alt={c.name} />
                ) : (
                  <span className="text-logo">{c.name}</span>
                )}
              </div>
            ))}
          </div>
          <div className="stats-grid stats-grid-inline r-fade">
            {GOBT_STATS.map((s) => (
              <StatCard stat={s} key={s.label} />
            ))}
          </div>
        </div>
      </section>

      {/* ── 05 TEAM / ABOUT ── */}
      <section id="team" className="section section-border-top">
        <div className="wrap">
          <div className="section-head">
            <div className="r-up">
              <span className="section-num-tag"><span className="num">05</span> About</span>
              <h2 className="section-h2">The people behind GOBT.</h2>
              <p className="section-lede">
                A small, senior team — which means you talk to the people actually building
                your product, not an account manager.
              </p>
            </div>
          </div>
          <div className="team-index r-fade">
            {TEAM.map((member, i) => (
              <div className="team-index-row" key={member.name}>
                <span className="team-index-num">{String(i + 1).padStart(2, "0")}</span>
                <div className="team-index-avatar">
                  {member.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                </div>
                <div className="team-index-id">
                  <span className="team-index-name">{member.name}</span>
                  <span className="team-index-title">{member.title}</span>
                </div>
                <p className="team-index-quote">{member.quote}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WORK ── */}
      <section id="work" className="section section-border-top">
        <div className="wrap">
          <div className="section-head">
            <div className="r-up">
              <span className="section-num-tag">Work</span>
              <h2 className="section-h2">Recent builds.</h2>
            </div>
            {filter !== "All" && (
              <button
                className="vr-switch-btn r-up"
                onClick={() => setVrCategory(filter)}
              >
                <span className="vr-switch-dot" />
                Switch to VR
              </button>
            )}
          </div>
          <div className="work-filter-row r-fade">
            {(["All", "Web", "App"] as const).map((f) => (
              <button
                key={f}
                className={`work-filter-btn${filter === f ? " active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="work-grid r-fade">
            {filteredWorks.map((w) => (
              <WorkCard work={w} key={w.id} />
            ))}
          </div>
        </div>
      </section>

      {/* ── BUG SCAN ── */}
      <section className="section section-border-top bugscan-section">
        <div className="wrap bugscan-grid">
          <div className="bugscan-copy r-left">
            <span className="section-num-tag">Security</span>
            <h2 className="section-h2">We hunt bugs before your users do.</h2>
            <p className="bugscan-body">
              Every build goes through a security and QA pass before launch. Move your cursor
              over the screen to see how we scan for vulnerabilities.
            </p>
            <p className="bugscan-callout">Hover the laptop screen to run a live scan.</p>
          </div>
          <div className="bugscan-visual r-right">
            <span className="bugscan-label">Live Threat Scan</span>
            <BugScanLaptop />
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="section section-border-top testi-section">
        <div className="wrap">
          <div className="section-head">
            <div className="r-up">
              <span className="section-num-tag">Testimonials</span>
              <h2 className="section-h2">Don't take our word for it.</h2>
            </div>
          </div>
        </div>
        <div className="testi-marquee r-fade">
          <div className="testi-marquee-track">
            {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
              <div className="testi-card glass-panel" key={`${t.name}-${i}`}>
                <span className="testi-quote-icon">&ldquo;</span>
                <p className="testi-text">{t.text}</p>
                <div className="testi-author">
                  <div className="testi-avatar">{t.init}</div>
                  <div>
                    <div className="testi-name">{t.name}</div>
                    <div className="testi-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CAREERS ── */}
      <section id="careers" className="section section-border-top">
        <div className="wrap">
          <div className="section-head">
            <div className="r-up">
              <span className="section-num-tag">Careers</span>
              <h2 className="section-h2">We're hiring.</h2>
            </div>
          </div>
          <div className="careers-list r-fade">
            {JOBS.map((job, i) => (
              <div className="career-row" key={job.id} onClick={() => setActiveJob(job)}>
                <span className="career-row-num">{String(i + 1).padStart(2, "0")}</span>
                <div className="career-row-body">
                  <div className="career-row-title">{job.title}</div>
                  <div className="career-row-meta">
                    <span>{job.experience}</span>
                    <span>{job.type}</span>
                    <span>{job.location}</span>
                  </div>
                </div>
                <span className="career-arrow">→</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 06 CONTACT ── */}
      <section id="contact" className="section section-border-top">
        <div className="wrap">
          <div className="section-head">
            <div className="r-up">
              <span className="section-num-tag"><span className="num">06</span> Contact</span>
              <ScrambleText as="h2" className="section-h2" text="Let's build something." />
              <p className="section-lede">
                Tell us what you're trying to build — we'll reply within 24 hours with next
                steps.
              </p>
            </div>
          </div>
          <div className="contact-grid r-fade">
            <div className="contact-info">
              <div className="contact-info-row">
                <span className="contact-info-label">Email</span>
                <a className="contact-info-value" href="mailto:info@gobt.in">info@gobt.in</a>
              </div>
              <div className="contact-info-row">
                <span className="contact-info-label">Location</span>
                <span className="contact-info-value">Kolkata, India</span>
              </div>
              <div className="contact-info-row">
                <span className="contact-info-label">Response time</span>
                <span className="contact-info-value">Within 24 hours</span>
              </div>
            </div>
            <ContactForm />
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer>
        <div className="wrap footer-grid">
          <div className="footer-brand">
            <img src="/logo.png" alt="GOBT" className="footer-logo" />
            <p className="footer-brand-desc">
              GOBT — Group Of Blooming Technicians. A Kolkata-based digital engineering
              studio building web platforms, mobile apps and custom software.
            </p>
          </div>

          <div className="footer-col">
            <div className="footer-col-title">Navigation</div>
            <a href="#services" onClick={(e) => { e.preventDefault(); goto("services"); }}>Services</a>
            <a href="#work" onClick={(e) => { e.preventDefault(); goto("work"); }}>Work</a>
            <a href="#team" onClick={(e) => { e.preventDefault(); goto("team"); }}>Team</a>
            <a href="#careers" onClick={(e) => { e.preventDefault(); goto("careers"); }}>Careers</a>
            <a href="#contact" onClick={(e) => { e.preventDefault(); goto("contact"); }}>Contact</a>
          </div>

          <div className="footer-col footer-col-social">
            <div className="footer-col-title">Social</div>
            <a href="https://www.instagram.com/gobt.in/" target="_blank" rel="noopener noreferrer">Instagram</a>
            <a href="https://www.facebook.com/profile.php?id=61561011544267" target="_blank" rel="noopener noreferrer">Facebook</a>
            <a href="https://wa.me/918972297093" target="_blank" rel="noopener noreferrer">WhatsApp</a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          </div>
        </div>

        <div className="wrap footer-bottom">
          <span className="f-copy">Kolkata, India — {new Date().getFullYear()} GOBT Inc. All rights reserved.</span>
          <div className="footer-legal">
            <a href="#contact" onClick={(e) => { e.preventDefault(); goto("contact"); }}>Privacy Policy</a>
            <a href="#contact" onClick={(e) => { e.preventDefault(); goto("contact"); }}>Terms of Use</a>
          </div>
        </div>

        <div className="footer-wordmark-wrap" aria-hidden="true">
          <span className="footer-wordmark">GOBT</span>
        </div>
      </footer>

      {/* ── JOB MODAL ── */}
      <div className={`job-modal-overlay${activeJob ? " open" : ""}`} onClick={() => setActiveJob(null)}>
        {activeJob && (
          <div className="job-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="job-modal-close" onClick={() => setActiveJob(null)} aria-label="Close">✕</button>
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
              <a className="btn btn-primary" href="mailto:info@gobt.in?subject=Application">
                Apply now
              </a>
            </div>
          </div>
        )}
      </div>

      {/* ── VR GALLERY ── */}
      {vrCategory && (
        <VRGallery category={vrCategory} onClose={() => setVrCategory(null)} />
      )}
    </>
  );
}

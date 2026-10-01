/* Line icons drawn on a 24px grid, stroked with currentColor */

const S = { stroke: "currentColor", strokeWidth: 1.5, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const SERVICE_ICONS = [
  <svg key="web" viewBox="0 0 24 24" {...S}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 8.5h18M7 13l-2 2 2 2M11 13l2 2-2 2" /></svg>,
  <svg key="app" viewBox="0 0 24 24" {...S}><rect x="6" y="2.5" width="12" height="19" rx="2.2" /><path d="M10.5 18.2h3" /></svg>,
  <svg key="uiux" viewBox="0 0 24 24" {...S}><path d="M4 3l9 16 2-6 6-2-17-8z" /></svg>,
  <svg key="growth" viewBox="0 0 24 24" {...S}><path d="M4 19V5M4 19h16M7 15l4-4 3 3 5-6" /></svg>,
  <svg key="sw" viewBox="0 0 24 24" {...S}><path d="M8 8l-4 4 4 4M16 8l4 4-4 4M14 4l-4 16" /></svg>,
  <svg key="iot" viewBox="0 0 24 24" {...S}><rect x="8" y="8" width="8" height="8" rx="1.4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /></svg>,
  <svg key="ai" viewBox="0 0 24 24" {...S}><path d="M12 3l1.8 4.6L18 9l-4.2 1.4L12 15l-1.8-4.6L6 9l4.2-1.4L12 3z" /><path d="M18.5 15l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9.9-2.1z" /></svg>,
  <svg key="brand" viewBox="0 0 24 24" {...S}><path d="M11 3l9 9-8 8-9-9V4h7z" /><circle cx="8" cy="8" r="1.4" /></svg>,
  <svg key="data" viewBox="0 0 24 24" {...S}><ellipse cx="12" cy="5.5" rx="8" ry="3" /><path d="M4 5.5v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6M4 11.5v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" /></svg>,
  <svg key="security" viewBox="0 0 24 24" {...S}><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" /><path d="M9 12l2 2 4-4" /></svg>,
  <svg key="game" viewBox="0 0 24 24" {...S}><path d="M7 8h10a4 4 0 014 4v3a3 3 0 01-5.4 1.8L14 15h-4l-1.6 1.8A3 3 0 013 15v-3a4 4 0 014-4z" /><path d="M7.5 10.5v3M6 12h3" /><circle cx="16" cy="11" r=".9" fill="currentColor" /><circle cx="18" cy="13" r=".9" fill="currentColor" /></svg>,
];

export const IconCheck = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" {...S} strokeWidth={2.2}><path d="M4 12.5l5 5L20 6.5" /></svg>
);

export const IconCross = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" {...S} strokeWidth={2}><path d="M6 6l12 12M18 6L6 18" /></svg>
);

export const IconArrow = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" {...S}><path d="M7 17L17 7M9 7h8v8" /></svg>
);

export const IconBrowser = () => (
  <svg viewBox="0 0 24 24" {...S}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 8.5h18" /><circle cx="6" cy="6.3" r=".5" fill="currentColor" /><circle cx="8" cy="6.3" r=".5" fill="currentColor" /></svg>
);

export const IconDashboard = () => (
  <svg viewBox="0 0 24 24" {...S}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M8 4v16M11 9h7M11 13h4M11 17h6" /></svg>
);

export const IconPhone = () => (
  <svg viewBox="0 0 24 24" {...S}><rect x="6.5" y="2.5" width="11" height="19" rx="2.2" /><path d="M10.5 18.5h3" /></svg>
);

"use client";

import { useState } from "react";
import {
  ESTIMATE_ROLES,
  ESTIMATE_SCOPES,
  ESTIMATE_TEAM,
  ESTIMATE_TIMELINES,
  ESTIMATE_TYPES,
  ESTIMATE_WEEKS,
  type EstimateType,
} from "@/lib/content";
import { EVT_PREFILL, scrollToTarget } from "@/lib/scroll";
import SectionHead from "@/components/ui/SectionHead";
import { IconBrowser, IconDashboard, IconPhone } from "@/components/ui/icons";
import { track } from "@/lib/analytics";

const TYPE_ICONS: Record<EstimateType, React.ReactNode> = {
  Website: <IconBrowser />,
  "Web App": <IconDashboard />,
  "Mobile App": <IconPhone />,
};

const MAX_WEEKS = 8;

/* Wireframe that gains detail as the scope grows. Each block shows
   from its level upward: 0 Essential, 1 Momentum, 2 Full-Scale. */
function Hologram({ type, level }: { type: EstimateType; level: number }) {
  const on = (l: number) => `holo-el${level >= l ? " is-on" : ""}`;
  return (
    <div className="holo" aria-hidden="true">
      <div className="holo-stage">
        {type === "Website" && (
          <svg viewBox="0 0 320 210" className="holo-svg">
            <rect x="4" y="4" width="312" height="202" rx="6" className="holo-frame" />
            <path d="M4 22h312" className="holo-frame" />
            <circle cx="16" cy="13" r="2.5" className="holo-dot" />
            <circle cx="25" cy="13" r="2.5" className="holo-dot" />
            <circle cx="34" cy="13" r="2.5" className="holo-dot" />
            <g className={on(0)}>
              <rect x="18" y="32" width="60" height="8" rx="2" />
              <rect x="200" y="32" width="100" height="8" rx="2" />
              <rect x="18" y="54" width="170" height="16" rx="2" className="holo-fill" />
              <rect x="18" y="76" width="120" height="8" rx="2" />
              <rect x="18" y="92" width="64" height="16" rx="3" className="holo-fill" />
              <rect x="206" y="52" width="96" height="62" rx="4" />
            </g>
            <g className={on(1)}>
              <rect x="18" y="126" width="88" height="44" rx="4" />
              <rect x="116" y="126" width="88" height="44" rx="4" />
              <rect x="214" y="126" width="88" height="44" rx="4" />
            </g>
            <g className={on(2)}>
              <rect x="18" y="180" width="284" height="16" rx="3" className="holo-fill" />
              <path d="M222 60l20 18 18-10 30 30" />
            </g>
          </svg>
        )}
        {type === "Web App" && (
          <svg viewBox="0 0 320 210" className="holo-svg">
            <rect x="4" y="4" width="312" height="202" rx="6" className="holo-frame" />
            <path d="M64 4v202M64 26h252" className="holo-frame" />
            <g className={on(0)}>
              <rect x="14" y="16" width="38" height="8" rx="2" className="holo-fill" />
              <rect x="14" y="40" width="38" height="6" rx="2" />
              <rect x="14" y="54" width="30" height="6" rx="2" />
              <rect x="14" y="68" width="34" height="6" rx="2" />
              <rect x="76" y="38" width="228" height="78" rx="4" />
              <path d="M84 104l30-26 26 14 34-34 30 20 34-30 36 20" />
            </g>
            <g className={on(1)}>
              <rect x="76" y="126" width="70" height="34" rx="4" />
              <rect x="155" y="126" width="70" height="34" rx="4" />
              <rect x="234" y="126" width="70" height="34" rx="4" />
              <rect x="84" y="136" width="30" height="10" rx="2" className="holo-fill" />
              <rect x="163" y="136" width="40" height="10" rx="2" className="holo-fill" />
              <rect x="242" y="136" width="24" height="10" rx="2" className="holo-fill" />
            </g>
            <g className={on(2)}>
              <path d="M76 172h228M76 184h228M76 196h228" />
              <rect x="14" y="82" width="38" height="6" rx="2" />
              <rect x="14" y="96" width="26" height="6" rx="2" />
            </g>
          </svg>
        )}
        {type === "Mobile App" && (
          <svg viewBox="0 0 320 210" className="holo-svg">
            <rect x="112" y="4" width="96" height="202" rx="14" className="holo-frame" />
            <rect x="146" y="10" width="28" height="5" rx="2.5" className="holo-dot" />
            <g className={on(0)}>
              <rect x="122" y="24" width="50" height="8" rx="2" className="holo-fill" />
              <rect x="122" y="40" width="76" height="56" rx="6" />
              <circle cx="160" cy="68" r="14" />
            </g>
            <g className={on(1)}>
              <rect x="122" y="104" width="76" height="16" rx="4" />
              <rect x="122" y="126" width="76" height="16" rx="4" />
              <rect x="122" y="148" width="76" height="16" rx="4" />
            </g>
            <g className={on(2)}>
              <path d="M112 178h96" />
              <circle cx="132" cy="190" r="4" className="holo-fill" />
              <circle cx="160" cy="190" r="4" />
              <circle cx="188" cy="190" r="4" />
              <rect x="40" y="40" width="58" height="96" rx="8" />
              <rect x="222" y="60" width="58" height="96" rx="8" />
            </g>
          </svg>
        )}
        <span className="holo-scan" />
      </div>
      <span className="holo-base" />
    </div>
  );
}

export default function Estimate() {
  const [type, setType] = useState<EstimateType>("Website");
  const [scopeIdx, setScopeIdx] = useState(1);

  const scope = ESTIMATE_SCOPES[scopeIdx];
  const timeline = ESTIMATE_TIMELINES[type][scope];
  const [firm, max] = ESTIMATE_WEEKS[type][scope];
  const roles = ESTIMATE_ROLES[scope];

  const quote = () => {
    const message = `Hi GOBT, I'm planning a ${type} (${scope} scope). Your estimator suggests ${timeline} with ${ESTIMATE_TEAM[scope].toLowerCase()}. Here's what I have in mind: `;
    window.dispatchEvent(new CustomEvent(EVT_PREFILL, { detail: message }));
    track("estimate_cta", { project_type: type, scope });
    scrollToTarget("#contact");
  };

  return (
    <section id="estimate" className="est">
      <div className="est-fx" data-fx="wave" data-fx-fit="width" data-fx-opacity="0.3" data-fx-opacity-sm="0.2" data-fx-y="0.88" aria-hidden="true" />
      <div className="wrap">
        <SectionHead title="Get a feel for *your project.*" lede="Adjust the controls — this is a starting estimate, your custom quote comes after a quick call." />

        <div className="est-console" data-reveal="fade">
          <span className="est-corner tl" aria-hidden="true" />
          <span className="est-corner br" aria-hidden="true" />

          <div className="est-controls">
            <fieldset className="est-group">
              <legend className="est-label">
                What are you building?
              </legend>
              <div className="est-types">
                {ESTIMATE_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`est-type${t === type ? " is-active" : ""}`}
                    aria-pressed={t === type}
                    onClick={() => setType(t)}
                  >
                    <span className="est-type-icon">{TYPE_ICONS[t]}</span>
                    <span className="est-type-name">{t}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="est-group">
              <label className="est-label" htmlFor="est-scope">
                How complex is the scope?
              </label>
              <div className="est-slider" style={{ "--p": scopeIdx / 2 } as React.CSSProperties}>
                <input
                  id="est-scope"
                  type="range"
                  min={0}
                  max={2}
                  step={1}
                  value={scopeIdx}
                  onChange={(e) => setScopeIdx(Number(e.target.value))}
                  aria-valuetext={scope}
                />
                <span className="est-slider-track" aria-hidden="true">
                  <span className="est-slider-fill" />
                  {ESTIMATE_SCOPES.map((s, i) => (
                    <span key={s} className={`est-slider-stop${i <= scopeIdx ? " is-on" : ""}`} style={{ left: `${i * 50}%` }} />
                  ))}
                  <span className="est-slider-thumb" />
                </span>
                <div className="est-slider-labels">
                  {ESTIMATE_SCOPES.map((s, i) => (
                    <button key={s} type="button" className={i === scopeIdx ? "is-active" : ""} onClick={() => setScopeIdx(i)} tabIndex={-1}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Hologram type={type} level={scopeIdx} />
          </div>

          <div className="est-readout" aria-live="polite">
            <div className="est-row">
              <span className="est-k">Product</span>
              <span className="est-v">
                <span className="text-metal">{type}</span> · {scope}
              </span>
            </div>

            <div className="est-row">
              <span className="est-k">Estimated timeline</span>
              <span className="est-time" key={timeline}>
                {timeline}
              </span>
              <div className="est-weeks" aria-hidden="true">
                {Array.from({ length: MAX_WEEKS }).map((_, i) => (
                  <span
                    key={i}
                    className={i < firm ? "is-on" : i < max ? "is-range" : ""}
                    style={{ transitionDelay: `${i * 40}ms` }}
                  />
                ))}
              </div>
              <div className="est-weeks-axis" aria-hidden="true">
                <span>Week 1</span>
                <span>Week {MAX_WEEKS}</span>
              </div>
            </div>

            <div className="est-row">
              <span className="est-k">Team involved</span>
              <span className="est-v est-team">{ESTIMATE_TEAM[scope]}</span>
              <div className="est-roles" aria-hidden="true">
                {roles.map((r, i) => (
                  <span key={`${scope}-${i}`} className={`est-role${r.optional ? " is-optional" : ""}`} style={{ animationDelay: `${i * 70}ms` }}>
                    <i />
                    {r.role}
                  </span>
                ))}
              </div>
            </div>

            <button className="btn btn-gold btn-lg est-cta" type="button" onClick={quote} data-magnetic>
              <span className="btn-label">Get a custom quote</span>
              <span className="btn-arrow" aria-hidden="true">↗</span>
            </button>
            <p className="est-note">Your selection carries straight into the contact form.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

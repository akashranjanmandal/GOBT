"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useIsClient } from "@/lib/useIsClient";
import { CONTACT, JOBS, type Job } from "@/lib/content";
import { lockScroll } from "@/lib/scroll";
import SectionHead from "@/components/ui/SectionHead";
import { IconArrow } from "@/components/ui/icons";

function Drawer({ job, onClose }: { job: Job | null; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  /* keep the last job rendered while the drawer animates out */
  const [shown, setShown] = useState<Job | null>(job);
  if (job && job !== shown) setShown(job);

  useEffect(() => {
    if (!job) return;
    lockScroll(true);
    const t = window.setTimeout(() => closeRef.current?.focus(), 80);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      lockScroll(false);
    };
  }, [job, onClose]);

  return (
    <div className={`drawer${job ? " is-open" : ""}`} aria-hidden={!job} inert={!job}>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="drawer-panel" role="dialog" aria-modal="true" aria-labelledby="drawer-title" data-lenis-prevent>
        {shown && (
          <>
            <header className="drawer-head">
              <span className="drawer-kicker">Open role</span>
              <button className="drawer-close" onClick={onClose} ref={closeRef} aria-label="Close role details">
                ✕
              </button>
              <h2 className="drawer-title" id="drawer-title">
                {shown.title}
              </h2>
              <div className="drawer-meta">
                <span>{shown.experience}</span>
                <span>{shown.type}</span>
                <span>{shown.location}</span>
              </div>
            </header>
            {/* static, trusted copy authored in lib/content */}
            <div className="drawer-body" dangerouslySetInnerHTML={{ __html: shown.description }} />
            <footer className="drawer-foot">
              <a
                className="btn btn-gold btn-lg"
                href={`mailto:${CONTACT.email}?subject=${encodeURIComponent(`Application — ${shown.title}`)}`}
                data-magnetic
              >
                <span className="btn-label">Apply now</span>
                <span className="btn-arrow" aria-hidden="true">↗</span>
              </a>
              <span className="drawer-foot-note">Send your CV and a line on what you&apos;ve built.</span>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}

export default function Careers() {
  const [active, setActive] = useState<Job | null>(null);
  const lastTrigger = useRef<HTMLButtonElement | null>(null);
  const isClient = useIsClient();

  const close = useCallback(() => {
    setActive(null);
    window.setTimeout(() => lastTrigger.current?.focus(), 50);
  }, []);

  return (
    <section id="careers" className="careers">
      <div className="rest-fx" data-fx="ring" data-fx-opacity="0" aria-hidden="true" />
      <div className="wrap">
        <div className="careers-head">
          <SectionHead title="We’re *hiring.*" lede="Join a small team building deep-tech products for real businesses." />
          <span className="careers-badge" data-reveal="fade">
            {JOBS.length} open roles
          </span>
        </div>

        <ul className="jobs" data-reveal="stagger">
          {JOBS.map((job) => (
            <li key={job.id}>
              <button
                className="job"
                onClick={(e) => {
                  lastTrigger.current = e.currentTarget;
                  setActive(job);
                }}
               
              >
                <span className="job-title">{job.title}</span>
                <span className="job-meta">
                  <span>{job.experience}</span>
                  <span>{job.type}</span>
                  <span>{job.location}</span>
                </span>
                <span className="job-arrow" aria-hidden="true">
                  <IconArrow />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      {isClient && createPortal(<Drawer job={active} onClose={close} />, document.body)}
    </section>
  );
}

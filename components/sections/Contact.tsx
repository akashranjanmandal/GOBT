"use client";

import { useEffect, useRef, useState } from "react";
import { CONTACT } from "@/lib/content";
import { EVT_PREFILL } from "@/lib/scroll";
import { markup } from "@/lib/markup";
import { IconCheck } from "@/components/ui/icons";

type Field = "name" | "email" | "company" | "message";
type Phase = "idle" | "sending" | "sent" | "error";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(form: Record<Field, string>) {
  const errors: Partial<Record<Field, string>> = {};
  if (!form.name.trim()) errors.name = "Tell us who you are";
  if (!EMAIL_RE.test(form.email.trim())) errors.email = "We need a valid email to reply";
  if (form.message.trim().length < 10) errors.message = "A line or two about the project, please";
  return errors;
}

export default function Contact() {
  const [form, setForm] = useState<Record<Field, string>>({ name: "", email: "", company: "", message: "" });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [phase, setPhase] = useState<Phase>("idle");
  const messageRef = useRef<HTMLTextAreaElement>(null);

  /* the estimator hands over its selection */
  useEffect(() => {
    const onPrefill = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      setForm((f) => ({ ...f, message: detail }));
      setPhase("idle");
      window.setTimeout(() => {
        const el = messageRef.current;
        if (!el) return;
        el.focus({ preventScroll: true });
        el.setSelectionRange(el.value.length, el.value.length);
      }, 1400);
    };
    window.addEventListener(EVT_PREFILL, onPrefill);
    return () => window.removeEventListener(EVT_PREFILL, onPrefill);
  }, []);

  const set = (k: Field) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    setPhase("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setPhase(res.ok ? "sent" : "error");
    } catch {
      setPhase("error");
    }
  };

  const field = (k: Field, label: string, type = "text", required = true) => (
    <div className={`cf-field${form[k] ? " has-value" : ""}${errors[k] ? " has-error" : ""}`}>
      <input
        id={`cf-${k}`}
        type={type}
        value={form[k]}
        onChange={set(k)}
        autoComplete={k === "name" ? "name" : k === "email" ? "email" : k === "company" ? "organization" : "off"}
        aria-invalid={!!errors[k]}
        aria-describedby={errors[k] ? `cf-${k}-err` : undefined}
        placeholder=" "
      />
      <label htmlFor={`cf-${k}`}>
        {label}
        {!required && <em> (optional)</em>}
      </label>
      <span className="cf-line" aria-hidden="true" />
      {errors[k] && (
        <span className="cf-error" id={`cf-${k}-err`}>
          {errors[k]}
        </span>
      )}
    </div>
  );

  return (
    <section id="contact" className="contact">
      <div className="wrap contact-grid">
        <div className="contact-left">
          <h2
            className="contact-title"
            data-reveal="lines"
            dangerouslySetInnerHTML={{ __html: markup("Let’s build\n*something.*") }}
          />
          <p className="contact-lede" data-reveal="fade">
            Tell us what you&apos;re trying to build — we&apos;ll reply within 24 hours with next steps.
          </p>
          <dl className="contact-info" data-reveal="stagger">
            <div>
              <dt>Email</dt>
              <dd>
                <a href={`mailto:${CONTACT.email}`} data-magnetic>
                  {CONTACT.email}
                </a>
              </dd>
            </div>
            <div>
              <dt>WhatsApp</dt>
              <dd>
                <a href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer">
                  Message us directly ↗
                </a>
              </dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>
                {CONTACT.location}
              </dd>
            </div>
            <div>
              <dt>Response time</dt>
              <dd>Within 24 hours</dd>
            </div>
          </dl>
          <div className="contact-fx" data-fx="ring" data-fx-opacity="0.85" data-fx-opacity-sm="0.5" aria-hidden="true" />
        </div>

        <div className="cf" data-reveal="fade">

          {phase === "sent" ? (
            <div className="cf-done" role="status">
              <span className="cf-done-mark">
                <span className="cf-done-ring" />
                <span className="cf-done-ring r2" />
                <IconCheck />
              </span>
              <h3>Message received.</h3>
              <p>
                We respond within 24 hours. For a faster response, reach us directly on{" "}
                <a href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer">
                  WhatsApp
                </a>
                .
              </p>
              <button className="btn btn-ghost" onClick={() => {
                setForm({ name: "", email: "", company: "", message: "" });
                setPhase("idle");
              }}>
                <span className="btn-label">Send another</span>
              </button>
            </div>
          ) : (
            <form className="cf-form" onSubmit={submit} noValidate>
              <div className="cf-row">
                {field("name", "Full name")}
                {field("email", "Email address", "email")}
              </div>
              {field("company", "Company", "text", false)}
              <div className={`cf-field cf-area${form.message ? " has-value" : ""}${errors.message ? " has-error" : ""}`}>
                <textarea
                  id="cf-message"
                  ref={messageRef}
                  rows={5}
                  value={form.message}
                  onChange={set("message")}
                  aria-invalid={!!errors.message}
                  aria-describedby={errors.message ? "cf-message-err" : undefined}
                  placeholder=" "
                />
                <label htmlFor="cf-message">Project brief — goals, timeline, budget</label>
                <span className="cf-line" aria-hidden="true" />
                {errors.message && (
                  <span className="cf-error" id="cf-message-err">
                    {errors.message}
                  </span>
                )}
              </div>

              {phase === "error" && (
                <p className="cf-fail" role="alert">
                  We couldn&apos;t send your message. Please email us at <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a> or try again.
                </p>
              )}

              <button className={`btn btn-gold btn-lg cf-submit${phase === "sending" ? " is-sending" : ""}`} type="submit" disabled={phase === "sending"} data-magnetic>
                <span className="btn-label">{phase === "sending" ? "Sending…" : "Send message"}</span>
                <span className="btn-arrow" aria-hidden="true">↗</span>
                <span className="cf-progress" aria-hidden="true" />
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import {
  ACADEMY,
  ACADEMY_CLASSES,
  ACADEMY_COURSES,
  ACADEMY_LOCATIONS,
  inr,
  validateAcademy,
  type AcademyForm as Form,
} from "@/lib/academy";
import { track } from "@/lib/analytics";

type Phase = "idle" | "sending" | "sent" | "error";

const EMPTY: Form = { name: "", studentClass: "", school: "", mobile: "", whatsapp: "", address: "", course: "", location: "" };

export default function AcademyForm() {
  const [form, setForm] = useState<Form>(EMPTY);
  const [sameWa, setSameWa] = useState(true);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [phase, setPhase] = useState<Phase>("idle");
  const [website, setWebsite] = useState(""); // honeypot

  const data: Form = { ...form, whatsapp: sameWa ? form.mobile : form.whatsapp };
  const course = ACADEMY_COURSES.find((c) => c.id === form.course);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validateAcademy(data);
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      document.getElementById(`af-${first}`)?.focus();
      return;
    }
    setPhase("sending");
    try {
      const res = await fetch("/api/academy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, website }),
      });
      setPhase(res.ok ? "sent" : "error");
      if (res.ok) track("generate_lead", { form: "academy", course: data.course });
    } catch {
      setPhase("error");
    }
  };

  if (phase === "sent") {
    return (
      <div className="af-done" role="status">
        <h3>Registration received!</h3>
        <p lang="bn">আপনার নিবন্ধন আমরা পেয়েছি।</p>
        <p>
          Thank you. Our team will call or WhatsApp you on +91 {data.mobile.replace(/\D/g, "").slice(-10)} to confirm the admission.
        </p>
        <a className="btn btn-ghost" href={ACADEMY.whatsapp} target="_blank" rel="noopener noreferrer">
          <span className="btn-label">Message us on WhatsApp</span>
        </a>
      </div>
    );
  }

  const err = (k: keyof Form) =>
    errors[k] ? (
      <span className="af-error" id={`af-${k}-err`}>
        {errors[k]}
      </span>
    ) : null;
  const a11y = (k: keyof Form) => ({
    id: `af-${k}`,
    "aria-invalid": !!errors[k],
    "aria-describedby": errors[k] ? `af-${k}-err` : undefined,
  });

  return (
    <form className="af" onSubmit={submit} noValidate>
      <div className="af-grid">
        <div className={`af-field${errors.name ? " has-error" : ""}`}>
          <label htmlFor="af-name">
            Student&apos;s name <span lang="bn">শিক্ষার্থীর নাম</span>
          </label>
          <input {...a11y("name")} value={form.name} onChange={set("name")} autoComplete="name" />
          {err("name")}
        </div>

        <div className={`af-field${errors.studentClass ? " has-error" : ""}`}>
          <label htmlFor="af-studentClass">
            Class <span lang="bn">শ্রেণি</span>
          </label>
          <select {...a11y("studentClass")} value={form.studentClass} onChange={set("studentClass")}>
            <option value="">Choose class</option>
            {ACADEMY_CLASSES.map((c) => (
              <option key={c} value={c}>
                Class {c}
              </option>
            ))}
          </select>
          {err("studentClass")}
        </div>

        <div className={`af-field af-wide${errors.school ? " has-error" : ""}`}>
          <label htmlFor="af-school">
            School <span lang="bn">স্কুল</span>
          </label>
          <input {...a11y("school")} value={form.school} onChange={set("school")} />
          {err("school")}
        </div>

        <div className={`af-field${errors.mobile ? " has-error" : ""}`}>
          <label htmlFor="af-mobile">
            Mobile number <span lang="bn">মোবাইল নম্বর</span>
          </label>
          <input {...a11y("mobile")} type="tel" inputMode="tel" placeholder="10-digit number" value={form.mobile} onChange={set("mobile")} autoComplete="tel" />
          {err("mobile")}
          <label className="af-check">
            <input type="checkbox" checked={sameWa} onChange={(e) => setSameWa(e.target.checked)} /> Same number on WhatsApp
          </label>
        </div>

        {!sameWa && (
          <div className={`af-field${errors.whatsapp ? " has-error" : ""}`}>
            <label htmlFor="af-whatsapp">
              WhatsApp number <span lang="bn">হোয়াটসঅ্যাপ নম্বর</span>
            </label>
            <input {...a11y("whatsapp")} type="tel" inputMode="tel" placeholder="10-digit number" value={form.whatsapp} onChange={set("whatsapp")} />
            {err("whatsapp")}
          </div>
        )}

        <div className={`af-field af-wide${errors.address ? " has-error" : ""}`}>
          <label htmlFor="af-address">
            Address <span lang="bn">ঠিকানা</span>
          </label>
          <textarea {...a11y("address")} rows={2} value={form.address} onChange={set("address")} autoComplete="street-address" />
          {err("address")}
        </div>

        <div className={`af-field${errors.course ? " has-error" : ""}`}>
          <label htmlFor="af-course">
            Course <span lang="bn">কোর্স</span>
          </label>
          <select {...a11y("course")} value={form.course} onChange={set("course")}>
            <option value="">Choose a course</option>
            {ACADEMY_COURSES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title} ({c.duration}, {inr(c.fee)})
              </option>
            ))}
          </select>
          {err("course")}
        </div>

        <div className={`af-field${errors.location ? " has-error" : ""}`}>
          <label htmlFor="af-location">
            Nearest location <span lang="bn">নিকটতম কেন্দ্র</span>
          </label>
          <select {...a11y("location")} value={form.location} onChange={set("location")}>
            <option value="">Choose location</option>
            {ACADEMY_LOCATIONS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          {err("location")}
        </div>
      </div>

      {/* hidden from people; bots tend to fill it in */}
      <input className="af-hp" tabIndex={-1} autoComplete="off" aria-hidden="true" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} />

      <dl className="af-fees">
        <div>
          <dt>Registration fee</dt>
          <dd>{inr(ACADEMY.registrationFee)} (same for all courses)</dd>
        </div>
        <div>
          <dt>Course fee</dt>
          <dd>{course ? `${inr(course.fee)} · ${course.duration}` : "Choose a course"}</dd>
        </div>
      </dl>

      {phase === "error" && (
        <p className="af-fail" role="alert">
          We couldn&apos;t send your registration. Please try again, or WhatsApp us at{" "}
          <a href={ACADEMY.whatsapp} target="_blank" rel="noopener noreferrer">
            {ACADEMY.phone}
          </a>
          .
        </p>
      )}

      <button className="btn btn-gold btn-lg af-submit" type="submit" disabled={phase === "sending"}>
        <span className="btn-label">{phase === "sending" ? "Sending…" : "Register now"}</span>
        <span className="btn-arrow" aria-hidden="true">↗</span>
      </button>
    </form>
  );
}

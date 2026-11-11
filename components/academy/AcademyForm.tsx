"use client";

import { useEffect, useState } from "react";
import {
  ACADEMY,
  ACADEMY_CLASSES,
  ACADEMY_COURSES,
  ACADEMY_LOCATIONS,
  classLabel,
  inr,
  validateAcademy,
  type AcademyForm as Form,
} from "@/lib/academy";
import { track } from "@/lib/analytics";

type Phase = "idle" | "sending" | "sent" | "error";

const EMPTY: Form = { name: "", studentClass: "", school: "", mobile: "", whatsapp: "", address: "", course: "", location: "" };

/* Admission form for parents: one question per field, plain labels,
   mistakes explained next to the field. */
export default function AcademyForm() {
  const [form, setForm] = useState<Form>(EMPTY);
  const [sameWa, setSameWa] = useState(true);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [phase, setPhase] = useState<Phase>("idle");
  const [website, setWebsite] = useState(""); // hidden field that only bots fill in

  /* /academy/form?course=python-ai preselects that course */
  useEffect(() => {
    const course = new URLSearchParams(window.location.search).get("course");
    if (!course || !ACADEMY_COURSES.some((c) => c.id === course)) return;
    const id = requestAnimationFrame(() => setForm((f) => (f.course ? f : { ...f, course })));
    return () => cancelAnimationFrame(id);
  }, []);

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
      document.getElementById(`af-${first === "whatsapp" && sameWa ? "mobile" : first}`)?.focus();
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
      if (res.ok) {
        track("generate_lead", { form: "academy", course: data.course });
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch {
      setPhase("error");
    }
  };

  if (phase === "sent") {
    return (
      <div className="af2-done" role="status">
        <span className="af2-done-mark" aria-hidden="true">
          ✓
        </span>
        <h2>Registration received!</h2>
        <p>
          Thank you. We&apos;ll call or WhatsApp you on <b>+91 {data.mobile.replace(/\D/g, "").slice(-10)}</b> to confirm{" "}
          {form.name.split(" ")[0]}&apos;s admission.
        </p>
        <a className="acx-btn acx-btn-wa" href={ACADEMY.whatsapp} target="_blank" rel="noopener noreferrer">
          Questions? WhatsApp us
        </a>
      </div>
    );
  }

  const field = (k: keyof Form) => ({
    id: `af-${k}`,
    "aria-invalid": !!errors[k],
    "aria-describedby": errors[k] ? `af-${k}-err` : undefined,
  });
  const err = (k: keyof Form) =>
    errors[k] ? (
      <span className="af2-error" id={`af-${k}-err`}>
        {errors[k]}
      </span>
    ) : null;
  const cls = (k: keyof Form, wide = false) => `af2-field${wide ? " af2-wide" : ""}${errors[k] ? " has-error" : ""}`;

  return (
    <form className="af2" onSubmit={submit} noValidate>
      <fieldset>
        <legend>About the student</legend>
        <div className="af2-grid">
          <div className={cls("name", true)}>
            <label htmlFor="af-name">Student&apos;s full name</label>
            <input {...field("name")} value={form.name} onChange={set("name")} autoComplete="off" />
            {err("name")}
          </div>
          <div className={cls("studentClass")}>
            <label htmlFor="af-studentClass">Class</label>
            <select {...field("studentClass")} value={form.studentClass} onChange={set("studentClass")}>
              <option value="">Choose class</option>
              {ACADEMY_CLASSES.map((c) => (
                <option key={c} value={c}>
                  {classLabel(c)}
                </option>
              ))}
            </select>
            {err("studentClass")}
          </div>
          <div className={cls("school")}>
            <label htmlFor="af-school">School name</label>
            <input {...field("school")} value={form.school} onChange={set("school")} />
            {err("school")}
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Parent&apos;s contact</legend>
        <div className="af2-grid">
          <div className={cls("mobile")}>
            <label htmlFor="af-mobile">Mobile number</label>
            <input {...field("mobile")} type="tel" inputMode="tel" placeholder="10-digit number" value={form.mobile} onChange={set("mobile")} autoComplete="tel" />
            {err("mobile")}
            <label className="af2-check">
              <input type="checkbox" checked={sameWa} onChange={(e) => setSameWa(e.target.checked)} /> This number is also on WhatsApp
            </label>
          </div>
          {!sameWa && (
            <div className={cls("whatsapp")}>
              <label htmlFor="af-whatsapp">WhatsApp number</label>
              <input {...field("whatsapp")} type="tel" inputMode="tel" placeholder="10-digit number" value={form.whatsapp} onChange={set("whatsapp")} />
              {err("whatsapp")}
            </div>
          )}
          <div className={cls("address", true)}>
            <label htmlFor="af-address">Home address</label>
            <textarea {...field("address")} rows={2} value={form.address} onChange={set("address")} autoComplete="street-address" />
            {err("address")}
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Course</legend>
        <div className="af2-grid">
          <div className={cls("course", true)}>
            <span className="af2-label" id="af-course-label">
              Which course?
            </span>
            <div className="af2-courses" role="radiogroup" aria-labelledby="af-course-label" id="af-course" tabIndex={-1}>
              {ACADEMY_COURSES.map((c) => (
                <label key={c.id} className={`af2-course${form.course === c.id ? " is-picked" : ""}`}>
                  <input type="radio" name="course" value={c.id} checked={form.course === c.id} onChange={set("course")} />
                  <span>
                    <b>{c.title}</b>
                    <small>
                      {c.duration} · {inr(c.fee)}
                    </small>
                  </span>
                </label>
              ))}
            </div>
            {err("course")}
          </div>
          <div className={cls("location", true)}>
            <span className="af2-label" id="af-location-label">
              Nearest centre
            </span>
            <div className="af2-pills" role="radiogroup" aria-labelledby="af-location-label" id="af-location" tabIndex={-1}>
              {ACADEMY_LOCATIONS.map((l) => (
                <label key={l} className={`af2-pill${form.location === l ? " is-picked" : ""}`}>
                  <input type="radio" name="location" value={l} checked={form.location === l} onChange={set("location")} />
                  {l}
                </label>
              ))}
            </div>
            {err("location")}
          </div>
        </div>
      </fieldset>

      {/* hidden from people; bots tend to fill it in */}
      <input className="af2-hp" tabIndex={-1} autoComplete="off" aria-hidden="true" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} />

      <div className="af2-total" aria-live="polite">
        <div>
          <span>Course fee</span>
          <b>{course ? inr(course.fee) : "Choose a course"}</b>
        </div>
        <div>
          <span>Registration fee (one time)</span>
          <b>{inr(ACADEMY.registrationFee)}</b>
        </div>
        <p>You don&apos;t pay anything online. We&apos;ll confirm the fees with you on the phone.</p>
      </div>

      {phase === "error" && (
        <p className="af2-fail" role="alert">
          Sorry, we couldn&apos;t send your registration. Please try again, or WhatsApp us at{" "}
          <a href={ACADEMY.whatsapp} target="_blank" rel="noopener noreferrer">
            {ACADEMY.phone}
          </a>
          .
        </p>
      )}

      <button className="acx-btn acx-btn-main acx-btn-block af2-submit" type="submit" disabled={phase === "sending"}>
        {phase === "sending" ? "Sending…" : "Send registration"}
      </button>
    </form>
  );
}

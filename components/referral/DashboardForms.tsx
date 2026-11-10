"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { redeemAction, saveProfileAction, submitLeadAction, type FormState } from "@/app/referral/actions";

function Status({ state }: { state: FormState }) {
  if (state.error) return <p className="rf-error" role="alert">{state.error}</p>;
  if (state.message) return <p className="rf-ok" role="status">{state.message}</p>;
  return null;
}

export function ProfileForm({
  name,
  phone,
  upi,
  needsAgree,
}: {
  name: string;
  phone: string;
  upi: string;
  needsAgree: boolean;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveProfileAction, {});
  return (
    <form action={action} className="rf-form">
      <div className="rf-grid2">
        <label className="rf-field">
          <span>Full name</span>
          <input name="name" defaultValue={name} required autoComplete="name" />
        </label>
        <label className="rf-field">
          <span>Mobile number</span>
          <input name="phone" defaultValue={phone} required inputMode="tel" autoComplete="tel" placeholder="10-digit number" />
        </label>
      </div>
      <label className="rf-field">
        <span>
          UPI ID <em>(where we pay you; you can add it later)</em>
        </span>
        <input name="upi" defaultValue={upi} placeholder="yourname@okaxis" autoComplete="off" />
      </label>
      {needsAgree && (
        <label className="rf-check">
          <input type="checkbox" name="agree" required />
          <span>
            I&apos;m 18+ and I agree to the{" "}
            <a href="/referral/terms" target="_blank">
              program rules
            </a>
            .
          </span>
        </label>
      )}
      <Status state={state} />
      <button className="rf-btn rf-btn-gold" disabled={pending}>
        {pending ? "Saving…" : needsAgree ? "Save and continue" : "Save profile"}
      </button>
    </form>
  );
}

export function LeadForm({ left }: { left: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitLeadAction, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);
  const bad = (f: string) => (state.field === f ? " has-error" : "");

  return (
    <form action={action} className="rf-form" ref={ref}>
      <div className="rf-grid2">
        <label className={`rf-field${bad("name")}`}>
          <span>Their name</span>
          <input name="name" required />
        </label>
        <label className={`rf-field${bad("phone")}`}>
          <span>Their mobile</span>
          <input name="phone" required inputMode="tel" placeholder="10-digit number" />
        </label>
        <label className={`rf-field${bad("email")}`}>
          <span>
            Their email <em>(optional)</em>
          </span>
          <input name="email" type="email" />
        </label>
        <label className="rf-field">
          <span>
            Business / company <em>(optional)</em>
          </span>
          <input name="company" />
        </label>
      </div>
      <label className={`rf-field${bad("need")}`}>
        <span>What do they need?</span>
        <textarea name="need" rows={3} required placeholder="e.g. A website and online ordering for their bakery in Behala" />
      </label>
      <label className={`rf-check${bad("consent")}`}>
        <input type="checkbox" name="consent" required />
        <span>They know me and are happy for GOBT to contact them.</span>
      </label>
      <Status state={state} />
      <button className="rf-btn rf-btn-gold" disabled={pending || left <= 0}>
        {left <= 0 ? "Limit reached, try again later" : pending ? "Submitting…" : "Submit referral"}
      </button>
    </form>
  );
}

export function RedeemButton({ disabled, label }: { disabled: boolean; label: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(redeemAction, {});
  return (
    <form action={action}>
      <button className="rf-btn rf-btn-mint" disabled={disabled || pending}>
        {pending ? "Requesting…" : label}
      </button>
      <Status state={state} />
    </form>
  );
}

export function ShareBox({ url, code }: { url: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const message = `Need a website, app or custom software? I recommend GOBT, a deep-tech team from Kolkata. Have a look: ${url}`;
  return (
    <div className="rf-share">
      <div className="rf-share-link">
        <code>{url}</code>
        <button
          type="button"
          className="rf-btn rf-btn-ghost rf-btn-sm"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1800);
            } catch {
              /* clipboard blocked; the link is selectable */
            }
          }}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <div className="rf-share-actions">
        <a className="rf-btn rf-btn-mint rf-btn-sm" href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer">
          Share on WhatsApp
        </a>
        <span className="rf-fine">
          Your code: <b>{code}</b>
        </span>
      </div>
    </div>
  );
}

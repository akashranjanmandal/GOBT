"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { redeemAction, saveProfileAction, submitLeadAction, type FormState } from "@/app/referral/actions";
import { CHANNELS, shareUrl, taggedLink } from "@/lib/referral/channels";

function Status({ state }: { state: FormState }) {
  if (state.error) return <p className="rf-error" role="alert">{state.error}</p>;
  if (state.message) return <p className="rf-ok" role="status">{state.message}</p>;
  return null;
}

export function ProfileForm({ name, phone, upi, needsAgree }: { name: string; phone: string; upi: string; needsAgree: boolean }) {
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
          UPI ID <em>(where we send your money)</em>
        </span>
        <input name="upi" defaultValue={upi} placeholder="yourname@okaxis" autoComplete="off" />
      </label>
      {needsAgree && (
        <label className="rf-check">
          <input type="checkbox" name="agree" required />
          <span>
            I&apos;m 18 or older and I agree to the{" "}
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
          <span>Their mobile number</span>
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
            Business name <em>(optional)</em>
          </span>
          <input name="company" />
        </label>
      </div>
      <label className={`rf-field${bad("need")}`}>
        <span>What do they need built?</span>
        <textarea name="need" rows={3} required placeholder="e.g. A website with online ordering for their bakery" />
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

const MESSAGE = "Need a website, app or custom software? I recommend GOBT, a deep-tech team from Kolkata.";

/* The link, a copy button and one button per channel. Every press is
   recorded, and each channel's link is tagged so its clicks can be traced. */
export function ShareBox({ url, code }: { url: string; code: string }) {
  const [note, setNote] = useState("");

  const report = (channel: string) => {
    fetch("/api/referral/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel }),
      keepalive: true,
    }).catch(() => {});
  };

  const copy = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setNote(message);
    } catch {
      setNote("Couldn't copy automatically. Select the link above and copy it.");
    }
    window.setTimeout(() => setNote(""), 3500);
  };

  const share = (channel: string) => {
    report(channel);
    const link = shareUrl(channel, url, MESSAGE);
    if (!link) {
      void copy(
        taggedLink(url, channel),
        channel === "instagram" ? "Link copied. Paste it in your Instagram story, bio or a message." : "Link copied."
      );
    } else if (link.startsWith("mailto:") || link.startsWith("sms:")) {
      window.location.assign(link);
    } else {
      window.open(link, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="rf-share">
      <div className="rf-share-link">
        <code>{url.replace("https://", "")}</code>
        <button
          type="button"
          className="rf-btn rf-btn-ghost rf-btn-sm"
          onClick={() => {
            report("copy");
            void copy(taggedLink(url, "copy"), "Link copied. Paste it anywhere.");
          }}
        >
          Copy
        </button>
      </div>
      <p className="rf-fine">Or share it in one tap. We keep count so you can see which place works best for you.</p>
      <div className="rf-channels">
        {CHANNELS.filter((c) => c.id !== "copy").map((c) => (
          <button key={c.id} type="button" className={`rf-channel rf-channel-${c.id}`} onClick={() => share(c.id)}>
            {c.label}
          </button>
        ))}
      </div>
      <p className="rf-fine" aria-live="polite">
        {note || (
          <>
            Your code: <b>{code}</b>
          </>
        )}
      </p>
    </div>
  );
}

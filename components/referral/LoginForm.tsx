"use client";

import { useActionState, useState } from "react";
import { sendCodeAction, type FormState } from "@/app/referral/actions";

/* Email → 6-digit code → in. One component, two steps. Step 2 posts to
   /api/referral/login (which sets the login cookie on a plain response),
   then loads the dashboard with a full page navigation. */
export default function LoginForm() {
  const [sent, send, sending] = useActionState<FormState, FormData>(sendCodeAction, { step: "email" });
  /* "use a different email" dismisses the current code step */
  const [dismissed, setDismissed] = useState<FormState | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const onCode = sent.step === "code" && sent !== dismissed;
  const email = sent.email ?? "";

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setError("");
    try {
      const res = await fetch("/api/referral/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        window.location.assign("/referral/dashboard");
        return;
      }
      setError(data.error ?? "Couldn't log in. Please try again.");
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    }
    setVerifying(false);
  };

  if (!onCode) {
    return (
      <form action={send} className="rf-form">
        <label className="rf-field">
          <span>Your email</span>
          <input name="email" type="email" required autoComplete="email" defaultValue={email} placeholder="you@example.com" autoFocus />
        </label>
        {sent.error && <p className="rf-error" role="alert">{sent.error}</p>}
        <button className="rf-btn rf-btn-gold rf-btn-lg rf-btn-block" disabled={sending}>
          {sending ? "Sending…" : "Email me a login code"}
        </button>
        <p className="rf-fine">New here? The same step creates your account. No password needed.</p>
      </form>
    );
  }

  return (
    <form onSubmit={verify} className="rf-form">
      <p className="rf-ok">{sent.message}</p>
      <label className="rf-field">
        <span>6-digit code</span>
        <input
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]{6,7}"
          maxLength={7}
          required
          autoFocus
          className="rf-code"
          placeholder="••••••"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </label>
      {error && <p className="rf-error" role="alert">{error}</p>}
      <button className="rf-btn rf-btn-gold rf-btn-lg rf-btn-block" disabled={verifying}>
        {verifying ? "Checking…" : "Log in"}
      </button>
      <button
        type="button"
        className="rf-link"
        onClick={() => {
          setDismissed(sent);
          setCode("");
          setError("");
        }}
      >
        Use a different email or resend the code
      </button>
    </form>
  );
}

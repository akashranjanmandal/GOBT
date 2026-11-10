"use client";

import { useActionState, useState } from "react";
import { sendCodeAction, verifyCodeAction, type FormState } from "@/app/referral/actions";

/* Email → 6-digit code → in. One component, two steps. */
export default function LoginForm() {
  const [sent, send, sending] = useActionState<FormState, FormData>(sendCodeAction, { step: "email" });
  const [checked, verify, verifying] = useActionState<FormState, FormData>(verifyCodeAction, {});
  /* "use a different email" dismisses the current code step */
  const [dismissed, setDismissed] = useState<FormState | null>(null);
  const onCode = sent.step === "code" && sent !== dismissed;
  const email = sent.email ?? "";

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
    <form
      action={(fd) => {
        fd.set("email", email);
        verify(fd);
      }}
      className="rf-form"
    >
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
        />
      </label>
      {checked.error && <p className="rf-error" role="alert">{checked.error}</p>}
      <button className="rf-btn rf-btn-gold rf-btn-lg rf-btn-block" disabled={verifying}>
        {verifying ? "Checking…" : "Log in"}
      </button>
      <button type="button" className="rf-link" onClick={() => setDismissed(sent)}>
        Use a different email or resend the code
      </button>
    </form>
  );
}

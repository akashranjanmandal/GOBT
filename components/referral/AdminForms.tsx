"use client";

import { useActionState, useState } from "react";
import {
  changePasswordAction,
  recordPaymentAction,
  type AdminFormState,
} from "@/app/referral/(admin)/admin/actions";

const Note = ({ state }: { state: AdminFormState }) =>
  state.error ? (
    <p className="ad-error" role="alert">
      {state.error}
    </p>
  ) : state.message ? (
    <p className="ad-ok" role="status">
      {state.message}
    </p>
  ) : null;

/* Posts to /api/referral/admin/login (which sets the login cookie on a
   plain response), then loads the panel with a full page navigation. */
export function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<AdminFormState>({});
  const [pending, setPending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setState({});
    try {
      const res = await fetch("/api/referral/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        window.location.assign("/referral/admin");
        return; /* keep the button in its busy state while the panel loads */
      }
      setState({ error: data.error ?? "Couldn't log in. Please try again." });
    } catch {
      setState({ error: "Couldn't reach the server. Check your connection and try again." });
    }
    setPending(false);
  };

  return (
    <form onSubmit={submit} className="ad-form">
      <label className="ad-field">
        <span>Email</span>
        <input name="email" type="email" required autoComplete="username" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="ad-field">
        <span>Password</span>
        <input name="password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      <Note state={state} />
      <button className="ad-btn ad-btn-primary ad-btn-block" disabled={pending}>
        {pending ? "Checking…" : "Log in"}
      </button>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState<AdminFormState, FormData>(changePasswordAction, {});
  return (
    <form action={action} className="ad-form">
      <label className="ad-field">
        <span>Current password</span>
        <input name="current" type="password" required autoComplete="current-password" />
      </label>
      <label className="ad-field">
        <span>New password</span>
        <input name="next" type="password" required autoComplete="new-password" minLength={10} />
        <small>At least 10 characters, with an uppercase letter, a lowercase letter and a number.</small>
      </label>
      <label className="ad-field">
        <span>Type the new password again</span>
        <input name="confirm" type="password" required autoComplete="new-password" />
      </label>
      <Note state={state} />
      <button className="ad-btn ad-btn-primary" disabled={pending}>
        {pending ? "Saving…" : "Change password"}
      </button>
    </form>
  );
}

/* "the client paid us ₹X" → adds the referrer's commission */
export function PaymentForm({ id }: { id: number }) {
  const [state, action, pending] = useActionState<AdminFormState, FormData>(recordPaymentAction, {});
  return (
    <form action={action} className="ad-inline">
      <input type="hidden" name="id" value={id} />
      <input name="amount" inputMode="numeric" placeholder="₹ client paid" aria-label="Amount the client paid" />
      <button className="ad-btn ad-btn-sm" disabled={pending}>
        {pending ? "…" : "Add payment"}
      </button>
      {state.error && <small className="ad-error">{state.error}</small>}
      {state.ok && <small className="ad-ok">Added</small>}
    </form>
  );
}

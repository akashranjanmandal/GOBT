"use client";

import { useActionState, useState } from "react";
import {
  adminLoginAction,
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

export function AdminLoginForm() {
  const [state, action, pending] = useActionState<AdminFormState, FormData>(adminLoginAction, {});
  /* kept in state so a wrong password doesn't wipe the email */
  const [email, setEmail] = useState("");
  return (
    <form action={action} className="ad-form">
      <label className="ad-field">
        <span>Email</span>
        <input name="email" type="email" required autoComplete="username" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="ad-field">
        <span>Password</span>
        <input name="password" type="password" required autoComplete="current-password" />
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

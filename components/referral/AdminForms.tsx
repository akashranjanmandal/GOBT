"use client";

import { useActionState } from "react";
import { recordPaymentAction, type FormState } from "@/app/referral/actions";

/* "client paid us ₹X" → commission line for the referrer */
export function PaymentForm({ id }: { id: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(recordPaymentAction, {});
  return (
    <form action={action} className="rf-inline">
      <input type="hidden" name="id" value={id} />
      <input name="amount" inputMode="numeric" placeholder="₹ received" aria-label="Amount received from client" />
      <button className="rf-btn rf-btn-ghost rf-btn-sm" disabled={pending}>
        {pending ? "…" : "Add payment"}
      </button>
      {state.error && <small className="rf-error">{state.error}</small>}
      {state.ok && <small className="rf-ok">Added</small>}
    </form>
  );
}

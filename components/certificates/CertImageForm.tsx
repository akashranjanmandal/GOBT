"use client";

import { useActionState } from "react";
import { saveCertImageAction, type CertFormState } from "@/app/referral/(admin)/admin/certificates/actions";

/* upload box for a director's signature or the top-right logo */
export default function CertImageForm({
  slot,
  label,
  current,
  empty,
  placeholder,
}: {
  slot: "0" | "1" | "badge";
  label: string;
  current: string | null;
  empty: string;
  placeholder?: string;
}) {
  const [state, action, pending] = useActionState<CertFormState, FormData>(saveCertImageAction, {});
  return (
    <form action={action} className="cf-sig">
      <input type="hidden" name="slot" value={slot} />
      <div className="cf-sig-box">
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current} alt={label} />
        ) : placeholder ? (
          <span className="cf-sig-script">{placeholder}</span>
        ) : (
          <span className="cf-sig-none">Nothing uploaded</span>
        )}
      </div>
      <b>{label}</b>
      <small>{current ? "Uploaded" : empty}</small>
      <input type="file" name="file" accept="image/png,image/jpeg" aria-label={`Image for ${label}`} />
      <div className="ad-inline">
        <button className="ad-btn ad-btn-sm" disabled={pending}>
          {pending ? "Saving…" : "Upload"}
        </button>
        {current && (
          <button className="ad-link" name="remove" value="1" disabled={pending}>
            Remove
          </button>
        )}
      </div>
      {state.error && <small className="ad-error">{state.error}</small>}
      {state.message && <small className="ad-ok">{state.message}</small>}
    </form>
  );
}

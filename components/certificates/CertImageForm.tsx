"use client";

import { useActionState } from "react";
import { saveCertImageAction, type CertFormState } from "@/app/referral/(admin)/admin/certificates/actions";

/* upload box for a director's signature or the top-right logo */
export default function CertImageForm({
  slot,
  label,
  current,
  fallback,
}: {
  slot: "0" | "1" | "badge";
  label: string;
  current: string | null;
  /* GOBT's original artwork, used while nothing is uploaded */
  fallback: string;
}) {
  const [state, action, pending] = useActionState<CertFormState, FormData>(saveCertImageAction, {});
  return (
    <form action={action} className="cf-sig">
      <input type="hidden" name="slot" value={slot} />
      <div className="cf-sig-box">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current ?? fallback} alt={label} />
      </div>
      <b>{label}</b>
      <small>{current ? "Your uploaded image" : "From GOBT's original certificate. Upload to replace it."}</small>
      <input type="file" name="file" accept="image/png,image/jpeg" aria-label={`Image for ${label}`} />
      <div className="ad-inline">
        <button className="ad-btn ad-btn-sm" disabled={pending}>
          {pending ? "Saving…" : "Upload"}
        </button>
        {current && (
          <button className="ad-link" name="remove" value="1" disabled={pending}>
            Go back to the original
          </button>
        )}
      </div>
      {state.error && <small className="ad-error">{state.error}</small>}
      {state.message && <small className="ad-ok">{state.message}</small>}
    </form>
  );
}

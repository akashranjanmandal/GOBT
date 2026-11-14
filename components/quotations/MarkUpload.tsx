"use client";

import { useActionState, useRef, useState } from "react";
import { addMarkAction, type MarkFormState } from "@/app/referral/(admin)/admin/quotations/actions";

/* upload a new signature or stamp to the shared library */
export default function MarkUpload() {
  const [state, action, pending] = useActionState<MarkFormState, FormData>(addMarkAction, {});
  const [preview, setPreview] = useState<string | null>(null);
  const [kind, setKind] = useState<"signature" | "stamp">("signature");
  const form = useRef<HTMLFormElement>(null);
  return (
    <form ref={form} action={action} className="ad-form mk-up">
      <div className="qf-chips" role="radiogroup" aria-label="Type">
        {(["signature", "stamp"] as const).map((k) => (
          <label key={k} className={kind === k ? "is-on" : ""}>
            <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} />
            {k === "stamp" ? "Stamp / seal" : "Signature"}
          </label>
        ))}
      </div>
      <label className="ad-field">
        <span>Name</span>
        <input name="name" required maxLength={80} placeholder={kind === "stamp" ? "e.g. GOBT round seal (blue)" : "e.g. Suprime Mandal – blue ink"} />
      </label>
      <label className="ad-field">
        <span>Image (PNG or JPG, under 400 KB)</span>
        <input
          type="file"
          name="file"
          accept="image/png,image/jpeg"
          required
          onChange={(e) => {
            const f = e.target.files?.[0];
            setPreview(f ? URL.createObjectURL(f) : null);
          }}
        />
        <small>Tip: scan or photograph on white paper, crop tightly, and remove the background (PNG) so it sits naturally on the letterhead.</small>
      </label>
      {preview && (
        <div className="mk-preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Preview of the upload" />
        </div>
      )}
      {state.error && <p className="ad-error">{state.error}</p>}
      {state.message && <p className="ad-ok">{state.message}</p>}
      <button className="ad-btn ad-btn-primary" disabled={pending}>
        {pending ? "Saving…" : "Save to the library"}
      </button>
    </form>
  );
}

"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { CERT_KINDS, PRONOUNS, kindOf, templateText, type CertFields } from "@/lib/certificates/config";
import { saveCertificateAction, type CertFormState } from "@/app/referral/(admin)/admin/certificates/actions";

type Props = { id?: number; initial: CertFields; certNoHint: string };

export default function CertificateForm({ id, initial, certNoHint }: Props) {
  const [state, action, pending] = useActionState<CertFormState, FormData>(saveCertificateAction, {});
  const [f, setF] = useState<CertFields>(initial);
  /* new certificates follow the template until someone edits the text */
  const [ownText, setOwnText] = useState(Boolean(id));
  const [preview, setPreview] = useState<string | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const set = (patch: Partial<CertFields>) =>
    setF((prev) => {
      const next = { ...prev, ...patch };
      /* switching type keeps a custom title but swaps the default one */
      if (patch.kind && prev.title === kindOf(prev.kind).title) next.title = kindOf(patch.kind).title;
      if (!ownText && !("body" in patch) && !("note" in patch)) Object.assign(next, templateText(next));
      return next;
    });

  /* redraw the preview shortly after typing stops */
  useEffect(() => {
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      const form = formRef.current;
      if (!form) return;
      setDrawing(true);
      try {
        const res = await fetch("/api/referral/admin/certificates/preview", { method: "POST", body: new FormData(form), signal: ctrl.signal });
        if (!res.ok) throw new Error(String(res.status));
        const url = URL.createObjectURL(await res.blob());
        setPreview((old) => {
          if (old) URL.revokeObjectURL(old);
          return url;
        });
        setPreviewError(false);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setPreviewError(true);
      } finally {
        if (!ctrl.signal.aborted) setDrawing(false);
      }
    }, 650);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [f]);

  const kind = kindOf(f.kind);

  return (
    <div className="cf">
      <form ref={formRef} action={action} className="cf-form">
        {id && <input type="hidden" name="id" value={id} />}

        <fieldset className="cf-kinds">
          <legend>Type of certificate</legend>
          {CERT_KINDS.map((k) => (
            <label key={k.id} className={f.kind === k.id ? "is-on" : ""}>
              <input type="radio" name="kind" value={k.id} checked={f.kind === k.id} onChange={() => set({ kind: k.id })} />
              {k.label}
            </label>
          ))}
        </fieldset>

        <div className="cf-row">
          <label className="ad-field">
            <span>Full name of the person</span>
            <input name="recipient" required value={f.recipient} onChange={(e) => set({ recipient: e.target.value })} placeholder="Jhimi Thakur" />
          </label>
          <label className="ad-field">
            <span>Refer to them as</span>
            <select name="pronoun" value={f.pronoun} onChange={(e) => set({ pronoun: e.target.value })}>
              {PRONOUNS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="ad-field">
          <span>{kind.roleLabel}</span>
          <input name="role" value={f.role} onChange={(e) => set({ role: e.target.value })} placeholder={kind.rolePlaceholder} />
        </label>

        <div className="cf-row">
          <label className="ad-field">
            <span>From</span>
            <input type="date" name="startDate" value={f.startDate} onChange={(e) => set({ startDate: e.target.value })} />
          </label>
          <label className="ad-field">
            <span>To</span>
            <input type="date" name="endDate" value={f.endDate} onChange={(e) => set({ endDate: e.target.value })} />
          </label>
        </div>

        <label className="ad-field">
          <span>What they worked on or learnt</span>
          <input
            name="skills"
            value={f.skills}
            onChange={(e) => set({ skills: e.target.value })}
            placeholder="project coordination, client interaction, cold calling, professional mailing"
          />
          <small>A short list, separated by commas. It goes into the sentence after the dates.</small>
        </label>

        <label className="ad-field">
          <span>Title</span>
          <input name="title" required value={f.title} onChange={(e) => set({ title: e.target.value })} maxLength={60} />
        </label>

        <div className="ad-field">
          <div className="cf-texthead">
            <span>Certificate text</span>
            <button
              type="button"
              className="ad-link"
              onClick={() => {
                setOwnText(false);
                setF((prev) => ({ ...prev, ...templateText(prev) }));
              }}
            >
              Write it for me
            </button>
          </div>
          <textarea
            name="body"
            rows={5}
            required
            value={f.body}
            onChange={(e) => {
              setOwnText(true);
              set({ body: e.target.value });
            }}
          />
          <small>Put **double stars** around words that should be bold, like **Jhimi Thakur**.</small>
        </div>

        <label className="ad-field">
          <span>Closing line (printed in gold)</span>
          <textarea
            name="note"
            rows={3}
            value={f.note}
            onChange={(e) => {
              setOwnText(true);
              set({ note: e.target.value });
            }}
          />
        </label>

        <div className="cf-row">
          <label className="ad-field">
            <span>Date of issue</span>
            <input type="date" name="issuedOn" required value={f.issuedOn} onChange={(e) => set({ issuedOn: e.target.value })} />
          </label>
          <label className="ad-field">
            <span>Certificate no.</span>
            <input name="certNo" value={f.certNo ?? ""} onChange={(e) => set({ certNo: e.target.value })} placeholder={certNoHint} />
            <small>{id ? "Changing it also changes the verify link and QR code." : "Leave empty to number it automatically."}</small>
          </label>
        </div>

        {state.error && (
          <p className="ad-error" role="alert">
            {state.error}
          </p>
        )}
        <div className="cf-submit">
          <button className="ad-btn ad-btn-primary" disabled={pending}>
            {pending ? "Saving…" : id ? "Save changes" : "Issue certificate"}
          </button>
          <small>{id ? "The public page and downloads update straight away." : "It is published at gobt.in/certificates once issued."}</small>
        </div>
      </form>

      <div className="cf-preview" aria-live="polite">
        <div className="cf-preview-head">
          <span>Preview</span>
          <small>{drawing ? "Drawing…" : previewError ? "Couldn't draw the preview" : "Updates as you type"}</small>
        </div>
        <div className={`cf-preview-img${drawing ? " is-busy" : ""}`}>
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Preview of the certificate" />
          ) : (
            <span className="cf-preview-empty">Drawing the preview…</span>
          )}
        </div>
      </div>
    </div>
  );
}

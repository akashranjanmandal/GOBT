"use client";

import { STAMP_PLACES, markSrc, type MarkInfo, type MarkKind, type QuoteSign, type StampPlace } from "@/lib/quotations/model";

function Picker({ kind, marks, value, onPick }: { kind: MarkKind; marks: MarkInfo[]; value: string; onPick: (id: string) => void }) {
  const list = marks.filter((m) => m.kind === kind && (!m.hidden || m.id === value));
  return (
    <div className="sg-pick" role="radiogroup" aria-label={kind === "stamp" ? "Stamp" : "Signature"}>
      <label className={`sg-opt sg-none${value === "" ? " is-on" : ""}`}>
        <input type="radio" checked={value === ""} onChange={() => onPick("")} />
        <span>None</span>
      </label>
      {list.map((m) => (
        <label key={m.id} className={`sg-opt${value === m.id ? " is-on" : ""}`} title={m.name}>
          <input type="radio" checked={value === m.id} onChange={() => onPick(m.id)} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={markSrc(m.id)} alt="" loading="lazy" />
          <small>{m.name}</small>
        </label>
      ))}
    </div>
  );
}

/* which signature and stamp go on the quotation, and where the stamp sits */
export default function SignSettings({ marks, sign, onChange }: { marks: MarkInfo[]; sign: QuoteSign; onChange: (s: QuoteSign) => void }) {
  return (
    <section className="qf-card sg">
      <h2>Signature &amp; stamp</h2>
      <div>
        <h3>Signature</h3>
        <Picker kind="signature" marks={marks} value={sign.signature} onPick={(signature) => onChange({ ...sign, signature })} />
      </div>
      <div>
        <h3>Stamp</h3>
        <Picker kind="stamp" marks={marks} value={sign.stamp} onPick={(stamp) => onChange({ ...sign, stamp })} />
      </div>
      {sign.stamp && (
        <label className="ad-field">
          <span>Where the stamp goes</span>
          <select value={sign.place} onChange={(e) => onChange({ ...sign, place: e.target.value as StampPlace })}>
            {STAMP_PLACES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
      )}
      <p className="qf-help">
        Need another one, or a stamp somewhere else in the text? Use <b>✍ Signature / stamp</b> in the toolbar to place one anywhere.{" "}
        <a className="ad-link" href="/referral/admin/quotations/marks" target="_blank" rel="noopener noreferrer">
          Add or manage signatures &amp; stamps ↗
        </a>
      </p>
    </section>
  );
}

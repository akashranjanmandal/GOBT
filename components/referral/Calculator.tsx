"use client";

import { useState } from "react";
import { REFERRAL, inr } from "@/lib/referral/config";

/* Play with a project size and number of clients to see the payout */
export default function Calculator() {
  const [project, setProject] = useState(60000);
  const [clients, setClients] = useState(3);
  const cash = Math.round((project * REFERRAL.commissionPercent) / 100) * clients;
  const points = clients * REFERRAL.pointsPerCustomer;

  return (
    <div className="rf-calc">
      <span className="rf-sticker rf-sticker-pink rf-calc-sticker">Try it!</span>
      <label className="rf-calc-row">
        <span>
          Average project value <strong>{inr(project)}</strong>
        </span>
        <input type="range" min={10000} max={1000000} step={5000} value={project} onChange={(e) => setProject(Number(e.target.value))} />
      </label>
      <label className="rf-calc-row">
        <span>
          Clients you refer <strong>{clients}</strong>
        </span>
        <input type="range" min={1} max={20} step={1} value={clients} onChange={(e) => setClients(Number(e.target.value))} />
      </label>
      <div className="rf-calc-out">
        <div>
          <span className="rf-calc-label">You earn</span>
          <span className="rf-calc-big">{inr(cash)}</span>
        </div>
        <div>
          <span className="rf-calc-label">Plus</span>
          <span className="rf-calc-pts">+{points} pts</span>
        </div>
      </div>
      <p className="rf-calc-note">
        {REFERRAL.commissionPercent}% of what each client pays us. Paid by UPI once their payment clears.
      </p>
    </div>
  );
}

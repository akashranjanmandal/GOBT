"use client";

import { useState } from "react";

/* lets a parent pass the form on to other parents */
export default function ShareForm({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const message = `Robotics & AI classes for children in Falta (LKG to Class 12). Register here: ${url}`;
  return (
    <div className="acx-share">
      <a className="acx-btn acx-btn-wa" href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer">
        Share on WhatsApp
      </a>
      <button
        type="button"
        className="acx-btn acx-btn-ghost"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          } catch {
            /* the link is shown below to copy by hand */
          }
        }}
      >
        {copied ? "Link copied!" : "Copy link"}
      </button>
      <code>{url.replace("https://", "")}</code>
    </div>
  );
}

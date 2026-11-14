"use client";

import { useState } from "react";

export default function CopyLink({ path }: { path: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-ghost"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(`${window.location.origin}${path}`);
          setDone(true);
          setTimeout(() => setDone(false), 2000);
        } catch {
          /* clipboard blocked; nothing to do */
        }
      }}
    >
      <span className="btn-label">{done ? "Link copied" : "Copy verify link"}</span>
    </button>
  );
}

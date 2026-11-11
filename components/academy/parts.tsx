import "server-only";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { ACADEMY_PHOTOS } from "@/lib/academy";

/* Photos that actually exist in public/academy (checked at build time,
   so adding a file and redeploying makes it appear). */
export const availablePhotos = () => ACADEMY_PHOTOS.filter((p) => existsSync(join(process.cwd(), "public", "academy", p.file)));

/* friendly line icons for the activities */
export function ActivityIcon({ name }: { name: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "robot":
      return (
        <svg viewBox="0 0 32 32" aria-hidden="true" {...common}>
          <rect x="7" y="10" width="18" height="14" rx="4" />
          <path d="M16 10V6M13 5h6M11 16h.01M21 16h.01M12 20h8M4 15v4M28 15v4" />
        </svg>
      );
    case "code":
      return (
        <svg viewBox="0 0 32 32" aria-hidden="true" {...common}>
          <path d="M11 10l-6 6 6 6M21 10l6 6-6 6M18 7l-4 18" />
        </svg>
      );
    case "ai":
      return (
        <svg viewBox="0 0 32 32" aria-hidden="true" {...common}>
          <rect x="9" y="9" width="14" height="14" rx="3" />
          <path d="M13 9V5M19 9V5M13 27v-4M19 27v-4M9 13H5M9 19H5M27 13h-4M27 19h-4M13 19l2-6h2l2 6M14 17h4" />
        </svg>
      );
    case "iot":
      return (
        <svg viewBox="0 0 32 32" aria-hidden="true" {...common}>
          <path d="M8 13a11 11 0 0 1 16 0M11 17a6.5 6.5 0 0 1 10 0M16 22h.01" />
          <rect x="12" y="24" width="8" height="4" rx="1" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 32 32" aria-hidden="true" {...common}>
          <path d="M10 5h12v6a6 6 0 0 1-12 0V5zM10 8H6a4 4 0 0 0 4 5M22 8h4a4 4 0 0 1-4 5M16 17v5M11 27h10M13 22h6v5h-6z" />
        </svg>
      );
  }
}

/* GA4 events. A no-op until NEXT_PUBLIC_GA_ID is set and gtag has loaded. */
type Gtag = (cmd: "event", name: string, params?: Record<string, string | number>) => void;

export function track(name: string, params?: Record<string, string | number>) {
  if (typeof window === "undefined") return;
  (window as unknown as { gtag?: Gtag }).gtag?.("event", name, params);
}

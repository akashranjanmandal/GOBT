import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/* false during SSR and hydration, true once running in the browser —
   for things like portals that need `document` */
export function useIsClient() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}

import { useSyncExternalStore } from "react";

export type WorkspaceView = "player" | "developer";

function currentPage(): WorkspaceView | null {
  const hash = window.location.hash;
  return hash === "#player" ? "player" : hash === "#developer" ? "developer" : null;
}

function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener("popstate", onChange);
  };
}

// Native links retain refresh, deep links and browser Back without a routing dependency.
// These public views never assign an account role or change API authorization.
export function usePage() {
  return useSyncExternalStore(subscribe, currentPage);
}

"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

function subscribeReducedMotion(callback: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Server has no matchMedia; assume motion is allowed until the client
// re-evaluates on mount (matches this component's own SSR fallback below,
// which doesn't auto-rotate anything anyway).
function getReducedMotionServerSnapshot() {
  return false;
}

// @google/model-viewer's custom element reads `window`/`HTMLElement` at
// module-eval time, so it can only be imported client-side — importing it
// at the top of this file would still run during Next's SSR pass of this
// "use client" component. Loading it inside an effect guarantees it never
// executes on the server.
export function HeroModel() {
  const [ready, setReady] = useState(false);
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
  const autoRotate = !prefersReducedMotion;

  useEffect(() => {
    import("@google/model-viewer").then(() => setReady(true));
  }, []);

  // Same footprint as the model-viewer element below, using the poster as a
  // plain background image, so there's no layout shift while the custom
  // element registers.
  if (!ready) {
    return (
      <div
        className="mx-auto h-64 w-64 sm:h-80 sm:w-80"
        style={{
          backgroundImage: "url(/logo-512.png)",
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        }}
      />
    );
  }

  return (
    <model-viewer
      src="/devkeys-logo.glb"
      poster="/logo-512.png"
      alt="DevKeys logo"
      loading="lazy"
      reveal="auto"
      camera-controls
      auto-rotate={autoRotate}
      camera-orbit="0deg 35deg auto"
      className="mx-auto h-64 w-64 sm:h-80 sm:w-80"
      style={{
        backgroundColor: "transparent",
        ["--poster-color" as string]: "transparent",
      }}
    />
  );
}

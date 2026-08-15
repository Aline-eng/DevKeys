import type { DetailedHTMLProps, HTMLAttributes } from "react";

type ModelViewerAttributes = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  src?: string;
  alt?: string;
  poster?: string;
  loading?: "auto" | "lazy" | "eager";
  reveal?: "auto" | "interaction" | "manual";
  "camera-controls"?: boolean;
  "disable-zoom"?: boolean;
  "disable-pan"?: boolean;
  "auto-rotate"?: boolean;
  "auto-rotate-delay"?: string | number;
  "rotation-per-second"?: string;
  "camera-orbit"?: string;
  "camera-target"?: string;
  "field-of-view"?: string;
  exposure?: string | number;
  "shadow-intensity"?: string | number;
  "shadow-softness"?: string | number;
  "environment-image"?: string;
  "interaction-prompt"?: "auto" | "when-focused" | "none";
};

// @types/react 19 declares JSX.IntrinsicElements inside the "react" module
// itself (not the bare global JSX namespace) to avoid polluting the global
// scope, so the augmentation has to target that module to be picked up.
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerAttributes;
    }
  }
}

export {};

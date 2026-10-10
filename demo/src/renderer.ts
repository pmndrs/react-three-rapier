export type RendererKind = "webgpu" | "webgl";

const STORAGE_KEY = "r3-rapier-demo-renderer";

export const hasWebGPU = () =>
  typeof navigator !== "undefined" && "gpu" in navigator;

const isKind = (v: unknown): v is RendererKind =>
  v === "webgpu" || v === "webgl";

/**
 * `?renderer=webgl|webgpu` wins, then the last choice saved in localStorage, then WebGPU when
 * the browser has it, otherwise WebGL. A WebGPU request without `navigator.gpu` falls back.
 */
export const getRenderer = (): RendererKind => {
  let wanted: unknown = new URLSearchParams(window.location.search).get(
    "renderer"
  );
  if (!isKind(wanted)) {
    try {
      wanted = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* storage unavailable */
    }
  }
  if (isKind(wanted)) {
    return wanted === "webgpu" && !hasWebGPU() ? "webgl" : wanted;
  }
  return hasWebGPU() ? "webgpu" : "webgl";
};

/**
 * Persist the choice and reload: the canvas owns a WebGL or WebGPU context for its whole life,
 * so a full reload is the cleanest way to swap (and avoids leaking contexts).
 */
export const switchRenderer = (kind: RendererKind) => {
  try {
    localStorage.setItem(STORAGE_KEY, kind);
  } catch {
    /* storage unavailable */
  }
  const url = new URL(window.location.href);
  url.searchParams.set("renderer", kind);
  window.location.href = url.toString();
};

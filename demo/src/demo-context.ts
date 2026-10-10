import type { JSX, ReactNode } from "react";
import { createContext, useContext } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three/addons/controls/OrbitControls.js";
import type { RendererKind } from "./renderer";

export type DemoContext = {
  setDebug: (f: boolean) => void;
  setPaused: (f: boolean) => void;
  setCameraEnabled: (f: boolean) => void;
  orbitControlRef: React.RefObject<OrbitControlsImpl>;
  /** The renderer the canvas was created with */
  renderer: RendererKind;
};

export const demoContext = createContext<Partial<DemoContext>>({});

export const useDemo = () => useContext(demoContext);

export interface Demo {
  (props: { children?: ReactNode }): JSX.Element;
}

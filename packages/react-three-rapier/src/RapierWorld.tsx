import React, { createContext, FC, ReactNode, useMemo, useRef } from "react";
import { useAsset } from "use-asset";
import type Rapier from "@dimforge/rapier3d-compat";
import { useFrame } from "@react-three/fiber";
import { Vector3Array } from "./types";
import { vectorArrayToObject } from "./utils";

export interface RapierContext {
  RAPIER: typeof Rapier;
  world: Rapier.World;
  stepFuncs: Array<() => void>;
}

export const RapierContext = createContext<RapierContext | undefined>(
  undefined
);

const importRapier = async () => {
  let r = await import("@dimforge/rapier3d-compat");
  await r.init();
  return r;
};

interface RapierWorldProps {
  gravity?: Vector3Array;
  children: ReactNode;
}

export const RapierWorld: FC<RapierWorldProps> = ({
  children,
  gravity = [0, -9.81, 0],
}) => {
  const rapier = useAsset(importRapier);
  const stepFuncs = useRef<Array<() => void>>([]);

  const world = useMemo(() => {
    if (!rapier.World) return null;

    let world = new rapier.World(vectorArrayToObject(gravity));

    return world;
  }, [rapier]) as Rapier.World;

  const time = useRef(performance.now());

  useFrame((context) => {
    // Set timestep to current delta, to allow for variable frame rates
    // We cap the delta at 100, so that the physics simulation doesn't get wild
    const now = performance.now();
    const delta = Math.min(100, now - time.current);

    world.timestep = delta / 1000;
    world.step();

    // Run all step funcs
    stepFuncs.current.forEach((func) => func());

    time.current = now;
  });

  return (
    <RapierContext.Provider
      value={{ RAPIER: rapier, world, stepFuncs: stepFuncs.current }}
    >
      {children}
    </RapierContext.Provider>
  );
};

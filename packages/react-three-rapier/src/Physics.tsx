import React, { createContext, FC, MutableRefObject, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useAsset } from "use-asset";
import type Rapier from "@dimforge/rapier3d-compat";
import { useFrame } from "@react-three/fiber";
import { RigidBodyAutoCollider, Vector3Array } from "./types";
import { ColliderHandle, RigidBodyHandle, World } from "@dimforge/rapier3d-compat";
import { Object3D } from "three";
import { vectorArrayToObject } from "./utils";

export interface RapierContext {
  rapier: typeof Rapier;
  worldGetter: MutableRefObject<() => World>;
  colliderMeshes: Map<ColliderHandle, Object3D>;
  rigidBodyMeshes: Map<ColliderHandle, Object3D>;
  physicsOptions: {
    colliders: RigidBodyAutoCollider;
  }
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
  colliders?: RigidBodyAutoCollider
  children: ReactNode;
}

export const Physics: FC<RapierWorldProps> = ({
  colliders = 'cuboid',
  gravity = [0, -9.81, 0],
  children
}) => {
  const rapier = useAsset(importRapier);

  const worldRef = useRef<World | null>(null)
  const [colliderMeshes] = useState<Map<ColliderHandle, Object3D>>(() => new Map());
  const [rigidBodyMeshes] = useState<Map<RigidBodyHandle, Object3D>>(() => new Map());
  const [stepFuncs] = useState(() => new Array<() => void>());

  const worldGetter = useRef(() => {
    if (worldRef.current === null) {
      worldRef.current = new rapier.World(vectorArrayToObject(gravity))
    }
    return worldRef.current
  })

  useEffect(() => {
    return () => {
      if (worldRef.current !== null) {
        worldRef.current.free()
        worldRef.current = null
      }
    }
  }, [])

  const time = useRef(performance.now());

  useFrame((context) => {
    const world = worldGetter.current()
    if (!world) return

    // Set timestep to current delta, to allow for variable frame rates
    // We cap the delta at 100, so that the physics simulation doesn't get wild
    const now = performance.now();
    const delta = Math.min(100, now - time.current);

    world.timestep = delta / 1000;
    world.step();

    // Run all step funcs
    stepFuncs.forEach((func) => func());

    time.current = now;
  });

  const context = useMemo<RapierContext>(() => ({ 
    rapier,
    worldGetter,
    physicsOptions: {
      colliders,
      gravity
    },
    stepFuncs,
    colliderMeshes,
    rigidBodyMeshes,
  }), [])

  return (
    <RapierContext.Provider
      value={context}
    >
      {children}
    </RapierContext.Provider>
  );
};

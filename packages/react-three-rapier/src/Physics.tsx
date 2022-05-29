import React, { createContext, FC, MutableRefObject, ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useAsset } from "use-asset";
import type Rapier from "@dimforge/rapier3d-compat";
import { useFrame } from "@react-three/fiber";
import { RigidBodyAutoCollider, Vector3Array, WorldApi } from "./types";
import { ColliderHandle, RigidBodyHandle, World } from "@dimforge/rapier3d-compat";
import { Object3D, Quaternion, Vector3 } from "three";
import { vectorArrayToObject } from "./utils";
import { createWorldApi } from "./api";

export interface RapierContext {
  rapier: typeof Rapier;
  world: WorldApi
  colliderMeshes: Map<ColliderHandle, Object3D>;
  rigidBodyMeshes: Map<ColliderHandle, Object3D>;
  physicsOptions: {
    colliders: RigidBodyAutoCollider;
  }
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

  const worldRef = useRef<World>()
  const getWorldRef = useRef(() => {
    if (!worldRef.current) {
      const world = new rapier.World(vectorArrayToObject(gravity));
      worldRef.current = world
    }
    return worldRef.current;
  })

  const [colliderMeshes] = useState<Map<ColliderHandle, Object3D>>(() => new Map());
  const [rigidBodyMeshes] = useState<Map<RigidBodyHandle, Object3D>>(() => new Map());

  // Init world
  useLayoutEffect(() => {
    const world = getWorldRef.current()

    return () => {
      if (world) {
        world.free()
        worldRef.current = undefined
      }
    }
  }, [])

  const time = useRef(performance.now());

  useFrame((context) => {
    const world = worldRef.current
    if (!world) return

    // Set timestep to current delta, to allow for variable frame rates
    // We cap the delta at 100, so that the physics simulation doesn't get wild
    const now = performance.now();
    const delta = Math.min(100, now - time.current);

    world.timestep = delta / 1000;
    world.step();

    // Update meshes
    rigidBodyMeshes.forEach((mesh, handle) => {
      const rigidBody = world.getRigidBody(handle);

      if (!rigidBody || rigidBody.isSleeping() || rigidBody.isFixed() || !mesh.parent) {
        return
      }

      const { x, y, z } = rigidBody.translation();
      const { x: rx, y: ry, z: rz, w: rw } = rigidBody.rotation();
      const scale = mesh.getWorldScale(new Vector3())

      // haha matrixes I have no idea what I'm doing :)
      const o = new Object3D()
      o.position.set(x, y, z)
      o.rotation.setFromQuaternion(new Quaternion(rx, ry, rz, rw))
      o.scale.set(scale.x, scale.y, scale.z)
      o.updateMatrix()

      o.applyMatrix4(mesh.parent.matrixWorld.clone().invert())
      o.updateMatrix()

      mesh.position.setFromMatrixPosition(o.matrix)
      mesh.rotation.setFromRotationMatrix(o.matrix)
    })

    time.current = now;
  });

  const api = useMemo(() => createWorldApi(getWorldRef), [])

  const context = useMemo<RapierContext>(() => ({ 
    rapier,
    world: api,
    physicsOptions: {
      colliders,
      gravity
    },
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

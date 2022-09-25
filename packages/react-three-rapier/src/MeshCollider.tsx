import { Collider } from "@dimforge/rapier3d-compat";
import React, { ReactNode, useRef, useEffect, useMemo } from "react";
import { Object3D } from "three";
import { AnyCollider } from ".";
import { useChildColliderProps, useRapier } from "./hooks";
import { useRigidBodyContext } from "./RigidBody";
import { RigidBodyAutoCollider } from "./types";

interface MeshColliderProps {
  children: ReactNode;
  type: RigidBodyAutoCollider;
}

export const MeshCollider = ({ children, type }: MeshColliderProps) => {
  const { physicsOptions, world } = useRapier();
  const object = useRef<Object3D>(null);
  const { options } = useRigidBodyContext();

  const mergedOptions = useMemo(() => {
    return {
      ...physicsOptions,
      ...options,
      colliders: type
    };
  }, [physicsOptions, options]);

  const childColliderProps = useChildColliderProps(object, mergedOptions);

  return (
    <object3D
      ref={object}
      userData={{
        r3RapierType: "MeshCollider"
      }}
    >
      {children}
      {childColliderProps.map((colliderProps, index) => (
        <AnyCollider key={index} {...colliderProps} />
      ))}
    </object3D>
  );
};

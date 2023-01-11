import React, { ReactNode, useRef, useMemo, memo } from "react";
import { Object3D } from "three";
import { AnyCollider } from ".";
import { useChildColliderProps, useRapier } from "./hooks";
import { useRigidBodyContext } from "./RigidBody";
import { RigidBodyAutoCollider } from "./types";

export interface MeshColliderProps {
  children: ReactNode;
  type: RigidBodyAutoCollider;
}

export const MeshCollider = memo((props: MeshColliderProps) => {
  const { children, type } = props;
  const { physicsOptions, world } = useRapier();
  const object = useRef<Object3D>(null);
  const { options } = useRigidBodyContext();

  const mergedOptions = useMemo(() => {
    return {
      ...physicsOptions,
      ...options,
      children: undefined,
      colliders: type
    };
  }, [physicsOptions, options]);

  const childColliderProps = useChildColliderProps(
    object,
    mergedOptions,
    false
  );

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
});

MeshCollider.displayName = "MeshCollider";

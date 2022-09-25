import React, { ReactNode, useRef, useMemo } from "react";
import { Object3D } from "three";
import { AnyCollider } from ".";
import { useChildColliderProps, useRapier } from "./hooks";
import { useRigidBodyContext } from "./RigidBody";
import { RigidBodyAutoCollider } from "./types";

interface MeshColliderProps {
  children: ReactNode;
  type: RigidBodyAutoCollider;
}

export const MeshCollider = (props: MeshColliderProps) => {
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
};

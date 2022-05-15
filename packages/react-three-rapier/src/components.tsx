import React, { MutableRefObject, useEffect } from "react";

import {
  createContext,
  forwardRef,
  ReactNode,
  useContext,
  useImperativeHandle,
} from "react";
import { Group, Vector3 } from "three";
import { useCollider, useRapier, useRigidBody } from "./hooks";
import {
  BallArgs,
  CapsuleArgs,
  ConeArgs,
  ConvexHullArgs,
  CuboidArgs,
  CylinderArgs,
  HeightfieldArgs,
  RapierRigidBody,
  RigidBodyAutoCollider,
  RoundCuboidArgs,
  TrimeshArgs,
  UseColliderOptions,
  UseRigidBodyOptions,
} from "./types";
import { createColliderFromOptions, scaleVertices } from "./utils";

const RigidBodyContext = createContext<
  [MutableRefObject<Group>, RapierRigidBody]
>(undefined!);

const useParentRigidBody = () => useContext(RigidBodyContext);

// RigidBody
interface RigidBodyProps extends UseRigidBodyOptions {
  children?: ReactNode;
  colliders?: RigidBodyAutoCollider | false;
}

export const RigidBody = forwardRef<RapierRigidBody, RigidBodyProps>(
  ({ children, ...props }, ref) => {
    const [group, rigidBody] = useRigidBody<Group>(props);

    useImperativeHandle(ref, () => rigidBody);

    return (
      <RigidBodyContext.Provider value={[group, rigidBody]}>
        <group ref={group}>{children}</group>
      </RigidBodyContext.Provider>
    );
  }
);

// Colliders
const AnyCollider = (props: UseColliderOptions<any>) => {
  const { world } = useRapier();
  const [object, rigidBody] = useParentRigidBody();

  useEffect(() => {
    const scale = object.current.getWorldScale(new Vector3());

    const collider = createColliderFromOptions(props, world, rigidBody, scale);

    return () => {
      world.removeCollider(collider, false);
    };
  }, []);

  return null;
};

export const CuboidCollider = (props: UseColliderOptions<CuboidArgs>) => {
  return <AnyCollider {...props} shape="cuboid" />;
};

export const RoundCuboidCollider = (
  props: UseColliderOptions<RoundCuboidArgs>
) => {
  return <AnyCollider {...props} shape="roundCuboid" />;
};

export const BallCollider = (props: UseColliderOptions<BallArgs>) => {
  return <AnyCollider {...props} shape="ball" />;
};

export const CapsuleCollider = (props: UseColliderOptions<CapsuleArgs>) => {
  return <AnyCollider {...props} shape="capsule" />;
};

export const HeightfieldCollider = (
  props: UseColliderOptions<HeightfieldArgs>
) => {
  return <AnyCollider {...props} shape="heightfield" />;
};

export const TrimeshCollider = (props: UseColliderOptions<TrimeshArgs>) => {
  return <AnyCollider {...props} shape="trimesh" />;
};

export const ConeCollider = (props: UseColliderOptions<ConeArgs>) => {
  return <AnyCollider {...props} shape="cone" />;
};

export const CylinderCollider = (props: UseColliderOptions<CylinderArgs>) => {
  return <AnyCollider {...props} shape="cylinder" />;
};

export const ConvexHullCollider = (
  props: UseColliderOptions<ConvexHullArgs>
) => {
  return <AnyCollider {...props} shape="convexHull" />;
};

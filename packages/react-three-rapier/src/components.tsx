import React, { MutableRefObject, useEffect } from "react";

import {
  createContext,
  forwardRef,
  ReactNode,
  useContext,
  useImperativeHandle,
} from "react";
import { Group, Vector3 } from "three";
import { useRapier, useRigidBody } from "./hooks";
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

type UseColliderOptionsRequiredArgs<T> = Omit<UseColliderOptions<T>, "args"> & {
  args: T;
};

export const CuboidCollider = (
  props: UseColliderOptionsRequiredArgs<CuboidArgs>
) => {
  return <AnyCollider {...props} shape="cuboid" />;
};

export const RoundCuboidCollider = (
  props: UseColliderOptionsRequiredArgs<RoundCuboidArgs>
) => {
  return <AnyCollider {...props} shape="roundCuboid" />;
};

export const BallCollider = (
  props: UseColliderOptionsRequiredArgs<BallArgs>
) => {
  return <AnyCollider {...props} shape="ball" />;
};

export const CapsuleCollider = (
  props: UseColliderOptionsRequiredArgs<CapsuleArgs>
) => {
  return <AnyCollider {...props} shape="capsule" />;
};

export const HeightfieldCollider = (
  props: UseColliderOptionsRequiredArgs<HeightfieldArgs>
) => {
  return <AnyCollider {...props} shape="heightfield" />;
};

export const TrimeshCollider = (
  props: UseColliderOptionsRequiredArgs<TrimeshArgs>
) => {
  return <AnyCollider {...props} shape="trimesh" />;
};

export const ConeCollider = (
  props: UseColliderOptionsRequiredArgs<ConeArgs>
) => {
  return <AnyCollider {...props} shape="cone" />;
};

export const CylinderCollider = (
  props: UseColliderOptionsRequiredArgs<CylinderArgs>
) => {
  return <AnyCollider {...props} shape="cylinder" />;
};

export const ConvexHullCollider = (
  props: UseColliderOptionsRequiredArgs<ConvexHullArgs>
) => {
  return <AnyCollider {...props} shape="convexHull" />;
};

import { Collider } from "@dimforge/rapier3d-compat";
import React, { ReactNode, useRef, useEffect } from "react";
import { Object3D, Vector3, InstancedMesh } from "three";
import { useRapier } from "./hooks";
import { useRigidBodyContext, RigidBodyProps } from "./RigidBody";
import {
  UseColliderOptions,
  CuboidArgs,
  RoundCuboidArgs,
  BallArgs,
  CapsuleArgs,
  HeightfieldArgs,
  TrimeshArgs,
  ConeArgs,
  CylinderArgs,
  ConvexHullArgs,
} from "./types";
import { createColliderFromOptions, vectorArrayToVector3 } from "./utils";

// Colliders
const AnyCollider = ({
  children,
  ...props
}: UseColliderOptions<any> & { children?: ReactNode }) => {
  const { world } = useRapier();
  const rigidBodyContext = useRigidBodyContext();
  const ref = useRef<Object3D>(null);

  useEffect(() => {
    const scale = ref.current!.getWorldScale(new Vector3());
    const colliders: Collider[] = [];

    // If this is an InstancedRigidBody api
    if (rigidBodyContext && "at" in rigidBodyContext.api) {
      rigidBodyContext.api.forEach((body, index) => {
        let instanceScale = scale.clone();

        if (
          "scales" in rigidBodyContext.options &&
          rigidBodyContext?.options?.scales?.[index]
        ) {
          instanceScale.multiply(
            vectorArrayToVector3(rigidBodyContext.options.scales[index])
          );
        }

        colliders.push(
          createColliderFromOptions({
            options: props,
            world,
            rigidBody: body.raw(),
            scale: instanceScale,
            hasCollisionEvents: rigidBodyContext?.hasCollisionEvents,
          })
        );
      });
    } else {
      colliders.push(
        createColliderFromOptions({
          options: props,
          world,
          // Initiate with a rigidbody, or undefined, because colliders can exist without a rigid body
          rigidBody:
            rigidBodyContext && "raw" in rigidBodyContext.api
              ? rigidBodyContext.api.raw()
              : undefined,
          scale,
          hasCollisionEvents: rigidBodyContext?.hasCollisionEvents,
        })
      );
    }

    return () => {
      colliders.forEach((collider) => world.removeCollider(collider));
    };
  }, []);

  return <object3D ref={ref}>{children}</object3D>;
};

type UseColliderOptionsRequiredArgs<T> = Omit<UseColliderOptions<T>, "args"> & {
  args: T;
  children?: ReactNode;
};

export type CuboidColliderProps = UseColliderOptionsRequiredArgs<CuboidArgs>;
export type RoundCuboidColliderProps = UseColliderOptionsRequiredArgs<
  RoundCuboidArgs
>;
export type BallColliderProps = UseColliderOptionsRequiredArgs<BallArgs>;
export type CapsuleColliderProps = UseColliderOptionsRequiredArgs<CapsuleArgs>;
export type HeightfieldColliderProps = UseColliderOptionsRequiredArgs<
  HeightfieldArgs
>;
export type TrimeshColliderProps = UseColliderOptionsRequiredArgs<TrimeshArgs>;
export type ConeColliderProps = UseColliderOptionsRequiredArgs<ConeArgs>;
export type CylinderColliderProps = UseColliderOptionsRequiredArgs<
  CylinderArgs
>;
export type ConvexHullColliderProps = UseColliderOptionsRequiredArgs<
  ConvexHullArgs
>;

export const CuboidCollider = (props: CuboidColliderProps) => {
  return <AnyCollider {...props} shape="cuboid" />;
};

export const RoundCuboidCollider = (props: RoundCuboidColliderProps) => {
  return <AnyCollider {...props} shape="roundCuboid" />;
};

export const BallCollider = (props: BallColliderProps) => {
  return <AnyCollider {...props} shape="ball" />;
};

export const CapsuleCollider = (props: CapsuleColliderProps) => {
  return <AnyCollider {...props} shape="capsule" />;
};

export const HeightfieldCollider = (props: HeightfieldColliderProps) => {
  return <AnyCollider {...props} shape="heightfield" />;
};

export const TrimeshCollider = (props: TrimeshColliderProps) => {
  return <AnyCollider {...props} shape="trimesh" />;
};

export const ConeCollider = (props: ConeColliderProps) => {
  return <AnyCollider {...props} shape="cone" />;
};

export const CylinderCollider = (props: CylinderColliderProps) => {
  return <AnyCollider {...props} shape="cylinder" />;
};

export const ConvexHullCollider = (props: ConvexHullColliderProps) => {
  return <AnyCollider {...props} shape="convexHull" />;
};

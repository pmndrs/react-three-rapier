import { Collider, ColliderDesc } from "@dimforge/rapier3d-compat";
import React, { ReactNode, useRef, useEffect, memo } from "react";
import { Object3D, Vector3, InstancedMesh } from "three";
import { useRapier } from "./hooks";
import { useRigidBodyContext, RigidBodyProps } from "./RigidBody";
import { _euler, _position, _rotation, _scale } from "./shared-objects";
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
  RigidBodyApi
} from "./types";
import { vectorArrayToVector3 } from "./utils";
import {
  createColliderFromOptions,
  createColliderState,
  useColliderEvents,
  useUpdateColliderOptions
} from "./utils-collider";

export interface ColliderProps extends UseColliderOptions<any> {
  children?: ReactNode;
}

// Colliders
export const AnyCollider = memo((props: ColliderProps) => {
  const { children, position, rotation, quaternion, scale } = props;
  const { world, colliderEvents, colliderStates } = useRapier();
  const rigidBodyContext = useRigidBodyContext();
  const ref = useRef<Object3D>(null);
  const collidersRef = useRef<Collider[]>([]);

  useEffect(() => {
    const object = ref.current!;

    const worldScale = object.getWorldScale(new Vector3());

    const colliders: Collider[] = [];

    // If this is an InstancedRigidBody api
    if (rigidBodyContext && "at" in rigidBodyContext.api) {
      rigidBodyContext.api.forEach((body, index) => {
        let instanceScale = worldScale;

        if (
          "scales" in rigidBodyContext.options &&
          rigidBodyContext?.options?.scales?.[index]
        ) {
          instanceScale = instanceScale
            .clone()
            .multiply(
              vectorArrayToVector3(rigidBodyContext.options.scales[index])
            );
        }

        const collider = createColliderFromOptions(
          props,
          world,
          instanceScale,
          body.raw()
        );
        colliderStates.set(
          collider.handle,
          createColliderState(collider, object, rigidBodyContext?.ref.current)
        );
        colliders.push(collider);
      });
    } else {
      const collider = createColliderFromOptions(
        props,
        world,
        worldScale,
        rigidBodyContext && (rigidBodyContext?.api as RigidBodyApi).raw()
      );
      colliderStates.set(
        collider.handle,
        createColliderState(collider, object, rigidBodyContext?.ref.current)
      );
      colliders.push(collider);
    }

    collidersRef.current = colliders;

    return () => {
      colliders.forEach(collider => {
        world.removeCollider(collider);
      });
    };
  }, []);

  useUpdateColliderOptions(collidersRef, props, colliderStates);
  useColliderEvents(collidersRef, props, colliderEvents);

  return (
    <object3D
      position={position}
      rotation={rotation}
      quaternion={quaternion}
      scale={scale}
      ref={ref}
    >
      {children}
    </object3D>
  );
});

type UseColliderOptionsRequiredArgs<T extends unknown[]> = Omit<
  UseColliderOptions<T>,
  "args"
> & {
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

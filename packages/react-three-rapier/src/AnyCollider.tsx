import { Collider } from "@dimforge/rapier3d-compat";
import React, { ReactNode, useRef, useEffect } from "react";
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
  ConvexHullArgs
} from "./types";
import { vectorArrayToVector3 } from "./utils";

export interface ColliderProps extends UseColliderOptions<any> {
  children?: ReactNode;
}

// Colliders
export const AnyCollider = ({
  children,
  position,
  rotation,
  ...props
}: ColliderProps) => {
  const { world, colliderEvents, colliderStates } = useRapier();
  const rigidBodyContext = useRigidBodyContext();
  const ref = useRef<Object3D>(null);

  useEffect(() => {
    const object = ref.current!;
    object.updateWorldMatrix(true, false);
    const objectMatrix = object.matrixWorld.clone();

    const scale = object.getWorldScale(new Vector3());

    // If we have a ridig body parent, we premultiply that objects inverted worldMatrix
    const parent = rigidBodyContext?.ref.current;
    const rigidBodyOffset = parent?.matrixWorld.clone().invert();

    if (rigidBodyOffset) {
      objectMatrix.premultiply(rigidBodyOffset);
    }

    objectMatrix.decompose(_position, _rotation, _scale);
    const eulerRotation = _euler.setFromQuaternion(_rotation);

    const colliders: Collider[] = [];

    // If this is an InstancedRigidBody api
    if (rigidBodyContext && "at" in rigidBodyContext.api) {
      rigidBodyContext.api.forEach((body, index) => {
        let instanceScale = _scale;

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

        colliders
          .push
          //   createColliderFromOptions({
          //     options: {
          //       solverGroups: rigidBodyContext.options.solverGroups,
          //       collisionGroups: rigidBodyContext.options.collisionGroups,
          //       ...props
          //     },
          //     world,
          //     rigidBody: body.raw(),
          //     scale: instanceScale,
          //   })
          ();
      });
    } else {
      colliders
        .push
        // createColliderFromOptions({
        //   options: {
        //     solverGroups:
        //       rigidBodyContext?.options.solverGroups || props.solverGroups,
        //     collisionGroups:
        //       rigidBodyContext?.options.collisionGroups ||
        //       props.collisionGroups,
        //     ...props,
        //     position: [_position.x, _position.y, _position.z],
        //     rotation: [eulerRotation.x, eulerRotation.y, eulerRotation.z]
        //   },
        //   world,
        //   // Initiate with a rigidbody, or undefined, because colliders can exist without a rigid body
        //   rigidBody:
        //     rigidBodyContext && "raw" in rigidBodyContext.api
        //       ? rigidBodyContext.api.raw()
        //       : undefined,
        //   scale: _scale,
        // })
        ();
    }

    /* Register collision events. */
    // colliders.forEach(collider =>
    //   colliderEvents.set(collider.handle, {
    //     onCollisionEnter,
    //     onCollisionExit
    //   })
    // );

    return () => {
      colliders.forEach(collider => {
        colliderEvents.delete(collider.handle);
        world.removeCollider(collider);
      });
    };
  }, []);

  return (
    <object3D position={position} rotation={rotation} ref={ref}>
      {children}
    </object3D>
  );
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

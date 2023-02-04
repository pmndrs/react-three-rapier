import { Collider } from "@dimforge/rapier3d-compat";
import React, {
  ReactNode,
  useRef,
  useEffect,
  memo,
  ForwardedRef,
  useMemo,
  forwardRef
} from "react";
import { Object3D, Vector3 } from "three";
import { RigidBodyApi } from "../utils/api";
import { useRapier } from "../hooks/hooks";
import { useRigidBodyContext } from "./RigidBody";
import { _euler, _position, _rotation, _scale } from "../utils/shared-objects";
import {
  ColliderOptions,
  CuboidArgs,
  RoundCuboidArgs,
  BallArgs,
  CapsuleArgs,
  HeightfieldArgs,
  TrimeshArgs,
  ConeArgs,
  CylinderArgs,
  ConvexHullArgs
} from "../types";
import {
  createColliderFromOptions,
  createColliderState,
  useColliderEvents,
  useUpdateColliderOptions
} from "../utils/utils-collider";

export interface ColliderProps extends ColliderOptions<any> {
  children?: ReactNode;
}

// Colliders
export const AnyCollider = memo(
  forwardRef((props: ColliderProps, forwardedRef: ForwardedRef<Collider>) => {
    const { children, position, rotation, quaternion, scale, name } = props;
    const { world, colliderEvents, colliderStates } = useRapier();
    const rigidBodyContext = useRigidBodyContext();
    const ref = useRef<Object3D>(null);
    const colliderRef = useRef<Collider>();

    useEffect(() => {
      const object = ref.current!;

      const worldScale = object.getWorldScale(new Vector3());

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

      colliderRef.current = collider;

      if (forwardedRef) {
        if (typeof forwardedRef === "function") {
          forwardedRef(colliderRef.current);
        } else {
          forwardedRef.current = colliderRef.current;
        }
      }

      return () => {
        world.removeCollider(collider);
      };
    }, []);

    const mergedProps = useMemo(() => {
      return { ...rigidBodyContext?.options, ...props };
    }, [props, rigidBodyContext?.options]);

    useUpdateColliderOptions(colliderRef, mergedProps, colliderStates);
    useColliderEvents(colliderRef, mergedProps, colliderEvents);

    return (
      <object3D
        position={position}
        rotation={rotation}
        quaternion={quaternion}
        scale={scale}
        ref={ref}
        name={name}
      >
        {children}
      </object3D>
    );
  })
);

export type ColliderOptionsRequiredArgs<T extends unknown[]> = Omit<
  ColliderOptions<T>,
  "args"
> & {
  args: T;
  children?: ReactNode;
};

export type CuboidColliderProps = ColliderOptionsRequiredArgs<CuboidArgs>;
export type RoundCuboidColliderProps =
  ColliderOptionsRequiredArgs<RoundCuboidArgs>;
export type BallColliderProps = ColliderOptionsRequiredArgs<BallArgs>;
export type CapsuleColliderProps = ColliderOptionsRequiredArgs<CapsuleArgs>;
export type HeightfieldColliderProps =
  ColliderOptionsRequiredArgs<HeightfieldArgs>;
export type TrimeshColliderProps = ColliderOptionsRequiredArgs<TrimeshArgs>;
export type ConeColliderProps = ColliderOptionsRequiredArgs<ConeArgs>;
export type CylinderColliderProps = ColliderOptionsRequiredArgs<CylinderArgs>;
export type ConvexHullColliderProps =
  ColliderOptionsRequiredArgs<ConvexHullArgs>;

export const CuboidCollider = React.forwardRef(
  (props: CuboidColliderProps, ref: ForwardedRef<Collider>) => {
    return <AnyCollider {...props} shape="cuboid" ref={ref} />;
  }
);

export const RoundCuboidCollider = React.forwardRef(
  (props: RoundCuboidColliderProps, ref: ForwardedRef<Collider>) => {
    return <AnyCollider {...props} shape="roundCuboid" ref={ref} />;
  }
);

export const BallCollider = React.forwardRef(
  (props: BallColliderProps, ref: ForwardedRef<Collider>) => {
    return <AnyCollider {...props} shape="ball" ref={ref} />;
  }
);

export const CapsuleCollider = React.forwardRef(
  (props: CapsuleColliderProps, ref: ForwardedRef<Collider>) => {
    return <AnyCollider {...props} shape="capsule" ref={ref} />;
  }
);

export const HeightfieldCollider = React.forwardRef(
  (props: HeightfieldColliderProps, ref: ForwardedRef<Collider>) => {
    return <AnyCollider {...props} shape="heightfield" ref={ref} />;
  }
);

export const TrimeshCollider = React.forwardRef(
  (props: TrimeshColliderProps, ref: ForwardedRef<Collider>) => {
    return <AnyCollider {...props} shape="trimesh" ref={ref} />;
  }
);

export const ConeCollider = React.forwardRef(
  (props: ConeColliderProps, ref: ForwardedRef<Collider>) => {
    return <AnyCollider {...props} shape="cone" ref={ref} />;
  }
);

export const CylinderCollider = React.forwardRef(
  (props: CylinderColliderProps, ref: ForwardedRef<Collider>) => {
    return <AnyCollider {...props} shape="cylinder" ref={ref} />;
  }
);

export const ConvexHullCollider = React.forwardRef(
  (props: ConvexHullColliderProps, ref: ForwardedRef<Collider>) => {
    return <AnyCollider {...props} shape="convexHull" ref={ref} />;
  }
);

CuboidCollider.displayName = "CuboidCollider";
RoundCuboidCollider.displayName = "RoundCuboidCollider";
BallCollider.displayName = "BallCollider";
CapsuleCollider.displayName = "CapsuleCollider";
HeightfieldCollider.displayName = "HeightfieldCollider";
TrimeshCollider.displayName = "TrimeshCollider";
ConeCollider.displayName = "ConeCollider";
CylinderCollider.displayName = "CylinderCollider";
ConvexHullCollider.displayName = "ConvexHullCollider";

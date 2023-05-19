import { Collider } from "@dimforge/rapier3d-compat";
import React, {
  ReactNode,
  useRef,
  memo,
  ForwardedRef,
  useMemo,
  forwardRef,
  useImperativeHandle,
  useEffect
} from "react";
import { Object3D } from "three";
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
  ConvexHullArgs,
  RoundCylinderArgs
} from "../types";
import {
  cleanRigidBodyPropsForCollider,
  createColliderFromOptions,
  createColliderState,
  getActiveCollisionEventsFromProps,
  immutableColliderOptions,
  useColliderEvents,
  useUpdateColliderOptions
} from "../utils/utils-collider";
import { useImperativeInstance } from "../hooks/use-imperative-instance";
import { vec3 } from "../utils/three-object-helpers";
import { RoundConeArgs } from "../types";
import { useForwardedRef } from "../hooks/use-forwarded-ref";

export interface ColliderProps extends ColliderOptions<any> {
  children?: ReactNode;
}

/**
 * A collider is a shape that can be attached to a rigid body to define its physical properties.
 * @internal
 */
export const AnyCollider = memo(
  forwardRef((props: ColliderProps, forwardedRef: ForwardedRef<Collider>) => {
    const { children, position, rotation, quaternion, scale, name } = props;
    const { world, colliderEvents, colliderStates } = useRapier();
    const rigidBodyContext = useRigidBodyContext();
    const colliderRef = useForwardedRef(forwardedRef);
    const objectRef = useRef<Object3D>(null);

    // We spread the props out here to make sure that the ref is updated when the props change.
    const immutablePropArray = immutableColliderOptions.flatMap((key) =>
      Array.isArray(props[key]) ? [...props[key]] : props[key]
    );

    const getInstance = useImperativeInstance(
      () => {
        const worldScale = objectRef.current!.getWorldScale(vec3());

        const collider = createColliderFromOptions(
          props,
          world,
          worldScale,
          rigidBodyContext?.getRigidBody
        );

        if (typeof forwardedRef == "function") {
          forwardedRef(collider);
        }
        colliderRef.current = collider;

        return collider;
      },
      (collider) => {
        world.removeCollider(collider, true);
      },
      [...immutablePropArray, rigidBodyContext]
    );

    useEffect(() => {
      const collider = getInstance();

      colliderStates.set(
        collider.handle,
        createColliderState(
          collider,
          objectRef.current!,
          rigidBodyContext?.ref.current
        )
      );

      return () => {
        colliderStates.delete(collider.handle);
      };
    }, [getInstance]);

    const mergedProps = useMemo(() => {
      return {
        ...cleanRigidBodyPropsForCollider(rigidBodyContext?.options),
        ...props
      };
    }, [props, rigidBodyContext?.options]);

    useUpdateColliderOptions(getInstance, mergedProps, colliderStates);
    useColliderEvents(
      getInstance,
      mergedProps,
      colliderEvents,
      getActiveCollisionEventsFromProps(rigidBodyContext?.options)
    );

    return (
      <object3D
        position={position}
        rotation={rotation}
        quaternion={quaternion}
        scale={scale}
        ref={objectRef}
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

/**
 * A cuboid collider shape
 * @category Colliders
 */
export const CuboidCollider = React.forwardRef(
  (props: CuboidColliderProps, ref: ForwardedRef<Collider>) => {
    return <AnyCollider {...props} shape="cuboid" ref={ref} />;
  }
);
CuboidCollider.displayName = "CuboidCollider";

export type RoundCuboidColliderProps =
  ColliderOptionsRequiredArgs<RoundCuboidArgs>;

/**
 * A round cuboid collider shape
 * @category Colliders
 */
export const RoundCuboidCollider = React.forwardRef(
  (props: RoundCuboidColliderProps, ref: ForwardedRef<Collider>) => (
    <AnyCollider {...props} shape="roundCuboid" ref={ref} />
  )
);
RoundCuboidCollider.displayName = "RoundCuboidCollider";

export type BallColliderProps = ColliderOptionsRequiredArgs<BallArgs>;
/**
 * A ball collider shape
 * @category Colliders
 */
export const BallCollider = React.forwardRef(
  (props: BallColliderProps, ref: ForwardedRef<Collider>) => (
    <AnyCollider {...props} shape="ball" ref={ref} />
  )
);
BallCollider.displayName = "BallCollider";

export type CapsuleColliderProps = ColliderOptionsRequiredArgs<CapsuleArgs>;

/**
 * A capsule collider shape
 * @category Colliders
 */
export const CapsuleCollider = React.forwardRef(
  (props: CapsuleColliderProps, ref: ForwardedRef<Collider>) => (
    <AnyCollider {...props} shape="capsule" ref={ref} />
  )
);
CapsuleCollider.displayName = "CapsuleCollider";

export type HeightfieldColliderProps =
  ColliderOptionsRequiredArgs<HeightfieldArgs>;

/**
 * A heightfield collider shape
 * @category Colliders
 */
export const HeightfieldCollider = React.forwardRef(
  (props: HeightfieldColliderProps, ref: ForwardedRef<Collider>) => (
    <AnyCollider {...props} shape="heightfield" ref={ref} />
  )
);
HeightfieldCollider.displayName = "HeightfieldCollider";

export type TrimeshColliderProps = ColliderOptionsRequiredArgs<TrimeshArgs>;
/**
 * A trimesh collider shape
 * @category Colliders
 */
export const TrimeshCollider = React.forwardRef(
  (props: TrimeshColliderProps, ref: ForwardedRef<Collider>) => (
    <AnyCollider {...props} shape="trimesh" ref={ref} />
  )
);
TrimeshCollider.displayName = "TrimeshCollider";

export type ConeColliderProps = ColliderOptionsRequiredArgs<ConeArgs>;

/**
 * A cone collider shape
 * @category Colliders
 */
export const ConeCollider = React.forwardRef(
  (props: ConeColliderProps, ref: ForwardedRef<Collider>) => (
    <AnyCollider {...props} shape="cone" ref={ref} />
  )
);
ConeCollider.displayName = "ConeCollider";

export type RoundConeColliderProps = ColliderOptionsRequiredArgs<RoundConeArgs>;

/**
 * A round cylinder collider shape
 * @category Colliders
 */
export const RoundConeCollider = React.forwardRef(
  (props: RoundConeColliderProps, ref: ForwardedRef<Collider>) => (
    <AnyCollider {...props} shape="roundCone" ref={ref} />
  )
);
RoundConeCollider.displayName = "RoundConeCollider";

export type CylinderColliderProps = ColliderOptionsRequiredArgs<CylinderArgs>;

/**
 * A cylinder collider shape
 * @category Colliders
 */
export const CylinderCollider = React.forwardRef(
  (props: CylinderColliderProps, ref: ForwardedRef<Collider>) => (
    <AnyCollider {...props} shape="cylinder" ref={ref} />
  )
);
CylinderCollider.displayName = "CylinderCollider";

export type RoundCylinderColliderProps =
  ColliderOptionsRequiredArgs<RoundCylinderArgs>;

/**
 * A round cylinder collider shape
 * @category Colliders
 */
export const RoundCylinderCollider = React.forwardRef(
  (props: RoundConeColliderProps, ref: ForwardedRef<Collider>) => (
    <AnyCollider {...props} shape="roundCylinder" ref={ref} />
  )
);
CylinderCollider.displayName = "RoundCylinderCollider";

export type ConvexHullColliderProps =
  ColliderOptionsRequiredArgs<ConvexHullArgs>;

/**
 * A convex hull collider shape
 * @category Colliders
 */
export const ConvexHullCollider = React.forwardRef(
  (props: ConvexHullColliderProps, ref: ForwardedRef<Collider>) => (
    <AnyCollider {...props} shape="convexHull" ref={ref} />
  )
);
ConvexHullCollider.displayName = "ConvexHullCollider";

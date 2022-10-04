import { Collider, ColliderDesc } from "@dimforge/rapier3d-compat";
import React, {
  ReactNode,
  useRef,
  useEffect,
  memo,
  ForwardedRef,
  useMemo,
  MutableRefObject
} from "react";
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
export const AnyCollider = memo(
  React.forwardRef(
    (props: ColliderProps, forwardedRef: ForwardedRef<Collider[]>) => {
      const { children, position, rotation, quaternion, scale } = props;
      const { world, colliderEvents, colliderStates } = useRapier();
      const rigidBodyContext = useRigidBodyContext();
      const ref = useRef<Object3D>(null);
      const collidersRef = useMemo(() => {
        if (forwardedRef !== null) {
          return forwardedRef as MutableRefObject<Collider[]>;
        }

        const result = React.createRef() as MutableRefObject<Collider[]>;
        result.current = [];
        return result;
      }, []);

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
              createColliderState(
                collider,
                object,
                rigidBodyContext?.ref.current
              )
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
          colliders.forEach((collider) => {
            world.removeCollider(collider);
          });
        };
      }, []);

      const mergedProps = useMemo(() => {
        return { ...rigidBodyContext?.options, ...props };
      }, [props, rigidBodyContext?.options]);

      useUpdateColliderOptions(collidersRef, mergedProps, colliderStates);
      useColliderEvents(collidersRef, mergedProps, colliderEvents);

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
    }
  )
);

type UseColliderOptionsRequiredArgs<T extends unknown[]> = Omit<
  UseColliderOptions<T>,
  "args"
> & {
  args: T;
  children?: ReactNode;
};

export type CuboidColliderProps = UseColliderOptionsRequiredArgs<CuboidArgs>;
export type RoundCuboidColliderProps =
  UseColliderOptionsRequiredArgs<RoundCuboidArgs>;
export type BallColliderProps = UseColliderOptionsRequiredArgs<BallArgs>;
export type CapsuleColliderProps = UseColliderOptionsRequiredArgs<CapsuleArgs>;
export type HeightfieldColliderProps =
  UseColliderOptionsRequiredArgs<HeightfieldArgs>;
export type TrimeshColliderProps = UseColliderOptionsRequiredArgs<TrimeshArgs>;
export type ConeColliderProps = UseColliderOptionsRequiredArgs<ConeArgs>;
export type CylinderColliderProps =
  UseColliderOptionsRequiredArgs<CylinderArgs>;
export type ConvexHullColliderProps =
  UseColliderOptionsRequiredArgs<ConvexHullArgs>;

export const CuboidCollider = React.forwardRef(
  (props: CuboidColliderProps, ref: ForwardedRef<Collider[]>) => {
    return <AnyCollider {...props} shape="cuboid" ref={ref} />;
  }
);

export const RoundCuboidCollider = React.forwardRef(
  (props: RoundCuboidColliderProps, ref: ForwardedRef<Collider[]>) => {
    return <AnyCollider {...props} shape="roundCuboid" ref={ref} />;
  }
);

export const BallCollider = React.forwardRef(
  (props: BallColliderProps, ref: ForwardedRef<Collider[]>) => {
    return <AnyCollider {...props} shape="ball" ref={ref} />;
  }
);

export const CapsuleCollider = React.forwardRef(
  (props: CapsuleColliderProps, ref: ForwardedRef<Collider[]>) => {
    return <AnyCollider {...props} shape="capsule" ref={ref} />;
  }
);

export const HeightfieldCollider = React.forwardRef(
  (props: HeightfieldColliderProps, ref: ForwardedRef<Collider[]>) => {
    return <AnyCollider {...props} shape="heightfield" ref={ref} />;
  }
);

export const TrimeshCollider = React.forwardRef(
  (props: TrimeshColliderProps, ref: ForwardedRef<Collider[]>) => {
    return <AnyCollider {...props} shape="trimesh" ref={ref} />;
  }
);

export const ConeCollider = React.forwardRef(
  (props: ConeColliderProps, ref: ForwardedRef<Collider[]>) => {
    return <AnyCollider {...props} shape="cone" ref={ref} />;
  }
);

export const CylinderCollider = React.forwardRef(
  (props: CylinderColliderProps, ref: ForwardedRef<Collider[]>) => {
    return <AnyCollider {...props} shape="cylinder" ref={ref} />;
  }
);

export const ConvexHullCollider = React.forwardRef(
  (props: ConvexHullColliderProps, ref: ForwardedRef<Collider[]>) => {
    return <AnyCollider {...props} shape="convexHull" ref={ref} />;
  }
);

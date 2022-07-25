import { Collider } from "@dimforge/rapier3d-compat";
import React, { MutableRefObject, useEffect, useRef } from "react";

import {
  createContext,
  forwardRef,
  ReactNode,
  useContext,
  useImperativeHandle,
} from "react";
import { Object3D, Vector3 } from "three";
import { useRapier, useRigidBody } from "./hooks";
import {
  BallArgs,
  CapsuleArgs,
  ConeArgs,
  ConvexHullArgs,
  CuboidArgs,
  CylinderArgs,
  HeightfieldArgs,
  RigidBodyApi,
  RigidBodyAutoCollider,
  RoundCuboidArgs,
  TrimeshArgs,
  UseColliderOptions,
  UseRigidBodyOptions,
} from "./types";
import {
  createColliderFromOptions,
  createCollidersFromChildren,
} from "./utils";

const RigidBodyContext = createContext<{
  ref: MutableRefObject<Object3D>;
  api: RigidBodyApi;
  hasCollisionEvents: boolean;
  options: UseRigidBodyOptions;
}>(undefined!);

const useRigidBodyContext = () => useContext(RigidBodyContext);

// RigidBody
interface RigidBodyProps extends UseRigidBodyOptions {
  children?: ReactNode;
}

export const RigidBody = forwardRef<RigidBodyApi, RigidBodyProps>(
  ({ children, ...props }, ref) => {
    const [object, api] = useRigidBody<Object3D>(props);

    useImperativeHandle(ref, () => api);

    return (
      <RigidBodyContext.Provider
        value={{
          ref: object,
          api,
          hasCollisionEvents: !!(
            props.onCollisionEnter || props.onCollisionExit
          ),
          options: props,
        }}
      >
        <object3D ref={object}>{children}</object3D>
      </RigidBodyContext.Provider>
    );
  }
);

interface MeshColliderProps {
  children: ReactNode;
  type: RigidBodyAutoCollider;
}

export const MeshCollider = ({ children, type }: MeshColliderProps) => {
  const { physicsOptions, world } = useRapier();
  const object = useRef<Object3D>(null);
  const { api, options } = useRigidBodyContext();

  useEffect(() => {
    let autoColliders: Collider[] = [];

    if (object.current) {
      const colliderSetting = type ?? physicsOptions.colliders ?? false;
      autoColliders =
        colliderSetting !== false
          ? createCollidersFromChildren(
              object.current,
              api,
              {
                ...options,
                colliders: colliderSetting,
              },
              world,
              false
            )
          : [];
    }

    return () => {
      autoColliders.forEach((collider) => {
        world.removeCollider(collider);
      });
    };
  }, []);

  return (
    <object3D
      ref={object}
      userData={{
        r3RapierType: "MeshCollider",
      }}
    >
      {children}
    </object3D>
  );
};

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

    const collider = createColliderFromOptions({
      options: props,
      world,
      rigidBody: rigidBodyContext?.api?.raw(),
      scale,
      hasCollisionEvents: rigidBodyContext?.hasCollisionEvents,
    });

    return () => {
      world.removeCollider(collider);
    };
  }, []);

  return <object3D ref={ref}>{children}</object3D>;
};

type UseColliderOptionsRequiredArgs<T> = Omit<UseColliderOptions<T>, "args"> & {
  args: T;
  children?: ReactNode;
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

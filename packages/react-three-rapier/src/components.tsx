import React from "react";

import {
  Collider,
  RigidBody as RapierRigidBody,
} from "@dimforge/rapier3d-compat";
import {
  createContext,
  forwardRef,
  ReactNode,
  useContext,
  useImperativeHandle,
} from "react";
import { Group } from "three";
import { useCollider, useRigidBody } from "./hooks";
import {
  BallArgs,
  CapsuleArgs,
  ConeArgs,
  ConvexHullArgs,
  CuboidArgs,
  CylinderArgs,
  HeightfieldArgs,
  PolylineArgs,
  RoundConeArgs,
  RoundConvexHullArgs,
  RoundCuboidArgs,
  RoundCylinderArgs,
  TrimeshArgs,
  UseColliderOptions,
  UseRigidBodyOptions,
} from "./types";

const RigidBodyContext = createContext<RapierRigidBody>(null!);

const useParentRigidBody = () => useContext(RigidBodyContext);

// RigidBody
interface RigidBodyProps extends UseRigidBodyOptions {
  children?: ReactNode;
}

export const RigidBody = forwardRef<RapierRigidBody, RigidBodyProps>(
  ({ children, ...props }, ref) => {
    const [group, rigidBody] = useRigidBody<Group>(props);

    useImperativeHandle(ref, () => rigidBody);

    return (
      <RigidBodyContext.Provider value={rigidBody}>
        <group ref={group}>{children}</group>
      </RigidBodyContext.Provider>
    );
  }
);

// Colliders
type ColliderProps<A> = Omit<UseColliderOptions<A>, "shape">;

export const CuboidCollider = forwardRef<Collider, ColliderProps<CuboidArgs>>(
  (props, ref) => {
    const rigidBody = useParentRigidBody();
    const [collider] = useCollider(rigidBody, {
      shape: "cuboid",
      ...props,
    });

    useImperativeHandle(ref, () => collider);

    return null;
  }
);

export const RoundCuboidCollider = forwardRef<
  Collider,
  ColliderProps<RoundCuboidArgs>
>((props, ref) => {
  const rigidBody = useParentRigidBody();
  const [collider] = useCollider(rigidBody, {
    shape: "roundCuboid",
    ...props,
  });

  useImperativeHandle(ref, () => collider);

  return null;
});

export const BallCollider = forwardRef<Collider, ColliderProps<BallArgs>>(
  (props, ref) => {
    const rigidBody = useParentRigidBody();
    const [collider] = useCollider(rigidBody, {
      shape: "ball",
      ...props,
    });

    useImperativeHandle(ref, () => collider);

    return null;
  }
);

export const CapsuleCollider = forwardRef<Collider, ColliderProps<CapsuleArgs>>(
  (props, ref) => {
    const rigidBody = useParentRigidBody();
    const [collider] = useCollider(rigidBody, {
      shape: "capsule",
      ...props,
    });

    useImperativeHandle(ref, () => collider);

    return null;
  }
);

export const HeightfieldCollider = forwardRef<
  Collider,
  ColliderProps<HeightfieldArgs>
>((props, ref) => {
  const rigidBody = useParentRigidBody();
  const [collider] = useCollider(rigidBody, {
    shape: "heightfield",
    ...props,
  });

  useImperativeHandle(ref, () => collider);

  return null;
});

export const TrimeshCollider = forwardRef<Collider, ColliderProps<TrimeshArgs>>(
  (props, ref) => {
    const rigidBody = useParentRigidBody();
    const [collider] = useCollider(rigidBody, {
      shape: "trimesh",
      ...props,
    });

    useImperativeHandle(ref, () => collider);

    return null;
  }
);

export const PolylineCollider = forwardRef<
  Collider,
  ColliderProps<PolylineArgs>
>((props, ref) => {
  const rigidBody = useParentRigidBody();
  const [collider] = useCollider(rigidBody, {
    shape: "polyline",
    ...props,
  });

  useImperativeHandle(ref, () => collider);

  return null;
});

export const CylinderCollider = forwardRef<
  Collider,
  ColliderProps<CylinderArgs>
>((props, ref) => {
  const rigidBody = useParentRigidBody();
  const [collider] = useCollider(rigidBody, {
    shape: "cylinder",
    ...props,
  });

  useImperativeHandle(ref, () => collider);

  return null;
});

export const RoundCylinderCollider = forwardRef<
  Collider,
  ColliderProps<RoundCylinderArgs>
>((props, ref) => {
  const rigidBody = useParentRigidBody();
  const [collider] = useCollider(rigidBody, {
    shape: "roundCylinder",
    ...props,
  });

  useImperativeHandle(ref, () => collider);

  return null;
});

export const ConeCollider = forwardRef<Collider, ColliderProps<ConeArgs>>(
  (props, ref) => {
    const rigidBody = useParentRigidBody();
    const [collider] = useCollider(rigidBody, {
      shape: "cone",
      ...props,
    });

    useImperativeHandle(ref, () => collider);

    return null;
  }
);

export const RoundConeCollider = forwardRef<
  Collider,
  ColliderProps<RoundConeArgs>
>((props, ref) => {
  const rigidBody = useParentRigidBody();
  const [collider] = useCollider(rigidBody, {
    shape: "roundCone",
    ...props,
  });

  useImperativeHandle(ref, () => collider);

  return null;
});

export const ConvexHullCollider = forwardRef<
  Collider,
  ColliderProps<ConvexHullArgs>
>((props, ref) => {
  const rigidBody = useParentRigidBody();
  const [collider] = useCollider(rigidBody, {
    shape: "convexHull",
    ...props,
  });

  useImperativeHandle(ref, () => collider);

  return null;
});

export const RoundConvexHullCollider = forwardRef<
  Collider,
  ColliderProps<RoundConvexHullArgs>
>((props, ref) => {
  const rigidBody = useParentRigidBody();
  const [collider] = useCollider(rigidBody, {
    shape: "roundConvexHull",
    ...props,
  });

  useImperativeHandle(ref, () => collider);

  return null;
});

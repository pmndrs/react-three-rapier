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
type ColliderProps<A> = Omit<UseColliderOptions<A>, "shape">;

export const CuboidCollider = (props: UseColliderOptions<CuboidArgs>) => {
  const { world } = useRapier();
  const [ref, rigidBody] = useParentRigidBody();

  useEffect(() => {
    const [x, y, z] = props.args || [0.5, 0.5, 0.5];
    const scale = ref.current.getWorldScale(new Vector3());

    const collider = createColliderFromOptions(
      {
        shape: "cuboid",
        ...props,
        args: [scale.x * x, scale.y * y, scale.z * z],
      },
      world,
      rigidBody
    );

    return () => {
      world.removeCollider(collider, false);
    };
  }, []);

  return null;
};

export const RoundCuboidCollider = (
  props: UseColliderOptions<RoundCuboidArgs>
) => {
  const { world } = useRapier();
  const [ref, rigidBody] = useParentRigidBody();

  useEffect(() => {
    const [x, y, z, r] = props.args || [0.5, 0.5, 0.5, 0.1];
    const scale = ref.current.getWorldScale(new Vector3());

    const collider = createColliderFromOptions(
      {
        shape: "roundCuboid",
        ...props,
        args: [scale.x * x, scale.y * y, scale.z * z, scale.x * r],
      },
      world,
      rigidBody
    );

    return () => {
      world.removeCollider(collider, false);
    };
  });

  return null;
};

export const BallCollider = (props: UseColliderOptions<BallArgs>) => {
  const { world } = useRapier();
  const [ref, rigidBody] = useParentRigidBody();

  useEffect(() => {
    const [radius] = props.args || [0.5];
    const scale = ref.current.getWorldScale(new Vector3());

    const collider = createColliderFromOptions(
      {
        shape: "ball",
        ...props,
        args: [scale.x * radius],
      },
      world,
      rigidBody
    );

    return () => {
      world.removeCollider(collider, false);
    };
  }, []);

  return null;
};

export const CapsuleCollider = (props: UseColliderOptions<CapsuleArgs>) => {
  const { world } = useRapier();
  const [ref, rigidBody] = useParentRigidBody();

  useEffect(() => {
    const [radius, height] = props.args || [0.5, 1];
    const scale = ref.current.getWorldScale(new Vector3());

    const collider = createColliderFromOptions(
      {
        shape: "capsule",
        ...props,
        args: [scale.x * radius, scale.y * height],
      },
      world,
      rigidBody
    );

    return () => {
      world.removeCollider(collider, false);
    };
  }, []);

  return null;
};

export const HeightfieldCollider = (
  props: UseColliderOptions<HeightfieldArgs>
) => {
  const { world } = useRapier();
  const [ref, rigidBody] = useParentRigidBody();

  useEffect(() => {
    const [width, height, heights, fieldScale] = props.args || [1, 1, [1], 1];
    const scale = ref.current.getWorldScale(new Vector3());

    const collider = createColliderFromOptions(
      {
        shape: "heightfield",
        ...props,
        args: [
          width,
          height,
          heights.map((h) => h * scale.x),
          fieldScale * scale.x,
        ],
      },
      world,
      rigidBody
    );

    return () => {
      world.removeCollider(collider, false);
    };
  }, []);

  return null;
};

export const TrimeshCollider = (props: UseColliderOptions<TrimeshArgs>) => {
  const { world } = useRapier();
  const [ref, rigidBody] = useParentRigidBody();

  useEffect(() => {
    const [vertices, indices] = props.args || [[], []];
    const scale = ref.current.getWorldScale(new Vector3());

    const scaledVertices = scaleVertices(vertices, scale);

    const collider = createColliderFromOptions(
      {
        shape: "trimesh",
        ...props,
        args: [scaledVertices, indices],
      },
      world,
      rigidBody
    );

    return () => {
      world.removeCollider(collider, false);
    };
  }, []);

  return null;
};

export const ConeCollider = (props: UseColliderOptions<ConeArgs>) => {
  const { world } = useRapier();
  const [ref, rigidBody] = useParentRigidBody();

  useEffect(() => {
    const [radius, height] = props.args || [0.5, 1];
    const scale = ref.current.getWorldScale(new Vector3());

    const collider = createColliderFromOptions(
      {
        shape: "cone",
        ...props,
        args: [scale.x * radius, scale.y * height],
      },
      world,
      rigidBody
    );

    return () => {
      world.removeCollider(collider, false);
    };
  }, []);

  return null;
};

export const CylinderCollider = (props: UseColliderOptions<CylinderArgs>) => {
  const { world } = useRapier();
  const [ref, rigidBody] = useParentRigidBody();

  useEffect(() => {
    const [radius, height] = props.args || [0.5, 1];
    const scale = ref.current.getWorldScale(new Vector3());

    const collider = createColliderFromOptions(
      {
        shape: "cylinder",
        ...props,
        args: [scale.x * radius, scale.y * height],
      },
      world,
      rigidBody
    );

    return () => {
      world.removeCollider(collider, false);
    };
  }, []);

  return null;
};

export const ConvexHullCollider = (
  props: UseColliderOptions<ConvexHullArgs>
) => {
  const { world } = useRapier();
  const [ref, rigidBody] = useParentRigidBody();

  useEffect(() => {
    const [vertices] = props.args || [[]];
    const scale = ref.current.getWorldScale(new Vector3());

    const collider = createColliderFromOptions(
      {
        shape: "convexHull",
        ...props,
        args: [scaleVertices(vertices, scale)],
      },
      world,
      rigidBody
    );

    return () => {
      world.removeCollider(collider, false);
    };
  }, []);

  return null;
};

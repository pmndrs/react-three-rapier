import {
  RefObject,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
} from "react";
import { RapierContext } from "./RapierWorld";
import { useRef } from "react";
import { Mesh, Object3D, Quaternion } from "three";

import type Rapier from "@dimforge/rapier3d-compat";

export const useRapier = () => {
  return useContext(RapierContext) as RapierContext;
};

// Private hook for updating the simulations on objects
const useRapierStep = (callback: () => void) => {
  const { stepFuncs } = useRapier();

  useEffect(() => {
    stepFuncs.push(callback);

    return () => {
      const index = stepFuncs.indexOf(callback);
      stepFuncs.splice(index, 1);
    };
  }, [callback]);
};

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
  UseBodyOptions,
  UseRigidBodyAPI,
  UseRigidBodyOptions,
  UseImpulseJoint,
  SphericalJointParams,
  FixedJointParams,
  PrismaticJointParams,
  RevoluteJointParams,
  UseColliderOptions,
} from "./types";

import {
  Collider,
  FixedImpulseJoint,
  ImpulseJoint,
  PrismaticImpulseJoint,
  RevoluteImpulseJoint,
  RigidBody,
  RoundCone,
  SphericalImpulseJoint,
} from "@dimforge/rapier3d-compat";

import { rigidBodyTypeFromString, vectorArrayToObject } from "./utils";

export const useCollider = <A>(
  body: RigidBody,
  options?: UseColliderOptions<A>
) => {
  const { RAPIER, world } = useRapier();
  const collider = useMemo(() => {
    const mass = options?.mass || 1;
    const colliderShape = options?.shape ?? "cuboid";
    const colliderArgs = options?.args ?? [];
    const [cmx, cmy, cmz] = options?.centerOfMass || [0, 0, 0];
    const [pix, piy, piz] = options?.principalAngularInertia || [
      mass * 0.2,
      mass * 0.2,
      mass * 0.2,
    ];
    const [x, y, z] = options?.position || [0, 0, 0];

    let colliderDesc = (
      RAPIER.ColliderDesc[colliderShape](
        // @ts-ignore
        ...colliderArgs
      ) as Rapier.ColliderDesc
    )
      .setTranslation(x, y, z)
      .setRestitution(options?.restitution ?? 0)
      .setRestitutionCombineRule(
        options?.restitutionCombineRule ?? RAPIER.CoefficientCombineRule.Average
      )
      .setFriction(options?.friction ?? 0.7)
      .setFrictionCombineRule(
        options?.frictionCombineRule ?? RAPIER.CoefficientCombineRule.Average
      );

    // If any of the mass properties are specified, add mass properties
    if (
      options?.mass ||
      options?.centerOfMass ||
      options?.principalAngularInertia
    ) {
      colliderDesc.setDensity(0);
      colliderDesc.setMassProperties(
        mass,
        { x: cmx, y: cmy, z: cmz },
        { x: pix, y: piy, z: piz },
        { x: 0, y: 0, z: 0, w: 1 }
      );
    }

    const collider = world.createCollider(colliderDesc, body.handle);

    return collider;
  }, []);

  useEffect(() => {
    return () => {
      world.removeCollider(collider, false);
    };
  }, []);

  return [collider];
};

export const useRigidBody = <O extends Object3D>(
  options?: UseRigidBodyOptions
): [RefObject<O>, RigidBody] => {
  const { RAPIER, world } = useRapier();
  const ref = useRef<O>(null);

  const rigidBody = useMemo(() => {
    const [rx, ry, rz] = options?.rotation || [0, 0, 0];
    const [x, y, z] = options?.position || [0, 0, 0];
    const [lvx, lvy, lvz] = options?.linearVelocity ?? [0, 0, 0];
    const [avx, avy, avz] = options?.angularVelocity ?? [0, 0, 0];
    const gravityScale = options?.gravityScale ?? 1;
    const canSleep = options?.canSleep ?? true;
    const ccdEnabled = options?.ccd ?? false;
    const type = rigidBodyTypeFromString(options?.type || "dynamic");

    const rigidBodyDesc = new RAPIER.RigidBodyDesc(type)
      .setTranslation(x, y, z)
      .setRotation({ x: rx, y: ry, z: rz, w: 1 })
      .setLinvel(lvx, lvy, lvz)
      .setAngvel({ x: avx, y: avy, z: avz })
      .setGravityScale(gravityScale)
      .setCanSleep(canSleep)
      .setCcdEnabled(ccdEnabled);

    const body = world.createRigidBody(rigidBodyDesc);

    return body;
  }, []);

  useRapierStep(() => {
    if (rigidBody && ref.current) {
      const { x, y, z } = rigidBody.translation();
      const { x: rx, y: ry, z: rz, w: rw } = rigidBody.rotation();
      ref.current.position.set(x, y, z);
      ref.current.rotation.setFromQuaternion(new Quaternion(rx, ry, rz, rw));
    }
  });

  useEffect(() => {
    return () => world.removeRigidBody(rigidBody);
  }, []);

  return [ref, rigidBody];
};

export const useRigidBodyWithCollider = <A, O extends Object3D = Object3D>(
  rigidBodyOptions?: UseRigidBodyOptions,
  colliderOptions?: UseColliderOptions<A>
): [ref: RefObject<Object3D>, rigidBody: RigidBody, collider: Collider] => {
  const [ref, rigidBody] = useRigidBody<O>(rigidBodyOptions);
  const [collider] = useCollider<A>(rigidBody, colliderOptions);

  return [ref, rigidBody, collider];
};

export const useCuboid = (
  rigidBodyOptions: UseBodyOptions = {},
  colliderOptions: UseColliderOptions<CuboidArgs> = {}
) => {
  return useRigidBodyWithCollider<CuboidArgs>(rigidBodyOptions, {
    shape: "cuboid",
    args: colliderOptions.args ?? [0.5, 0.5, 0.5],
    ...colliderOptions,
  });
};

export const useBall = (
  rigidBodyOptions: UseBodyOptions = {},
  colliderOptions: UseColliderOptions<BallArgs> = {}
) => {
  return useRigidBodyWithCollider<BallArgs>(rigidBodyOptions, {
    shape: "ball",
    args: colliderOptions.args ?? [0.5],
    ...colliderOptions,
  });
};

export const useCapsule = (
  rigidBodyOptions: UseBodyOptions = {},
  colliderOptions: UseColliderOptions<CapsuleArgs> = {}
) => {
  return useRigidBodyWithCollider<CapsuleArgs>(rigidBodyOptions, {
    shape: "capsule",
    args: colliderOptions.args ?? [0.5, 0.5],
    ...colliderOptions,
  });
};

export const useHeightfield = (
  rigidBodyOptions: UseBodyOptions = {},
  colliderOptions: UseColliderOptions<HeightfieldArgs> = {}
) => {
  return useRigidBodyWithCollider<HeightfieldArgs>(rigidBodyOptions, {
    shape: "heightfield",
    ...colliderOptions,
  });
};

/**
 * Create a trimesh collider and rigid body.
 * Note that Trimeshes don't have mass unless provided.
 * See https://rapier.rs/docs/user_guides/javascript/rigid_bodies#mass-properties
 * for available properties.
 */
export const useTrimesh = (
  rigidBodyOptions: UseBodyOptions = {},
  colliderOptions: UseColliderOptions<TrimeshArgs> = {}
) => {
  return useRigidBodyWithCollider<TrimeshArgs>(rigidBodyOptions, {
    shape: "trimesh",
    ...colliderOptions,
  });
};

useTrimesh.fromMesh = (
  mesh: Mesh,
  rigidBodyOptions: UseBodyOptions = {},
  colliderOptions: UseColliderOptions<TrimeshArgs> = {}
) => {
  return useTrimesh(rigidBodyOptions, {
    args: [
      mesh.geometry.attributes.position.array,
      mesh.geometry?.index?.array || [],
    ],
    ...colliderOptions,
  });
};

export const usePolyline = (
  rigidBodyOptions: UseBodyOptions = {},
  colliderOptions: UseColliderOptions<PolylineArgs> = {}
) => {
  return useRigidBodyWithCollider<PolylineArgs>(rigidBodyOptions, {
    shape: "polyline",
    ...colliderOptions,
  });
};

export const useRoundCuboid = (
  rigidBodyOptions: UseBodyOptions = {},
  colliderOptions: UseColliderOptions<RoundCuboidArgs> = {}
) => {
  return useRigidBodyWithCollider<RoundCuboidArgs>(rigidBodyOptions, {
    shape: "roundCuboid",
    ...colliderOptions,
  });
};

export const useCylinder = (
  rigidBodyOptions: UseBodyOptions = {},
  colliderOptions: UseColliderOptions<CylinderArgs> = {}
) => {
  return useRigidBodyWithCollider<CylinderArgs>(rigidBodyOptions, {
    shape: "cylinder",
    ...colliderOptions,
  });
};

export const useRoundCylinder = (
  rigidBodyOptions: UseBodyOptions = {},
  colliderOptions: UseColliderOptions<RoundCylinderArgs> = {}
) => {
  return useRigidBodyWithCollider<RoundCylinderArgs>(rigidBodyOptions, {
    shape: "roundCylinder",
    ...colliderOptions,
  });
};

export const useCone = (
  rigidBodyOptions: UseBodyOptions = {},
  colliderOptions: UseColliderOptions<ConeArgs> = {}
) => {
  return useRigidBodyWithCollider<ConeArgs>(rigidBodyOptions, {
    shape: "cone",
    ...colliderOptions,
  });
};

export const useRoundCone = (
  rigidBodyOptions: UseBodyOptions = {},
  colliderOptions: UseColliderOptions<RoundCone> = {}
) => {
  return useRigidBodyWithCollider<RoundCone>(rigidBodyOptions, {
    shape: "roundCone",
    ...colliderOptions,
  });
};

export const useConvexHull = (
  rigidBodyOptions: UseBodyOptions = {},
  colliderOptions: UseColliderOptions<ConvexHullArgs> = {}
) => {
  return useRigidBodyWithCollider<ConvexHullArgs>(rigidBodyOptions, {
    shape: "convexHull",
    ...colliderOptions,
  });
};

useConvexHull.fromMesh = (
  mesh: Mesh,
  rigidBodyOptions: UseBodyOptions = {},
  colliderOptions: Omit<UseColliderOptions<ConvexHullArgs>, "colliderArgs"> = {}
) => {
  return useConvexHull(rigidBodyOptions, {
    args: [mesh?.geometry?.attributes?.position?.array || []],
    ...colliderOptions,
  });
};

export const useRoundConvexHull = (
  rigidBodyOptions: UseBodyOptions = {},
  colliderOptions: UseColliderOptions<RoundConvexHullArgs> = {}
) => {
  return useRigidBodyWithCollider<RoundConvexHullArgs>(rigidBodyOptions, {
    shape: "roundConvexHull",
    ...colliderOptions,
  });
};

// ConvexMesh crashes Rapier for some reason
// export const useConvexMesh = (options: UseBodyOptions<ConvexMeshArgs> = {}) => {
//   return useRigidBody<ConvexMeshArgs>({
//     shape: "convexMesh",
//     ...options,
//   });
// };
// useConvexMesh.fromMesh = (
//   mesh: Mesh,
//   options?: Omit<UseBodyOptions<ConvexMeshArgs>, "colliderArgs">
// ) => {
//   return useConvexMesh({
//     colliderArgs: [
//       mesh.geometry.attributes.position.array,
//       mesh.geometry?.index?.array || [],
//     ],
//     ...options,
//   });
// };

// export const useRoundConvexMesh = (
//   options: UseBodyOptions<RoundConvexMeshArgs> = {}
// ) => {
//   return useRigidBody<RoundConvexMeshArgs>({
//     shape: "roundConvexMesh",
//     ...options,
//   });
// };

// Joints

// JOINTS is currently unfinished
interface UseImpulseJointState<T> {
  joint?: T;
}

// TODO: how can we return this after the layout effect? Do we need to use `current`?
export const useImpulseJoint = <T extends ImpulseJoint>(
  body1: RefObject<RigidBody>,
  body2: RefObject<RigidBody>,
  params: Rapier.JointData
) => {
  const { world, RAPIER } = useRapier();

  useLayoutEffect(() => {
    let joint: T;

    if (body1 && body2 && params) {
      joint = world.createImpulseJoint(
        params,
        body1.current!,
        body2.current!
      ) as T;
    }

    return () => {
      if (joint) world.removeImpulseJoint(joint, true);
    };
  }, [body1, body2]);
};

/**
 *
 * A fixed joint ensures that two rigid-bodies don't move relative to each other.
 * Fixed joints are characterized by one local frame (represented by an isometry) on each rigid-body.
 * The fixed-joint makes these frames coincide in world-space.
 */
export const useFixedJoint: UseImpulseJoint<FixedJointParams> = (
  body1,
  body2,
  [body1Anchor, body1LocalFrame, body2Anchor, body2LocalFrame]
) => {
  const { RAPIER } = useRapier();

  return useImpulseJoint<FixedImpulseJoint>(
    body1,
    body2,
    RAPIER.JointData.fixed(
      vectorArrayToObject(body1Anchor),
      { ...vectorArrayToObject(body1LocalFrame), w: 1 },
      vectorArrayToObject(body2Anchor),
      { ...vectorArrayToObject(body2LocalFrame), w: 1 }
    )
  );
};

/**
 * The spherical joint ensures that two points on the local-spaces of two rigid-bodies always coincide (it prevents any relative
 * translational motion at this points). This is typically used to simulate ragdolls arms, pendulums, etc.
 * They are characterized by one local anchor on each rigid-body. Each anchor represents the location of the
 * points that need to coincide on the local-space of each rigid-body.
 */
export const useSphericalJoint: UseImpulseJoint<SphericalJointParams> = (
  body1,
  body2,
  [body1Anchor, body2Anchor]
) => {
  const { RAPIER } = useRapier();

  return useImpulseJoint<SphericalImpulseJoint>(
    body1,
    body2,
    RAPIER.JointData.spherical(
      vectorArrayToObject(body1Anchor),
      vectorArrayToObject(body2Anchor)
    )
  );
};

/**
 * The revolute joint prevents any relative movement between two rigid-bodies, except for relative
 * rotations along one axis. This is typically used to simulate wheels, fans, etc.
 * They are characterized by one local anchor as well as one local axis on each rigid-body.
 */
export const useRevoluteJoint: UseImpulseJoint<RevoluteJointParams> = (
  body1,
  body2,
  [body1Anchor, body2Anchor, axis]
) => {
  const { RAPIER } = useRapier();

  return useImpulseJoint<RevoluteImpulseJoint>(
    body1,
    body2,
    RAPIER.JointData.revolute(
      vectorArrayToObject(body1Anchor),
      vectorArrayToObject(body2Anchor),
      vectorArrayToObject(axis)
    )
  );
};

/**
 * The prismatic joint prevents any relative movement between two rigid-bodies, except for relative translations along one axis.
 * It is characterized by one local anchor as well as one local axis on each rigid-body. In 3D, an optional
 * local tangent axis can be specified for each rigid-body.
 */
export const usePrismaticJoint: UseImpulseJoint<PrismaticJointParams> = (
  body1,
  body2,
  [body1Anchor, body2Anchor, axis]
) => {
  const { RAPIER } = useRapier();

  return useImpulseJoint<PrismaticImpulseJoint>(
    body1,
    body2,
    RAPIER.JointData.prismatic(
      vectorArrayToObject(body1Anchor),
      vectorArrayToObject(body2Anchor),
      vectorArrayToObject(axis)
    )
  );
};

import React, { 
  MutableRefObject, 
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo, } from "react";
import { RapierContext } from "./Physics";
import { useRef } from "react";
import { Euler, Matrix4, Mesh, Object3D, Quaternion, Vector3 } from "three/src/three";

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
  UseRigidBodyOptions,
  UseImpulseJoint,
  SphericalJointParams,
  FixedJointParams,
  PrismaticJointParams,
  RevoluteJointParams,
  UseColliderOptions,
  RapierRigidBody,
} from "./types";

import {
  Collider,
  FixedImpulseJoint,
  ImpulseJoint,
  PrismaticImpulseJoint,
  RevoluteImpulseJoint,
  RoundCone,
  SphericalImpulseJoint,
} from "@dimforge/rapier3d-compat";

import { createColliderFromOptions, createCollidersFromChildren, rigidBodyTypeFromString, vectorArrayToObject } from "./utils";

export const useCollider = <A>(
  body: RapierRigidBody,
  options: UseColliderOptions<A> = {}
) => {
  const { RAPIER, world } = useRapier();
  const collider = useMemo(() => {
    return createColliderFromOptions<A>(options, world, body)
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
): [MutableRefObject<O>, RapierRigidBody] => {
  const { RAPIER, world } = useRapier();
  const ref = useRef<O>();

  // Create rigidbody
  const rigidBody = useMemo(() => {
    const [lvx, lvy, lvz] = options?.linearVelocity ?? [0, 0, 0];
    const [avx, avy, avz] = options?.angularVelocity ?? [0, 0, 0];
    const gravityScale = options?.gravityScale ?? 1;
    const canSleep = options?.canSleep ?? true;
    const ccdEnabled = options?.ccd ?? false;
    const type = rigidBodyTypeFromString(options?.type || "dynamic");

    const [x, y, z] = options?.position || [0, 0, 0];
    const [rx, ry, rz] = options?.rotation || [0, 0, 0];

    const rigidBodyDesc = new RAPIER.RigidBodyDesc(type)
      .setLinvel(lvx, lvy, lvz)
      .setAngvel({ x: avx, y: avy, z: avz })
      .setGravityScale(gravityScale)
      .setCanSleep(canSleep)
      .setCcdEnabled(ccdEnabled)
      .setTranslation(0,0,0)

    const body = world.createRigidBody(rigidBodyDesc);

    return body;
  }, []);

  // Setup
  useEffect(() => {
    if (!ref.current) {
      ref.current = new Object3D() as O
    }

    // Get intitial world transforms
    const worldPosition = ref.current.getWorldPosition(new Vector3())
    const worldRotation = ref.current.getWorldQuaternion(new Quaternion())
    const scale = ref.current.parent?.getWorldScale(new Vector3()) || { x: 1, y: 1, z: 1 };

    // Transforms from options
    const [x, y, z] = options?.position || [0, 0, 0];
    const [rx, ry, rz] = options?.rotation || [0, 0, 0];

    console.log(y * scale.y)

    // Set initial transforms based on world transforms
    rigidBody.setTranslation({
      x: worldPosition.x + x * scale.x, 
      y: worldPosition.y + y * scale.y, 
      z: worldPosition.z + z * scale.z
    }, false)

    const eulerAngles = new Euler(rx, ry, rz, 'XYZ')
    const rotation = new Quaternion().setFromEuler(eulerAngles)
      .multiply(worldRotation)
    
    rigidBody.setRotation({x: rotation.x, y: rotation.y, z: rotation.z, w: rotation.w}, false)

    rigidBody.resetForces(false)
    rigidBody.resetTorques(false)

    const colliderSetting = options?.colliders ?? false;
    const autoColliders = colliderSetting !== false ? createCollidersFromChildren(ref.current, rigidBody, colliderSetting, world) : []
    
    return () => {
      world.removeRigidBody(rigidBody)
      autoColliders.forEach(collider => world.removeCollider(collider, false))
    }
  }, [])

  useRapierStep(() => {
    if (rigidBody && ref.current) {
      const { x, y, z } = rigidBody.translation();
      const { x: rx, y: ry, z: rz, w: rw } = rigidBody.rotation();
      const scale = ref.current.getWorldScale(new Vector3())

      if (ref.current.parent) {
        // haha matrixes I have no idea what I'm doing :)
        const o = new Object3D()
        o.position.set(x, y, z)
        o.rotation.setFromQuaternion(new Quaternion(rx, ry, rz, rw))
        o.scale.set(scale.x, scale.y, scale.z)
        o.updateMatrix()

        o.applyMatrix4(ref.current.parent.matrixWorld.clone().invert())
        o.updateMatrix()

        ref.current.position.setFromMatrixPosition(o.matrix)
        ref.current.rotation.setFromRotationMatrix(o.matrix)
      }
    }
  });

  return [ref as MutableRefObject<O>, rigidBody];
};

export const useRigidBodyWithCollider = <A, O extends Object3D = Object3D>(
  rigidBodyOptions?: UseRigidBodyOptions,
  colliderOptions?: UseColliderOptions<A>
): [ref: MutableRefObject<O>, rigidBody: RapierRigidBody] => {
  const {world} = useRapier()
  const [ref, rigidBody] = useRigidBody<O>(rigidBodyOptions);
  
  useEffect(() => {
    if (!colliderOptions) {
      return 
    }

    const scale = ref.current.getWorldScale(new Vector3());
    const collider = createColliderFromOptions(colliderOptions, world, rigidBody, scale);

    return () => {
      world.removeCollider(collider, false);
    };
  }, []);

  return [ref, rigidBody];
};

export const useCuboid = <T extends Object3D>(
  rigidBodyOptions: UseBodyOptions = {},
  colliderOptions: UseColliderOptions<CuboidArgs> = {}
) => {
  return useRigidBodyWithCollider<CuboidArgs, T>(rigidBodyOptions, {
    shape: "cuboid",
    args: colliderOptions.args ?? [0.5, 0.5, 0.5],
    ...colliderOptions,
  });
};

export const useBall = <T extends Object3D>(
  rigidBodyOptions: UseBodyOptions = {},
  colliderOptions: UseColliderOptions<BallArgs> = {}
) => {
  return useRigidBodyWithCollider<BallArgs, T>(rigidBodyOptions, {
    shape: "ball",
    args: colliderOptions.args ?? [0.5],
    ...colliderOptions,
  });
};

export const useCapsule = <T extends Object3D>(
  rigidBodyOptions: UseBodyOptions = {},
  colliderOptions: UseColliderOptions<CapsuleArgs> = {}
) => {
  return useRigidBodyWithCollider<CapsuleArgs, T>(rigidBodyOptions, {
    shape: "capsule",
    args: colliderOptions.args ?? [0.5, 0.5],
    ...colliderOptions,
  });
};

export const useHeightfield = <T extends Object3D>(
  rigidBodyOptions: UseBodyOptions = {},
  colliderOptions: UseColliderOptions<HeightfieldArgs> = {}
) => {
  return useRigidBodyWithCollider<HeightfieldArgs, T>(rigidBodyOptions, {
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
export const useTrimesh = <T extends Object3D>(
  rigidBodyOptions: UseBodyOptions = {},
  colliderOptions: UseColliderOptions<TrimeshArgs> = {}
) => {
  return useRigidBodyWithCollider<TrimeshArgs, T>(rigidBodyOptions, {
    shape: "trimesh",
    ...colliderOptions,
  });
};

useTrimesh.fromMesh = <T extends Object3D>(
  mesh: Mesh,
  rigidBodyOptions: UseBodyOptions = {},
  colliderOptions: UseColliderOptions<TrimeshArgs> = {}
) => {
  return useTrimesh<T>(rigidBodyOptions, {
    args: [
      mesh.geometry.attributes.position.array,
      mesh.geometry?.index?.array || [],
    ],
    ...colliderOptions,
  });
};

export const usePolyline = <T extends Object3D>(
  rigidBodyOptions: UseBodyOptions = {},
  colliderOptions: UseColliderOptions<PolylineArgs> = {}
) => {
  return useRigidBodyWithCollider<PolylineArgs, T>(rigidBodyOptions, {
    shape: "polyline",
    ...colliderOptions,
  });
};

export const useRoundCuboid = <T extends Object3D>(
  rigidBodyOptions: UseBodyOptions = {},
  colliderOptions: UseColliderOptions<RoundCuboidArgs> = {}
) => {
  return useRigidBodyWithCollider<RoundCuboidArgs, T>(rigidBodyOptions, {
    shape: "roundCuboid",
    ...colliderOptions,
  });
};

export const useCylinder = <T extends Object3D>(
  rigidBodyOptions: UseBodyOptions = {},
  colliderOptions: UseColliderOptions<CylinderArgs> = {}
) => {
  return useRigidBodyWithCollider<CylinderArgs, T>(rigidBodyOptions, {
    shape: "cylinder",
    ...colliderOptions,
  });
};

export const useRoundCylinder = <T extends Object3D>(
  rigidBodyOptions: UseBodyOptions = {},
  colliderOptions: UseColliderOptions<RoundCylinderArgs> = {}
) => {
  return useRigidBodyWithCollider<RoundCylinderArgs, T>(rigidBodyOptions, {
    shape: "roundCylinder",
    ...colliderOptions,
  });
};

export const useCone = <T extends Object3D>(
  rigidBodyOptions: UseBodyOptions = {},
  colliderOptions: UseColliderOptions<ConeArgs> = {}
) => {
  return useRigidBodyWithCollider<ConeArgs, T>(rigidBodyOptions, {
    shape: "cone",
    ...colliderOptions,
  });
};

export const useRoundCone = <T extends Object3D>(
  rigidBodyOptions: UseBodyOptions = {},
  colliderOptions: UseColliderOptions<RoundCone> = {}
) => {
  return useRigidBodyWithCollider<RoundCone, T>(rigidBodyOptions, {
    shape: "roundCone",
    ...colliderOptions,
  });
};

export const useConvexHull = <T extends Object3D>(
  rigidBodyOptions: UseBodyOptions = {},
  colliderOptions: UseColliderOptions<ConvexHullArgs> = {}
) => {
  return useRigidBodyWithCollider<ConvexHullArgs, T>(rigidBodyOptions, {
    shape: "convexHull",
    ...colliderOptions,
  });
};

useConvexHull.fromMesh = <T extends Object3D>(
  mesh: Mesh,
  rigidBodyOptions: UseBodyOptions = {},
  colliderOptions: Omit<UseColliderOptions<ConvexHullArgs>, "colliderArgs"> = {}
) => {
  return useConvexHull<T>(rigidBodyOptions, {
    args: [mesh?.geometry?.attributes?.position?.array || []],
    ...colliderOptions,
  });
};

export const useRoundConvexHull = <T extends Object3D>(
  rigidBodyOptions: UseBodyOptions = {},
  colliderOptions: UseColliderOptions<RoundConvexHullArgs> = {}
) => {
  return useRigidBodyWithCollider<RoundConvexHullArgs, T>(rigidBodyOptions, {
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
  body1: MutableRefObject<RapierRigidBody | undefined | null>,
  body2: MutableRefObject<RapierRigidBody | undefined | null>,
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

import React, { 
  MutableRefObject, 
  useContext,
  useEffect,
  useMemo, } from "react";
import { RapierContext } from "./Physics";
import { useRef } from "react";
import { Euler, Matrix4, Mesh, Object3D, Quaternion, Vector3 } from "three";

import type Rapier from "@dimforge/rapier3d-compat";

export const useRapier = () => {
  return useContext(RapierContext) as RapierContext;
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
  ConvexMeshArgs,
  RoundConvexMeshArgs,
  RigidBodyApi,
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

import { createColliderFromOptions, createCollidersFromChildren, rigidBodyTypeFromString, vectorArrayToObject } from "./utils";
import { createColliderApi, createJointApi, createRigidBodyApi } from "./api";

export const useRigidBody = <O extends Object3D>(
  options: UseRigidBodyOptions = {}
): [MutableRefObject<O>, RigidBodyApi] => {
  const { rapier, world, rigidBodyMeshes, physicsOptions, rigidBodyEvents } = useRapier();
  const ref = useRef<O>();

  // Create rigidbody
  const rigidBodyRef = useRef<RigidBody>()
  const getRigidBodyRef = useRef(() => {
    if (!rigidBodyRef.current) {
      const type = rigidBodyTypeFromString(options?.type || "dynamic");
      const [lvx, lvy, lvz] = options?.linearVelocity ?? [0, 0, 0];
      const [avx, avy, avz] = options?.angularVelocity ?? [0, 0, 0];
      const gravityScale = options?.gravityScale ?? 1;
      const canSleep = options?.canSleep ?? true;
      const ccdEnabled = options?.ccd ?? false;

      const desc = new rapier.RigidBodyDesc(type)
        .setLinvel(lvx, lvy, lvz)
        .setAngvel({ x: avx, y: avy, z: avz })
        .setGravityScale(gravityScale)
        .setCanSleep(canSleep)
        .setCcdEnabled(ccdEnabled)

      const rigidBody = world.createRigidBody(desc)
      rigidBodyRef.current = world.getRigidBody(rigidBody.handle)
    }
    return rigidBodyRef.current
  })

  // Setup
  useEffect(() => {
    const rigidBody = getRigidBodyRef.current() as RigidBody
    rigidBodyRef.current = rigidBody

    if (!ref.current) {
      ref.current = new Object3D() as O
    }

    // isSleeping used for onSleep and onWake events
    ref.current.userData.isSleeping = false

    // Get intitial world transforms
    const worldPosition = ref.current.getWorldPosition(new Vector3())
    const worldRotation = ref.current.getWorldQuaternion(new Quaternion())
    const scale = ref.current.parent?.getWorldScale(new Vector3()) || { x: 1, y: 1, z: 1 };

    // Transforms from options
    const [x, y, z] = options?.position || [0, 0, 0];
    const [rx, ry, rz] = options?.rotation || [0, 0, 0];

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

    const colliderSetting = options?.colliders ?? physicsOptions.colliders ?? false;

    const autoColliders = colliderSetting !== false ? createCollidersFromChildren(ref.current, rigidBody, {...options, colliders: colliderSetting}, world) : []

    rigidBodyMeshes.set(rigidBody.handle, ref.current)
    
    return () => {
      world.removeRigidBody(rigidBody)
      autoColliders.forEach(collider => world.removeCollider(collider))
      rigidBodyRef.current = undefined
      rigidBodyMeshes.delete(rigidBody.handle)
    }
  }, [])

  // Events
  useEffect(() => {
    const rigidBody = getRigidBodyRef.current() as RigidBody

    rigidBodyEvents.set(rigidBody.handle, {
      onCollisionEnter: options?.onCollisionEnter,
      onCollisionExit: options?.onCollisionExit,
      onSleep: options?.onSleep,
      onWake: options?.onWake,
    })

    return () => {
      rigidBodyEvents.delete(rigidBody.handle)
    }
  }, [options.onCollisionEnter, options.onCollisionExit])

  const api = useMemo(() => createRigidBodyApi(getRigidBodyRef), [])

  return [ref as MutableRefObject<O>, api];
};

export const useCollider = <A>(
  body: RigidBodyApi,
  options: UseColliderOptions<A> = {}
) => {
  const { world } = useRapier();

  const colliderRef = useRef<Collider>()

  const objectRef = useRef<Object3D>()
  const getColliderRef = useRef(() => {
    if (!colliderRef.current) {
      colliderRef.current = createColliderFromOptions<A>(options, world, world.getRigidBody(body.handle)!)
    }
    return colliderRef.current
  })

  useEffect(() => {
    const collider = getColliderRef.current()    

    return () => {
      if (collider) world.removeCollider(collider);
      colliderRef.current = undefined
    };
  }, []);

  const api = useMemo(() => createColliderApi(getColliderRef), [])

  return [objectRef, api];
};

export const useRigidBodyWithCollider = <A, O extends Object3D = Object3D>(
  rigidBodyOptions?: UseRigidBodyOptions,
  colliderOptions?: UseColliderOptions<A>
): [ref: MutableRefObject<O>, rigidBody: RigidBodyApi] => {
  const { world } = useRapier()
  const [ref, rigidBody] = useRigidBody<O>({...rigidBodyOptions, colliders: false});
  
  useEffect(() => {
    if (!colliderOptions) {
      return 
    }
    
    const scale = ref.current.getWorldScale(new Vector3());
    const collider = createColliderFromOptions(colliderOptions, world, world.getRigidBody(rigidBody.handle)!, scale);

    return () => {
      world.removeCollider(collider);
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

export const useConvexMesh =  <T extends Object3D>(  
  rigidBodyOptions: UseBodyOptions = {},
  colliderOptions: UseColliderOptions<ConvexMeshArgs> = {}
  ) => {
  return useRigidBodyWithCollider<ConvexMeshArgs>(rigidBodyOptions, {
    shape: "convexMesh",
    ...colliderOptions,
  });
};

useConvexMesh.fromMesh = <T extends Object3D>(
  mesh: Mesh,
  rigidBodyOptions: UseBodyOptions = {},
  colliderOptions: Omit<UseColliderOptions<ConvexMeshArgs>, "colliderArgs"> = {}
) => {
  return useConvexMesh<T>(rigidBodyOptions, {
    args: [
      mesh?.geometry?.attributes?.position?.array, 
      mesh.geometry?.index?.array || []
    ],
    ...colliderOptions,
  });
};

export const useRoundConvexMesh =  <T extends Object3D>(  
  rigidBodyOptions: UseBodyOptions = {},
  colliderOptions: UseColliderOptions<RoundConvexMeshArgs> = {}
  ) => {
  return useRigidBodyWithCollider<RoundConvexMeshArgs>(rigidBodyOptions, {
    shape: "convexMesh",
    ...colliderOptions,
  });
};

// Joints
interface UseImpulseJointState<T> {
  joint?: T;
}

export const useImpulseJoint = <T extends ImpulseJoint>(
  body1: MutableRefObject<RapierRigidBody | undefined | null> | RigidBodyApi,
  body2: MutableRefObject<RapierRigidBody | undefined | null> | RigidBodyApi,
  params: Rapier.JointData
) => {
  const { world } = useRapier();

  const jointRef = useRef<ImpulseJoint>()
  const getJointRef = useRef(() => {
    if (!jointRef.current) {
      let rb1: RapierRigidBody;
      let rb2: RapierRigidBody;

      if ('handle' in body1 && 'handle' in body2) {
        rb1 = world.getRigidBody(body1.handle)!;
        rb2 = world.getRigidBody(body2.handle)!;

        jointRef.current = world.createImpulseJoint(
          params,
          rb1,
          rb2
        ) as T;
      }

      if ('current' in body1 && body1.current && 'current' in body2 && body2.current) {
        rb1 = world.getRigidBody(body1.current.handle)!;
        rb2 = world.getRigidBody(body2.current.handle)!;

        const newJoint = world.createImpulseJoint(
          params,
          rb1,
          rb2
        ) as T;

        jointRef.current = newJoint
      }
    }
    return jointRef.current
  })

  useEffect(() => {
    const joint = getJointRef.current()

    return () => {
      if (joint) {
        world.removeImpulseJoint(joint);
        jointRef.current = undefined
      }
    };
  }, []);

  const api = useMemo(() => createJointApi(getJointRef), []);

  return api
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
  const { rapier } = useRapier();

  return useImpulseJoint<FixedImpulseJoint>(
    body1,
    body2,
    rapier.JointData.fixed(
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
  const { rapier } = useRapier();

  return useImpulseJoint<SphericalImpulseJoint>(
    body1,
    body2,
    rapier.JointData.spherical(
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
  const { rapier } = useRapier();

  return useImpulseJoint<RevoluteImpulseJoint>(
    body1,
    body2,
    rapier.JointData.revolute(
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
  const { rapier } = useRapier();

  return useImpulseJoint<PrismaticImpulseJoint>(
    body1,
    body2,
    rapier.JointData.prismatic(
      vectorArrayToObject(body1Anchor),
      vectorArrayToObject(body2Anchor),
      vectorArrayToObject(axis)
    )
  );
};

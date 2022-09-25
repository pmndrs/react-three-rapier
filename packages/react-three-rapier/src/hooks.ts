import React, { MutableRefObject, useContext, useEffect, useMemo, useState } from "react";
import { RapierContext } from "./Physics";
import { useRef } from "react";
import { Object3D, Quaternion, Vector3 } from "three";

import type Rapier from "@dimforge/rapier3d-compat";

export const useRapier = () => {
  return useContext(RapierContext) as RapierContext;
};

import {
  UseRigidBodyOptions,
  UseImpulseJoint,
  SphericalJointParams,
  FixedJointParams,
  PrismaticJointParams,
  RevoluteJointParams,
  RapierRigidBody,
  RigidBodyApi,
  RigidBodyApiRef,
} from "./types";

import {
  FixedImpulseJoint,
  ImpulseJoint,
  PrismaticImpulseJoint,
  RevoluteImpulseJoint,
  RigidBody,
  SphericalImpulseJoint,
} from "@dimforge/rapier3d-compat";

import {
  rigidBodyTypeFromString,
  vector3ToQuaternion,
  vectorArrayToVector3,
} from "./utils";
import { createJointApi, createRigidBodyApi } from "./api";
import { _position, _rotation, _scale, _vector3 } from "./shared-objects";
import { createRigidBodyState, rigidBodyDescFromOptions, setRigidBodyOptions } from "./utils-rigidbody";
import { ColliderProps } from ".";
import { createColliderPropsFromChildren } from "./utils-collider";

export const useRigidBody = <O extends Object3D>(
  options: UseRigidBodyOptions = {}
): [MutableRefObject<O>, RigidBodyApi, ColliderProps[]] => {
  const { world, rigidBodyStates, physicsOptions, rigidBodyEvents } =
    useRapier();
  const ref = useRef<O>();
  const [childColliderProps, setChildColliderProps] = useState<ColliderProps[]>([])
  
  const mergedOptions = useMemo(() => {
    return {
      ...physicsOptions,
      ...options,
    };
  }, [physicsOptions, options]);

  // Create rigidbody
  const rigidBodyRef = useRef<RigidBody>();
  const getRigidBodyRef = useRef(() => {
    if (!rigidBodyRef.current) {
      const desc = rigidBodyDescFromOptions(options);

      const rigidBody = world.createRigidBody(desc);
      rigidBodyRef.current = world.getRigidBody(rigidBody.handle);
    }

    return rigidBodyRef.current;
  });

  // Setup
  useEffect(() => {
    const rigidBody = getRigidBodyRef.current() as RigidBody;
    rigidBodyRef.current = rigidBody;

    if (!ref.current) {
      ref.current = new Object3D() as O;
    }

    // isSleeping used for onSleep and onWake events
    ref.current.userData.isSleeping = false;

    // Get intitial world transforms of the object
    ref.current.updateWorldMatrix(true, false);
    ref.current.matrixWorld.decompose(_position, _rotation, _scale);

    // Set initial transforms based on world transforms
    // will be replaced by the setRigidBodyOption below
    rigidBody.setTranslation(_position, false);
    rigidBody.setRotation(_rotation, false);

    rigidBodyStates.set(rigidBody.handle, createRigidBodyState(rigidBody, ref.current));

    // setRigidBodyOptions(rigidBody, mergedOptions, rigidBodyStates);

    if (mergedOptions.colliders !== false) {
      setChildColliderProps(createColliderPropsFromChildren({
        object: ref.current!,
        options: mergedOptions,
        ignoreMeshColliders: true,
      }))
    }

    return () => {
      world.removeRigidBody(rigidBody);
      rigidBodyRef.current = undefined;
      rigidBodyStates.delete(rigidBody.handle);
    };
  }, []);

  // Events
  // useEffect(() => {
  //   const rigidBody = getRigidBodyRef.current() as RigidBody;

  //   rigidBodyEvents.set(rigidBody.handle, {
  //     onCollisionEnter: options?.onCollisionEnter,
  //     onCollisionExit: options?.onCollisionExit,
  //     onSleep: options?.onSleep,
  //     onWake: options?.onWake,
  //   });

  //   return () => {
  //     rigidBodyEvents.delete(rigidBody.handle);
  //   };
  // }, [options.onCollisionEnter, options.onCollisionExit]);

  const api = useMemo(() => createRigidBodyApi(getRigidBodyRef), []);

  return [ref as MutableRefObject<O>, api, childColliderProps];
};

// Joints
interface UseImpulseJointState<T> {
  joint?: T;
}

export const useImpulseJoint = <T extends ImpulseJoint>(
  body1: RigidBodyApiRef,
  body2: RigidBodyApiRef,
  params: Rapier.JointData
) => {
  const { world } = useRapier();

  const jointRef = useRef<ImpulseJoint>();
  const getJointRef = useRef(() => {
    if (!jointRef.current) {
      let rb1: RapierRigidBody;
      let rb2: RapierRigidBody;

      if (
        "current" in body1 &&
        body1.current &&
        "current" in body2 &&
        body2.current
      ) {
        rb1 = world.getRigidBody(body1.current.handle)!;
        rb2 = world.getRigidBody(body2.current.handle)!;

        const newJoint = world.createImpulseJoint(params, rb1, rb2) as T;

        jointRef.current = newJoint;
      }
    }
    return jointRef.current;
  });

  useEffect(() => {
    const joint = getJointRef.current();

    return () => {
      if (joint) {
        world.removeImpulseJoint(joint);
        jointRef.current = undefined;
      }
    };
  }, []);

  const api = useMemo(() => createJointApi(getJointRef), []);

  return api;
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
      vectorArrayToVector3(body1Anchor),
      { ...vectorArrayToVector3(body1LocalFrame), w: 1 },
      vectorArrayToVector3(body2Anchor),
      { ...vectorArrayToVector3(body2LocalFrame), w: 1 }
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
      vectorArrayToVector3(body1Anchor),
      vectorArrayToVector3(body2Anchor)
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
      vectorArrayToVector3(body1Anchor),
      vectorArrayToVector3(body2Anchor),
      vectorArrayToVector3(axis)
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
      vectorArrayToVector3(body1Anchor),
      vectorArrayToVector3(body2Anchor),
      vectorArrayToVector3(axis)
    )
  );
};

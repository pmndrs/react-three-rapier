import {
  ImpulseJoint,
  FixedImpulseJoint,
  SphericalImpulseJoint,
  RevoluteImpulseJoint,
  PrismaticImpulseJoint
} from "@dimforge/rapier3d-compat";
import React, { useRef, useEffect, useMemo } from "react";
import {
  RigidBodyApiRef,
  useRapier,
  RapierRigidBody,
  UseImpulseJoint,
  FixedJointParams,
  SphericalJointParams,
  RevoluteJointParams,
  PrismaticJointParams
} from ".";
import { createJointApi } from "./api";
import { vectorArrayToVector3, tupleToObject } from "./utils";

import type Rapier from "@dimforge/rapier3d-compat";

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
      tupleToObject(body1LocalFrame, ["x", "y", "z", "w"] as const),
      vectorArrayToVector3(body2Anchor),
      tupleToObject(body2LocalFrame, ["x", "y", "z", "w"] as const)
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
  [body1Anchor, body2Anchor, axis, limits]
) => {
  const { rapier } = useRapier();

  const params = rapier.JointData.revolute(
    vectorArrayToVector3(body1Anchor),
    vectorArrayToVector3(body2Anchor),
    vectorArrayToVector3(axis)
  );
  if (limits) {
    params.limitsEnabled = true;
    params.limits = limits;
  }
  return useImpulseJoint<RevoluteImpulseJoint>(body1, body2, params);
};

/**
 * The prismatic joint prevents any relative movement between two rigid-bodies, except for relative translations along one axis.
 * It is characterized by one local anchor as well as one local axis on each rigid-body. In 3D, an optional
 * local tangent axis can be specified for each rigid-body.
 */
export const usePrismaticJoint: UseImpulseJoint<PrismaticJointParams> = (
  body1,
  body2,
  [body1Anchor, body2Anchor, axis, limits]
) => {
  const { rapier } = useRapier();
  const params = rapier.JointData.prismatic(
    vectorArrayToVector3(body1Anchor),
    vectorArrayToVector3(body2Anchor),
    vectorArrayToVector3(axis)
  );
  if (limits) {
    params.limitsEnabled = true;
    params.limits = limits;
  }
  return useImpulseJoint<PrismaticImpulseJoint>(body1, body2, params);
};

import React from "react";
import { InteractionGroups, RigidBody } from "@dimforge/rapier3d-compat";
import { useRapier } from "../hooks/hooks";
import { FC, memo, useEffect, useRef } from "react";
import { Object3D, Vector3 } from "three";
import { _position, _vector3 } from "../utils/shared-objects";
import { Object3DProps } from "@react-three/fiber";

export type AttractorGravityType = "static" | "linear" | "newtonian";

export interface AttractorProps {
  /**
   * The relative position of this attractor
   */
  position?: Object3DProps["position"];

  /**
   * The strength of the attractor.
   * Positive values attract, negative values repel.
   *
   * @defaultValue 1
   */
  strength?: number;

  /**
   * The range of the attractor. Will not affect objects outside of this range.
   *
   * @defaultValue 10
   * @min 0
   */
  range?: number;

  /**
   * The type of gravity to use.
   * - static: The gravity is constant and does not change over time.
   * - linear: The gravity is linearly interpolated the closer the object is to the attractor.
   * - newtonian: The gravity is calculated using the newtonian gravity formula.
   * @defaultValue "static"
   */
  type?: AttractorGravityType;

  /**
   * The mass of the attractor. Used when type is `newtonian`.
   * @defaultValue 6.673e-11
   */
  gravitationalConstant?: number;

  /**
   * The collision groups that this attractor will apply effects to. If a RigidBody contains one or more colliders that are in one of the mask group, it will be affected by this attractor.
   * If not specified, the attractor will apply effects to all RigidBodies.
   */
  collisionGroups?: InteractionGroups;
}

export interface AttractorState
  extends Required<Omit<AttractorProps, "position" | "collisionGroups">> {
  object: Object3D;
  collisionGroups?: InteractionGroups;
}

export type AttractorStateMap = Map<Object3D["uuid"], AttractorState>;

const calcForceByType = {
  static: (s: number, m2: number, r: number, d: number, G: number) => s,
  linear: (s: number, m2: number, r: number, d: number, G: number) =>
    s * (d / r),
  newtonian: (s: number, m2: number, r: number, d: number, G: number) =>
    (G * s * m2) / Math.pow(d, 2)
};

export const applyAttractorForceOnRigidBody = (
  rigidBody: RigidBody,
  {
    object,
    strength,
    range,
    gravitationalConstant,
    collisionGroups,
    type
  }: AttractorState
) => {
  const rbPosition = rigidBody.translation();
  _position.set(rbPosition.x, rbPosition.y, rbPosition.z);

  const worldPosition = object.getWorldPosition(new Vector3());

  const distance: number = worldPosition.distanceTo(_position);

  if (distance < range) {
    let force = calcForceByType[type](
      strength,
      rigidBody.mass(),
      range,
      distance,
      gravitationalConstant
    );

    // Prevent wild forces when Attractors collide
    force = force === Infinity ? strength : force;

    // Naively test if the rigidBody contains a collider in one of the collision groups
    let isRigidBodyInCollisionGroup =
      collisionGroups === undefined ? true : false;
    if (collisionGroups !== undefined) {
      for (let i = 0; i < rigidBody.numColliders(); i++) {
        const collider = rigidBody.collider(i);
        const colliderCollisionGroups = collider.collisionGroups();
        if (
          ((collisionGroups >> 16) & colliderCollisionGroups) != 0 &&
          ((colliderCollisionGroups >> 16) & collisionGroups) != 0
        ) {
          isRigidBodyInCollisionGroup = true;
          break;
        }
      }
    }

    if (isRigidBodyInCollisionGroup) {
      _vector3
        .set(0, 0, 0)
        .subVectors(worldPosition, _position)
        .normalize()
        .multiplyScalar(force);

      rigidBody.applyImpulse(_vector3, true);
    }
  }
};

export const Attractor: FC<AttractorProps> = memo((props) => {
  const {
    position = [0, 0, 0],
    strength = 1,
    range = 10,
    type = "static",
    gravitationalConstant = 6.673e-11,
    collisionGroups
  } = props;
  const { attractorStates } = useRapier();
  const object = useRef<Object3D>(null);

  useEffect(() => {
    let uuid = object.current?.uuid || "_";

    if (object.current) {
      attractorStates.set(uuid, {
        object: object.current,
        strength,
        range,
        type,
        gravitationalConstant,
        collisionGroups
      });
    }

    return () => {
      attractorStates.delete(uuid);
    };
  }, [props]);

  return <object3D ref={object} position={position} />;
});

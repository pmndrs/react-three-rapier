import React from "react";
import { RigidBody } from "@dimforge/rapier3d-compat";
import { Vector3Array } from "./types";
import { useRapier } from "./hooks";
import { FC, memo, useEffect, useRef } from "react";
import { Object3D, Vector3 } from "three";
import { _position, _vector3 } from "./shared-objects";
import { Object3DProps } from "@react-three/fiber";

type GravityType = "static" | "linear" | "newtonian";

interface AttractorProps {
  /**
   * The relative position of this attractor
   */
  position?: Object3DProps["position"];

  /**
   * The strength of the attractor.
   * Positive values attract, negative values repel.
   *
   * @default 1
   */
  strength?: number;

  /**
   * The range of the attractor. Will not affect objects outside of this range.
   *
   * @default 10
   * @min 0
   */
  range?: number;

  /**
   * The type of gravity to use.
   * - static: The gravity is constant and does not change over time.
   * - linear: The gravity is linearly interpolated the closer the object is to the attractor.
   * - newtonian: The gravity is calculated using the newtonian gravity formula.
   * @default "static"
   */
  type?: GravityType;

  /**
   * The mass of the attractor. Used when type is `newtonian`.
   * @default 6.673e-11
   */
  gravitationalConstant?: number;
}

export interface AttractorState
  extends Required<Omit<AttractorProps, "position">> {
  object: Object3D;
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
  { object, strength, range, gravitationalConstant, type }: AttractorState
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

    _vector3
      .set(0, 0, 0)
      .subVectors(worldPosition, _position)
      .normalize()
      .multiplyScalar(force);

    rigidBody.applyImpulse(_vector3, true);
  }
};

export const Attractor: FC<AttractorProps> = memo((props) => {
  const {
    position = [0, 0, 0],
    strength = 1,
    range = 10,
    type = "static",
    gravitationalConstant = 6.673e-11
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
        gravitationalConstant
      });
    }

    return () => {
      attractorStates.delete(uuid);
    };
  }, [props]);

  return <object3D ref={object} position={position} />;
});

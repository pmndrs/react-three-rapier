import React from "react";
import { RigidBody } from "@dimforge/rapier3d-compat";
import { Vector3Array } from "./types";
import { useRapier } from "./hooks";
import { FC, memo, useEffect, useRef } from "react";
import { Object3D } from "three";
import { _position, _vector3 } from "./shared-objects";

type GravityType = "static" | "linear" | "newtonian";

interface AttractorProps {
  position?: Vector3Array;
  strength?: number;
  range?: number;
  gravityType?: GravityType;
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
  {
    object,
    strength,
    range,
    gravitationalConstant,
    gravityType
  }: AttractorState
) => {
  const rbPosition = rigidBody.translation();
  _position.set(rbPosition.x, rbPosition.y, rbPosition.z);
  const distance: number = object.position.distanceTo(_position);

  if (distance < range) {
    let force = calcForceByType[gravityType](
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
      .subVectors(object.position, _position)
      .normalize()
      .multiplyScalar(force);

    rigidBody.applyImpulse(_vector3, true);
  }
};

export const Attractor: FC<AttractorProps> = memo((props) => {
  const {
    position = [0, 0, 0],
    strength = 0.5,
    range = 15,
    gravityType = "static",
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
        gravityType,
        gravitationalConstant
      });
    }

    return () => {
      attractorStates.delete(uuid);
    };
  }, [props]);

  return <object3D ref={object} position={position} />;
});

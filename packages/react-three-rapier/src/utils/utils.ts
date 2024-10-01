import { useRef } from "react";
import {
  Quaternion as RapierQuaternion,
  Vector3 as RapierVector3
} from "@dimforge/rapier3d-compat";
import { Euler, Quaternion, Vector3 } from "three";
import { _euler, _quaternion, _vector3 } from "./shared-objects";
import { RigidBodyTypeString, Vector3Tuple } from "../types";
import {
  Vector3 as Vector3Like,
  Quaternion as QuaternionLike
} from "@react-three/fiber";

export const vectorArrayToVector3 = (arr: Vector3Tuple) => {
  const [x, y, z] = arr;
  return new Vector3(x, y, z);
};

export const vector3ToQuaternion = (v: Vector3) => {
  return _quaternion.setFromEuler(_euler.setFromVector3(v));
};

export const rapierVector3ToVector3 = ({ x, y, z }: RapierVector3) =>
  _vector3.set(x, y, z);

export const rapierQuaternionToQuaternion = ({
  x,
  y,
  z,
  w
}: RapierQuaternion) => _quaternion.set(x, y, z, w);

export const vector3ToRapierVector = (v: Vector3Like) => {
  if (Array.isArray(v)) {
    return new RapierVector3(v[0], v[1], v[2]);
  } else if (typeof v === "number") {
    return new RapierVector3(v, v, v);
  } else {
    const threeVector3 = v as Vector3;
    return new RapierVector3(threeVector3.x, threeVector3.y, threeVector3.z);
  }
};

export const quaternionToRapierQuaternion = (v: QuaternionLike) => {
  if (Array.isArray(v)) {
    return new RapierQuaternion(v[0], v[1], v[2], v[3]);
  } else {
    return new RapierQuaternion(v.x, v.y, v.z, v.w);
  }
};

const rigidBodyTypeMap = {
  fixed: 1,
  dynamic: 0,
  kinematicPosition: 2,
  kinematicVelocity: 3
} as const;

export const rigidBodyTypeFromString = (type: RigidBodyTypeString) =>
  rigidBodyTypeMap[type];

export const scaleVertices = (vertices: ArrayLike<number>, scale: Vector3) => {
  const scaledVerts = Array.from(vertices);

  for (let i = 0; i < vertices.length / 3; i++) {
    scaledVerts[i * 3] *= scale.x;
    scaledVerts[i * 3 + 1] *= scale.y;
    scaledVerts[i * 3 + 2] *= scale.z;
  }

  return scaledVerts;
};

export const vectorToTuple = (
  v: Vector3 | Quaternion | any[] | undefined | number | Euler
) => {
  if (!v) return [0];

  if (v instanceof Quaternion) {
    return [v.x, v.y, v.z, v.w];
  }

  if (v instanceof Vector3 || v instanceof Euler) {
    return [v.x, v.y, v.z];
  }

  if (Array.isArray(v)) {
    return v;
  }

  return [v];
};

export function useConst<T>(initialValue: T | (() => T)): T {
  const ref = useRef<{ value: T }>();
  if (ref.current === undefined) {
    ref.current = {
      value:
        typeof initialValue === "function"
          ? (initialValue as Function)()
          : initialValue
    };
  }
  return ref.current.value;
}

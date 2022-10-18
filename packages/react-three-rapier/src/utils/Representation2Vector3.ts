import { Vector3, Vector3Tuple } from "three";

export type Vector3Representation = Vector3Tuple | Vector3 | number;

export function Representation2Vector3(v: Vector3Representation | Readonly<Vector3Tuple>, targetVector = new Vector3) {
  if(typeof v === 'number') return targetVector.setScalar(v);
  if(v instanceof Vector3) return targetVector.copy(v);
  return targetVector.fromArray(v);
}
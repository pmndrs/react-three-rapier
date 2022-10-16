import { Vector3, Vector3Tuple } from "three";

export type Vector3Representation = Vector3Tuple | Vector3 | number;

export function Representation2Vector3(v: Vector3Representation | Readonly<Vector3Tuple>, vector?: Vector3) {
  if(typeof v === 'number') return (vector || new Vector3()).setScalar(v);
  if(v instanceof Vector3) return v;
  return (vector || new Vector3()).fromArray(v);
}
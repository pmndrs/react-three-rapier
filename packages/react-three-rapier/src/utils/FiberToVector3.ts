import { Vector3 as FiberVector3 } from "@react-three/fiber";
import {Vector3 } from 'three';

export function FiberToVector3(v: FiberVector3, targetVector = new Vector3) {
  if(typeof v === 'number') return targetVector.setScalar(v);
  if(v instanceof Vector3) return targetVector.copy(v);
  return targetVector.fromArray(v);
}
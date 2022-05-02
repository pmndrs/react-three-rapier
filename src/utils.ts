// import { RigidBodyType } from "@dimforge/rapier3d-compat";
import { RigidBodyTypeString, Vector3Array } from "./types";

export const vectorArrayToObject = (arr: Vector3Array) => {
  const [x, y, z] = arr;
  return { x, y, z };
};

const rigidBodyTypeMap: {
  [key: string]: number;
} = {
  fixed: 1,
  dynamic: 0,
  kinematicPosition: 2,
  kinematicVelocity: 3,
};

export const rigidBodyTypeFromString = (type: RigidBodyTypeString) =>
  rigidBodyTypeMap[type];

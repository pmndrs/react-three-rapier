import { RigidBodyDesc } from "@dimforge/rapier3d-compat";
import { RigidBodyProps } from "./RigidBody";
import { rigidBodyTypeFromString } from "./utils";

export const rigidBodyDescFromOptions = (options: RigidBodyProps) => {
  const type = rigidBodyTypeFromString(options?.type || "dynamic");

  const desc = new RigidBodyDesc(type);

  return desc;
};

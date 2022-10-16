import { ColorRepresentation } from "three";
import { RigidBodyProps } from "./RigidBody";

export type InstancedRigidBody = RigidBodyProps & {
  key: string | number;
  color?: ColorRepresentation;
};

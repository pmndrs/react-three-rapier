import { RigidBody, RigidBodyDesc } from "@dimforge/rapier3d-compat";
import { useEffect } from "react";
import { Matrix4, Object3D } from "three";
import { RigidBodyState, RigidBodyStateMap } from "./Physics";
import { RigidBodyProps } from "./RigidBody";
import { _matrix4, _position, _rotation, _scale } from "./shared-objects";
import { rigidBodyTypeFromString } from "./utils";

export const rigidBodyDescFromOptions = (options: RigidBodyProps) => {
  const type = rigidBodyTypeFromString(options?.type || "dynamic");

  const desc = new RigidBodyDesc(type);

  return desc;
};

export const createRigidBodyState = (
  rigidBody: RigidBody,
  object: Object3D
): RigidBodyState => {
  object.updateWorldMatrix(true, false);
  const invertedWorldMatrix = object.parent!.matrixWorld.clone().invert();

  return {
    object,
    rigidBody,
    invertedWorldMatrix,
    setMatrix: (matrix: Matrix4) => {
      object.matrix.copy(matrix);
    },
    isSleeping: false
  };
};

export const setRigidBodyOptions = (
  rigidBody: RigidBody,
  options: RigidBodyProps,
  states: RigidBodyStateMap
) => {
  const state = states.get(rigidBody.handle);

  if (state) {
    state.object.updateWorldMatrix(true, false);

    _matrix4
      .copy(state.object.matrixWorld)
      .premultiply(state.invertedWorldMatrix)
      .decompose(_position, _rotation, _scale);

    rigidBody.setTranslation(_position, false);
    rigidBody.setRotation(_rotation, false);
  }
};

export const useUpdateRigidBodyOptions = (
  rigidBody: RigidBody,
  props: RigidBodyProps,
  states: RigidBodyStateMap
) => {
  useEffect(() => {
    setRigidBodyOptions(rigidBody, props, states);
  }, [props]);
};

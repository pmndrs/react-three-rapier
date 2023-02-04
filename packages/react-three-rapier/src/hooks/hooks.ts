import React, {
  MutableRefObject,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  rapierContext,
  RapierContext,
  WorldStepCallback
} from "../components/Physics";
import { useRef } from "react";
import { Object3D } from "three";

import { RigidBodyOptions } from "../types";

import { RigidBody, World } from "@dimforge/rapier3d-compat";

import { ColliderProps, RigidBodyProps } from "..";
import { createRigidBodyApi, RigidBodyApi } from "../utils/api";
import { createColliderPropsFromChildren } from "../utils/utils-collider";
import {
  createRigidBodyState,
  rigidBodyDescFromOptions,
  useRigidBodyEvents,
  useUpdateRigidBodyOptions
} from "../utils/utils-rigidbody";

// External hooks
export const useRapier = () => {
  return useContext(rapierContext) as RapierContext;
};

export const useBeforePhysicsStep = (callback: WorldStepCallback) => {
  const { beforeStepCallbacks } = useRapier();

  useEffect(() => {
    beforeStepCallbacks.add(callback);

    return () => {
      beforeStepCallbacks.delete(callback);
    };
  }, []);
};

export const useAfterPhysicsStep = (callback: WorldStepCallback) => {
  const { afterStepCallbacks } = useRapier();

  useEffect(() => {
    afterStepCallbacks.add(callback);

    return () => {
      afterStepCallbacks.delete(callback);
    };
  }, []);
};

// Internal hooks
export const useChildColliderProps = <O extends Object3D>(
  ref: MutableRefObject<O | undefined | null>,
  options: RigidBodyProps,
  ignoreMeshColliders = true
) => {
  const [colliderProps, setColliderProps] = useState<ColliderProps[]>([]);

  useEffect(() => {
    const object = ref.current;

    if (object && options.colliders !== false) {
      setColliderProps(
        createColliderPropsFromChildren({
          object: ref.current!,
          options,
          ignoreMeshColliders
        })
      );
    }
  }, [options.colliders]);

  return colliderProps;
};

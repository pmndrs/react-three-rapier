import React, {
  MutableRefObject,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { rapierContext, RapierContext, WorldStepCallback } from "./Physics";
import { useRef } from "react";
import { Object3D } from "three";

import { RigidBodyOptions } from "./types";

import { RigidBody, World } from "@dimforge/rapier3d-compat";

import { ColliderProps, RigidBodyProps } from ".";
import { createRigidBodyApi, RigidBodyApi } from "./api";
import { createColliderPropsFromChildren } from "./utils-collider";
import {
  createRigidBodyState,
  rigidBodyDescFromOptions,
  useRigidBodyEvents,
  useUpdateRigidBodyOptions
} from "./utils-rigidbody";

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

export const useRigidBody = <O extends Object3D>(
  options: RigidBodyOptions = {}
): [MutableRefObject<O>, RigidBodyApi, ColliderProps[]] => {
  const { world, rigidBodyStates, physicsOptions, rigidBodyEvents } =
    useRapier();
  const ref = useRef<O>();

  const mergedOptions = useMemo(() => {
    return {
      ...physicsOptions,
      ...options,
      children: undefined
    };
  }, [physicsOptions, options]);

  const childColliderProps = useChildColliderProps(ref, mergedOptions);

  // Create rigidbody
  const rigidBodyRef = useRef<RigidBody>();
  const getRigidBodyRef = useRef(() => {
    if (!rigidBodyRef.current) {
      const desc = rigidBodyDescFromOptions(options);

      const rigidBody = world.createRigidBody(desc);
      rigidBodyRef.current = world.getRigidBody(rigidBody.handle);
    }

    return rigidBodyRef.current;
  });

  // Setup
  useEffect(() => {
    const rigidBody = getRigidBodyRef.current() as RigidBody;
    rigidBodyRef.current = rigidBody;

    if (!ref.current) {
      ref.current = new Object3D() as O;
    }

    rigidBodyStates.set(
      rigidBody.handle,
      createRigidBodyState({
        rigidBody,
        object: ref.current
      })
    );

    return () => {
      world.removeRigidBody(rigidBody);
      rigidBodyStates.delete(rigidBody.handle);
      rigidBodyRef.current = undefined;
    };
  }, []);

  useUpdateRigidBodyOptions(rigidBodyRef, mergedOptions, rigidBodyStates);
  useRigidBodyEvents(rigidBodyRef, mergedOptions, rigidBodyEvents);

  const api = useMemo(() => createRigidBodyApi(getRigidBodyRef), []);

  return [ref as MutableRefObject<O>, api, childColliderProps];
};

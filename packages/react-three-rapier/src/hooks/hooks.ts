import React, {
  MutableRefObject,
  useContext,
  useEffect,
  useRef,
  useState
} from "react";
import {
  rapierContext,
  RapierContext,
  WorldStepCallback
} from "../components/Physics";
import { Object3D } from "three";

import { ColliderProps, RigidBodyProps } from "..";
import { createColliderPropsFromChildren } from "../utils/utils-collider";

// Utils
const useMutableCallback = <T>(fn: T) => {
  const ref = useRef<T>(fn);
  useEffect(() => {
    ref.current = fn;
  }, [fn]);
  return ref;
};

// External hooks
/**
 * Exposes the Rapier context, and world
 * @category Hooks
 */
export const useRapier = () => {
  return useContext(rapierContext) as RapierContext;
};

/**
 * Registers a callback to be called before the physics step
 * @category Hooks
 */
export const useBeforePhysicsStep = (callback: WorldStepCallback) => {
  const { beforeStepCallbacks } = useRapier();

  const ref = useMutableCallback(callback);

  useEffect(() => {
    beforeStepCallbacks.add(ref);

    return () => {
      beforeStepCallbacks.delete(ref);
    };
  }, []);
};

/**
 * Registers a callback to be called after the physics step
 * @category Hooks
 */
export const useAfterPhysicsStep = (callback: WorldStepCallback) => {
  const { afterStepCallbacks } = useRapier();

  const ref = useMutableCallback(callback);

  useEffect(() => {
    afterStepCallbacks.add(ref);

    return () => {
      afterStepCallbacks.delete(ref);
    };
  }, []);
};

// Internal hooks
/**
 * @internal
 */
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

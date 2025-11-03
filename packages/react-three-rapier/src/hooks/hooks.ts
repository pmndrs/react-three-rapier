import React, {
  RefObject,
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
export const useRapier = (): RapierContext => {
  const rapier = useContext(rapierContext);
  if (!rapier)
    throw new Error(
      "react-three-rapier: useRapier must be used within <Physics />!"
    );
  return rapier;
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

/**
 * Registers a callback to filter contact pairs.
 *
 * The callback determines if contact computation should happen between two colliders,
 * and how the constraints solver should behave for these contacts.
 *
 * This will only be executed if at least one of the involved colliders contains the
 * `ActiveHooks.FILTER_CONTACT_PAIR` flag in its active hooks.
 *
 * @param callback - Function that returns:
 *   - `SolverFlags.COMPUTE_IMPULSE` (1) - Process the collision normally (compute impulses and resolve penetration)
 *   - `SolverFlags.EMPTY` (0) - Skip computing impulses for this collision pair (colliders pass through each other)
 *   - `null` - Skip this hook; let the next registered hook decide, or use Rapier's default behavior if no hook handles it
 *
 * When multiple hooks are registered, they are called in order until one returns a non-null value.
 * That value is then passed to Rapier's physics engine.
 *
 * @category Hooks
 *
 * @example
 * ```tsx
 * import { useFilterContactPair } from '@react-three/rapier';
 * import { SolverFlags } from '@dimforge/rapier3d-compat';
 *
 * useFilterContactPair((collider1, collider2, body1, body2) => {
 *   // Only process collisions for specific bodies
 *   if (body1 === myBodyHandle) {
 *     return SolverFlags.COMPUTE_IMPULSE;
 *   }
 *   // Let other hooks or default behavior handle it
 *   return null;
 * });
 * ```
 */
export const useFilterContactPair = (
  callback: (
    collider1: number,
    collider2: number,
    body1: number,
    body2: number
  ) => number | null
) => {
  const { filterContactPairHooks } = useRapier();

  const ref = useMutableCallback(callback);

  useEffect(() => {
    filterContactPairHooks.add(ref);

    return () => {
      filterContactPairHooks.delete(ref);
    };
  }, []);
};

/**
 * Registers a callback to filter intersection pairs.
 *
 * The callback determines if intersection computation should happen between two colliders
 * (where at least one is a sensor).
 *
 * This will only be executed if at least one of the involved colliders contains the
 * `ActiveHooks.FILTER_INTERSECTION_PAIR` flag in its active hooks.
 *
 * @param callback - Function that returns:
 *   - `true` - Allow the intersection to be detected (trigger intersection events)
 *   - `false` - Block the intersection (no intersection events will fire)
 *
 * When multiple hooks are registered, the **first hook that returns `false` blocks** the intersection.
 * If all hooks return `true`, the intersection is allowed.
 *
 * @category Hooks
 *
 * @example
 * ```tsx
 * import { useFilterIntersectionPair } from '@react-three/rapier';
 *
 * useFilterIntersectionPair((collider1, collider2, body1, body2) => {
 *   // Block intersections for specific body pairs
 *   if (body1 === myBodyHandle && body2 === otherBodyHandle) {
 *     return false;
 *   }
 *   // Allow all other intersections
 *   return true;
 * });
 * ```
 */
export const useFilterIntersectionPair = (
  callback: (
    collider1: number,
    collider2: number,
    body1: number,
    body2: number
  ) => boolean
) => {
  const { filterIntersectionPairHooks } = useRapier();

  const ref = useMutableCallback(callback);

  useEffect(() => {
    filterIntersectionPairHooks.add(ref);

    return () => {
      filterIntersectionPairHooks.delete(ref);
    };
  }, []);
};

// Internal hooks
/**
 * @internal
 */
export const useChildColliderProps = <O extends Object3D>(
  ref: RefObject<O | undefined | null>,
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

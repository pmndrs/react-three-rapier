import type { RigidBody } from "@dimforge/rapier3d-compat";
import { RefObject, useEffect, useRef } from "react";
import type { Object3D } from "three";
import { useRapier } from "../hooks/hooks";
import { hasGeometry, SoftBodyState } from "./soft-body-state";
import type { SoftBodyOptions } from "./types";

const resolveRigidBody = (body: unknown): RigidBody | null | undefined => {
  if (body && typeof body === "object" && "current" in body) {
    return (body as RefObject<RigidBody | null | undefined>).current;
  }
  return body as RigidBody | undefined;
};

/**
 * Turns the geometry of an object into a soft body and keeps the two in sync
 * after every physics step. This is the hook behind {@link SoftBody}; use it
 * when you already hold a ref to a `<mesh>`, `<line>` or `<points>`.
 *
 * The geometry is replaced by a welded copy (vertices sharing a position are
 * merged), the object's transform is baked into it, and from then on it
 * receives the deformed vertex positions in the space of the object's parent,
 * with normals and bounds recomputed.
 *
 * Options are read when the body is created. The body is removed from the
 * world when the component unmounts.
 *
 * @example
 * ```tsx
 * const mesh = useRef<Mesh>(null)
 * const soft = useSoftBody(mesh, { type: "cloth", pinned: (p) => p.y > 0.99 })
 * return <mesh ref={mesh}><planeGeometry args={[2, 2, 16, 16]} /></mesh>
 * ```
 *
 * @returns A ref to the {@link SoftBodyState}, populated once the body exists.
 * @category Soft Bodies
 */
export const useSoftBody = (
  object: RefObject<Object3D | null | undefined>,
  options: SoftBodyOptions = {}
): RefObject<SoftBodyState | null> => {
  const { world, afterStepCallbacks, softBodyTearCallbacks } = useRapier();
  const state = useRef<SoftBodyState | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const target = object.current;
    if (!target || !hasGeometry(target)) {
      console.warn(
        "react-three-rapier: useSoftBody needs a ref to an object with a geometry."
      );
      return;
    }

    const created = new SoftBodyState(
      world,
      target,
      optionsRef.current,
      resolveRigidBody
    );
    state.current = created;

    const afterStep = { current: () => created.sync() };
    afterStepCallbacks.add(afterStep);
    const onTear = created.handleTear.bind(created);
    softBodyTearCallbacks.add(onTear);

    return () => {
      afterStepCallbacks.delete(afterStep);
      softBodyTearCallbacks.delete(onTear);
      created.dispose();
      state.current = null;
    };
    // Creation options are read once, like <RigidBody>'s.
  }, [world]);

  return state;
};

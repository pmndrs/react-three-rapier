import React, {
  Children,
  cloneElement,
  isValidElement,
  ReactElement,
  Ref,
  useCallback,
  useEffect,
  useRef
} from "react";
import type { Object3D } from "three";
import { useRapier } from "../index";
import { SoftBodyState } from "./soft-body-state";
import type { SoftBodyOptions } from "./types";
import { useSoftBody } from "./use-soft-body";

/**
 * @category Soft Bodies
 */
export interface SoftBodyProps extends SoftBodyOptions {
  /**
   * Exactly one `<mesh>` (cloth, volume) or `<line>`/`<points>` (rope)
   * element. Its geometry is consumed and driven by the simulation; its
   * transform sets the initial pose of the body.
   */
  children: ReactElement;
  /** Receives the {@link SoftBodyState} once the body exists. */
  ref?: Ref<SoftBodyState | null>;
}

const setRef = <T,>(ref: Ref<T> | undefined, value: T | null) => {
  if (typeof ref === "function") ref(value);
  else if (ref) (ref as { current: T | null }).current = value;
};

/**
 * A deformable body: cloth, rope or volumetric (jelly) body built from the
 * geometry of its child mesh. The mesh is kept in sync with the simulation
 * once per rendered frame, interpolated like the rigid bodies.
 *
 * Soft bodies collide with colliders and rigid bodies in the same
 * `<Physics>` world, can be pinned, and can be attached to rigid bodies.
 * Creation props are read once, when the body is created.
 *
 * @example
 * ```tsx
 * <Physics>
 *   <SoftBody type="cloth" pinned={(p) => p.y > 0.99} stiffness={12}>
 *     <mesh position={[0, 3, 0]}>
 *       <planeGeometry args={[2, 2, 20, 20]} />
 *       <meshStandardMaterial side={DoubleSide} />
 *     </mesh>
 *   </SoftBody>
 * </Physics>
 * ```
 *
 * @category Soft Bodies
 */
export const SoftBody = (props: SoftBodyProps) => {
  const { children, ref, ...options } = props;

  const meshRef = useRef<Object3D | null>(null);
  const state = useSoftBody(meshRef, options);
  const { world } = useRapier();

  // Expose the state through the ref. The state is created in an effect of
  // useSoftBody, which runs before this one.
  useEffect(() => {
    setRef(ref, state.current);
    return () => setRef(ref, null);
  }, [ref, state, world]);

  const onlyChild = Children.only(children);
  if (!isValidElement(onlyChild)) {
    throw new Error("react-three-rapier: <SoftBody> needs exactly one child.");
  }

  const childRef = (onlyChild as ReactElement<{ ref?: Ref<Object3D> }>).props
    .ref;
  const mergedRef = useCallback(
    (instance: Object3D | null) => {
      meshRef.current = instance;
      setRef(childRef, instance);
    },
    [childRef]
  );

  return cloneElement(onlyChild as ReactElement<{ ref?: Ref<Object3D> }>, {
    ref: mergedRef
  });
};

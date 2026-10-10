import React, {
  forwardRef,
  Fragment,
  memo,
  ReactNode,
  useEffect,
  useRef
} from "react";
import { DynamicDrawUsage, InstancedMesh, Object3D } from "three";
import { useChildColliderProps } from "../hooks/hooks";
import { useForwardedRef } from "../hooks/use-forwarded-ref";
import { RapierRigidBody } from "../types";
import { AnyCollider } from "./AnyCollider";
import { RigidBodyState } from "./Physics";
import { RigidBody, RigidBodyProps } from "./RigidBody";

export type InstancedRigidBodyProps = RigidBodyProps & {
  key: string | number;
};

export interface InstancedRigidBodiesProps extends Omit<RigidBodyProps, "ref"> {
  instances: InstancedRigidBodyProps[];
  colliderNodes?: ReactNode[];
  children: ReactNode;
  ref?: React.Ref<(RapierRigidBody | null)[] | null>;
  /**
   * Whether the child InstancedMesh is frustum culled. Physics moves the
   * instances away from where three computed the mesh's bounding sphere, so
   * culling is disabled by default to keep instances from vanishing (#683).
   * @defaultValue false
   */
  frustumCulled?: boolean;
}

export const InstancedRigidBodies = memo(
  ({ ref, ...props }: InstancedRigidBodiesProps) => {
    const rigidBodiesRef = useForwardedRef<(RapierRigidBody | null)[]>(ref, []);

    const objectRef = useRef<Object3D>(null);
    const instanceWrapperRef = useRef<Object3D>(null);
    const {
      // instanced props
      children,
      instances,
      colliderNodes = [],
      frustumCulled = false,

      // wrapper object props
      position,
      rotation,
      quaternion,
      scale,

      // rigid body specific props, and r3f-object props
      ...rigidBodyProps
    } = props;

    const childColliderProps = useChildColliderProps(objectRef, {
      ...props,
      children: undefined
    });

    const getInstancedMesh = () => {
      const firstChild = instanceWrapperRef.current!.children[0];

      if (firstChild && "isInstancedMesh" in firstChild) {
        return firstChild as InstancedMesh;
      }

      return undefined;
    };

    useEffect(() => {
      const instancedMesh = getInstancedMesh();

      if (instancedMesh) {
        instancedMesh.instanceMatrix.setUsage(DynamicDrawUsage);
      } else {
        console.warn(
          "InstancedRigidBodies expects exactly one child, which must be an InstancedMesh"
        );
      }
    }, []);

    // Three computes an InstancedMesh's bounding sphere once, from the
    // initial instance matrices. Physics then moves the instances around,
    // so the cached bounds go stale and the whole mesh gets culled when the
    // camera moves (#683). Recomputing the sphere every step is O(instances)
    // per frame, so we opt out of frustum culling by default instead.
    // Runs after every render so that a re-created InstancedMesh (e.g. when the
    // instance count changes) is also covered; it is cheap and idempotent.
    useEffect(() => {
      const instancedMesh = getInstancedMesh();
      if (instancedMesh && instancedMesh.frustumCulled !== frustumCulled) {
        instancedMesh.frustumCulled = frustumCulled;
      }
    });

    // Update the RigidBodyStates whenever the instances change
    const applyInstancedState = (state: RigidBodyState, index: number) => {
      const instancedMesh = getInstancedMesh();

      if (instancedMesh) {
        return {
          ...state,
          getMatrix: (matrix) => {
            instancedMesh.getMatrixAt(index, matrix);
            return matrix;
          },
          setMatrix: (matrix) => {
            instancedMesh.setMatrixAt(index, matrix);
            instancedMesh.instanceMatrix.needsUpdate = true;
          },
          meshType: "instancedMesh"
        } as RigidBodyState;
      }

      return state;
    };

    return (
      <object3D
        ref={objectRef}
        {...rigidBodyProps}
        position={position}
        rotation={rotation}
        quaternion={quaternion}
        scale={scale}
      >
        <object3D ref={instanceWrapperRef}>{children}</object3D>

        {instances?.map(({ key, ...instance }, index) => (
          <RigidBody
            key={key ?? index}
            {...rigidBodyProps}
            {...instance}
            ref={(body) => {
              rigidBodiesRef.current[index] = body;
            }}
            transformState={(state) => applyInstancedState(state, index)}
          >
            <>
              {colliderNodes.map((node, index) => (
                <Fragment key={index}>{node}</Fragment>
              ))}

              {childColliderProps.map((colliderProps, colliderIndex) => (
                <AnyCollider key={colliderIndex} {...colliderProps} />
              ))}
            </>
          </RigidBody>
        ))}
      </object3D>
    );
  }
);

InstancedRigidBodies.displayName = "InstancedRigidBodies";

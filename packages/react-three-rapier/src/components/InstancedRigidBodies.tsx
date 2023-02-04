import React, {
  forwardRef,
  Fragment,
  memo,
  ReactNode,
  useEffect,
  useImperativeHandle,
  useRef
} from "react";
import { DynamicDrawUsage, InstancedMesh, Object3D } from "three";
import { AnyCollider } from "./AnyCollider";
import { useChildColliderProps, useRapier } from "../hooks/hooks";
import { RigidBodyState } from "./Physics";
import { RigidBody, RigidBodyProps } from "./RigidBody";
import { _matrix4 } from "../utils/shared-objects";
import { RapierRigidBody } from "../types";

export type InstancedRigidBodyProps = RigidBodyProps & {
  key: string | number;
};

export interface InstancedRigidBodiesProps extends RigidBodyProps {
  instances: InstancedRigidBodyProps[];
  colliderNodes?: ReactNode[];
  children: ReactNode;
}

export const InstancedRigidBodies = memo(
  forwardRef<(RapierRigidBody | null)[], InstancedRigidBodiesProps>(
    (props, ref) => {
      const object = useRef<Object3D>(null);
      const instancedWrapper = useRef<Object3D>(null);
      const {
        // instanced props
        children,
        instances,
        colliderNodes = [],

        // wrapper object props
        position,
        rotation,
        quaternion,
        scale,

        // rigid body specific props, and r3f-object props
        ...rigidBodyProps
      } = props;

      const rigidBodyApis = useRef<(RapierRigidBody | null)[]>([]);

      useImperativeHandle(ref, () => rigidBodyApis.current, [instances]);

      const childColliderProps = useChildColliderProps(object, {
        ...props,
        children: undefined
      });

      const getInstancedMesh = () => {
        const firstChild = instancedWrapper.current!.children[0];

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
          ref={object}
          {...rigidBodyProps}
          position={position}
          rotation={rotation}
          quaternion={quaternion}
          scale={scale}
        >
          <object3D ref={instancedWrapper}>{children}</object3D>

          {instances?.map((instance, index) => (
            <RigidBody
              {...rigidBodyProps}
              {...instance}
              ref={(body) => (rigidBodyApis.current[index] = body)}
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
  )
);

InstancedRigidBodies.displayName = "InstancedRigidBodies";

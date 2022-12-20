import React, {
  forwardRef,
  memo,
  ReactNode,
  useEffect,
  useImperativeHandle,
  useRef
} from "react";
import { DynamicDrawUsage, InstancedMesh, Object3D } from "three";
import { AnyCollider } from "./AnyCollider";
import { RigidBodyApi } from "./api";
import { useChildColliderProps, useRapier } from "./hooks";
import { RigidBody, RigidBodyProps } from "./RigidBody";
import { _matrix4 } from "./shared-objects";

type InstancedRigidBody = RigidBodyProps & {
  key: number;
};

export interface InstancedRigidBodiesProps extends RigidBodyProps {
  instances: InstancedRigidBody[];
  colliderNodes?: ReactNode;
  children: ReactNode;
}

export type InstancedRigidBodiesApi = (RigidBodyApi | null)[];

export const InstancedRigidBodies = memo(
  forwardRef<(RigidBodyApi | null)[], InstancedRigidBodiesProps>(
    (props, ref) => {
      const { rigidBodyStates } = useRapier();
      const object = useRef<Object3D>(null);
      const {
        // instanced props
        children,
        instances,
        colliderNodes,

        // wrapper object props
        position,
        rotation,
        quaternion,
        scale,

        // rigid body specific props, and r3f-object props
        ...rigidBodyProps
      } = props;

      const rigidBodyApis = useRef<(RigidBodyApi | null)[]>([]);

      useImperativeHandle(ref, () => rigidBodyApis.current);

      const childColliderProps = useChildColliderProps(object, {
        ...props,
        children: undefined
      });

      const getInstancedMesh = () => {
        const firstChild = object.current!.children[0];

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
      useEffect(() => {
        const instancedMesh = getInstancedMesh();

        if (instancedMesh) {
          rigidBodyApis.current.forEach((api, index) => {
            if (api) {
              const currentState = rigidBodyStates!.get(api.handle)!;
              rigidBodyStates!.set(api.handle, {
                ...currentState,
                object: instancedMesh,
                getMatrix: (matrix) => {
                  instancedMesh.getMatrixAt(index, matrix);
                  return matrix;
                },
                setMatrix: (matrix) => instancedMesh.setMatrixAt(index, matrix)
              });
            }
          });
        }
      }, [instances]);

      return (
        <object3D
          ref={object}
          {...rigidBodyProps}
          position={position}
          rotation={rotation}
          quaternion={quaternion}
          scale={scale}
        >
          <>
            {children}

            {instances?.map((instance, i) => (
              <RigidBody
                {...rigidBodyProps}
                {...instance}
                ref={(api) => (rigidBodyApis.current[i] = api)}
              >
                {colliderNodes && colliderNodes}

                {childColliderProps.map((colliderProps, index) => (
                  <AnyCollider key={index} {...colliderProps} />
                ))}
              </RigidBody>
            ))}
          </>
        </object3D>
      );
    }
  )
);

InstancedRigidBodies.displayName = "InstancedRigidBodies";

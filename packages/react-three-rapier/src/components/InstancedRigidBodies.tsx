import {
  forwardRef,
  Fragment,
  memo,
  MutableRefObject,
  ReactNode,
  useCallback,
  useEffect,
  useImperativeHandle, useMemo, useRef
} from "react";
import { DynamicDrawUsage, InstancedMesh, Object3D } from "three";
import { useChildColliderProps } from "../hooks/hooks";
import { RapierRigidBody } from "../types";
import { AnyCollider, ColliderProps } from "./AnyCollider";
import { RigidBodyState } from "./Physics";
import { RigidBody, RigidBodyProps } from "./RigidBody";

export type InstancedRigidBodyProps = RigidBodyProps & {
  key: string | number;
};

export interface InstancedRigidBodiesProps extends RigidBodyProps {
  instances: InstancedRigidBodyProps[];
  colliderNodes?: ReactNode[];
  children: ReactNode;
}

export type InstancedRigidBodiesRef = Map<string|number, RapierRigidBody|null>;

export const InstancedRigidBodies = memo(
  forwardRef<InstancedRigidBodiesRef, InstancedRigidBodiesProps>(
    (props, ref) => {
      const object = useRef<Object3D>(null);
      const instancedWrapper = useRef<Object3D>(null);
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

      const memoColliderNodes = useMemo(()=>colliderNodes || [], [colliderNodes]);

      const rigidBodyApis = useRef<InstancedRigidBodiesRef>(new Map());

      useImperativeHandle(ref, () => rigidBodyApis.current, [instances]);

      const childColliderProps = useChildColliderProps(object, {
        ...props,
        children: undefined
      });

      const getInstancedMesh = useCallback(() => {
        const firstChild = instancedWrapper.current!.children[0];

        if (firstChild && "isInstancedMesh" in firstChild) {
          return firstChild as InstancedMesh;
        }

        return undefined;
      }, []);

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
      const applyInstancedState = useCallback((state: RigidBodyState, index: number) => {
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
      }, []);

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
            <Instance
              {...rigidBodyProps}
              {...instance}
              uuid={instance.key}
              index={index}
              apis={rigidBodyApis}
              applyInstancedState={applyInstancedState}
              colliderNodes={memoColliderNodes}
              childColliderProps={childColliderProps}
            />
          ))}
        </object3D>
      );
    }
  )
);

InstancedRigidBodies.displayName = "InstancedRigidBodies";

interface InstanceProps extends RigidBodyProps {
  apis: MutableRefObject<InstancedRigidBodiesRef>;
  applyInstancedState: (state: RigidBodyState, index: number) => RigidBodyState;
  colliderNodes: ReactNode[];
  childColliderProps: ColliderProps[];
  uuid: string | number;
  index: number;
}

/** A rigid body instance of `InstancedRigidBodies`  */
const Instance = memo<InstanceProps>(({
  apis, applyInstancedState, colliderNodes, childColliderProps, uuid, index,
  ...props
}) => {

  useEffect(()=>{
    return () => {
      apis.current.delete(uuid);
    }
  }, [])

  return <RigidBody
  {...props}
  ref={(body) => apis.current.set(uuid, body)}
  transformState={(state) => applyInstancedState(state, index)}
>
  {colliderNodes.map((node, index) => (
    <Fragment key={index}>{node}</Fragment>
  ))}

  {childColliderProps.map((colliderProps, colliderIndex) => (
    <AnyCollider key={colliderIndex} {...colliderProps} />
  ))}
</RigidBody>
});

InstancedRigidBodies.displayName = "InstancedRigidBodies";

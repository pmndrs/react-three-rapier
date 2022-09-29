import {
  Collider,
  RigidBody as RapierRigidBody
} from "@dimforge/rapier3d-compat";
import React, {
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useMemo,
  useLayoutEffect,
  useState
} from "react";
import {
  Object3D,
  InstancedMesh,
  Matrix4,
  Vector3,
  DynamicDrawUsage
} from "three";
import { AnyCollider } from ".";
import {
  createInstancedRigidBodiesApi,
  createRigidBodyApi,
  InstancedRigidBodyApi
} from "./api";
import { useChildColliderProps, useRapier } from "./hooks";
import { RigidBody, RigidBodyContext, RigidBodyProps } from "./RigidBody";
import {
  _matrix4,
  _object3d,
  _position,
  _rotation,
  _scale
} from "./shared-objects";
import { RigidBodyApi, Vector3Array } from "./types";
import { vector3ToQuaternion, vectorArrayToVector3 } from "./utils";
import {
  createRigidBodyState,
  rigidBodyDescFromOptions,
  setRigidBodyOptions,
  useRigidBodyEvents,
  useUpdateRigidBodyOptions
} from "./utils-rigidbody";

export interface InstancedRigidBodiesProps
  extends Omit<RigidBodyProps, "position" | "rotation"> {
  positions?: Vector3Array[];
  rotations?: Vector3Array[];
  scales?: Vector3Array[];
}

export const InstancedRigidBodies = forwardRef<
  InstancedRigidBodyApi,
  InstancedRigidBodiesProps
>((props: InstancedRigidBodiesProps, ref) => {
  const {
    world,
    rigidBodyStates,
    physicsOptions,
    rigidBodyEvents
  } = useRapier();
  const object = useRef<Object3D>(null);
  const { positions, rotations, children, ...options } = props;

  const instancesRef = useRef<
    { rigidBody: RapierRigidBody; api: RigidBodyApi }[]
  >([]);
  const instancesRefGetter = useRef(() => {
    if (!instancesRef.current) {
      instancesRef.current = [];
    }

    return instancesRef.current;
  });

  const mergedOptions = useMemo(() => {
    return {
      ...physicsOptions,
      ...options
    };
  }, [physicsOptions, options]);

  const childColliderProps = useChildColliderProps(object, mergedOptions);

  useLayoutEffect(() => {
    object.current!.updateWorldMatrix(true, false);
    const rigidBodies = instancesRefGetter.current();
    const invertedWorld = object.current!.matrixWorld.clone().invert();

    object.current!.traverseVisible(mesh => {
      if (mesh instanceof InstancedMesh) {
        mesh.instanceMatrix.setUsage(DynamicDrawUsage);
        const worldScale = mesh.getWorldScale(_scale);

        for (let index = 0; index < mesh.count; index++) {
          const desc = rigidBodyDescFromOptions(props);
          const rigidBody = world.createRigidBody(desc);

          const scale = options.scales?.[index] || [1, 1, 1];
          const instanceScale = worldScale
            .clone()
            .multiply(vectorArrayToVector3(scale));

          rigidBodyStates.set(
            rigidBody.handle,
            createRigidBodyState({
              rigidBody,
              object: mesh,
              setMatrix: (matrix: Matrix4) => mesh.setMatrixAt(index, matrix),
              getMatrix: (matrix: Matrix4) => {
                mesh.getMatrixAt(index, matrix);
                return matrix;
              },
              worldScale: instanceScale
            })
          );

          const [x, y, z] = positions?.[index] || [0, 0, 0];
          const [rx, ry, rz] = rotations?.[index] || [0, 0, 0];

          _object3d.position.set(x, y, z);
          _object3d.rotation.set(rx, ry, rz);
          _object3d.applyMatrix4(invertedWorld);
          mesh.setMatrixAt(index, _object3d.matrix);

          rigidBody.setTranslation(_object3d.position, false);
          rigidBody.setRotation(_object3d.quaternion, false);

          const api = createRigidBodyApi({
            current() {
              return rigidBody;
            }
          });
          rigidBodies.push({ rigidBody, api });
        }
      }
    });

    return () => {
      rigidBodies.forEach(rb => {
        world.removeRigidBody(rb.rigidBody);
        rigidBodyStates.delete(rb.rigidBody.handle);
      });
      instancesRef.current = [];
    };
  }, []);

  const api = useMemo(
    () =>
      createInstancedRigidBodiesApi(instancesRefGetter) as ReturnType<
        typeof createInstancedRigidBodiesApi
      >,
    []
  );

  useImperativeHandle(ref, () => api);
  useUpdateRigidBodyOptions(
    { current: instancesRef.current.map(({ rigidBody }) => rigidBody) },
    mergedOptions,
    rigidBodyStates,
    false
  );
  useRigidBodyEvents(
    { current: instancesRef.current.map(({ rigidBody }) => rigidBody) },
    mergedOptions,
    rigidBodyEvents,
    false
  );

  return (
    <RigidBodyContext.Provider
      value={{
        ref: object,
        api,
        options: props
      }}
    >
      <object3D ref={object}>
        {props.children}

        {childColliderProps.map((colliderProps, index) => (
          <AnyCollider key={index} {...colliderProps} />
        ))}
      </object3D>
    </RigidBodyContext.Provider>
  );
});

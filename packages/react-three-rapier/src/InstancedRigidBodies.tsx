import { RigidBody as RapierRigidBody } from "@dimforge/rapier3d-compat";
import React, {
  useRef,
  forwardRef,
  useImperativeHandle,
  useMemo,
  useLayoutEffect
} from "react";
import { Object3D, InstancedMesh, Matrix4, DynamicDrawUsage } from "three";
import { AnyCollider } from ".";
import {
  createInstancedRigidBodiesApi,
  createRigidBodyApi,
  InstancedRigidBodyApi,
  RigidBodyApi
} from "./api";
import { useChildColliderProps, useRapier } from "./hooks";
import { RigidBodyContext, RigidBodyProps } from "./RigidBody";
import {
  _matrix4,
  _object3d,
  _position,
  _rotation,
  _scale
} from "./shared-objects";
import { Vector3Array } from "./types";
import { vectorArrayToVector3 } from "./utils";
import {
  createRigidBodyState,
  rigidBodyDescFromOptions,
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
  const { world, rigidBodyStates, physicsOptions, rigidBodyEvents } =
    useRapier();
  const object = useRef<Object3D>(null);
  const { positions, rotations, children, ...options } = props;

  const instancesRef = useRef<
    { rigidBody: RapierRigidBody; api: RigidBodyApi }[]
  >([]);
  const rigidBodyRefs = useRef<RapierRigidBody[]>([]);
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
    const instances = instancesRefGetter.current();
    const invertedWorld = object.current!.matrixWorld.clone().invert();

    object.current!.traverseVisible((mesh) => {
      if (mesh instanceof InstancedMesh) {
        mesh.instanceMatrix.setUsage(DynamicDrawUsage);
        const worldScale = mesh.getWorldScale(_scale);

        for (let index = 0; index < mesh.count; index++) {
          const desc = rigidBodyDescFromOptions(props);
          const rigidBody = world.createRigidBody(desc);

          rigidBodyRefs.current.push(rigidBody);

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
          instances.push({ rigidBody, api });
        }
      }
    });

    return () => {
      instances.forEach((rb) => {
        world.removeRigidBody(rb.rigidBody);
        rigidBodyStates.delete(rb.rigidBody.handle);
      });
      rigidBodyRefs.current = [];
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
    rigidBodyRefs,
    mergedOptions,
    rigidBodyStates,
    false
  );
  useRigidBodyEvents(rigidBodyRefs, mergedOptions, rigidBodyEvents);

  const contextValue = useMemo(() => {
    return {
      ref: object,
      api,
      options: mergedOptions
    };
  }, [api, mergedOptions]);

  return (
    <RigidBodyContext.Provider value={contextValue}>
      <object3D ref={object}>
        {props.children}

        {childColliderProps.map((colliderProps, index) => (
          <AnyCollider key={index} {...colliderProps} />
        ))}
      </object3D>
    </RigidBodyContext.Provider>
  );
});

InstancedRigidBodies.displayName = "InstancedRigidBodies";

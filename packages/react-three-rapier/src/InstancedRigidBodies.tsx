import { Collider, RigidBody } from "@dimforge/rapier3d-compat";
import React, {
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useMemo,
  useLayoutEffect,
} from "react";
import {
  Object3D,
  InstancedMesh,
  Matrix4,
  Vector3,
  DynamicDrawUsage,
} from "three";
import {
  createInstancedRigidBodiesApi,
  createRigidBodyApi,
  InstancedRigidBodyApi,
} from "./api";
import { useRapier } from "./hooks";
import { RigidBodyContext, RigidBodyProps } from "./RigidBody";
import { RigidBodyApi, Vector3Array } from "./types";
import {
  colliderDescFromGeometry,
  decomposeMatrix4,
  rigidBodyDescFromOptions,
  vector3ToQuaternion,
  vectorArrayToVector3,
} from "./utils";

export interface InstancedRigidBodiesProps
  extends Omit<
    RigidBodyProps,
    "position" | "rotation" | "onCollisionEnter" | "onCollisionExit"
  > {
  positions?: Vector3Array[];
  rotations?: Vector3Array[];
  scales?: Vector3Array[];
}

export const InstancedRigidBodies = forwardRef<
  InstancedRigidBodyApi,
  InstancedRigidBodiesProps
>((props: InstancedRigidBodiesProps, ref) => {
  const { world, rigidBodyStates, physicsOptions } = useRapier();
  const object = useRef<Object3D>(null);

  const instancesRef = useRef<{ rigidBody: RigidBody; api: RigidBodyApi }[]>();
  const instancesRefGetter = useRef(() => {
    if (!instancesRef.current) {
      instancesRef.current = [];
    }

    return instancesRef.current;
  });

  useLayoutEffect(() => {
    const colliders: Collider[] = [];
    const rigidBodies = instancesRefGetter.current();

    if (object.current) {
      const worldScale = object.current.getWorldScale(new Vector3());
      let hasOneMesh = false;

      object.current.traverse((mesh) => {
        if (mesh instanceof InstancedMesh) {
          if (hasOneMesh) {
            console.warn(
              "Can only use a single InstancedMesh inside <InstancedRigidBodies />, more InstancedMeshes will be ignored."
            );
            return;
          }
          hasOneMesh = true;
          mesh.instanceMatrix.setUsage(DynamicDrawUsage);

          for (let index = 0; index < mesh.count; index++) {
            const scale = worldScale.clone();
            const rigidBodyDesc = rigidBodyDescFromOptions(props);

            if (props.scales && props.scales[index]) {
              const s = vectorArrayToVector3(props.scales[index]);
              scale.multiply(s);
            }

            const rigidBody = world.createRigidBody(rigidBodyDesc);
            const matrix = new Matrix4();
            mesh.getMatrixAt(index, matrix);
            const { position, rotation } = decomposeMatrix4(matrix);

            if (props.colliders !== false) {
              const colliderDesc = colliderDescFromGeometry(
                mesh.geometry,
                props.colliders !== undefined
                  ? props.colliders
                  : physicsOptions.colliders,
                scale,
                false // Collisions currently not enabled for instances
              );
              const collider = world.createCollider(colliderDesc, rigidBody);
              colliders.push(collider);
            }

            // Set positions
            if (props.positions && props.positions[index]) {
              rigidBody.setTranslation(
                vectorArrayToVector3(props.positions[index]),
                true
              );
            } else {
              rigidBody.setTranslation(position, true);
            }

            // Set rotations
            if (props.rotations && props.rotations[index]) {
              const [x, y, z] = props.rotations[index];
              rigidBody.setRotation(
                vector3ToQuaternion(new Vector3(x, y, z)),
                true
              );
            } else {
              rigidBody.setRotation(rotation, true);
            }

            rigidBodyStates.set(rigidBody.handle, {
              mesh: mesh,
              isSleeping: false,
              invertedMatrixWorld: object.current!.matrixWorld.clone().invert(),
              setMatrix: (matrix: Matrix4) => mesh.setMatrixAt(index, matrix),
              getMatrix: () => {
                const m = new Matrix4();
                mesh.getMatrixAt(index, m);
                return m;
              },
              // Setting the world scale to the scale here, because
              // we want the scales to be reflected by instance
              worldScale: scale,
            });

            const api = createRigidBodyApi({
              current() {
                return rigidBody;
              },
            });
            rigidBodies.push({ rigidBody, api });
          }
        }

        if (mesh.type === "Mesh" && !("isInstancedMesh" in mesh)) {
          console.warn(
            "Can only use InstancedMesh inside <InstancedRigidBodies />, Mesh will be ignored."
          );
        }
      });

      return () => {
        rigidBodies.forEach((rb) => world.removeRigidBody(rb.rigidBody));
        colliders.forEach((coll) => world.removeCollider(coll));
        instancesRef.current = undefined;
      };
    }
  }, []);

  const api = useMemo(
    () =>
      createInstancedRigidBodiesApi(instancesRefGetter) as ReturnType<
        typeof createInstancedRigidBodiesApi
      >,
    []
  );

  useImperativeHandle(ref, () => api);

  // console.log(api);

  return (
    <RigidBodyContext.Provider
      value={{
        ref: object,
        api,
        hasCollisionEvents: false,
        options: props,
      }}
    >
      <object3D ref={object}>{props.children}</object3D>
    </RigidBodyContext.Provider>
  );
});

import { Collider, RigidBody } from "@dimforge/rapier3d-compat";
import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import {
  Object3D,
  InstancedMesh,
  Matrix4,
  Vector3,
  DynamicDrawUsage,
  Mesh,
} from "three";
import { createInstancedRigidBodiesApi, InstancedRigidBodyApi } from "./api";
import { useRapier } from "./hooks";
import { RigidBodyProps } from "./RigidBody";
import { Vector3Array } from "./types";
import {
  colliderDescFromGeometry,
  decomposeMatrix4,
  rigidBodyDescFromOptions,
  vector3ToQuaternion,
  vectorArrayToObject,
} from "./utils";

interface InstancedRigidBodiesProps
  extends Omit<RigidBodyProps, "position" | "rotation"> {
  positions?: Vector3Array[];
  rotations?: Vector3Array[];
}

export const InstancedRigidBodies = forwardRef<
  InstancedRigidBodyApi,
  InstancedRigidBodiesProps
>((props: InstancedRigidBodiesProps, ref) => {
  const { world, rigidBodyStates, physicsOptions } = useRapier();
  const object = useRef<Object3D>(null);

  const instancesRef = useRef<RigidBody[]>();
  const instancesRefGetter = useRef(() => {
    if (!instancesRef.current) {
      instancesRef.current = [];
    }

    return instancesRef.current;
  });

  useEffect(() => {
    const colliders: Collider[] = [];
    const rigidBodies = instancesRefGetter.current();

    if (object.current) {
      const scale = object.current.getWorldScale(new Vector3());
      let hasOneMesh = false;

      object.current.traverse((mesh) => {
        if (mesh instanceof InstancedMesh) {
          if (hasOneMesh) {
            console.warn(
              "Can only use a single InstancedMesh inside <InstancedRigidBodies />, more InstancedMeshes will be ignored."
            );
            return;
          }

          mesh.instanceMatrix.setUsage(DynamicDrawUsage);

          const rigidBodyDesc = rigidBodyDescFromOptions(props);
          const colliderDesc = colliderDescFromGeometry(
            mesh.geometry,
            props.colliders || physicsOptions.colliders,
            scale
          );

          for (let index = 0; index < mesh.count; index++) {
            const rigidBody = world.createRigidBody(rigidBodyDesc);
            const matrix = new Matrix4();
            mesh.getMatrixAt(index, matrix);
            const { position, rotation } = decomposeMatrix4(matrix);

            // Set positions
            if (props.positions && props.positions[index]) {
              rigidBody.setTranslation(
                vectorArrayToObject(props.positions[index]),
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

            const collider = world.createCollider(colliderDesc, rigidBody);
            rigidBodyStates.set(rigidBody.handle, {
              mesh: mesh,
              isSleeping: false,
              invertedMatrixWorld: object.current!.matrixWorld.clone().invert(),
              setMatrix: (matrix: Matrix4) => mesh.setMatrixAt(index, matrix),
              worldScale: object.current!.getWorldScale(new Vector3()),
            });

            colliders.push(collider);
            rigidBodies.push(rigidBody);
          }
        }

        if (mesh.type === "Mesh" && !("isInstancedMesh" in mesh)) {
          console.warn(
            "Can only use InstancedMesh inside <InstancedRigidBodies />, Mesh will be ignored."
          );
        }
      });

      return () => {
        rigidBodies.forEach((rb) => world.removeRigidBody(rb));
        colliders.forEach((coll) => world.removeCollider(coll));
      };
    }
  }, []);

  useImperativeHandle(
    ref,
    () =>
      createInstancedRigidBodiesApi(instancesRefGetter) as ReturnType<
        typeof createInstancedRigidBodiesApi
      >
  );

  return <object3D ref={object}>{props.children}</object3D>;
});

import { Collider, RigidBody } from "@dimforge/rapier3d-compat";
import { useRef, useEffect } from "react";
import {
  Object3D,
  InstancedMesh,
  Matrix4,
  Vector3,
  DynamicDrawUsage,
  Mesh,
} from "three";
import { useRapier } from "./hooks";
import { RigidBodyProps } from "./RigidBody";
import {
  colliderDescFromGeometry,
  decomposeMatrix4,
  rigidBodyDescFromOptions,
} from "./utils";

export const InstancedRigidBodies = (props: RigidBodyProps) => {
  const { world, rigidBodyStates, physicsOptions } = useRapier();
  const object = useRef<Object3D>(null);

  useEffect(() => {
    const colliders: Collider[] = [];
    const rigidBodies: RigidBody[] = [];

    if (object.current) {
      const scale = object.current.getWorldScale(new Vector3());

      object.current.traverse((mesh) => {
        if (mesh instanceof InstancedMesh) {
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

            rigidBody.setTranslation(position, true);
            rigidBody.setRotation(rotation, true);

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
          console.log(mesh);
          console.warn("Cannot use <mesh> inside <InstancedRigidBodies />");
        }
      });

      return () => {
        rigidBodies.forEach((rb) => world.removeRigidBody(rb));
        colliders.forEach((coll) => world.removeCollider(coll));
      };
    }
  }, []);

  return <object3D ref={object}>{props.children}</object3D>;
};

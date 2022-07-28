import { Instance, Instances } from "@react-three/drei";
import { Debug, InstancedRigidBodies } from "@react-three/rapier";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  Euler,
  Group,
  InstancedMesh,
  MeshStandardMaterial,
  Object3D,
  Vector3,
} from "three";
import { useSuzanne } from "../all-shapes/AllShapes";
import { Demo } from "../App";

const COUNT = 200;

export const InstancedMeshes: Demo = () => {
  const group = useRef<Group>(null);

  const {
    nodes: { Suzanne },
  } = useSuzanne();

  const mesh = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const o = new Object3D();

    for (let i = 0; i < COUNT; i++) {
      o.position.copy(
        new Vector3(Math.random() * 20, Math.random() * 20, Math.random() * 20)
      );
      o.rotation.copy(
        new Euler().setFromVector3(
          new Vector3(
            Math.random() * 20,
            Math.random() * 20,
            Math.random() * 20
          )
        )
      );
      o.updateMatrix();

      mesh.current?.setMatrixAt(i, o.matrix);
    }
  }, []);

  const blueMat = useMemo(
    () => new MeshStandardMaterial({ color: "blue" }),
    []
  );

  return (
    <group>
      <Debug />

      <InstancedRigidBodies colliders="cuboid">
        <instancedMesh
          ref={mesh}
          args={[Suzanne.geometry, Suzanne.material, COUNT]}
        />
      </InstancedRigidBodies>

      {/* <InstancedRigidBodies colliders="ball">
        <Instances geometry={Suzanne.geometry} material={blueMat}>
          <Instance position={[0, 10, 0]} />
          <Instance position={[0, 20, 0]} />
        </Instances>
      </InstancedRigidBodies> */}
    </group>
  );
};

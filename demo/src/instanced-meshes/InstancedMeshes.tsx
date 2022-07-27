import { Debug } from "@react-three/rapier";
import { useEffect, useRef } from "react";
import { Euler, Group, InstancedMesh, Object3D, Vector3 } from "Three";
import { useSuzanne } from "../all-shapes/AllShapes";
import { Demo } from "../App";

const COUNT = 100;

export const InstancedMeshes: Demo = () => {
  const group = useRef<Group>(null);

  const {
    nodes: { Suzanne },
  } = useSuzanne();

  const mesh = useRef<InstancedMesh>(null);

  useEffect(() => {
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

  return (
    <group>
      <Debug />

      <instancedMesh
        ref={mesh}
        args={[Suzanne.geometry, Suzanne.material, COUNT]}
      />
    </group>
  );
};

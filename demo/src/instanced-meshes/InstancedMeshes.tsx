import { ThreeEvent } from "@react-three/fiber";
import { Debug, InstancedRigidBodies } from "@react-three/rapier";
import { InstancedRigidBodyApi } from "@react-three/rapier/dist/declarations/src/api";
import { useRef } from "react";
import { Group } from "three";
import { useSuzanne } from "../all-shapes/AllShapes";
import { Demo } from "../App";

const COUNT = 500;

export const InstancedMeshes: Demo = () => {
  const group = useRef<Group>(null);

  const {
    nodes: { Suzanne },
  } = useSuzanne();

  const api = useRef<InstancedRigidBodyApi>(null);

  const handleClickInstance = (evt: ThreeEvent<MouseEvent>) => {
    if (api.current) {
      api.current
        .at(evt.instanceId!)
        .applyTorqueImpulse({ x: 0, y: 500, z: 0 });
    }
  };

  return (
    <group>
      <Debug />

      <InstancedRigidBodies
        ref={api}
        colliders="cuboid"
        positions={Array.from({ length: COUNT }, () => [
          Math.random() * 20,
          Math.random() * 20,
          Math.random() * 20,
        ])}
        rotations={Array.from({ length: COUNT }, () => [
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
        ])}
      >
        <instancedMesh
          args={[Suzanne.geometry, Suzanne.material, COUNT]}
          onClick={handleClickInstance}
        />
      </InstancedRigidBodies>
    </group>
  );
};

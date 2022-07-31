import { ThreeEvent } from "@react-three/fiber";
import {
  Debug,
  InstancedRigidBodies,
  InstancedRigidBodyApi,
} from "@react-three/rapier";
import { useEffect, useRef } from "react";
import { useSuzanne } from "../all-shapes/AllShapes";
import { Demo } from "../App";

const COUNT = 200;

export const InstancedMeshes: Demo = () => {
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

  useEffect(() => {
    if (api.current) {
      api.current.forEach((body) => {
        body.applyImpulse({
          x: -Math.random() * 20,
          y: Math.random() * 20,
          z: -Math.random() * 20,
        });
      });
    }
  }, []);

  return (
    <group>
      <InstancedRigidBodies
        ref={api}
        colliders="hull"
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
          castShadow
          args={[Suzanne.geometry, undefined, COUNT]}
          onClick={handleClickInstance}
        >
          <meshPhysicalMaterial color={"yellow"} />
        </instancedMesh>
      </InstancedRigidBodies>
    </group>
  );
};

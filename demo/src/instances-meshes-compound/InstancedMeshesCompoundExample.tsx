import { ThreeEvent } from "@react-three/fiber";
import {
  BallCollider,
  CuboidCollider,
  Debug,
  InstancedRigidBodies,
  InstancedRigidBodyApi
} from "@react-three/rapier";
import { useEffect, useRef } from "react";
import { useSuzanne } from "../all-shapes/AllShapesExample";
import { Demo } from "../App";

const COUNT = 10;

export const InstancedMeshesCompound: Demo = () => {
  const {
    nodes: { Suzanne }
  } = useSuzanne();

  const api = useRef<InstancedRigidBodyApi>(null);

  const handleClickInstance = (evt: ThreeEvent<MouseEvent>) => {
    if (api.current) {
      api.current
        .at(evt.instanceId!)
        .applyTorqueImpulse({ x: 0, y: 100, z: 0 });
    }
  };

  useEffect(() => {
    if (api.current) {
      api.current.forEach((body) => {
        body.applyImpulse({
          x: -Math.random() * 5,
          y: Math.random() * 5,
          z: -Math.random() * 5
        });
      });
    }
  }, []);

  return (
    <group scale={0.7}>
      <InstancedRigidBodies
        ref={api}
        colliders={false}
        positions={Array.from({ length: COUNT }, () => [
          Math.random() * 20,
          Math.random() * 20,
          Math.random() * 20
        ])}
        rotations={Array.from({ length: COUNT }, () => [
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2
        ])}
        scales={Array.from({ length: COUNT }, () => [
          0.5 + Math.random(),
          0.5 + Math.random(),
          0.5 + Math.random()
        ])}
      >
        <instancedMesh
          castShadow
          args={[Suzanne.geometry, undefined, COUNT]}
          onClick={handleClickInstance}
        >
          <meshPhysicalMaterial color={"yellow"} />
        </instancedMesh>

        <BallCollider args={[1]} />
        <BallCollider args={[0.5]} position={[1, 0.3, -0.25]} />
        <CuboidCollider args={[0.5, 0.2, 0.5]} position={[-1, 0.3, -0.25]} />
      </InstancedRigidBodies>
    </group>
  );
};

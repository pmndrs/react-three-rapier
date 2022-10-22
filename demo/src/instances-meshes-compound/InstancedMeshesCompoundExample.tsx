import { ThreeEvent } from "@react-three/fiber";
import {
  BallCollider,
  CuboidCollider,
  InstancedRigidBodies, InstancedRigidBodyApi, RigidBodyApi
} from "@react-three/rapier";
import { useEffect, useMemo, useRef } from "react";
import { MeshPhongMaterial, SphereGeometry } from "three";
import { useSuzanne } from "../all-shapes/AllShapesExample";
import { Demo } from "../App";

const COUNT = 10;

export const InstancedMeshesCompound: Demo = () => {
  const {
    nodes: { Suzanne }
  } = useSuzanne();

  const api = useRef<InstancedRigidBodyApi>(null);

  const handleClickInstance = (evt: ThreeEvent<MouseEvent>) => {
    if (!api.current) return;
    if (evt.instanceId === undefined) return;
    const body = api.current[evt.instanceId];
    if (!body) return;
    body.applyTorqueImpulse({ x: 0, y: 100, z: 0 });
  };

  useEffect(() => {
    if (!api.current) return;
    for (const body of api.current) {
      if (!body) continue;
      body.applyImpulse({
        x: -Math.random() * 5,
        y: Math.random() * 5,
        z: -Math.random() * 5
      });
    }
  }, []);

  return (
    <group scale={0.7}>
      <InstancedRigidBodies
        ref={api}
        colliders={false}
        rigidBodies={Array.from({ length: COUNT }, (_v, i) => ({
          key: i,
          position: [
            Math.random() * 20,
            Math.random() * 20,
            Math.random() * 20
          ],
          rotation: [
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2
          ],
          scale: [
            0.5 + Math.random(),
            0.5 + Math.random(),
            0.5 + Math.random()
          ]
        }))}
        colliderNodes={<>
          <BallCollider args={[1]} />
          <BallCollider args={[0.5]} position={[1, 0.3, -0.25]} />
          <CuboidCollider args={[0.5, 0.2, 0.5]} position={[-1, 0.3, -0.25]} />
        </>}
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
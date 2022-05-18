import { RigidBody as RapierRigidBody } from "@dimforge/rapier3d-compat";
import { Environment, Sphere } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import { createRef, useEffect, useRef } from "react";
import { Vector3 } from "three";
import { Demo } from "../App";

const BALLS = 1000;

export const Cluster: Demo = ({ setUI }) => {
  useEffect(() => {
    setUI("");
  }, []);

  const refs = useRef(
    Array.from({ length: BALLS }).map(() => createRef<RapierRigidBody>())
  );

  useFrame(() => {
    refs.current.forEach((ref) => {
      const p = ref.current?.translation();
      const v = new Vector3(p?.x, p?.y, p?.z);
      v.normalize().multiplyScalar(-0.02);

      ref.current?.applyImpulse({ x: v.x, y: v.y, z: v.z }, true);
    });
  });

  return (
    <group>
      {Array.from({ length: BALLS }).map((_, i) => (
        <RigidBody
          position={[Math.floor(i / 30) * 0.5, (i % 30) * 0.5, 0]}
          colliders="ball"
          ref={refs.current[i]}
          key={i}
        >
          <Sphere scale={0.2}>
            <meshPhysicalMaterial roughness={0} metalness={0.5} />
          </Sphere>
        </RigidBody>
      ))}
    </group>
  );
};

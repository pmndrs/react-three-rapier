import { Box, Sphere, Torus } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {
  BallCollider,
  CuboidCollider,
  RapierCollider,
  RapierRigidBody,
  RigidBody
} from "@react-three/rapier";
import { useEffect, useRef } from "react";
import { Demo } from "../../App";

const Ball = () => {
  const ball = useRef<RapierRigidBody>(null);

  useFrame(() => {
    if (ball.current) {
      if (ball.current.translation().y < -10) {
        ball.current.setTranslation(
          { x: Math.random() * 2, y: 20, z: 0 },
          true
        );
        ball.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      }
    }
  });

  return (
    <RigidBody
      ref={ball}
      colliders="ball"
      position={[Math.random(), 5 + Math.random() * 20, Math.random()]}
    >
      <Sphere castShadow receiveShadow>
        <meshPhysicalMaterial color="red" />
      </Sphere>
    </RigidBody>
  );
};

export const Colliders: Demo = () => {
  const cuboid = useRef<RapierCollider>(null);

  useEffect(() => {
    console.log(cuboid.current);
  }, []);

  return (
    <group>
      <Ball />
      <Ball />
      <Ball />
      <Ball />
      <Ball />

      <group position={[0, 0, 0]} name="potato">
        <CuboidCollider
          args={[10, 1, 10]}
          position={[0, 0, 0]}
          rotation={[0.1, 0.1, 0.2]}
          ref={cuboid}
        />
        <BallCollider args={[3]} position={[1, 2, 1]} />
      </group>
    </group>
  );
};

import { Box, Sphere, Torus } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {
  BallCollider,
  CuboidCollider,
  RigidBody,
  RigidBodyApi,
} from "@react-three/rapier";
import { useRef } from "react";
import { Demo } from "../App";

const Ball = () => {
  const ball = useRef<RigidBodyApi>(null);

  useFrame(() => {
    if (ball.current) {
      if (ball.current.translation().y < -10) {
        ball.current.setTranslation({ x: Math.random() * 2, y: 20, z: 0 });
        ball.current.setLinvel({ x: 0, y: 0, z: 0 });
      }
    }
  });

  return (
    <RigidBody ref={ball} colliders="ball">
      <Sphere castShadow receiveShadow>
        <meshPhysicalMaterial color="red" />
      </Sphere>
    </RigidBody>
  );
};

export const Colliders: Demo = () => {
  return (
    <group>
      <Ball />
      <Ball />
      <Ball />
      <Ball />
      <Ball />

      <CuboidCollider args={[10, 1, 10]} />
      <BallCollider args={[3]} position={[1, 2, 1]} />
    </group>
  );
};

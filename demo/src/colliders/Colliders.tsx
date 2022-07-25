import { Box, Sphere, Torus } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {
  BallCollider,
  ConeCollider,
  CuboidCollider,
  Debug,
  RigidBody,
  RigidBodyApi,
} from "@react-three/rapier";
import { useEffect, useRef } from "react";
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

export const Colliders: Demo = ({ setUI }) => {
  useEffect(() => {
    setUI("");
  }, []);

  return (
    <group>
      <Ball />
      <Ball />
      <Ball />
      <Ball />
      <Ball />

      <Debug />

      <CuboidCollider args={[10, 1, 10]} />
      <BallCollider args={[3]} position={[1, 2, 1]} />
    </group>
  );
};

import { Box, Sphere, Torus } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { RigidBody, RigidBodyApi } from "@react-three/rapier";
import { useEffect, useRef } from "react";
import { Euler, Quaternion } from "three";
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

export const Kinematics: Demo = () => {
  const torus = useRef<RigidBodyApi>(null);
  const platform = useRef<RigidBodyApi>(null);

  useFrame(() => {
    const now = performance.now();

    if (torus.current) {
      const euler = new Euler(now / 1000, 0, 0);
      torus.current.setNextKinematicRotation(
        new Quaternion().setFromEuler(euler)
      );
    }

    if (platform.current) {
      platform.current.setNextKinematicTranslation({
        x: Math.sin(now / 100),
        y: -8 + Math.sin(now / 50) * 0.5,
        z: 0,
      });
    }
  });

  return (
    <group rotation={[0, 0, 0]} scale={1}>
      <Ball />
      <Ball />
      <Ball />
      <Ball />
      <Ball />

      <RigidBody
        position={[0, 2, 0]}
        colliders="trimesh"
        type="kinematicPosition"
        ref={torus}
        restitution={1}
      >
        <Torus castShadow scale={5} receiveShadow>
          <meshPhysicalMaterial />
        </Torus>
      </RigidBody>

      <RigidBody
        colliders="cuboid"
        position={[0, -8, 0]}
        type="kinematicPosition"
        ref={platform}
      >
        <Box args={[40, 1, 40]} castShadow receiveShadow>
          <meshPhysicalMaterial />
        </Box>
      </RigidBody>
    </group>
  );
};

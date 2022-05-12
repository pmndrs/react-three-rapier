import { Box, Sphere } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {
  CuboidCollider,
  RigidBody,
  RigidBodyAutoCollider,
} from "@react-three/rapier";
import { useRef } from "react";
import { Group } from "three/src/Three";
import { Demo } from "../App";

export const Transforms: Demo = () => {
  const group = useRef<Group>(null);

  useFrame(() => {
    if (group.current) group.current.rotation.z += 0.01;
  });

  return (
    <group rotation={[0, 0, 1]} ref={group}>
      <Box castShadow receiveShadow scale={[5, 5, 0.5]} position={[0, 0, -2]}>
        <meshPhysicalMaterial />
      </Box>

      <RigidBody position={[-0.5, 2, 1]} colliders={RigidBodyAutoCollider.Ball}>
        <Sphere scale={0.5} castShadow receiveShadow>
          <meshPhysicalMaterial />
        </Sphere>
      </RigidBody>
      <RigidBody position={[0, 0, 1]} colliders={RigidBodyAutoCollider.Cuboid}>
        <Box castShadow receiveShadow>
          <meshPhysicalMaterial />
        </Box>
      </RigidBody>
      <RigidBody position={[3, 0, 1]} colliders={RigidBodyAutoCollider.Cuboid}>
        <Box castShadow receiveShadow>
          <meshPhysicalMaterial />
        </Box>
      </RigidBody>
    </group>
  );
};

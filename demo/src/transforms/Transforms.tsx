import { Box, Sphere } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {
  CuboidCollider,
  RigidBody,
  RigidBodyAutoCollider,
} from "@react-three/rapier";
import { useEffect, useRef } from "react";
import { Group } from "three/src/Three";
import { Demo } from "../App";

export const Transforms: Demo = () => {
  const group = useRef<Group>(null);

  useFrame(() => {
    // if (group.current) group.current.rotation.z += 0.02;
    // if (group.current) group.current.rotation.x += 0.02;
  });

  const collider = useRef();

  useEffect(() => {
    console.log(collider.current);
  }, []);

  return (
    <group>
      <group rotation={[2, 2, 6]} position={[0, -5, 0]} scale={1.2} ref={group}>
        <Box castShadow receiveShadow scale={[5, 5, 0.5]} position={[0, 0, -2]}>
          <meshPhysicalMaterial />
        </Box>

        <RigidBody
          position={[-0.5, 2, 1]}
          colliders={RigidBodyAutoCollider.Ball}
        >
          <Sphere scale={0.2} castShadow receiveShadow>
            <meshPhysicalMaterial />
          </Sphere>
        </RigidBody>
        <RigidBody
          position={[0, 0, 1]}
          colliders={RigidBodyAutoCollider.Cuboid}
        >
          <Box castShadow receiveShadow scale={2} position={[0, 0, 2]}>
            <meshPhysicalMaterial />
          </Box>
          <Box castShadow receiveShadow scale={1} position={[2, 0, 0]}>
            <meshPhysicalMaterial />
          </Box>
        </RigidBody>
        <RigidBody
          position={[3, 0, 1]}
          colliders={RigidBodyAutoCollider.Cuboid}
        >
          <Box castShadow receiveShadow>
            <meshPhysicalMaterial />
          </Box>
        </RigidBody>
      </group>

      <group scale={0.4} rotation={[2, 0, 1]}>
        <RigidBody>
          <Box castShadow receiveShadow />

          <CuboidCollider args={[0.5, 0.5, 0.5]} />
        </RigidBody>
      </group>
    </group>
  );
};

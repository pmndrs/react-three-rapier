import React, { useMemo } from "react";

import { Box, Clone, Sphere, useGLTF } from "@react-three/drei";
import {
  RigidBody,
  RigidBodyAutoCollider,
  TrimeshCollider,
} from "@react-three/rapier";
import { useRef } from "react";
import { GroupProps, Object3DNode, useFrame } from "@react-three/fiber";
import type { RigidBody as RB } from "@dimforge/rapier3d-compat";
import { Mesh } from "three";
import { Demo } from "../App";

const Map = () => {
  const { nodes } = useGLTF(
    // @ts-ignore
    new URL("../map.glb", import.meta.url).toString()
  ) as unknown as { nodes: { map: Mesh } };

  nodes.map.castShadow = true;
  nodes.map.receiveShadow = true;

  return (
    <group position={[0, -3, 0]} scale={.2}>
      <RigidBody position={[0, -2, 0]}>
        <primitive object={nodes.map.clone(true)} position={[0,0,0]} />;
        <TrimeshCollider args={[nodes.map.geometry.attributes.position.array, nodes.map.geometry.index?.array || []]} />;
      </RigidBody>
    </group>
  );
};

const Pear = (props: GroupProps) => {
  const { nodes } = useGLTF(
    new URL("../shapes/objects.glb", import.meta.url).toString()
  ) as unknown as {
    nodes: {
      pear: Mesh;
    };
  };

  const scale = useMemo(() => .4 + Math.random() * .5, [])

  return (
    <group {...props} scale={1}>
      <RigidBody position={[0, 2, 0]} colliders={RigidBodyAutoCollider.ConvexHull}>
        <Clone object={nodes.pear} castShadow receiveShadow scale={scale} />
      </RigidBody>
    </group>
  );
};

export const ComponentsExample:Demo = ({ setUI }) => {
  setUI("");

  return (
    <group>
      <group scale={1}>
        <RigidBody colliders={RigidBodyAutoCollider.Cuboid}>
          <Box castShadow>
            <meshPhysicalMaterial />
          </Box>
          <Box position={[2, 1, 1]} scale={[4,1,2]} castShadow>
            <meshPhysicalMaterial />
          </Box>
          <Box position={[7, 3, 0]} scale={4} castShadow>
            <meshPhysicalMaterial />
          </Box>
        </RigidBody>


        <RigidBody colliders={RigidBodyAutoCollider.Ball} position={[5, 0, 0]}>
            <Sphere castShadow>
              <meshPhysicalMaterial />
            </Sphere>
         </RigidBody>
      </group>

      {/* {Array.from({length: 20}).map((_, i) => <Pear position={[0, 4 * i, 0]} key={i} />)} */}

      <Map />
    </group>
  );
};

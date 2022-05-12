import React from "react";

import { Box, Clone, useGLTF } from "@react-three/drei";
import {
  ConvexHullCollider,
  CuboidCollider,
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
    <group position={[0, -3, 0]}>
      <RigidBody position={[0, 0, 0]} colliders={RigidBodyAutoCollider.Trimesh} >
        <primitive object={nodes.map} />;
        <primitive object={nodes.map.clone(true)} position={[10,0,0]} />;
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

  return (
    <group {...props} scale={.5}>
      <RigidBody position={[0, 2, 0]} colliders={RigidBodyAutoCollider.ConvexHull}>
        <Clone object={nodes.pear} castShadow receiveShadow scale={.5} />
      </RigidBody>
    </group>
  );
};

export const ComponentsExample:Demo = ({ setUI }) => {
  setUI("");

  return (
    <group>
      <RigidBody rotation={[0, 0, 0.2]} colliders={RigidBodyAutoCollider.Cuboid}>
        <Box castShadow>
          <meshPhysicalMaterial />
        </Box>
        <Box position={[2, 0, 0]} scale={[1, 2, 1]} castShadow>
          <meshPhysicalMaterial />
        </Box>
      </RigidBody>

      {Array.from({length: 100}).map((_, i) => <Pear position={[0, 4 * i, 0]} key={i} />)}

      <Map />
    </group>
  );
};

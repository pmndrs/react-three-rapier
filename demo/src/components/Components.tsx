import React from "react";

import { Box, Clone, useGLTF } from "@react-three/drei";
import {
  ConvexHullCollider,
  CuboidCollider,
  RigidBody,
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
      <RigidBody position={[3, 0, 0]}>
        <primitive object={nodes.map} />;
        <TrimeshCollider
          args={[
            nodes.map.geometry.attributes.position.array,
            nodes.map?.geometry?.index?.array || [],
          ]}
        />
      </RigidBody>

      <RigidBody position={[10, 0, 0]}>
        <primitive object={nodes.map.clone(true)} />;
        <TrimeshCollider
          args={[
            nodes.map.geometry.attributes.position.array,
            nodes.map?.geometry?.index?.array || [],
          ]}
        />
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
    <group {...props}>
      <RigidBody position={[0, 2, 0]}>
        <Clone object={nodes.pear} castShadow receiveShadow />
        <ConvexHullCollider
          args={[nodes.pear.geometry.attributes.position.array]}
        />
      </RigidBody>
    </group>
  );
};

export const ComponentsExample:Demo = ({ setUI }) => {
  setUI("");

  return (
    <group>
      <RigidBody rotation={[0, 0, 0.2]}>
        <Box castShadow>
          <meshPhysicalMaterial />
        </Box>
        <Box position={[2, 0, 0]} scale={[1, 2, 1]} castShadow>
          <meshPhysicalMaterial />
        </Box>

        <CuboidCollider position={[0, 0, 0]} args={[0.5, 0.5, 0.5]} />
        <CuboidCollider position={[2, 0, 0]} args={[0.5, 1, 0.5]} />
      </RigidBody>

      {Array.from({length: 500}).map((_, i) => <Pear position={[0, 4 * i, 0]} key={i} />)}
      
      {/* <Pear position={[-2, 4, 0]} /> */}
      {/* <Pear position={[0, 4, 0]} /> */}

      <Map />
    </group>
  );
};

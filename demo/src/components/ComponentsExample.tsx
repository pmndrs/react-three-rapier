import React, { useMemo, useState } from "react";

import { Box, Clone, Sphere, useGLTF } from "@react-three/drei";
import { RigidBody, TrimeshCollider } from "@react-three/rapier";
import { GroupProps, Object3DNode, useFrame } from "@react-three/fiber";
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
    <group position={[0, -3, 0]} scale={0.2}>
      <RigidBody position={[0, -2, 0]}>
        <primitive object={nodes.map.clone(true)} position={[0, 0, 0]} />;
        <TrimeshCollider
          args={[
            nodes.map.geometry.attributes.position.array,
            nodes.map.geometry.index?.array || []
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
    <group {...props} scale={1}>
      <RigidBody position={[0, 2, 0]} colliders="hull">
        <Clone object={nodes.pear} castShadow receiveShadow />
      </RigidBody>
    </group>
  );
};

const Ball = () => {
  const [colliding, setColliding] = useState(false);

  return (
    <RigidBody
      colliders="ball"
      position={[5, 0, 0]}
      onCollisionEnter={({ manifold }) => {
        setColliding(true);
      }}
      onCollisionExit={() => setColliding(false)}
    >
      <Sphere castShadow>
        <meshPhysicalMaterial color={colliding ? "blue" : "green"} />
      </Sphere>
    </RigidBody>
  );
};

const CompoundShape = () => {
  const [asleep, setAsleep] = useState(false);

  return (
    <group scale={1}>
      <RigidBody colliders="cuboid" onSleep={() => setAsleep(true)}>
        <Box castShadow>
          <meshPhysicalMaterial color={asleep ? "red" : "white"} />
        </Box>
        <Box position={[2, 1, 1]} scale={[4, 1, 2]} castShadow>
          <meshPhysicalMaterial />
        </Box>
        <Box position={[7, 3, 0]} scale={4} castShadow>
          <meshPhysicalMaterial />
        </Box>
      </RigidBody>
    </group>
  );
};

export const ComponentsExample: Demo = () => {
  return (
    <group>
      <CompoundShape />
      <Pear />
      <Ball />
      <Map />
    </group>
  );
};

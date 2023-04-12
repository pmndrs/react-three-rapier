import React, { useMemo } from "react";

import { Html, useGLTF } from "@react-three/drei";
import {
  BallCollider,
  ConeCollider,
  ConvexHullCollider,
  CuboidCollider,
  RigidBody,
  TrimeshCollider
} from "@react-three/rapier";

import { Demo } from "../../App";
import { Mesh } from "three";

export const useSuzanne = () => {
  // @ts-ignore
  return useGLTF(
    new URL("../../models/susanne.glb", import.meta.url).toString()
  ) as {
    nodes: {
      Suzanne: Mesh;
    };
  };
};

const useOffsetTorus = () => {
  // @ts-ignore
  return useGLTF(
    new URL("../../models/offset-torus.glb", import.meta.url).toString()
  ) as {
    nodes: {
      Torus: Mesh;
    };
  };
};

const Suzanne = () => {
  const { nodes } = useSuzanne();

  return (
    <mesh
      castShadow
      geometry={nodes.Suzanne.geometry}
      material={nodes.Suzanne.material}
    />
  );
};

const OffsetTorus = () => {
  const { nodes } = useOffsetTorus();

  return (
    <mesh
      castShadow
      geometry={nodes.Torus.geometry}
      material={nodes.Torus.material}
    />
  );
};

export const AllShapesExample: Demo = () => {
  const { nodes } = useSuzanne();

  return (
    <>
      <group>
        <RigidBody colliders="cuboid">
          <Suzanne />
          <Html>Auto Cuboid</Html>
        </RigidBody>

        <RigidBody colliders="ball" position={[4, 0, 0]}>
          <Suzanne />
          <Html>Auto Ball</Html>
        </RigidBody>

        <RigidBody colliders="hull" position={[8, 0, 0]}>
          <Suzanne />
          <Html>Auto Hull</Html>
        </RigidBody>

        <RigidBody colliders="trimesh" position={[12, 0, 0]}>
          <Suzanne />
          <Html>Auto Trimesh</Html>
        </RigidBody>

        <RigidBody position={[0, 4, 0]}>
          <Suzanne />
          <CuboidCollider args={[1, 1, 1]} />
          <Html>Custom Cuboid</Html>
        </RigidBody>

        <RigidBody position={[4.1, 4, 0]}>
          <Suzanne />
          <BallCollider args={[1]} />
          <Html>Custom BallCollider</Html>
        </RigidBody>

        <RigidBody position={[8, 4, 0]}>
          <Suzanne />
          <ConeCollider args={[1, 1]} />
          <Html>Custom ConeCollider</Html>
        </RigidBody>

        <RigidBody position={[5, 8, 0]}>
          <Suzanne />
          <TrimeshCollider
            args={[
              nodes.Suzanne.geometry.attributes.position.array,
              nodes.Suzanne.geometry.index?.array || []
            ]}
            mass={1}
          />
          <Html>Custom TrimeshCollider</Html>
        </RigidBody>

        <RigidBody position={[0, 8, 0]}>
          <Suzanne />
          <ConvexHullCollider
            args={[nodes.Suzanne.geometry.attributes.position.array]}
          />
          <Html>Custom TrimeshCollider</Html>
        </RigidBody>

        <RigidBody position={[8, 8, 0]}>
          <Suzanne />
          <Html>Custom Combound shape</Html>

          <CuboidCollider args={[0.5, 0.5, 0.5]} position={[1, 1, 1]} />
          <BallCollider args={[0.5]} position={[-1, -1, 1]} />
        </RigidBody>

        <RigidBody position={[4, 10, 0]} colliders={"ball"}>
          <Suzanne />
          <Html>Auto and Custom Combound shape</Html>

          <CuboidCollider args={[0.5, 0.5, 0.5]} position={[1, 1, 1]} />
          <BallCollider args={[0.5]} position={[-1, -1, 1]} />
        </RigidBody>

        <group scale={1.5} position={[5, 10, 0]}>
          <RigidBody colliders="ball">
            <group position={[-2, -2, -2]} scale={1.2}>
              <OffsetTorus />
            </group>
            <Html>Mesh with offset geometry</Html>
          </RigidBody>
        </group>
      </group>
    </>
  );
};

/*
Auto-generated by: https://github.com/pmndrs/gltfjsx
*/

import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import type { GLTF } from "three-stdlib";
import { useRef } from "react";
import { Group, Mesh, MeshPhysicalMaterial, MeshStandardMaterial } from "three";
import { RigidBody } from "@react-three/rapier";

type GLTFResult = GLTF & {
  nodes: {
    plinko: Mesh;
    container: Mesh;
    wall: Mesh;
  };
  materials: {
    blue: MeshStandardMaterial;
    Material: MeshPhysicalMaterial;
    ["Material.001"]: MeshPhysicalMaterial;
  };
};

export default function Plinko({ ...props }: JSX.IntrinsicElements["group"]) {
  const group = useRef<Group>(null);

  const { nodes, materials } = useGLTF(
    // @ts-ignore
    new URL("plinko.glb", import.meta.url).toString()
  ) as unknown as GLTFResult;

  return (
    <group
      ref={group}
      {...props}
      dispose={null}
      rotation={[0, -1, 0]}
      scale={1}
    >
      <RigidBody type="fixed" colliders="trimesh" position={[0, 1, 0]}>
        <group scale={1}>
          <mesh
            geometry={nodes.plinko.geometry}
            material={materials.blue}
            material-color="blue"
            castShadow
            receiveShadow
            rotation={[0, 0, 0.4]}
            position={[0, 7.58, -1.06]}
          />
        </group>
      </RigidBody>
      <RigidBody type="fixed" colliders={"trimesh"}>
        <mesh
          geometry={nodes.container.geometry}
          material={materials.Material}
          castShadow
          rotation={[0, 1, 0]}
        />
      </RigidBody>
      <RigidBody type="fixed" colliders={"hull"}>
        <mesh
          geometry={nodes.wall.geometry}
          material={materials["Material.001"]}
          position={[0, -0.39, 0.44]}
        />
      </RigidBody>
    </group>
  );
}

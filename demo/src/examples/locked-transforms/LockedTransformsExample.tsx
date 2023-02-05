import { Box, Html, Sphere, Torus } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { RigidBody, RapierRigidBody } from "@react-three/rapier";
import { useControls } from "leva";
import { useEffect, useRef } from "react";
import { Demo } from "../../App";

export const LockedTransformsExample: Demo = () => {
  return (
    <group rotation={[0, 0, 0]} scale={1}>
      <RigidBody
        position={[0, 10, 0]}
        colliders="hull"
        lockRotations
        restitution={1}
      >
        <Torus castShadow scale={3} receiveShadow>
          <Html>Locked Rotations</Html>
          <meshPhysicalMaterial />
        </Torus>
      </RigidBody>

      <RigidBody
        position={[0, 5, 0]}
        colliders="hull"
        lockTranslations
        restitution={1}
      >
        <Torus castShadow scale={3} receiveShadow>
          <Html>Locked Translations</Html>
          <meshPhysicalMaterial />
        </Torus>
      </RigidBody>

      <RigidBody
        position={[0, 0, 0]}
        colliders="hull"
        enabledRotations={[true, false, false]}
        restitution={1}
      >
        <Torus castShadow scale={3} receiveShadow>
          <Html>Enabled Rotations [true, false, false]</Html>
          <meshPhysicalMaterial />
        </Torus>
      </RigidBody>

      <RigidBody
        position={[0, 15, 0]}
        colliders="hull"
        enabledTranslations={[true, false, false]}
        restitution={1}
      >
        <Torus castShadow scale={3} receiveShadow>
          <Html>Enabled translations [true, false, false]</Html>
          <meshPhysicalMaterial />
        </Torus>
      </RigidBody>
    </group>
  );
};

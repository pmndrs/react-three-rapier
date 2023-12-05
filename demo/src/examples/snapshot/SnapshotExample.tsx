import { Box, Sphere, useTexture } from "@react-three/drei";
import { RigidBody, useRapier } from "@react-three/rapier";
import { RepeatWrapping } from "three";
import { Demo } from "../../App";

import React, { useRef } from "react";

import { useControls, button } from "leva";

export const SnapshotExample: Demo = () => {
  const floor = useTexture(
    new URL("../damping/white.png", import.meta.url).toString()
  );
  const ramp = useTexture(
    new URL("../damping/red.png", import.meta.url).toString()
  );
  const ball = useTexture(
    new URL("../damping/green.png", import.meta.url).toString()
  );

  floor.wrapS = floor.wrapT = RepeatWrapping;

  const balls = Array.from(Array(10).keys());

  const { world, setWorld, rapier } = useRapier();
  const worldSnapshot = useRef<Uint8Array>();

  useControls({
    takeSnapshot: button(() => (worldSnapshot.current = world.takeSnapshot())),
    restoreSnapshot: button(
      () =>
        !!worldSnapshot.current &&
        setWorld(rapier.World.restoreSnapshot(worldSnapshot.current))
    )
  });

  return (
    <>
      <group>
        <RigidBody type="fixed" colliders="cuboid">
          <Box args={[40, 1, 100]} position={[18, -1, 25]}>
            <meshStandardMaterial map={floor} />
          </Box>
        </RigidBody>

        <RigidBody type="fixed" colliders="cuboid">
          <Box
            args={[40, 0.5, 14]}
            position={[18, 2, -5]}
            rotation={[Math.PI / 8, 0, 0]}
          >
            <meshStandardMaterial map={ramp} />
          </Box>
        </RigidBody>

        {balls.map((i) => (
          <RigidBody
            key={i}
            colliders="ball"
            position={[i * 3, 10, -10]}
            angularDamping={i / 10}
          >
            <Sphere>
              <meshStandardMaterial map={ball} />
            </Sphere>
          </RigidBody>
        ))}
      </group>
    </>
  );
};

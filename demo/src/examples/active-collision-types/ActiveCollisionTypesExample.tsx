import { ActiveCollisionTypes } from "@dimforge/rapier3d-compat";
import { Box, Sphere } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { RapierRigidBody, RigidBody } from "@react-three/rapier";
import { useRef, useState } from "react";
import { useResetOrbitControls } from "../../hooks/use-reset-orbit-controls";

const activeCollisionTypes =
  ActiveCollisionTypes.DEFAULT | ActiveCollisionTypes.KINEMATIC_FIXED;

const Ball = () => {
  const rb = useRef<RapierRigidBody>(null);

  const [color, setColor] = useState("blue");

  useFrame(({ clock: { elapsedTime } }) => {
    if (!rb.current) return;

    rb.current.setTranslation(
      { x: Math.sin(elapsedTime) * 3, y: 0, z: 0 },
      true
    );
  });

  return (
    <RigidBody
      ref={rb}
      colliders="ball"
      type="kinematicPosition"
      activeCollisionTypes={activeCollisionTypes}
      onCollisionEnter={() => setColor("green")}
      onCollisionExit={() => setColor("blue")}
    >
      <Sphere>
        <meshStandardMaterial color={color} />
      </Sphere>
    </RigidBody>
  );
};

const Wall = () => {
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <Box args={[0.5, 5, 2]}>
        <meshStandardMaterial color="white" transparent opacity={0.5} />
      </Box>
    </RigidBody>
  );
};

export const ActiveCollisionTypesExample = () => {
  useResetOrbitControls(10);

  return (
    <group>
      <Ball />
      <Wall />
    </group>
  );
};

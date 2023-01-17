import React, { useEffect } from "react";
import {
  RigidBody,
  useAfterPhysicsStep,
  useBeforePhysicsStep,
  useRapier
} from "@react-three/rapier";
import { Box } from "@react-three/drei";
import { useControls, button } from "leva";
import { useDemo } from "../../App";

export const ManualStepExample = () => {
  const { setPaused } = useDemo();
  const { step } = useRapier();

  useControls({
    step: button(() => {
      step(1 / 60);
    })
  });

  useEffect(() => {
    setPaused?.(true);
  }, []);

  useBeforePhysicsStep(() => {
    console.log("before step");
  });

  useAfterPhysicsStep(() => {
    console.log("after step");
  });

  return (
    <group>
      <RigidBody linearVelocity={[10, 10, 0]}>
        <Box />
      </RigidBody>
    </group>
  );
};

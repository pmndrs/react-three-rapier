import React, { useEffect, useRef } from "react";
import {
  RigidBody,
  useAfterPhysicsStep,
  useBeforePhysicsStep,
  useRapier
} from "@react-three/rapier";
import { Box } from "@react-three/drei";
import { useControls, button } from "leva";
import { useDemo } from "../../App";
import { resetOrbitControl } from "../../hooks/resetOrbitControl";

export const ManualStepExample = () => {
  const { setPaused } = useDemo();
  const { step } = useRapier();

  const steps = useRef({
    before: 0,
    after: 0
  });

  useControls({
    step: button(() => {
      step(1 / 60);
    })
  });

  useEffect(() => {
    setPaused?.(true);
  }, []);

  useBeforePhysicsStep(() => {
    steps.current.before++;
    console.log("before step", steps.current.before);
  });

  useAfterPhysicsStep(() => {
    steps.current.after++;
    console.log("after step", steps.current.after);
  });

  resetOrbitControl(30);

  return (
    <group>
      <RigidBody linearVelocity={[10, 10, 0]}>
        <Box />
      </RigidBody>
    </group>
  );
};

import { Box } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { RapierRigidBody, RigidBody, euler, quat } from "@react-three/rapier";
import { Demo } from "../../App";
import { useRef, useState } from "react";
import { useControls } from "leva";
import { resetOrbitControl } from "../../hooks/resetOrbitControl";

export const ImmutablePropsExample: Demo = () => {
  const [canSleep, setCanSleep] = useState(true);
  const rb = useRef<RapierRigidBody>(null);
  resetOrbitControl(30);
  useControls({
    canSleep: {
      value: canSleep,
      onChange: (v) => setCanSleep(v)
    }
  });

  useFrame(() => {
    let rot = performance.now() / 1000;
    rb.current!.setRotation(
      quat().setFromEuler(euler({ x: 0, y: rot, z: 0 })),
      true
    );
  });

  return (
    <group>
      <RigidBody type="fixed" ref={rb} canSleep={canSleep}>
        <Box />
      </RigidBody>
    </group>
  );
};

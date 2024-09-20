import { Box, KeyboardControls, Sphere, Text, Torus } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { RigidBody, RapierRigidBody } from "@react-three/rapier";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { Euler, Quaternion, RGB_PVRTC_2BPPV1_Format } from "three";
import { Demo } from "../../App";
import { resetOrbitControl } from "../../hooks/resetOrbitControl";
import { degToRad } from "three/src/math/MathUtils";
import { KinematicCharacterController } from "./KinematicCharacterController";

const Floor = () => {
  return (
    <RigidBody type="fixed">
      <Box args={[40, 0.5, 40]} position={[0, -0.25, 0]} receiveShadow>
        <meshStandardMaterial color={"green"} />
      </Box>
    </RigidBody>
  );
};

const Stairs = ({
  steps = 10,
  stepHeight = 0.2,
  stepWidth = 0.2,
  position,
  ...props
}) => {
  const stairs = useMemo(() => {
    const stairElements = [];
    for (let i = 0; i < steps; i++) {
      stairElements.push(
        <Box
          key={i}
          args={[4, stepHeight, stepWidth]}
          position={[0, i * stepHeight, -i * stepWidth]}
          receiveShadow
        >
          <meshStandardMaterial color="gray" />
        </Box>
      );
    }
    return stairElements;
  }, [steps, stepHeight, stepWidth]);

  return (
    <>
      <group position={position} rotation={[0, Math.PI, 0]}>
        <Suspense fallback={null}>
          <group position={[0, 6, 0]}>
            <Text fontSize={0.4}>{`stepWidth:${stepWidth}
stepHeight:${stepHeight}
        `}</Text>
          </group>
        </Suspense>
        <RigidBody type="fixed" {...props}>
          {stairs}
        </RigidBody>
      </group>
    </>
  );
};

const Slope = ({ angle, ...props }) => {
  return (
    <>
      <Suspense fallback={null}>
        <group position={[0, 6, 0]}>
          <Text position={props.position}>{angle + "deg"}</Text>
        </group>
      </Suspense>
      <RigidBody type="fixed" {...props}>
        <Box
          args={[5, 0.5, 100]}
          position={[0, -0.25, 0]}
          rotation={[degToRad(angle), 0, 0]}
          receiveShadow
        >
          <meshStandardMaterial color={"pink"} />
        </Box>
      </RigidBody>
    </>
  );
};

const Ball = ({ x }) => {
  const rb = useRef<RapierRigidBody>(null);

  const restartBall = () => {
    rb.current?.setTranslation({ x: x, y: 7, z: -10 }, true);
    rb.current?.setLinvel({ x: 0, y: 0, z: 5 }, true);
  };

  useFrame(() => {
    if (rb.current) {
      const translation = rb.current.translation();
      if (translation.z > 20 || translation.y < -4) {
        restartBall();
      }
    }
  });

  useEffect(() => {
    restartBall();
  });

  return (
    <RigidBody ref={rb} colliders="ball" restitution={0.8}>
      <Sphere castShadow args={[0.25]} />
    </RigidBody>
  );
};

export const KinematicCharacterControllerExample: Demo = () => {
  resetOrbitControl(30);

  const keyboardMap = useMemo(
    () => [
      { name: "forward", keys: ["ArrowUp", "KeyW"] },
      { name: "back", keys: ["ArrowDown", "KeyS"] },
      { name: "left", keys: ["ArrowLeft", "KeyA"] },
      { name: "right", keys: ["ArrowRight", "KeyD"] },
      { name: "jump", keys: ["Space"] }
    ],
    []
  );

  const DynamicBalls = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => {
      return <Ball key={i} x={i * 0.75} />;
    });
  }, []);

  return (
    <>
      <group rotation={[0, 0, 0]} scale={1}>
        <Floor />
        <Stairs position={[15, 0, 10]} stepWidth={0.9} stepHeight={0.45} />
        <Stairs position={[10, 0, 10]} stepWidth={0.9} stepHeight={0.45} />
        <Stairs position={[5, 0, 10]} stepWidth={0.19} stepHeight={0.5} />
        <Stairs position={[-5, 0, 10]} stepWidth={0.9} stepHeight={0.2} />
        <Stairs position={[-10, 0, 10]} stepWidth={0.9} stepHeight={0.2} />
        <Stairs position={[-15, 0, 10]} stepWidth={0.9} stepHeight={0.1} />
        <Slope position={[-10, 0, -10]} angle={5} />
        <Slope position={[-5, 0, -10]} angle={15} />
        <Slope position={[0, 0, -10]} angle={30} />
        <Slope position={[5, 0, -10]} angle={45} />
        <Slope position={[10, 0, -10]} angle={60} />
        {DynamicBalls}
      </group>
      <KeyboardControls map={keyboardMap}>
        <KinematicCharacterController
          kinematicMode="position"
          autostepMaxHeight={1}
          autostepMinWidth={0.1}
          moveForce={10}
        />
      </KeyboardControls>
    </>
  );
};

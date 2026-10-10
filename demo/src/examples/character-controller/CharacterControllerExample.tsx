import { Box, Sphere } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {
  CapsuleCollider,
  CharacterController,
  CharacterControllerRef,
  RapierRigidBody,
  RigidBody,
  useBeforePhysicsStep
} from "@react-three/rapier";
import { useEffect, useMemo, useRef } from "react";
import { MathUtils } from "three";
import { Demo } from "../../App";
import { useResetOrbitControls } from "../../hooks/use-reset-orbit-controls";

// Course layout idea originally by @AlaricBaraou in pmndrs/react-three-rapier#702.

const Stairs = ({
  steps = 10,
  stepHeight = 0.2,
  stepDepth = 0.9,
  position
}: {
  steps?: number;
  stepHeight?: number;
  stepDepth?: number;
  position: [number, number, number];
}) => (
  <RigidBody type="fixed" position={position} colliders="cuboid">
    {Array.from({ length: steps }, (_, i) => (
      <Box
        key={i}
        args={[4, stepHeight, stepDepth]}
        position={[0, stepHeight / 2 + i * stepHeight, -i * stepDepth]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="gray" />
      </Box>
    ))}
  </RigidBody>
);

const Slope = ({
  angle,
  position
}: {
  angle: number;
  position: [number, number, number];
}) => (
  <RigidBody
    type="fixed"
    position={position}
    rotation={[MathUtils.degToRad(angle), 0, 0]}
    colliders="cuboid"
  >
    <Box args={[4, 0.5, 20]} receiveShadow>
      <meshStandardMaterial color="pink" />
    </Box>
  </RigidBody>
);

const Ball = ({ x }: { x: number }) => {
  const rb = useRef<RapierRigidBody>(null);

  const restart = () => {
    rb.current?.setTranslation({ x, y: 7, z: -10 }, true);
    rb.current?.setLinvel({ x: 0, y: 0, z: 5 }, true);
  };

  useEffect(restart, []);
  useFrame(() => {
    const t = rb.current?.translation();
    if (t && (t.z > 25 || t.y < -4)) restart();
  });

  return (
    <RigidBody ref={rb} colliders="ball" restitution={0.8}>
      <Sphere castShadow args={[0.25]}>
        <meshStandardMaterial color="orange" />
      </Sphere>
    </RigidBody>
  );
};

const useKeys = () => {
  const keys = useRef(new Set<string>());
  useEffect(() => {
    const down = (e: KeyboardEvent) => keys.current.add(e.code);
    const up = (e: KeyboardEvent) => keys.current.delete(e.code);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);
  return keys;
};

const SPEED = 5;
const JUMP_SPEED = 7;
const GRAVITY = -20;

const Player = () => {
  const ref = useRef<CharacterControllerRef>(null);
  const keys = useKeys();
  // Vertical velocity is userland: Rapier's controller only resolves movement.
  const verticalVelocity = useRef(0);
  const jumpQueued = useRef(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") jumpQueued.current = true;
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Runs once per fixed physics step, so the motion is framerate independent.
  useBeforePhysicsStep((world) => {
    const character = ref.current;
    if (!character) return;
    const dt = world.timestep;
    const k = keys.current;

    const x =
      (k.has("KeyD") || k.has("ArrowRight") ? 1 : 0) -
      (k.has("KeyA") || k.has("ArrowLeft") ? 1 : 0);
    const z =
      (k.has("KeyS") || k.has("ArrowDown") ? 1 : 0) -
      (k.has("KeyW") || k.has("ArrowUp") ? 1 : 0);
    const len = Math.hypot(x, z) || 1;

    if (character.grounded && verticalVelocity.current < 0) {
      verticalVelocity.current = 0;
    }
    if (jumpQueued.current && character.grounded) {
      verticalVelocity.current = JUMP_SPEED;
    }
    jumpQueued.current = false;
    verticalVelocity.current += GRAVITY * dt;

    character.setVelocity({
      x: (x / len) * SPEED,
      y: verticalVelocity.current,
      z: (z / len) * SPEED
    });
  });

  return (
    <CharacterController
      ref={ref}
      position={[0, 2, 5]}
      autostep={{ maxHeight: 0.5, minWidth: 0.1 }}
      snapToGround={0.3}
      maxSlopeClimbAngle={MathUtils.degToRad(50)}
      minSlopeSlideAngle={MathUtils.degToRad(55)}
      applyImpulsesToDynamicBodies
      characterMass={1}
      onGrounded={() => console.log("grounded")}
      onAirborne={() => console.log("airborne")}
    >
      <CapsuleCollider args={[0.5, 0.35]} />
      <mesh castShadow position={[0, 0, 0]}>
        <capsuleGeometry args={[0.35, 1]} />
        <meshStandardMaterial color="royalblue" />
      </mesh>
    </CharacterController>
  );
};

/**
 * WASD / arrows to move, Space to jump. Stairs of varying height on the
 * left and right, slopes of increasing angle in front, bouncing balls to push.
 */
export const CharacterControllerExample: Demo = () => {
  useResetOrbitControls(30, [0, 1, 1]);

  const balls = useMemo(
    () => Array.from({ length: 10 }, (_, i) => <Ball key={i} x={i * 0.75} />),
    []
  );

  return (
    <>
      <RigidBody type="fixed" position={[0, -0.25, 0]}>
        <Box args={[60, 0.5, 60]} receiveShadow>
          <meshStandardMaterial color="seagreen" />
        </Box>
      </RigidBody>

      <Stairs position={[-15, 0, 18]} stepHeight={0.1} />
      <Stairs position={[-10, 0, 18]} stepHeight={0.2} />
      <Stairs position={[-5, 0, 18]} stepHeight={0.45} />
      <Stairs position={[5, 0, 18]} stepHeight={0.5} stepDepth={0.2} />
      <Stairs position={[10, 0, 18]} stepHeight={0.45} />

      <Slope position={[-10, 1, -10]} angle={5} />
      <Slope position={[-5, 1, -10]} angle={15} />
      <Slope position={[0, 1, -10]} angle={30} />
      <Slope position={[5, 1, -10]} angle={45} />
      <Slope position={[10, 1, -10]} angle={60} />

      {balls}
      <Player />
    </>
  );
};

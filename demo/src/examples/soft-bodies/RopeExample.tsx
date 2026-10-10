import { RapierRigidBody, RigidBody } from "@react-three/rapier";
import { SoftBody } from "@react-three/rapier/soft-bodies";
import { useMemo, useRef } from "react";
import { BufferGeometry, Vector3 } from "three";
import { Demo } from "../../App";
import { useResetOrbitControls } from "../../hooks/use-reset-orbit-controls";

const POINTS = 24;
const LENGTH = 5;

/**
 * A rope built from the points of a line: pinned at one end, with a heavy
 * ball attached to its free end.
 */
export const RopeExample: Demo = () => {
  useResetOrbitControls(10, [0, 3, 0]);
  const ball = useRef<RapierRigidBody>(null);

  const geometry = useMemo(
    () =>
      new BufferGeometry().setFromPoints(
        Array.from(
          { length: POINTS },
          (_, i) => new Vector3((i / (POINTS - 1)) * LENGTH, 6, 0)
        )
      ),
    []
  );

  return (
    <>
      {/* the ball is declared first so it exists when the rope attaches to it */}
      <RigidBody ref={ball} colliders="ball" position={[LENGTH, 6, 0]} mass={4}>
        <mesh castShadow>
          <sphereGeometry args={[0.35]} />
          <meshStandardMaterial color="#e76f51" />
        </mesh>
      </RigidBody>

      <SoftBody
        type="rope"
        stiffness={30}
        damping={0.8}
        pinned={[0]}
        attachments={[{ particles: [POINTS - 1], body: ball }]}
      >
        <line>
          <primitive object={geometry} attach="geometry" />
          <lineBasicMaterial color="#222" />
        </line>
      </SoftBody>
    </>
  );
};

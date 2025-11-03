import { Sphere } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import {
  CuboidCollider,
  RapierCollider,
  RapierRigidBody,
  RigidBody,
  useBeforePhysicsStep,
  useFilterContactPair,
  useRapier
} from "@react-three/rapier";
import { useEffect, useRef } from "react";
import { Vector3 } from "three";
import { Demo } from "../../App";
import { useControls } from "leva";

export const OneWayPlatform: Demo = () => {
  const platformRef = useRef<RapierRigidBody>(null);
  const colliderRef = useRef<RapierCollider>(null);
  const ballRef = useRef<RapierRigidBody>(null);
  const { camera } = useThree();

  const { filteringEnabled } = useControls("One-Way Platform", {
    filteringEnabled: {
      value: true,
      label: "Enable Filtering"
    }
  });

  // Cache for storing body states before physics step
  const bodyStateCache = useRef<
    Map<number, { position: Vector3; velocity: Vector3 }>
  >(new Map());

  useEffect(() => {
    camera.position.set(0, 10, 20);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();

    window.addEventListener("click", () => {
      ballRef.current?.applyImpulse(new Vector3(0, 50, 0), true);
    });
  }, []);

  const { rapier } = useRapier();

  // Cache body states BEFORE the physics step
  useBeforePhysicsStep(() => {
    if (platformRef.current && ballRef.current) {
      const platformHandle = platformRef.current.handle;
      const ballHandle = ballRef.current.handle;

      const platformPos = platformRef.current.translation();
      const ballPos = ballRef.current.translation();
      const ballVel = ballRef.current.linvel();

      bodyStateCache.current.set(platformHandle, {
        position: new Vector3(platformPos.x, platformPos.y, platformPos.z),
        velocity: new Vector3(0, 0, 0)
      });

      bodyStateCache.current.set(ballHandle, {
        position: new Vector3(ballPos.x, ballPos.y, ballPos.z),
        velocity: new Vector3(ballVel.x, ballVel.y, ballVel.z)
      });
    }
  });

  useFilterContactPair((c1: number, c2: number, b1: number, b2: number) => {
    try {
      // If filtering is disabled, let default collision behavior happen
      if (!filteringEnabled) {
        return null;
      }

      // Use cached states instead of querying the world
      const state1 = bodyStateCache.current.get(b1);
      const state2 = bodyStateCache.current.get(b2);

      if (!state1 || !state2) {
        return null; // Let default behavior happen
      }

      // Determine which is platform and which is ball
      let platformState, ballState;

      if (
        platformRef.current?.handle === b1 &&
        ballRef.current?.handle === b2
      ) {
        platformState = state1;
        ballState = state2;
      } else if (
        platformRef.current?.handle === b2 &&
        ballRef.current?.handle === b1
      ) {
        platformState = state2;
        ballState = state1;
      } else {
        return null; // Not our platform/ball pair
      }

      // Allow collision only if the ball is moving downwards and above the platform
      if (
        ballState.velocity.y < 0 &&
        ballState.position.y > platformState.position.y
      ) {
        return rapier.SolverFlags.COMPUTE_IMPULSE; // Process the collision
      }

      return rapier.SolverFlags.EMPTY; // Ignore the collision (pass through)
    } catch (error) {
      console.error(error);
      return null;
    }
  });

  useEffect(() => {
    if (colliderRef.current) {
      colliderRef.current.setActiveHooks(
        filteringEnabled ? rapier.ActiveHooks.FILTER_CONTACT_PAIRS : 0
      );
    }
  }, [filteringEnabled, rapier]);

  return (
    <group>
      <RigidBody
        ref={ballRef}
        colliders="ball"
        position={[0, -5, 0]}
        userData={{ type: "ball" }}
      >
        <Sphere castShadow receiveShadow>
          <meshPhysicalMaterial color="red" />
        </Sphere>
      </RigidBody>
      <mesh>
        <boxGeometry args={[10, 0.1, 10]} />
        <meshStandardMaterial
          color={filteringEnabled ? "orange" : "grey"}
          opacity={0.5}
          transparent={true}
        />
      </mesh>
      <RigidBody type="fixed" userData={{ type: "platform" }} ref={platformRef}>
        <CuboidCollider args={[10, 0.1, 10]} ref={colliderRef} />
      </RigidBody>
    </group>
  );
};

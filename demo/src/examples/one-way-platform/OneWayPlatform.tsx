import { Sphere } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import {
  CuboidCollider,
  RapierCollider,
  RapierRigidBody,
  RigidBody,
  useRapier
} from "@react-three/rapier";
import { useCallback, useEffect, useRef } from "react";
import { Vector3 } from "three";
import { Demo } from "../../App";

export const OneWayPlatform: Demo = () => {
  const ref = useRef<RapierRigidBody>(null);
  const collider = useRef<RapierCollider>(null);

  const ball = useRef<RapierRigidBody>(null);
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 10, 20);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();

    window.addEventListener("click", () => {
      ball.current?.applyImpulse(new Vector3(0, 50, 0), true);
    });
  }, []);

  const { filterContactPairHooks, world } = useRapier();

  const hook = useCallback(
    (c1: number, c2: number, b1: number, b2: number) => {
      try {
        const collider1 = world.getCollider(c1);
        const collider2 = world.getCollider(c2);

        const body1 = world.getRigidBody(b1);
        const body2 = world.getRigidBody(b2);

        if (
          (body1.userData as any)?.type &&
          (body1.userData as any).type === "platform" &&
          (body2.userData as any)?.type &&
          (body2.userData as any)?.type === "ball"
        ) {
          // Once we get try to get access to the ball and platform, the "hook" that we pass to filterContactPairHooks crashes

          // why does this crash here? what's wrong with the below setup?
          const platformPosition = body1.translation();
          const ballVelocity = body2.linvel();
          const ballPosition = body2.translation();

          // also doesn't work
          // const platformPosition = ref.current!.translation();
          // const ballVelocity = ball.current!.linvel();
          // const ballPosition = ref.current!.translation();

          // Allow collision if the ball is moving downwards and above the platform
          if (ballVelocity.y < 0 && ballPosition.y > platformPosition.y) {
            return 1; // Process the collision
          }
        }

        return 0; // Ignore the collision
      } catch (error) {
        console.log(error);
        return null;
      }
    },
    [world]
  );

  useEffect(() => {
    collider.current?.setActiveHooks(1);
    filterContactPairHooks.push(hook);
  }, []);

  return (
    <group>
      <RigidBody
        ref={ball}
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
        <meshStandardMaterial color={"grey"} opacity={0.5} transparent={true} />
      </mesh>
      <RigidBody type="fixed" userData={{ type: "platform" }} ref={ref}>
        <CuboidCollider args={[10, 0.1, 10]} ref={collider} />
      </RigidBody>
    </group>
  );
};

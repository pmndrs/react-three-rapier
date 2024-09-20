import { Box, Capsule, Cone, useKeyboardControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {
  BallCollider,
  CapsuleCollider,
  CuboidCollider,
  interactionGroups,
  RigidBody,
  useRapier
} from "@react-three/rapier";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Quaternion, Vector3 } from "three";

const CAMERA_OFFSET = new Vector3(0, 3, -10);

export const KinematicCharacterController = ({
  gravity = 9.81,
  height = 0.5,
  radius = 0.25,
  rotationForce = Math.PI / 3,
  jumpForce = 0.3,
  moveForce = 5,
  damping = 0.5,
  maxSlopeClimbAngle = 45,
  minSlopeSlideAngle = 30,
  slideEnabled = true,
  enableAutostepOnDynamic = true,
  autostepMaxHeight = 0.5,
  autostepMinWidth = 0.2,
  distanceSnapToGround = 0.5,
  applyImpulsesToDynamicBodies = true,
  characterMass = 1,
  characterControllerOffset = 0.01,
  kinematicMode = "position"
}) => {
  const refCollider = useRef();
  const rigidBodyRef = useRef(null);
  const isGroundedRef = useRef(false);
  const refCharacterModel = useRef(null);
  const canJumpRef = useRef(false);
  // const currentYRotation = useRef(0)
  const allIntersections = useRef(new Map()).current;
  const currentPos = useRef(new Vector3(0, 10, 0)).current;
  const startingPos = useRef(new Vector3(0, 10, 0)).current;
  const nextTranslation = useRef(new Vector3(0, 0, 0)).current;
  const computedMovement = useRef(new Vector3(0, 0, 0)).current;
  const velocityWorld = useRef(new Vector3(0, 0, 0)).current;
  const velocityLocal = useRef(new Vector3(0, 0, 0)).current;
  const invQuaternion = useRef(new Quaternion()).current;
  const [characterController, setCharacterController] = useState();
  const { world, rapier, colliderStates, colliderEvents } = useRapier();

  const [, getKeyboardControls] = useKeyboardControls();

  useEffect(() => {
    if (!world || !rapier) return;

    const characterController = world.createCharacterController(
      characterControllerOffset
    );

    characterController.setSlideEnabled(slideEnabled); // Allow sliding down hill
    characterController.setMaxSlopeClimbAngle(maxSlopeClimbAngle); // Don’t allow climbing slopes larger than 45 degrees.
    characterController.setMinSlopeSlideAngle(minSlopeSlideAngle); // Automatically slide down on slopes smaller than 30 degrees.
    characterController.enableAutostep(
      autostepMaxHeight,
      autostepMinWidth,
      enableAutostepOnDynamic
    ); // (maxHeight, minWidth, includeDynamicBodies) Stair behavior
    characterController.enableSnapToGround(distanceSnapToGround); // (distance) Set ground snap behavior
    characterController.setApplyImpulsesToDynamicBodies(
      applyImpulsesToDynamicBodies
    ); // Add push behavior
    characterController.setCharacterMass(characterMass); // (mass) Set character mass

    setCharacterController(characterController);

    return () => {
      world.removeCharacterController(characterController);
    };
  }, [world, rapier]);

  useFrame(({ camera }, delta) => {
    if (!characterController || !refCollider.current || !rigidBodyRef.current)
      return;

    isGroundedRef.current = characterController.computedGrounded();
    const { left, right, forward, back, jump } = getKeyboardControls();

    if (kinematicMode === "position") {
      if (isGroundedRef.current) {
        // velocityWorld.y = 0
      } else {
        velocityWorld.y -= (delta * gravity) / 9.81;
      }

      if (left || right) {
        if (left && !right) {
          refCharacterModel.current.rotateY(rotationForce * delta);
        } else if (right && !left) {
          refCharacterModel.current.rotateY(-rotationForce * delta);
        }
      }

      invQuaternion.copy(refCharacterModel.current.quaternion).invert();
      velocityLocal.copy(velocityWorld).applyQuaternion(invQuaternion);

      if (forward || back) {
        if (forward && !back) {
          velocityLocal.z += moveForce * delta;
        } else if (back && !forward) {
          velocityLocal.z -= moveForce * delta;
        }
      }

      velocityLocal.x *= damping;
      velocityLocal.z *= damping;

      invQuaternion.copy(refCharacterModel.current.quaternion).invert();
      velocityWorld
        .copy(velocityLocal)
        .applyQuaternion(refCharacterModel.current.quaternion);

      if (jump && canJumpRef.current) {
        velocityWorld.y = jumpForce;
      }

      characterController.computeColliderMovement(
        refCollider.current,
        velocityWorld,
        rapier.QueryFilterFlags.EXCLUDE_SENSORS
      );
      nextTranslation.copy(rigidBodyRef.current.translation());
      computedMovement.copy(characterController.computedMovement());
      // console.log('computedMovement',computedMovement.toArray().join(','),velocityWorld.toArray().join(','))
      nextTranslation.add(computedMovement);
      velocityWorld.copy(computedMovement);
      rigidBodyRef.current.setNextKinematicTranslation(nextTranslation);
    } else {
      velocityWorld.copy(rigidBodyRef.current.linvel());
      velocityWorld.multiplyScalar(world.timestep);

      //velocity
      if (isGroundedRef.current) {
        // velocityWorld.y = 0
      } else {
        velocityWorld.y -= (delta * gravity) / 9.81;
      }

      if (left || right) {
        if (left && !right) {
          refCharacterModel.current.rotateY(rotationForce * delta);
        } else if (right && !left) {
          refCharacterModel.current.rotateY(-rotationForce * delta);
        }
      }

      invQuaternion.copy(refCharacterModel.current.quaternion).invert();
      velocityLocal.copy(velocityWorld).applyQuaternion(invQuaternion);

      if (forward || back) {
        if (forward && !back) {
          velocityLocal.z += moveForce * delta;
        } else if (back && !forward) {
          velocityLocal.z -= moveForce * delta;
        }
      }

      velocityLocal.x *= damping;
      velocityLocal.z *= damping;

      invQuaternion.copy(refCharacterModel.current.quaternion).invert();
      velocityWorld
        .copy(velocityLocal)
        .applyQuaternion(refCharacterModel.current.quaternion);

      if (jump && canJumpRef.current) {
        velocityWorld.y = jumpForce;
      }

      characterController.computeColliderMovement(
        refCollider.current,
        velocityWorld,
        rapier.QueryFilterFlags.EXCLUDE_SENSORS
      );
      computedMovement.copy(characterController.computedMovement());
      velocityWorld.copy(computedMovement);
      velocityWorld.divideScalar(world.timestep);
      rigidBodyRef.current.setLinvel(velocityWorld);
    }

    currentPos.copy(rigidBodyRef.current.translation());
    camera.position
      .copy(CAMERA_OFFSET)
      .applyQuaternion(refCharacterModel.current.quaternion)
      .add(currentPos);
    camera.lookAt(currentPos);
  });

  const handleFloorSensorEnter = useCallback((e) => {
    allIntersections.set(e.other.collider.handle, true);
    console.log("allIntersections", allIntersections.size);
    canJumpRef.current = allIntersections.size > 0;
  }, []);

  const handleFloorSensorExit = useCallback((e) => {
    allIntersections.delete(e.other.collider.handle);
    console.log("allIntersections", allIntersections.size);
    canJumpRef.current = allIntersections.size > 0;
  }, []);

  return (
    <>
      <RigidBody
        position={startingPos}
        colliders={false}
        canSleep={false}
        enabledRotations={[false, false, false]}
        ref={rigidBodyRef}
        // onCollisionEnter={handleOnCollisionEnter}
        type={
          kinematicMode === "position"
            ? "kinematicPosition"
            : "kinematicVelocity"
        }
        name={"Player"}
        ccd={true}
      >
        {/* add model character here */}
        {/* capsule is a placeholer */}
        <Capsule ref={refCharacterModel} args={[radius, height]}>
          <Box
            args={[0.2, 0.2, 0.5]}
            position={[0, height / 2 + radius / 2, -radius / 2]}
            rotation={[0, 0, Math.PI / 2]}
          />
        </Capsule>
        <CapsuleCollider ref={refCollider} args={[height / 2, radius]} />
        <BallCollider
          sensor
          position={[0, -height / 2 - radius / 2, 0]}
          args={[radius]}
          onIntersectionEnter={handleFloorSensorEnter}
          onIntersectionExit={handleFloorSensorExit}
          // collisionGroups={interactionGroups(0)}
          activeCollisionTypes={
            rapier.ActiveCollisionTypes.DEFAULT |
            rapier.ActiveCollisionTypes.KINEMATIC_FIXED |
            rapier.ActiveCollisionTypes.KINEMATIC_KINEMATIC
          }
        />
      </RigidBody>

      {/* <CuboidCollider
        position={[0, 0, 1]}
        args={[5, 3, 1]}
        sensor
        onIntersectionEnter={() => {
          console.log(true);
        }}
        onIntersectionExit={() => console.log(false)}
      /> */}
    </>
  );
};

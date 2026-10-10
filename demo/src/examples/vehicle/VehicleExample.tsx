import { Box, Cylinder } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {
  CuboidCollider,
  RapierRigidBody,
  RigidBody,
  useBeforePhysicsStep,
  useRapier
} from "@react-three/rapier";
import { useEffect, useRef } from "react";
import { Group } from "three";
import { Demo, useDemo } from "../../App";
import { useResetOrbitControls } from "../../hooks/use-reset-orbit-controls";

/**
 * A raycast vehicle built straight on Rapier's DynamicRayCastVehicleController. There is no
 * <Vehicle /> component on purpose: this file is meant to be copied and adapted.
 *
 * Drive with WASD / arrow keys, brake with Space.
 */

const WHEEL_RADIUS = 0.4;
const SUSPENSION_REST_LENGTH = 0.35;

// Wheel hard points in chassis space. The first two are the steered front wheels.
const WHEELS: [number, number, number][] = [
  [-0.95, -0.1, 1.3],
  [0.95, -0.1, 1.3],
  [-0.95, -0.1, -1.3],
  [0.95, -0.1, -1.3]
];

const useKeys = () => {
  const keys = useRef(new Set<string>());

  useEffect(() => {
    const down = (e: KeyboardEvent) => keys.current.add(e.code);
    const up = (e: KeyboardEvent) => keys.current.delete(e.code);
    const blur = () => keys.current.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);

  return keys;
};

const Vehicle = () => {
  const { rapier, world } = useRapier();
  const chassis = useRef<RapierRigidBody>(null);
  const controller = useRef<ReturnType<typeof world.createVehicleController> | null>(null);
  const wheelGroups = useRef<(Group | null)[]>([]);
  const wheelSpin = useRef<(Group | null)[]>([]);
  const keys = useKeys();
  const { orbitControlRef } = useDemo();

  useEffect(() => {
    const body = chassis.current;
    if (!body) return;

    const vehicle = world.createVehicleController(body);
    // the controller defaults to y-up, z-forward
    WHEELS.forEach(([x, y, z]) => {
      vehicle.addWheel(
        { x, y, z },
        { x: 0, y: -1, z: 0 }, // suspension direction
        { x: -1, y: 0, z: 0 }, // axle
        SUSPENSION_REST_LENGTH,
        WHEEL_RADIUS
      );
    });
    for (let i = 0; i < WHEELS.length; i++) {
      vehicle.setWheelSuspensionStiffness(i, 24);
      vehicle.setWheelMaxSuspensionTravel(i, 0.3);
      vehicle.setWheelFrictionSlip(i, 2.5);
      vehicle.setWheelSideFrictionStiffness(i, 1);
    }
    controller.current = vehicle;

    return () => {
      controller.current = null;
      world.removeVehicleController(vehicle);
    };
  }, [world]);

  useBeforePhysicsStep((world) => {
    const vehicle = controller.current;
    if (!vehicle) return;

    const k = keys.current;
    const forward = (k.has("KeyW") || k.has("ArrowUp") ? 1 : 0) -
      (k.has("KeyS") || k.has("ArrowDown") ? 1 : 0);
    const steer = (k.has("KeyA") || k.has("ArrowLeft") ? 1 : 0) -
      (k.has("KeyD") || k.has("ArrowRight") ? 1 : 0);
    const brake = k.has("Space") ? 1 : 0;

    for (let i = 0; i < WHEELS.length; i++) {
      vehicle.setWheelEngineForce(i, forward * 12);
      vehicle.setWheelBrake(i, brake * 1.5);
    }
    vehicle.setWheelSteering(0, steer * 0.5);
    vehicle.setWheelSteering(1, steer * 0.5);

    // EXCLUDE_SENSORS: wheel rays ignore sensor colliders. Without it the green trigger zone
    // below would be treated as ground (#693).
    vehicle.updateVehicle(
      world.timestep,
      rapier.QueryFilterFlags.EXCLUDE_SENSORS
    );
  });

  // Wheel meshes are children of the chassis body, so they live in chassis space - exactly
  // what the controller reports - and follow its (interpolated) transform.
  useFrame(() => {
    const vehicle = controller.current;
    if (!vehicle) return;

    // keep the orbit camera centred on the car while preserving the user's view offset
    const controls = orbitControlRef?.current;
    const body = chassis.current;
    if (controls && body) {
      const { x, y, z } = body.translation();
      controls.object.position.x += x - controls.target.x;
      controls.object.position.y += y - controls.target.y;
      controls.object.position.z += z - controls.target.z;
      controls.target.set(x, y, z);
      controls.update();
    }

    for (let i = 0; i < WHEELS.length; i++) {
      const group = wheelGroups.current[i];
      const spin = wheelSpin.current[i];
      if (!group || !spin) continue;

      const [x, y, z] = WHEELS[i];
      const suspension = vehicle.wheelSuspensionLength(i) ?? SUSPENSION_REST_LENGTH;
      group.position.set(x, y - suspension, z);
      group.rotation.y = vehicle.wheelSteering(i) ?? 0;
      spin.rotation.x = vehicle.wheelRotation(i) ?? 0;
    }
  });

  return (
    <RigidBody
      ref={chassis}
      colliders={false}
      position={[0, 3, 0]}
      mass={150}
      canSleep={false}
      name="chassis"
    >
      <CuboidCollider args={[1, 0.35, 1.8]} />
      <Box args={[2, 0.7, 3.6]} castShadow receiveShadow>
        <meshStandardMaterial color="orangered" />
      </Box>
      <Box args={[1.6, 0.5, 1.7]} position={[0, 0.6, -0.2]} castShadow>
        <meshStandardMaterial color="#334" />
      </Box>

      {WHEELS.map((_, i) => (
        <group key={i} ref={(g) => void (wheelGroups.current[i] = g)}>
          <group ref={(g) => void (wheelSpin.current[i] = g)}>
            <Cylinder
              args={[WHEEL_RADIUS, WHEEL_RADIUS, 0.3, 24]}
              rotation={[0, 0, Math.PI / 2]}
              castShadow
            >
              <meshStandardMaterial color="#222" />
            </Cylinder>
            {/* a hub stripe so the spin is visible */}
            <Box args={[0.32, 0.1, WHEEL_RADIUS * 1.6]}>
              <meshStandardMaterial color="#ddd" />
            </Box>
          </group>
        </group>
      ))}
    </RigidBody>
  );
};

export const VehicleExample: Demo = () => {
  useResetOrbitControls(25, [0, 0.6, 1]);

  return (
    <>
      <Vehicle />

      {/* ground */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[100, 0.5, 100]} position={[0, -0.5, 0]} />
        <Box args={[200, 1, 200]} position={[0, -0.5, 0]} receiveShadow>
          <meshStandardMaterial color="#9a9" />
        </Box>
      </RigidBody>

      {/* ramp */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, 0.4, -14]}>
        <Box
          args={[6, 0.4, 8]}
          rotation={[0.2, 0, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color="#cb8" />
        </Box>
      </RigidBody>

      {/* a sensor zone the wheel rays must ignore (QueryFilterFlags.EXCLUDE_SENSORS) */}
      <RigidBody type="fixed" colliders={false} position={[0, 0.15, 8]}>
        <CuboidCollider args={[3, 0.15, 3]} sensor />
        <Box args={[6, 0.3, 6]}>
          <meshStandardMaterial color="lime" transparent opacity={0.3} />
        </Box>
      </RigidBody>

      {/* things to bump into */}
      {[0, 1, 2, 3, 4].map((i) => (
        <RigidBody key={i} position={[6 + (i % 2) * 0.1, 0.6 + i * 1.2, -4]}>
          <Box args={[1.2, 1.2, 1.2]} castShadow receiveShadow>
            <meshStandardMaterial color="#58f" />
          </Box>
        </RigidBody>
      ))}
    </>
  );
};

export const meta = {
  title: "Raycast vehicle",
  description:
    "Rapier's DynamicRayCastVehicleController with QueryFilterFlags.EXCLUDE_SENSORS. WASD/arrows to drive, Space to brake. Copy-paste example, not a component API."
};

export default VehicleExample;

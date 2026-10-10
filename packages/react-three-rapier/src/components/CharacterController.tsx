import {
  CharacterCollision,
  Collider,
  InteractionGroups,
  KinematicCharacterController,
  QueryFilterFlags,
  World
} from "@dimforge/rapier3d-compat";
import React, { Ref, useImperativeHandle, useMemo, useRef } from "react";
import { useBeforePhysicsStep } from "../hooks/hooks";
import {
  CharacterControllerOptions,
  CharacterVector3,
  getStepDt,
  useCharacterController
} from "../hooks/use-character-controller";
import { RapierRigidBody } from "../types";
import { RigidBody, RigidBodyProps } from "./RigidBody";

/**
 * Imperative handle exposed by the `<CharacterController>` ref.
 * @category Character Controller
 */
export interface CharacterControllerRef {
  /** The underlying Rapier `KinematicCharacterController`. */
  readonly controller: KinematicCharacterController;
  /** The kinematic rigid body of the character. */
  readonly rigidBody: RapierRigidBody;
  /** Whether the character was standing on the ground during the last step. */
  readonly grounded: boolean;
  /**
   * Sets the persistent desired velocity (units per second).
   * It is converted to a translation with the fixed step dt on every physics step,
   * so the resulting motion is framerate independent.
   */
  setVelocity(velocity: CharacterVector3): void;
  /**
   * Queues a one-off displacement (world units) applied on the next physics step
   * on top of the velocity, e.g. for knockback or teleport-like pushes.
   * Multiple calls before the step accumulate.
   */
  move(delta: CharacterVector3): void;
}

/**
 * Props of {@link CharacterController}.
 * @category Character Controller
 */
export interface CharacterControllerProps
  extends CharacterControllerOptions,
    Omit<RigidBodyProps, "type" | "ref"> {
  ref?: Ref<CharacterControllerRef>;
  /** Called once when the character becomes grounded (edge triggered). */
  onGrounded?: () => void;
  /** Called once when the character leaves the ground (edge triggered). */
  onAirborne?: () => void;
  /**
   * Called for every collision found while moving, on every step.
   * The collision object is pooled: read it, do not retain it.
   */
  onCharacterCollision?: (collision: CharacterCollision) => void;
  /** Rapier query filter flags used while moving. */
  filterFlags?: QueryFilterFlags;
  /** Rapier interaction groups used to filter what the character collides with. */
  filterGroups?: InteractionGroups;
  /** Return `false` to ignore a collider. The character's own colliders are always ignored. */
  filterPredicate?: (collider: Collider) => boolean;
  /** Ignore sensor colliders. @default true */
  excludeSensors?: boolean;
}

/**
 * A kinematic character controller: a `kinematicPosition` RigidBody whose
 * movement is resolved against the world (walls, slopes, stairs) by Rapier's
 * `KinematicCharacterController`.
 *
 * Children are colliders / meshes, exactly like `<RigidBody>`. The first
 * non-sensor collider is used to compute the movement.
 *
 * The desired motion is applied once per fixed physics step with the fixed
 * `dt`, so it is framerate independent. Gravity and jumping stay in userland:
 * integrate your own vertical velocity in `useBeforePhysicsStep` and call
 * `setVelocity`.
 *
 * @example
 * ```tsx
 * const Player = () => {
 *   const ref = useRef<CharacterControllerRef>(null);
 *   const vy = useRef(0);
 *   const input = useInput(); // your own input, returns { x, z, jump }
 *
 *   useBeforePhysicsStep((world) => {
 *     const dt = world.timestep;
 *     const c = ref.current!;
 *     vy.current = c.grounded && !input.jump ? 0 : vy.current - 9.81 * dt;
 *     if (c.grounded && input.jump) vy.current = 6;
 *     c.setVelocity({ x: input.x * 4, y: vy.current, z: input.z * 4 });
 *   });
 *
 *   return (
 *     <CharacterController
 *       ref={ref}
 *       position={[0, 2, 0]}
 *       autostep={{ maxHeight: 0.3, minWidth: 0.2 }}
 *       snapToGround={0.2}
 *       onGrounded={() => console.log("landed")}
 *     >
 *       <CapsuleCollider args={[0.5, 0.3]} />
 *     </CharacterController>
 *   );
 * };
 * ```
 * @category Components
 */
export const CharacterController = (props: CharacterControllerProps) => {
  const {
    ref,
    children,
    onGrounded,
    onAirborne,
    onCharacterCollision,
    filterFlags,
    filterGroups,
    filterPredicate,
    excludeSensors,
    offset,
    up,
    slide,
    maxSlopeClimbAngle,
    minSlopeSlideAngle,
    autostep,
    snapToGround,
    applyImpulsesToDynamicBodies,
    characterMass,
    normalNudgeFactor,
    ...rigidBodyProps
  } = props;

  const bodyRef = useRef<RapierRigidBody>(null);
  const cc = useCharacterController({
    offset,
    up,
    slide,
    maxSlopeClimbAngle,
    minSlopeSlideAngle,
    autostep,
    snapToGround,
    applyImpulsesToDynamicBodies,
    characterMass,
    normalNudgeFactor
  });

  const state = useMemo(
    () => ({
      grounded: false,
      velocity: { x: 0, y: 0, z: 0 },
      pending: { x: 0, y: 0, z: 0 },
      desired: { x: 0, y: 0, z: 0 }
    }),
    []
  );

  // Latest props, read inside the step callback.
  const latest = useRef(props);
  latest.current = props;

  useImperativeHandle(
    ref,
    () => ({
      get controller() {
        return cc.controller;
      },
      get rigidBody() {
        return bodyRef.current!;
      },
      get grounded() {
        return state.grounded;
      },
      setVelocity(v) {
        state.velocity.x = v.x;
        state.velocity.y = v.y;
        state.velocity.z = v.z;
      },
      move(d) {
        state.pending.x += d.x;
        state.pending.y += d.y;
        state.pending.z += d.z;
      }
    }),
    [cc, state]
  );

  useBeforePhysicsStep((world: World, dt?: number) => {
    const body = bodyRef.current;
    if (!body) return;
    const step = getStepDt(world, dt);
    const { velocity, pending, desired } = state;
    desired.x = velocity.x * step + pending.x;
    desired.y = velocity.y * step + pending.y;
    desired.z = velocity.z * step + pending.z;
    pending.x = pending.y = pending.z = 0;

    const p = latest.current;
    const result = cc.move(body, desired, {
      filterFlags: p.filterFlags,
      filterGroups: p.filterGroups,
      filterPredicate: p.filterPredicate,
      excludeSensors: p.excludeSensors
    });

    if (p.onCharacterCollision) {
      for (let i = 0; i < result.collisions.length; i++) {
        p.onCharacterCollision(result.collisions[i]);
      }
    }

    if (result.grounded !== state.grounded) {
      state.grounded = result.grounded;
      if (result.grounded) p.onGrounded?.();
      else p.onAirborne?.();
    }
  });

  return (
    <RigidBody {...rigidBodyProps} ref={bodyRef} type="kinematicPosition">
      {children}
    </RigidBody>
  );
};

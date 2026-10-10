import {
  CharacterCollision,
  Collider,
  InteractionGroups,
  KinematicCharacterController,
  QueryFilterFlags,
  RigidBody,
  World
} from "@dimforge/rapier3d-compat";
import { useEffect, useMemo, useRef } from "react";
import { Vector3Object } from "../types";
import { useRapier } from "./hooks";
import { useImperativeInstance } from "./use-imperative-instance";

/**
 * Autostep (stair climbing) configuration.
 * @category Character Controller
 */
export interface CharacterAutostepOptions {
  /** Maximum height of a step the character can climb. */
  maxHeight: number;
  /** Minimum free horizontal width required on top of the step. */
  minWidth: number;
  /** Whether dynamic bodies can be stepped over. Defaults to `false`. */
  includeDynamicBodies?: boolean;
}

/**
 * Configuration of the Rapier `KinematicCharacterController`.
 * Every option is applied reactively: changing a value updates the live controller.
 * Options left `undefined` (or reset to `undefined`) revert to Rapier's defaults;
 * `autostep` and `snapToGround` default to disabled.
 * @category Character Controller
 */
export interface CharacterControllerOptions {
  /**
   * Small gap kept between the character and the environment.
   * @default 0.01
   */
  offset?: number;
  /** The "up" direction of the character. @default [0, 1, 0] */
  up?: [number, number, number] | Vector3Object;
  /** Whether the character slides along obstacles. @default true */
  slide?: boolean;
  /** Maximum angle (radians) of a slope the character can climb. */
  maxSlopeClimbAngle?: number;
  /** Minimum angle (radians) from which the character starts sliding down slopes. */
  minSlopeSlideAngle?: number;
  /** `false` disables stair climbing, otherwise an autostep configuration. */
  autostep?: false | CharacterAutostepOptions;
  /** `false` disables snap-to-ground, otherwise the max snapping distance. */
  snapToGround?: false | number;
  /** Whether the character pushes dynamic bodies it touches. */
  applyImpulsesToDynamicBodies?: boolean;
  /** Mass used when pushing dynamic bodies. */
  characterMass?: number;
  /** Normal nudge factor, see the Rapier docs. */
  normalNudgeFactor?: number;
}

/**
 * Per-call options for {@link CharacterControllerApi.move}.
 * @category Character Controller
 */
export interface CharacterMoveOptions {
  /**
   * The collider used to compute the movement.
   * Defaults to the first non-sensor collider of the rigid body.
   */
  collider?: Collider;
  /** Rapier query filter flags. */
  filterFlags?: QueryFilterFlags;
  /** Rapier interaction groups: only colliders matching these are considered. */
  filterGroups?: InteractionGroups;
  /** Return `false` to ignore a collider. Colliders of the character's own body are always ignored. */
  filterPredicate?: (collider: Collider) => boolean;
  /** Ignore sensor colliders. @default true */
  excludeSensors?: boolean;
}

/**
 * Result of a {@link CharacterControllerApi.move} call.
 *
 * The returned object (including `movement` and `collisions`) is reused between
 * calls to avoid allocations: read it, do not retain it.
 * @category Character Controller
 */
export interface CharacterMoveResult {
  /** The translation that was applied to the body (after collision resolution). */
  movement: Vector3Object;
  /** Whether the character is standing on the ground. */
  grounded: boolean;
  /** Collisions that happened while computing the movement (pooled objects). */
  collisions: CharacterCollision[];
}

/**
 * Imperative API returned by {@link useCharacterController}.
 * @category Character Controller
 */
export interface CharacterControllerApi {
  /** The underlying Rapier controller. Only valid while the hook is mounted. */
  readonly controller: KinematicCharacterController;
  /**
   * Computes a collision-resolved movement for `rigidBody` and applies it with
   * `setNextKinematicTranslation`. Call it once per physics step from
   * `useBeforePhysicsStep`, with a translation already scaled by the step `dt`.
   */
  move(
    rigidBody: RigidBody,
    desiredTranslation: Vector3Object,
    options?: CharacterMoveOptions
  ): CharacterMoveResult;
}

/**
 * Returns the fixed-step dt for a before-step callback.
 * Uses the `dt` argument when the stepping loop provides it, and falls back to `world.timestep`.
 * Switching to the 2nd callback argument later only requires changing the call site.
 * Pass the callback's `dt` argument once the stepping loop provides it.
 */
export const getStepDt = (world: World, dt?: number): number =>
  dt ?? world.timestep;

/**
 * Creates and owns a Rapier `KinematicCharacterController`.
 *
 * The controller is created on mount and freed on unmount (StrictMode safe),
 * options are applied reactively, and the returned api is referentially stable.
 *
 * Gravity, jumping and input are left to you. Compute a desired translation per
 * fixed physics step (`velocity * dt`) inside `useBeforePhysicsStep` and pass it to `move`.
 *
 * @example
 * ```tsx
 * const Player = () => {
 *   const body = useRef<RapierRigidBody>(null);
 *   const vy = useRef(0);
 *   const cc = useCharacterController({ autostep: { maxHeight: 0.3, minWidth: 0.2 } });
 *
 *   useBeforePhysicsStep((world) => {
 *     const dt = world.timestep;
 *     vy.current -= 9.81 * dt;
 *     const { grounded } = cc.move(body.current!, { x: 0, y: vy.current * dt, z: 0 });
 *     if (grounded) vy.current = 0;
 *   });
 *
 *   return (
 *     <RigidBody ref={body} type="kinematicPosition">
 *       <CapsuleCollider args={[0.5, 0.3]} />
 *     </RigidBody>
 *   );
 * };
 * ```
 * @category Hooks
 */
export const useCharacterController = (
  options: CharacterControllerOptions = {}
): CharacterControllerApi => {
  const { world } = useRapier();

  const {
    offset,
    slide,
    maxSlopeClimbAngle,
    minSlopeSlideAngle,
    autostep,
    snapToGround,
    applyImpulsesToDynamicBodies,
    characterMass,
    normalNudgeFactor,
    up
  } = options;

  const upX = up ? (Array.isArray(up) ? up[0] : up.x) : undefined;
  const upY = up ? (Array.isArray(up) ? up[1] : up.y) : undefined;
  const upZ = up ? (Array.isArray(up) ? up[2] : up.z) : undefined;

  const autostepHeight = autostep ? autostep.maxHeight : undefined;
  const autostepWidth = autostep ? autostep.minWidth : undefined;
  const autostepDynamic = autostep
    ? !!autostep.includeDynamicBodies
    : undefined;

  // Rapier's own defaults, captured from the freshly created controller.
  const defaults = useRef<{
    offset: number;
    up: Vector3Object;
    slide: boolean;
    maxSlope: number;
    minSlide: number;
    impulses: boolean;
    mass: number | null;
    nudge: number;
  }>(null!);
  // Set once the controller has been freed (guards move() after unmount).
  const destroyed = useRef(false);

  const getController = useImperativeInstance(
    () => {
      const c = world.createCharacterController(offset ?? 0.01);
      defaults.current = {
        offset: c.offset(),
        up: { x: c.up().x, y: c.up().y, z: c.up().z },
        slide: c.slideEnabled(),
        maxSlope: c.maxSlopeClimbAngle(),
        minSlide: c.minSlopeSlideAngle(),
        impulses: c.applyImpulsesToDynamicBodies(),
        mass: c.characterMass(),
        nudge: c.normalNudgeFactor()
      };
      return c;
    },
    (controller) => {
      destroyed.current = true;
      world.removeCharacterController(controller);
    },
    [world]
  );

  // The hook is (re)mounted: allow use again (StrictMode re-runs effects).
  useEffect(() => {
    destroyed.current = false;
    return () => {
      destroyed.current = true;
    };
  }, []);

  useEffect(() => {
    const c = getController();
    const d = defaults.current;
    c.setOffset(offset ?? d.offset);
    c.setUp(upX !== undefined ? { x: upX, y: upY!, z: upZ! } : d.up);
    c.setSlideEnabled(slide ?? d.slide);
    c.setMaxSlopeClimbAngle(maxSlopeClimbAngle ?? d.maxSlope);
    c.setMinSlopeSlideAngle(minSlopeSlideAngle ?? d.minSlide);
    if (autostepHeight !== undefined) {
      c.enableAutostep(autostepHeight, autostepWidth!, autostepDynamic!);
    } else {
      c.disableAutostep();
    }
    if (typeof snapToGround === "number") c.enableSnapToGround(snapToGround);
    else c.disableSnapToGround();
    c.setApplyImpulsesToDynamicBodies(
      applyImpulsesToDynamicBodies ?? d.impulses
    );
    c.setCharacterMass((characterMass ?? d.mass) as number);
    c.setNormalNudgeFactor(normalNudgeFactor ?? d.nudge);
  }, [
    getController,
    offset,
    upX,
    upY,
    upZ,
    slide,
    maxSlopeClimbAngle,
    minSlopeSlideAngle,
    autostepHeight,
    autostepWidth,
    autostepDynamic,
    snapToGround,
    applyImpulsesToDynamicBodies,
    characterMass,
    normalNudgeFactor
  ]);

  return useMemo<CharacterControllerApi>(() => {
    // Scratch state, reused across calls so move() does not allocate.
    let bodyHandle = -1;
    let userPredicate: ((collider: Collider) => boolean) | undefined;
    const predicate = (collider: Collider) => {
      if (collider.parent()?.handle === bodyHandle) return false;
      return userPredicate ? userPredicate(collider) : true;
    };

    const movement: Vector3Object = { x: 0, y: 0, z: 0 };
    const target: Vector3Object = { x: 0, y: 0, z: 0 };
    const collisions: CharacterCollision[] = [];
    const pool: CharacterCollision[] = [];
    const result: CharacterMoveResult = {
      movement,
      grounded: false,
      collisions
    };

    return {
      get controller() {
        return getController();
      },
      move(rigidBody, desired, opts) {
        if (destroyed.current) {
          if (process.env.NODE_ENV !== "production") {
            console.warn(
              "react-three-rapier: character controller move() called after the controller was destroyed; ignoring."
            );
          }
          result.movement.x = result.movement.y = result.movement.z = 0;
          return result;
        }
        const controller = getController();

        let collider = opts?.collider;
        if (!collider) {
          const n = rigidBody.numColliders();
          for (let i = 0; i < n; i++) {
            const candidate = rigidBody.collider(i);
            if (!candidate.isSensor()) {
              collider = candidate;
              break;
            }
          }
        }
        if (!collider) {
          throw new Error(
            "react-three-rapier: character controller move() needs a non-sensor collider on the rigid body."
          );
        }

        bodyHandle = rigidBody.handle;
        userPredicate = opts?.filterPredicate;

        let flags = opts?.filterFlags ?? 0;
        if (opts?.excludeSensors ?? true)
          flags |= QueryFilterFlags.EXCLUDE_SENSORS;

        controller.computeColliderMovement(
          collider,
          desired,
          flags || undefined,
          opts?.filterGroups,
          predicate
        );
        userPredicate = undefined;

        controller.computedMovement(movement);
        const t = rigidBody.translation();
        target.x = t.x + movement.x;
        target.y = t.y + movement.y;
        target.z = t.z + movement.z;
        rigidBody.setNextKinematicTranslation(target);

        const n = controller.numComputedCollisions();
        collisions.length = n;
        for (let i = 0; i < n; i++) {
          const c = (pool[i] ??= new CharacterCollision());
          controller.computedCollision(i, c);
          collisions[i] = c;
        }

        result.grounded = controller.computedGrounded();
        return result;
      }
    };
  }, [getController, destroyed]);
};

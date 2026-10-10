import type Rapier from "@dimforge/rapier3d-compat";
import {
  Collider,
  ColliderHandle,
  EventQueue,
  PhysicsHooks,
  RigidBody,
  RigidBodyHandle,
  SoftBodyTearEvent,
  SolverFlags,
  World
} from "@dimforge/rapier3d-compat";
import { useThree } from "@react-three/fiber";
import React, {
  createContext,
  FC,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef
} from "react";
import { Matrix4, Object3D, Quaternion, Vector3 } from "three";
import { suspend } from "suspend-react";
import {
  CollisionPayload,
  CollisionEnterHandler,
  CollisionExitHandler,
  ContactForceHandler,
  IntersectionEnterHandler,
  IntersectionExitHandler,
  RigidBodyAutoCollider,
  Vector3Tuple
} from "../types";
import { _matrix4, _scale } from "../utils/shared-objects";
import {
  useConst,
  vectorArrayToVector3,
  vector3ToRapierVector
} from "../utils/utils";
import {
  anyParentSpaceMoved,
  beginParentSpacePass,
  ParentSpace,
  refreshParentInverse
} from "../utils/utils-rigidbody";
import { sanitizeMaxSubSteps } from "../utils/utils-physics";
import FrameStepper from "./FrameStepper";
import { Debug } from "./Debug";
import { createSingletonProxy } from "../utils/singleton-proxy";

// Scratch objects for syncMeshes
const _syncPosition = new Vector3();
const _syncRotation = new Quaternion();
const _syncRotationPrev = new Quaternion();

export interface RigidBodyState {
  meshType: "instancedMesh" | "mesh";
  rigidBody: RigidBody;
  object: Object3D;
  /**
   * Inverse of the parent's world matrix: the space synced poses are written
   * into. Refreshed every frame from the CURRENT parent transform, so moving or
   * rotating an ancestor after mount keeps the visual on its body.
   */
  invertedWorldMatrix: Matrix4;
  setMatrix: (matrix: Matrix4) => void;
  getMatrix: (matrix: Matrix4) => Matrix4;
  /**
   * Required for instanced rigid bodies.
   */
  scale: Vector3;
  isSleeping: boolean;
  /**
   * Pose before the latest physics step, used for interpolation.
   * @internal
   */
  previousPose?: { position: Vector3; rotation: Quaternion; valid: boolean };
  /**
   * World-space pose last written to the object (after interpolation), reused
   * when only the parent space changes later in the frame.
   * @internal
   */
  renderedPose?: { position: Vector3; rotation: Quaternion };
  /**
   * The parent space `invertedWorldMatrix` was last refreshed from.
   * @internal
   */
  parentSpace?: ParentSpace;
  /**
   * Version of that parent space.
   * @internal
   */
  parentSpaceVersion?: number;
}

export type RigidBodyStateMap = Map<RigidBody["handle"], RigidBodyState>;

const sceneDepth = (object: Object3D) => {
  let depth = 0;
  for (let o = object.parent; o; o = o.parent) depth++;
  return depth;
};

/**
 * The rigid body state map, iterable parent-first. The order is rebuilt (a
 * stable sort by scene depth) only when bodies register or unregister, so a
 * nested <RigidBody> is always synced after the body that carries it.
 * @internal
 */
export class RigidBodyStateRegistry extends Map<
  RigidBody["handle"],
  RigidBodyState
> {
  private orderedEntries: [RigidBody["handle"], RigidBodyState][] = [];
  private orderDirty = false;

  set(handle: RigidBody["handle"], state: RigidBodyState) {
    this.orderDirty = true;
    return super.set(handle, state);
  }

  delete(handle: RigidBody["handle"]) {
    this.orderDirty = true;
    return super.delete(handle);
  }

  clear() {
    this.orderDirty = true;
    super.clear();
  }

  /** Entries ordered parent-first (by scene depth at registration time). */
  ordered() {
    if (this.orderDirty) {
      this.orderDirty = false;
      this.orderedEntries = Array.from(this.entries())
        .map((entry) => ({ entry, depth: sceneDepth(entry[1].object) }))
        .sort((a, b) => a.depth - b.depth)
        .map(({ entry }) => entry);
    }
    return this.orderedEntries;
  }
}

/**
 * Called once per physics step.
 *
 * @param world The world being stepped
 * @param dt The length of this step in seconds (the fixed `timeStep`, or the
 * clamped frame delta with `timeStep="vary"`)
 */
export type WorldStepCallback = (world: World, dt: number) => void;

/**
 * Called for every soft body tear event drained after a world step. The
 * event is only valid for the duration of the call.
 */
export type SoftBodyTearCallback = (event: SoftBodyTearEvent) => void;

export type WorldStepCallbackSet = Set<{ current: WorldStepCallback }>;

/**
 * Something whose visuals are written once per rendered frame, next to the
 * rigid bodies (e.g. a soft body's geometry).
 * @internal
 */
export interface FrameSyncCallback {
  /**
   * Write the visuals, interpolated by `alpha` between the previous and the
   * latest step (1 = the latest step). Called in the per-frame sync, after
   * the rigid bodies were written. Return `true` while the visuals still
   * move, to keep a `frameloop="demand"` canvas ticking.
   */
  sync: (alpha: number) => boolean | void;
  /**
   * The previous step's state must not be interpolated from anymore (manual
   * step, `setWorld`, or a `paused`/`interpolate`/`timeStep` change). Render
   * the latest step until the next one.
   */
  resetInterpolation?: () => void;
}

/** @internal */
export type FrameSyncCallbackSet = Set<{ current: FrameSyncCallback }>;

export type FilterContactPairCallback = (
  collider1: ColliderHandle,
  collider2: ColliderHandle,
  body1: RigidBodyHandle,
  body2: RigidBodyHandle
) => SolverFlags | null;

export type FilterIntersectionPairCallback = (
  collider1: ColliderHandle,
  collider2: ColliderHandle,
  body1: RigidBodyHandle,
  body2: RigidBodyHandle
) => boolean;

export type FilterContactPairCallbackSet = Set<{
  current: FilterContactPairCallback;
}>;

export type FilterIntersectionPairCallbackSet = Set<{
  current: FilterIntersectionPairCallback;
}>;

export interface ColliderState {
  collider: Collider;
  object: Object3D;

  /**
   * The parent of which this collider needs to base its
   * world position on, can be empty
   */
  worldParent?: Object3D;
}

export type ColliderStateMap = Map<Collider["handle"], ColliderState>;

export interface RapierContext {
  /**
   * Used by the world to keep track of RigidBody states
   * @internal
   */
  rigidBodyStates: RigidBodyStateMap;

  /**
   * Used by the world to keep track of Collider states
   * @internal
   */
  colliderStates: ColliderStateMap;

  /**
   * Used by the world to keep track of RigidBody events
   * @internal
   */
  rigidBodyEvents: EventMap;
  /**
   * Used by the world to keep track of Collider events
   * @internal
   */
  colliderEvents: EventMap;

  /**
   * Default options for rigid bodies and colliders
   * @internal
   */
  physicsOptions: {
    colliders: RigidBodyAutoCollider;
  };

  /**
   * Triggered before the physics world is stepped
   * @internal
   */
  beforeStepCallbacks: WorldStepCallbackSet;

  /**
   * Triggered after the physics world is stepped
   * @internal
   */
  afterStepCallbacks: WorldStepCallbackSet;

  /**
   * Triggered for every soft body tear event produced by the world step
   * @internal
   */
  softBodyTearCallbacks: Set<SoftBodyTearCallback>;

  /**
   * Visuals synced once per rendered frame with the interpolation alpha,
   * right after the rigid bodies (e.g. soft bodies)
   * @internal
   */
  frameSyncCallbacks: FrameSyncCallbackSet;

  /**
   * Hooks to filter contact pairs
   * @internal
   */
  filterContactPairHooks: FilterContactPairCallbackSet;

  /**
   * Hooks to filter intersection pairs
   * @internal
   */
  filterIntersectionPairHooks: FilterIntersectionPairCallbackSet;

  /**
   * Direct access to the Rapier instance
   */
  rapier: typeof Rapier;

  /**
   * The Rapier physics world
   */
  world: World;

  /**
   * Can be used to overwrite the current World. Useful when working with snapshots.
   *
   * @example
   * ```tsx
   * import { useRapier } from '@react-three/rapier';
   *
   * const SnapshottingComponent = () => {
   *   const { world, setWorld, rapier } = useRapier();
   *   const worldSnapshot = useRef<Uint8Array>();
   *
   *   // Store the snapshot
   *   const takeSnapshot = () => {
   *     const snapshot = world.takeSnapshot()
   *     worldSnapshot.current = snapshot
   *   }
   *
   *   // Create a new World from the snapshot, and replace the current one
   *   const restoreSnapshot = () => {
   *     setWorld(rapier.World.restoreSnapshot(worldSnapshot.current))
   *   }
   *
   *   return <>
   *     <Rigidbody>...</RigidBody>
   *     <Rigidbody>...</RigidBody>
   *     <Rigidbody>...</RigidBody>
   *     <Rigidbody>...</RigidBody>
   *     <Rigidbody>...</RigidBody>
   *   </>
   * }
   * ```
   */
  setWorld: (world: World) => void;

  /**
   * If the physics simulation is paused
   */
  isPaused: boolean;

  /**
   * Step the physics world one step and sync meshes to the result.
   * Works while `paused`, which is how manual stepping is done.
   *
   * @param deltaTime The delta time to step the world with
   *
   * @example
   * ```
   * step(1/60)
   * ```
   */
  step: (deltaTime: number) => void;

  /**
   * Is debug mode enabled
   */
  isDebug: boolean;
}

export const rapierContext = createContext<RapierContext | undefined>(
  undefined
);

type CollisionSource = {
  collider: {
    object: Collider;
    events?: EventMapValue;
    state?: ColliderState;
  };
  rigidBody: {
    object?: RigidBody;
    events?: EventMapValue;
    state?: RigidBodyState;
  };
};

const getCollisionPayloadFromSource = (
  target: CollisionSource,
  other: CollisionSource
): CollisionPayload => ({
  target: {
    rigidBody: target.rigidBody.object,
    collider: target.collider.object,
    colliderObject: target.collider.state?.object,
    rigidBodyObject: target.rigidBody.state?.object
  },

  other: {
    rigidBody: other.rigidBody.object,
    collider: other.collider.object,
    colliderObject: other.collider.state?.object,
    rigidBodyObject: other.rigidBody.state?.object
  },

  rigidBody: other.rigidBody.object,
  collider: other.collider.object,
  colliderObject: other.collider.state?.object,
  rigidBodyObject: other.rigidBody.state?.object
});

const importRapier = async () => {
  const r = await import("@dimforge/rapier3d-compat");
  await r.init();
  return r;
};

export type EventMapValue = {
  onSleep?(): void;
  onWake?(): void;
  onCollisionEnter?: CollisionEnterHandler;
  onCollisionExit?: CollisionExitHandler;
  onIntersectionEnter?: IntersectionEnterHandler;
  onIntersectionExit?: IntersectionExitHandler;
  onContactForce?: ContactForceHandler;
};

export type EventMap = Map<ColliderHandle | RigidBodyHandle, EventMapValue>;

export interface PhysicsProps {
  children: ReactNode;
  /**
   * Set the gravity of the physics world
   * @defaultValue [0, -9.81, 0]
   */
  gravity?: Vector3Tuple;

  /**
   * Amount of penetration the engine wont attempt to correct
   * @defaultValue 0.001
   */
  allowedLinearError?: number;

  /**
   * The number of solver iterations run by the constraints solver for calculating forces.
   * The greater this value is, the most rigid and realistic the physics simulation will be.
   * However a greater number of iterations is more computationally intensive.
   *
   * @defaultValue 4
   */
  numSolverIterations?: number;

  /**
   * Number of internal Project Gauss Seidel (PGS) iterations run at each solver iteration.
   * Increasing this parameter will improve stability of the simulation. It will have a lesser effect than
   * increasing `numSolverIterations` but is also less computationally expensive.
   *
   * @defaultValue 1
   */
  numInternalPgsIterations?: number;

  /**
   * The maximal distance separating two objects that will generate predictive contacts
   *
   * @defaultValue 0.002
   *
   */
  predictionDistance?: number;

  /**
   * Minimum number of dynamic bodies in each active island
   *
   * @deprecated Removed from Rapier. This prop is ignored.
   */
  minIslandSize?: number;

  /**
   * Maximum number of substeps performed by the solver
   * Set to 0 to disable CCD entirely, including automatic CCD against fixed colliders.
   *
   * @defaultValue 1
   */
  maxCcdSubsteps?: number;

  /**
   * Directly affects the `erp` (Error Reduction Parameter) which is the proportion (0 to 1) of the positional error to be corrected at each time step.
   * The higher this value is, the more the physics engine will try to correct errors.
   *
   * This prop is currently undocumented in the Rapier documentation.
   *
   * @see https://github.com/dimforge/rapier/pull/651 where this change was made to Rapier
   * @defaultValue 30
   */
  contactNaturalFrequency?: number;

  /**
   * The approximate size of most dynamic objects in the scene.
   *
   * This value is used internally to estimate some length-based tolerance.
   * This value can be understood as the number of units-per-meter in your physical world compared to a human-sized world in meter.
   *
   * @defaultValue 1
   */
  lengthUnit?: number;

  /**
   * Set the base automatic colliders for this physics world
   * All Meshes inside RigidBodies will generate a collider
   * based on this value, if not overridden.
   */
  colliders?: RigidBodyAutoCollider;

  /**
   * Set the timestep for the simulation.
   * Setting this to a number (eg. 1/60) runs the simulation in fixed steps of
   * that length, decoupled from the frame rate. With `updateLoop="follow"` and
   * a fiber whose scheduler supports fixed phases, the steps run in a dedicated
   * fixed-timestep scheduler phase (`rapier:fixed:<timeStep>:<maxSubSteps>`).
   *
   * Alternatively, set this to "vary" to step once per frame with the frame
   * delta (clamped to 0.5s). Not deterministic and no interpolation.
   *
   * @defaultValue 1/60
   */
  timeStep?: number | "vary";

  /**
   * The most fixed steps a single frame may run. Simulation time beyond
   * `maxSubSteps * timeStep` is dropped instead of queued, so a long frame
   * (tab switch, debugger pause, heavy load) can't snowball into an ever
   * growing backlog. Ignored when `timeStep="vary"`.
   *
   * @defaultValue 5
   */
  maxSubSteps?: number;

  /**
   * Pause the physics simulation. No time is banked while paused, so resuming
   * does not burst. `step()` from `useRapier()` still works while paused.
   *
   * @defaultValue false
   */
  paused?: boolean;

  /**
   * Interpolate rendered transforms between the last two fixed steps, using
   * how far the frame is into the next step.
   * Has no effect if timeStep is set to "vary".
   *
   * @defaultValue true
   **/
  interpolate?: boolean;

  /**
   * Ordering of this world's jobs within their scheduler phase when
   * `updateLoop="follow"`. Higher runs first (the r3f v10 convention).
   *
   * Breaking in 3.0: this no longer takes over r3f's render loop. Physics
   * always steps before `update`, and r3f keeps rendering.
   *
   * @defaultValue 0
   */
  updatePriority?: number;

  /**
   * Set the update loop strategy for the physics world.
   *
   * If set to "follow", the physics world is stepped by the
   * @react-three/fiber scheduler: in a fixed-timestep phase between `physics`
   * and `update` (or a per-frame job if fixed phases are unavailable or
   * `timeStep="vary"`). Meshes are synced once per frame in the `rapier`
   * phase, before `update`. Works with `frameloop="demand"`: the canvas is
   * invalidated while any body is awake.
   *
   * If set to "independent", the physics world is stepped
   * in a separate requestAnimationFrame loop, not tied to the render loop.
   *
   * @defaultValue "follow"
   */
  updateLoop?: "follow" | "independent";

  /**
   * Enable debug rendering of the physics world.
   * @defaultValue false
   */
  debug?: boolean;
}

/**
 * The main physics component used to create a physics world.
 * @category Components
 */
export const Physics: FC<PhysicsProps> = (props) => {
  const {
    colliders = "cuboid",
    children,
    timeStep = 1 / 60,
    maxSubSteps: maxSubStepsProp,
    paused = false,
    interpolate = true,
    updatePriority,
    updateLoop = "follow",
    debug = false,

    gravity = [0, -9.81, 0],
    allowedLinearError = 0.001,
    predictionDistance = 0.002,
    numSolverIterations = 4,
    numInternalPgsIterations = 1,
    maxCcdSubsteps = 1,
    contactNaturalFrequency = 30,
    lengthUnit = 1
  } = props;
  const maxSubSteps = sanitizeMaxSubSteps(maxSubStepsProp);
  const rapier = suspend(importRapier, ["@react-thee/rapier", importRapier]);
  const { invalidate } = useThree();

  const rigidBodyStates = useConst(() => new RigidBodyStateRegistry());
  const colliderStates = useConst<ColliderStateMap>(() => new Map());
  const rigidBodyEvents = useConst<EventMap>(() => new Map());
  const colliderEvents = useConst<EventMap>(() => new Map());
  const eventQueue = useConst(() => new EventQueue(false));

  const filterContactPairHooks = useConst<FilterContactPairCallbackSet>(
    () => new Set()
  );
  const filterIntersectionPairHooks =
    useConst<FilterIntersectionPairCallbackSet>(() => new Set());

  const hooks = useConst<PhysicsHooks>(() => ({
    filterContactPair: (...args) => {
      for (const hook of filterContactPairHooks) {
        const result = hook.current(...args);
        if (result !== null) return result;
      }
      return null;
    },
    filterIntersectionPair: (...args) => {
      for (const hook of filterIntersectionPairHooks) {
        const result = hook.current(...args);
        if (result === false) return false;
      }
      return true;
    }
  }));
  const beforeStepCallbacks = useConst<WorldStepCallbackSet>(() => new Set());
  const afterStepCallbacks = useConst<WorldStepCallbackSet>(() => new Set());
  const softBodyTearCallbacks = useConst<Set<SoftBodyTearCallback>>(
    () => new Set()
  );
  const frameSyncCallbacks = useConst<FrameSyncCallbackSet>(() => new Set());

  /**
   * Initiate the world
   * This creates a singleton proxy, so that the world is only created when
   * something within it is accessed.
   */
  const {
    proxy: worldProxy,
    reset: resetWorldProxy,
    set: setWorldProxy
  } = useConst(() =>
    createSingletonProxy<World>(
      () => new rapier.World(vectorArrayToVector3(gravity))
    )
  );

  /**
   * World teardown.
   *
   * React runs a parent's unmount cleanup before its children's, so freeing the
   * world here directly would leave every <RigidBody>/collider/joint cleanup
   * running against a freed world (and the lazy proxy would silently create a
   * new, leaked one). Defer the free to a microtask, which runs after the whole
   * commit. StrictMode's mount -> unmount -> mount happens inside that window,
   * so the microtask only frees when we did not remount.
   */
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      queueMicrotask(() => {
        if (alive.current) return;
        worldProxy.free();
        resetWorldProxy();
        eventQueue.free();
      });
    };
  }, []);

  // Update mutable props
  useEffect(() => {
    worldProxy.gravity = vector3ToRapierVector(gravity);

    worldProxy.integrationParameters.numSolverIterations = numSolverIterations;
    worldProxy.integrationParameters.numInternalPgsIterations =
      numInternalPgsIterations;

    worldProxy.integrationParameters.normalizedAllowedLinearError =
      allowedLinearError;
    worldProxy.integrationParameters.maxCcdSubsteps = maxCcdSubsteps;
    worldProxy.integrationParameters.normalizedPredictionDistance =
      predictionDistance;
    worldProxy.lengthUnit = lengthUnit;
    worldProxy.integrationParameters.contact_natural_frequency =
      contactNaturalFrequency;
  }, [
    worldProxy,
    ...gravity,
    numSolverIterations,
    numInternalPgsIterations,
    allowedLinearError,
    maxCcdSubsteps,
    predictionDistance,
    lengthUnit,
    contactNaturalFrequency
  ]);

  const getSourceFromColliderHandle = useCallback((handle: ColliderHandle) => {
    const collider = worldProxy.getCollider(handle);
    const colEvents = colliderEvents.get(handle);
    const colliderState = colliderStates.get(handle);

    const rigidBodyHandle = collider?.parent()?.handle;
    const rigidBody =
      rigidBodyHandle !== undefined
        ? worldProxy.getRigidBody(rigidBodyHandle)
        : undefined;
    const rbEvents =
      rigidBody && rigidBodyHandle !== undefined
        ? rigidBodyEvents.get(rigidBodyHandle)
        : undefined;
    const rigidBodyState =
      rigidBodyHandle !== undefined
        ? rigidBodyStates.get(rigidBodyHandle)
        : undefined;

    const source: CollisionSource = {
      collider: {
        object: collider,
        events: colEvents,
        state: colliderState
      },
      rigidBody: {
        object: rigidBody,
        events: rbEvents,
        state: rigidBodyState
      }
    };

    return source;
  }, []);

  // Latest props, read by the stable stepping functions below.
  const config = useRef({ timeStep, interpolate });
  config.current.timeStep = timeStep;
  config.current.interpolate = interpolate;

  const drainEvents = (world: World) => {
    eventQueue.drainCollisionEvents((handle1, handle2, started) => {
      const source1 = getSourceFromColliderHandle(handle1);
      const source2 = getSourceFromColliderHandle(handle2);

      // Collision Events
      if (!source1?.collider.object || !source2?.collider.object) {
        return;
      }

      const collisionPayload1 = getCollisionPayloadFromSource(source1, source2);
      const collisionPayload2 = getCollisionPayloadFromSource(source2, source1);

      if (started) {
        world.contactPair(
          source1.collider.object,
          source2.collider.object,
          (manifold, flipped) => {
            /* RigidBody events */
            source1.rigidBody.events?.onCollisionEnter?.({
              ...collisionPayload1,
              manifold,
              flipped
            });

            source2.rigidBody.events?.onCollisionEnter?.({
              ...collisionPayload2,
              manifold,
              flipped
            });

            /* Collider events */
            source1.collider.events?.onCollisionEnter?.({
              ...collisionPayload1,
              manifold,
              flipped
            });

            source2.collider.events?.onCollisionEnter?.({
              ...collisionPayload2,
              manifold,
              flipped
            });
          }
        );
      } else {
        source1.rigidBody.events?.onCollisionExit?.(collisionPayload1);
        source2.rigidBody.events?.onCollisionExit?.(collisionPayload2);
        source1.collider.events?.onCollisionExit?.(collisionPayload1);
        source2.collider.events?.onCollisionExit?.(collisionPayload2);
      }

      // Sensor Intersections
      if (started) {
        if (
          world.intersectionPair(
            source1.collider.object,
            source2.collider.object
          )
        ) {
          source1.rigidBody.events?.onIntersectionEnter?.(collisionPayload1);

          source2.rigidBody.events?.onIntersectionEnter?.(collisionPayload2);

          source1.collider.events?.onIntersectionEnter?.(collisionPayload1);

          source2.collider.events?.onIntersectionEnter?.(collisionPayload2);
        }
      } else {
        source1.rigidBody.events?.onIntersectionExit?.(collisionPayload1);
        source2.rigidBody.events?.onIntersectionExit?.(collisionPayload2);
        source1.collider.events?.onIntersectionExit?.(collisionPayload1);
        source2.collider.events?.onIntersectionExit?.(collisionPayload2);
      }
    });

    eventQueue.drainContactForceEvents((event) => {
      const source1 = getSourceFromColliderHandle(event.collider1());
      const source2 = getSourceFromColliderHandle(event.collider2());

      // Collision Events
      if (!source1?.collider.object || !source2?.collider.object) {
        return;
      }

      const collisionPayload1 = getCollisionPayloadFromSource(source1, source2);
      const collisionPayload2 = getCollisionPayloadFromSource(source2, source1);

      source1.rigidBody.events?.onContactForce?.({
        ...collisionPayload1,
        totalForce: event.totalForce(),
        totalForceMagnitude: event.totalForceMagnitude(),
        maxForceDirection: event.maxForceDirection(),
        maxForceMagnitude: event.maxForceMagnitude()
      });

      source2.rigidBody.events?.onContactForce?.({
        ...collisionPayload2,
        totalForce: event.totalForce(),
        totalForceMagnitude: event.totalForceMagnitude(),
        maxForceDirection: event.maxForceDirection(),
        maxForceMagnitude: event.maxForceMagnitude()
      });

      source1.collider.events?.onContactForce?.({
        ...collisionPayload1,
        totalForce: event.totalForce(),
        totalForceMagnitude: event.totalForceMagnitude(),
        maxForceDirection: event.maxForceDirection(),
        maxForceMagnitude: event.maxForceMagnitude()
      });

      source2.collider.events?.onContactForce?.({
        ...collisionPayload2,
        totalForce: event.totalForce(),
        totalForceMagnitude: event.totalForceMagnitude(),
        maxForceDirection: event.maxForceDirection(),
        maxForceMagnitude: event.maxForceMagnitude()
      });
    });

    eventQueue.drainSoftBodyTearEvents((event) => {
      softBodyTearCallbacks.forEach((callback) => callback(event));
    });
  };

  /**
   * Advance the world by exactly one step of `dt` seconds: before-step
   * callbacks, `world.step`, after-step callbacks, then collision and
   * contact-force events. Runs once per fixed substep.
   */
  const stepWorld = useConst(() => (dt: number) => {
    if (!alive.current) return;
    const world = worldProxy;

    beforeStepCallbacks.forEach((callback) => {
      callback.current(world, dt);
    });

    // Snapshot the pose each body is about to leave, so a frame that runs
    // several substeps interpolates across the last one only. Taken after the
    // before-step callbacks, so a teleport made there is not interpolated.
    if (config.current.interpolate && config.current.timeStep !== "vary") {
      rigidBodyStates.forEach((state, handle) => {
        const rigidBody = world.getRigidBody(handle);
        if (!rigidBody) return;

        const pose = (state.previousPose ??= {
          position: new Vector3(),
          rotation: new Quaternion(),
          valid: false
        });
        const t = rigidBody.translation();
        const r = rigidBody.rotation();
        pose.position.set(t.x, t.y, t.z);
        pose.rotation.set(r.x, r.y, r.z, r.w);
        pose.valid = true;
      });
    }

    world.timestep = dt;

    const hasHooks =
      filterContactPairHooks.size > 0 || filterIntersectionPairHooks.size > 0;

    world.step(eventQueue, hasHooks ? hooks : undefined);

    afterStepCallbacks.forEach((callback) => {
      callback.current(world, dt);
    });

    drainEvents(world);
  });

  const writePose = (
    state: RigidBodyState,
    position: Vector3,
    rotation: Quaternion
  ) => {
    _matrix4
      .compose(position, rotation, state.scale)
      .premultiply(state.invertedWorldMatrix);

    if (state.meshType === "instancedMesh") {
      state.setMatrix(_matrix4);
    } else {
      _matrix4.decompose(
        state.object.position,
        state.object.quaternion,
        _scale
      );
    }
  };

  const rememberPose = (
    state: RigidBodyState,
    position: Vector3,
    rotation: Quaternion
  ) => {
    const pose = (state.renderedPose ??= {
      position: new Vector3(),
      rotation: new Quaternion()
    });
    pose.position.copy(position);
    pose.rotation.copy(rotation);
    return pose;
  };

  // Parent spaces read by the last sync, checked again right before render.
  const syncedSpaces = useConst<ParentSpace[]>(() => []);

  /**
   * Write body poses into their Object3Ds / instances, once per rendered frame.
   *
   * Bodies are visited parent-first. Poses are written in the CURRENT parent
   * space (the parent's inverse world matrix is recomputed every frame, not
   * captured at spawn), interpolated by `alpha` between the previous and the
   * latest step. Also dispatches sleep/wake events and invalidates the canvas
   * once if any body is awake, so `frameloop="demand"` keeps ticking while
   * things move.
   */
  const syncMeshes = useConst(() => (alpha: number) => {
    if (!alive.current) return;
    const world = worldProxy;
    beginParentSpacePass();
    syncedSpaces.length = 0;

    let anyAwake = false;

    const entries = rigidBodyStates.ordered();
    for (let i = 0; i < entries.length; i++) {
      const [handle, state] = entries[i];
      const rigidBody = world.getRigidBody(handle);
      if (!rigidBody) continue;

      const sleeping = rigidBody.isSleeping();
      const events = rigidBodyEvents.get(handle);
      if (sleeping && !state.isSleeping) events?.onSleep?.();
      if (!sleeping && state.isSleeping) events?.onWake?.();
      state.isSleeping = sleeping;

      if (!state.setMatrix || !state.object.parent) continue;

      const parentMoved = refreshParentInverse(state, syncedSpaces);

      // A sleeping body doesn't move, but its parent might have.
      if (sleeping && !parentMoved && state.renderedPose) continue;
      // Fixed bodies are still synced (they can be teleported), but never
      // keep a demand frameloop awake.
      if (!sleeping && !rigidBody.isFixed()) anyAwake = true;

      const t = rigidBody.translation();
      const r = rigidBody.rotation();
      _syncPosition.set(t.x, t.y, t.z);
      _syncRotation.set(r.x, r.y, r.z, r.w);

      const previous = state.previousPose;
      if (!sleeping && previous?.valid && alpha < 1) {
        // Interpolating in world space, then mapping into parent space once,
        // equals mapping both poses and interpolating (affine parent).
        _syncPosition.lerpVectors(previous.position, _syncPosition, alpha);
        _syncRotationPrev.copy(previous.rotation).slerp(_syncRotation, alpha);
        _syncRotation.copy(_syncRotationPrev);
      }

      const pose = rememberPose(state, _syncPosition, _syncRotation);
      writePose(state, pose.position, pose.rotation);
    }

    frameSyncCallbacks.forEach((callback) => {
      if (callback.current.sync(alpha)) anyAwake = true;
    });

    if (anyAwake) invalidate();
  });

  /**
   * Late pass, right before render: if an ancestor moved after the sync (e.g.
   * animated in a regular `useFrame`), re-express the already synced world
   * poses in the new parent spaces. Costs one matrix compare per distinct
   * parent when nothing moved.
   */
  const lateSync = useConst(() => () => {
    if (!alive.current || syncedSpaces.length === 0) return;
    if (!anyParentSpaceMoved(syncedSpaces)) return;

    const world = worldProxy;
    beginParentSpacePass();
    syncedSpaces.length = 0;

    const entries = rigidBodyStates.ordered();
    for (let i = 0; i < entries.length; i++) {
      const [handle, state] = entries[i];
      if (!state.setMatrix || !state.object.parent) continue;
      if (!refreshParentInverse(state, syncedSpaces)) continue;

      let pose = state.renderedPose;
      if (!pose) {
        const rigidBody = world.getRigidBody(handle);
        if (!rigidBody) continue;
        const t = rigidBody.translation();
        const r = rigidBody.rotation();
        _syncPosition.set(t.x, t.y, t.z);
        _syncRotation.set(r.x, r.y, r.z, r.w);
        pose = rememberPose(state, _syncPosition, _syncRotation);
      }
      writePose(state, pose.position, pose.rotation);
    }
  });

  /**
   * Forget the previous-step poses, so the next frames render the current
   * pose until a new step gives something to interpolate from. Used whenever
   * the pose may have jumped outside a regular step.
   */
  const resetInterpolation = useConst(() => () => {
    rigidBodyStates.forEach((state) => {
      if (state.previousPose) state.previousPose.valid = false;
    });
    frameSyncCallbacks.forEach((callback) => {
      callback.current.resetInterpolation?.();
    });
  });

  useEffect(() => {
    resetInterpolation();
  }, [paused, interpolate, timeStep]);

  const step = useCallback((dt: number) => {
    stepWorld(dt);
    resetInterpolation();
    syncMeshes(1);
  }, []);

  const context = useMemo<RapierContext>(
    () => ({
      rapier,
      world: worldProxy,
      setWorld: (world: World) => {
        setWorldProxy(world);
        resetInterpolation();
      },
      physicsOptions: {
        colliders,
        gravity
      },
      rigidBodyStates,
      colliderStates,
      rigidBodyEvents,
      colliderEvents,
      beforeStepCallbacks,
      afterStepCallbacks,
      softBodyTearCallbacks,
      frameSyncCallbacks,
      isPaused: paused,
      isDebug: debug,
      step,
      filterContactPairHooks,
      filterIntersectionPairHooks
    }),
    [paused, step, debug, colliders, gravity]
  );

  return (
    <rapierContext.Provider value={context}>
      <FrameStepper
        type={updateLoop}
        timeStep={timeStep}
        maxSubSteps={maxSubSteps}
        paused={paused}
        interpolate={interpolate}
        updatePriority={updatePriority}
        stepWorld={stepWorld}
        syncMeshes={syncMeshes}
        lateSync={lateSync}
      />
      {debug && <Debug />}
      {children}
    </rapierContext.Provider>
  );
};

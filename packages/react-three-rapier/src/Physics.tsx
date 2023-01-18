import type Rapier from "@dimforge/rapier3d-compat";
import {
  Collider,
  ColliderHandle,
  EventQueue,
  RigidBody,
  RigidBodyHandle,
  World
} from "@dimforge/rapier3d-compat";
import { useFrame } from "@react-three/fiber";
import React, {
  createContext,
  FC,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  InstancedMesh,
  MathUtils,
  Matrix4,
  Object3D,
  Quaternion,
  Vector3
} from "three";
import { useAsset } from "use-asset";
import {
  CollisionPayload,
  CollisionEnterHandler,
  CollisionExitHandler,
  ContactForceHandler,
  IntersectionEnterHandler,
  IntersectionExitHandler,
  RigidBodyAutoCollider,
  Vector3Array
} from "./types";

import { createWorldApi, WorldApi } from "./api";
import { _matrix4, _position, _rotation, _scale } from "./shared-objects";
import {
  rapierQuaternionToQuaternion,
  useConst,
  vectorArrayToVector3
} from "./utils";
import {
  applyAttractorForceOnRigidBody,
  AttractorState,
  AttractorStateMap
} from "./Attractor";

export interface RigidBodyState {
  rigidBody: RigidBody;
  object: Object3D;
  invertedWorldMatrix: Matrix4;
  setMatrix: (matrix: Matrix4) => void;
  getMatrix: (matrix: Matrix4) => Matrix4;
  /**
   * Required for instanced rigid bodies.
   */
  scale: Vector3;
  isSleeping: boolean;
}

export type RigidBodyStateMap = Map<RigidBody["handle"], RigidBodyState>;

export type WorldStepCallback = (worldApi: WorldApi) => void;

export type WorldStepCallbackSet = Set<WorldStepCallback>;

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
   * Used by the world to keep track of Attractor states
   * @internal
   */
  attractorStates: AttractorStateMap;

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
   * Direct access to the Rapier instance
   */
  rapier: typeof Rapier;

  /**
   * The Rapier physics world
   */
  world: WorldApi;

  /**
   * If the physics simulation is paused
   */
  isPaused: boolean;

  /**
   * Step the physics world one step
   *
   * @param deltaTime The delta time to step the world with
   *
   * @example
   * ```
   * step(1/60)
   * ```
   */
  step: (deltaTime: number) => void;
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
  let r = await import("@dimforge/rapier3d-compat");
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
  gravity?: Vector3Array;

  /**
   * Set the base automatic colliders for this physics world
   * All Meshes inside RigidBodies will generate a collider
   * based on this value, if not overridden.
   */
  colliders?: RigidBodyAutoCollider;

  /**
   * Set the timestep for the simulation.
   * Setting this to a number (eg. 1/60) will run the
   * simulation at that framerate. Alternatively, you can set this to
   * "vary", which will cause the simulation to always synchronize with
   * the current frame delta times.
   *
   * @defaultValue 1/60
   */
  timeStep?: number | "vary";

  /**
   * Pause the physics simulation
   *
   * @defaultValue false
   */
  paused?: boolean;

  /**
   * The update priority at which the physics simulation should run.
   *
   * @see https://docs.pmnd.rs/react-three-fiber/api/hooks#taking-over-the-render-loop
   * @defaultValue undefined
   */
  updatePriority?: number;

  /**
   * Interpolate the world transform using the frame delta times.
   * Has no effect if timeStep is set to "vary".
   *
   * @default true
   **/
  interpolate?: boolean;
}

export const Physics: FC<PhysicsProps> = ({
  colliders = "cuboid",
  gravity = [0, -9.81, 0],
  children,
  timeStep = 1 / 60,
  paused = false,
  updatePriority,
  interpolate = true
}) => {
  const rapier = useAsset(importRapier);

  const worldRef = useRef<World>();
  const getWorldRef = useRef(() => {
    if (!worldRef.current) {
      const world = new rapier.World(vectorArrayToVector3(gravity));
      worldRef.current = world;
    }
    return worldRef.current;
  });

  const rigidBodyStates = useConst<RigidBodyStateMap>(() => new Map());
  const colliderStates = useConst<ColliderStateMap>(() => new Map());
  const rigidBodyEvents = useConst<EventMap>(() => new Map());
  const colliderEvents = useConst<EventMap>(() => new Map());
  const eventQueue = useConst(() => new EventQueue(false));
  const attractorStates = useConst<AttractorStateMap>(() => new Map());
  const beforeStepCallbacks = useConst<WorldStepCallbackSet>(() => new Set());
  const afterStepCallbacks = useConst<WorldStepCallbackSet>(() => new Set());

  // Init world
  useEffect(() => {
    const world = getWorldRef.current();

    return () => {
      if (world) {
        world.free();
        worldRef.current = undefined;
      }
    };
  }, []);

  // Update gravity
  useEffect(() => {
    const world = worldRef.current;
    if (world) {
      world.gravity = vectorArrayToVector3(gravity);
    }
  }, [gravity]);

  const api = useMemo(() => createWorldApi(getWorldRef), []);

  const getSourceFromColliderHandle = useCallback((handle: ColliderHandle) => {
    const world = worldRef.current;
    if (world) {
      const collider = world.getCollider(handle);
      const colEvents = colliderEvents.get(handle);
      const colliderState = colliderStates.get(handle);

      const rigidBodyHandle = collider?.parent()?.handle;
      const rigidBody =
        rigidBodyHandle !== undefined
          ? world.getRigidBody(rigidBodyHandle)
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
    }
  }, []);

  const [steppingState] = useState<{
    accumulator: number;
    previousState: Record<number, any>;
  }>({
    previousState: {},
    accumulator: 0
  });

  const step = useCallback(
    (dt: number) => {
      const world = worldRef.current;
      if (!world) return;

      /* Check if the timestep is supposed to be variable. We'll do this here
        once so we don't have to string-check every frame. */
      const timeStepVariable = timeStep === "vary";

      /**
       * Fixed timeStep simulation progression
       * @see https://gafferongames.com/post/fix_your_timestep/
       */

      const clampedDelta = MathUtils.clamp(dt, 0, 0.2);

      const stepWorld = () => {
        // Apply attractors
        world.forEachRigidBody((body) => {
          attractorStates.forEach((attractorState) => {
            applyAttractorForceOnRigidBody(body, attractorState);
          });
        });

        // Trigger beforeStep callbacks
        beforeStepCallbacks.forEach((callback) => {
          callback(api);
        });

        world.step(eventQueue);

        // Trigger afterStep callbacks
        afterStepCallbacks.forEach((callback) => {
          callback(api);
        });
      };

      if (timeStepVariable) {
        world.timestep = clampedDelta;

        stepWorld();
      } else {
        world.timestep = timeStep;

        // don't step time forwards if paused
        // Increase accumulator
        steppingState.accumulator += clampedDelta;

        while (steppingState.accumulator >= timeStep) {
          // Set up previous state
          // needed for accurate interpolations if the world steps more than once
          if (interpolate) {
            steppingState.previousState = {};
            world.forEachRigidBody((body) => {
              steppingState.previousState[body.handle] = {
                position: body.translation(),
                rotation: body.rotation()
              };
            });
          }

          stepWorld();

          steppingState.accumulator -= timeStep;
        }
      }

      const interpolationAlpha =
        timeStepVariable || !interpolate || paused
          ? 1
          : steppingState.accumulator / timeStep;

      // Update meshes
      rigidBodyStates.forEach((state, handle) => {
        const rigidBody = world.getRigidBody(handle);

        const events = rigidBodyEvents.get(handle);
        if (events?.onSleep || events?.onWake) {
          if (rigidBody.isSleeping() && !state.isSleeping) {
            events?.onSleep?.();
          }
          if (!rigidBody.isSleeping() && state.isSleeping) {
            events?.onWake?.();
          }
          state.isSleeping = rigidBody.isSleeping();
        }

        if (!rigidBody || rigidBody.isSleeping() || !state.setMatrix) {
          return;
        }

        // New states
        let t = rigidBody.translation() as Vector3;
        let r = rigidBody.rotation() as Quaternion;

        let previousState = steppingState.previousState[handle];

        if (previousState) {
          // Get previous simulated world position
          _matrix4
            .compose(
              previousState.position,
              rapierQuaternionToQuaternion(previousState.rotation),
              state.scale
            )
            .premultiply(state.invertedWorldMatrix)
            .decompose(_position, _rotation, _scale);

          // Apply previous tick position
          if (!(state.object instanceof InstancedMesh)) {
            state.object.position.copy(_position);
            state.object.quaternion.copy(_rotation);
          }
        }

        // Get new position
        _matrix4
          .compose(t, rapierQuaternionToQuaternion(r), state.scale)
          .premultiply(state.invertedWorldMatrix)
          .decompose(_position, _rotation, _scale);

        if (state.object instanceof InstancedMesh) {
          state.setMatrix(_matrix4);
          state.object.instanceMatrix.needsUpdate = true;
        } else {
          // Interpolate to new position
          state.object.position.lerp(_position, interpolationAlpha);
          state.object.quaternion.slerp(_rotation, interpolationAlpha);
        }
      });

      eventQueue.drainCollisionEvents((handle1, handle2, started) => {
        const source1 = getSourceFromColliderHandle(handle1);
        const source2 = getSourceFromColliderHandle(handle2);

        // Collision Events
        if (!source1?.collider.object || !source2?.collider.object) {
          return;
        }

        const collisionPayload1 = getCollisionPayloadFromSource(
          source1,
          source2
        );
        const collisionPayload2 = getCollisionPayloadFromSource(
          source2,
          source1
        );

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

        const collisionPayload1 = getCollisionPayloadFromSource(
          source1,
          source2
        );
        const collisionPayload2 = getCollisionPayloadFromSource(
          source2,
          source1
        );

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
    },
    [paused, timeStep, interpolate]
  );

  useFrame((_, dt) => {
    if (!paused) step(dt);
  }, updatePriority);

  const context = useMemo<RapierContext>(
    () => ({
      rapier,
      world: api,
      physicsOptions: {
        colliders,
        gravity
      },
      rigidBodyStates,
      colliderStates,
      rigidBodyEvents,
      colliderEvents,
      attractorStates,
      beforeStepCallbacks,
      afterStepCallbacks,
      isPaused: paused,
      step
    }),
    [paused, step]
  );

  return (
    <rapierContext.Provider value={context}>{children}</rapierContext.Provider>
  );
};

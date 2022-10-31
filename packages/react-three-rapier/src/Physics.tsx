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
  CollisionEnterHandler,
  CollisionExitHandler,
  ContactForceHandler,
  IntersectionEnterHandler,
  IntersectionExitHandler,
  RigidBodyAutoCollider,
  Vector3Array,
  WorldApi
} from "./types";

import { createWorldApi } from "./api";
import { _matrix4, _position, _rotation, _scale } from "./shared-objects";
import { rapierQuaternionToQuaternion, vectorArrayToVector3 } from "./utils";
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
  rapier: typeof Rapier;
  world: WorldApi;

  rigidBodyStates: RigidBodyStateMap;
  colliderStates: ColliderStateMap;

  rigidBodyEvents: EventMap;
  colliderEvents: EventMap;

  attractorStates: AttractorStateMap;

  physicsOptions: {
    colliders: RigidBodyAutoCollider;
  };

  isPaused: boolean;
}

export const RapierContext = createContext<RapierContext | undefined>(
  undefined
);

const importRapier = async () => {
  let r = await import("@dimforge/rapier3d-compat");
  await r.init();
  return r;
};

export type EventMap = Map<
  ColliderHandle | RigidBodyHandle,
  {
    onSleep?(): void;
    onWake?(): void;
    onCollisionEnter?: CollisionEnterHandler;
    onCollisionExit?: CollisionExitHandler;
    onIntersectionEnter?: IntersectionEnterHandler;
    onIntersectionExit?: IntersectionExitHandler;
    onContactForce?: ContactForceHandler;
  }
>;

interface RapierWorldProps {
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

export const Physics: FC<RapierWorldProps> = ({
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

  const [rigidBodyStates] = useState<RigidBodyStateMap>(() => new Map());
  const [colliderStates] = useState<ColliderStateMap>(() => new Map());
  const [rigidBodyEvents] = useState<EventMap>(() => new Map());
  const [colliderEvents] = useState<EventMap>(() => new Map());
  const [eventQueue] = useState(() => new EventQueue(false));
  const [attractorStates] = useState<AttractorStateMap>(() => new Map());

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

  const [steppingState] = useState<{
    accumulator: number;
    previousState: Record<number, any>;
  }>({
    previousState: {},
    accumulator: 0
  });

  /* Check if the timestep is supposed to be variable. We'll do this here
  once so we don't have to string-check every frame. */
  const timeStepVariable = timeStep === "vary";

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

      return {
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
    }
  }, []);

  useFrame((_, dt) => {
    const world = worldRef.current;
    if (!world) return;

    /**
     * Fixed timeStep simulation progression
     * @see https://gafferongames.com/post/fix_your_timestep/
     */

    const clampedDelta = MathUtils.clamp(dt, 0, 0.2);

    if (timeStepVariable) {
      world.timestep = clampedDelta;
      if (!paused) world.step(eventQueue);
    } else {
      world.timestep = timeStep;

      // don't step time forwards if paused
      // Increase accumulator
      steppingState.accumulator += paused ? 0 : clampedDelta;

      if (!paused) {
        while (steppingState.accumulator >= timeStep) {
          world.forEachRigidBody((body) => {
            // Set up previous state
            // needed for accurate interpolations if the world steps more than once
            if (interpolate) {
              steppingState.previousState = {};
              steppingState.previousState[body.handle] = {
                position: body.translation(),
                rotation: body.rotation()
              };
            }

            // Apply attractors
            attractorStates.forEach((attractorState) => {
              applyAttractorForceOnRigidBody(body, attractorState);
            });
          });

          world.step(eventQueue);
          steppingState.accumulator -= timeStep;
        }
      }
    }

    const interpolationAlpha =
      timeStepVariable || !interpolate
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

      if (started) {
        world.contactPair(
          source1.collider.object,
          source2.collider.object,
          (manifold, flipped) => {
            /* RigidBody events */
            source1.rigidBody.events?.onCollisionEnter?.({
              rigidBody: source2.rigidBody.object,
              collider: source2.collider.object,
              colliderObject: source2.collider.state?.object,
              rigidBodyObject: source2.rigidBody.state?.object,
              manifold,
              flipped
            });

            source2.rigidBody.events?.onCollisionEnter?.({
              rigidBody: source1.rigidBody.object,
              collider: source1.collider.object,
              colliderObject: source1.collider.state?.object,
              rigidBodyObject: source1.rigidBody.state?.object,
              manifold,
              flipped
            });

            /* Collider events */
            source1.collider.events?.onCollisionEnter?.({
              rigidBody: source2.rigidBody.object,
              collider: source2.collider.object,
              colliderObject: source2.collider.state?.object,
              rigidBodyObject: source2.rigidBody.state?.object,
              manifold,
              flipped
            });

            source2.collider.events?.onCollisionEnter?.({
              rigidBody: source1.rigidBody.object,
              collider: source1.collider.object,
              colliderObject: source1.collider.state?.object,
              rigidBodyObject: source1.rigidBody.state?.object,
              manifold,
              flipped
            });
          }
        );
      } else {
        source1.rigidBody.events?.onCollisionExit?.({
          rigidBody: source2.rigidBody.object,
          collider: source2.collider.object
        });
        source2.rigidBody.events?.onCollisionExit?.({
          rigidBody: source1.rigidBody.object,
          collider: source1.collider.object
        });
        source1.collider.events?.onCollisionExit?.({
          rigidBody: source2.rigidBody.object,
          collider: source2.collider.object
        });
        source2.collider.events?.onCollisionExit?.({
          rigidBody: source1.rigidBody.object,
          collider: source1.collider.object
        });
      }

      // Sensor Intersections
      if (started) {
        if (
          world.intersectionPair(
            source1.collider.object,
            source2.collider.object
          )
        ) {
          source1.rigidBody.events?.onIntersectionEnter?.({
            rigidBody: source2.rigidBody.object,
            collider: source2.collider.object,
            colliderObject: source2.collider.state?.object,
            rigidBodyObject: source2.rigidBody.state?.object
          });

          source2.rigidBody.events?.onIntersectionEnter?.({
            rigidBody: source1.rigidBody.object,
            collider: source1.collider.object,
            colliderObject: source1.collider.state?.object,
            rigidBodyObject: source1.rigidBody.state?.object
          });

          source1.collider.events?.onIntersectionEnter?.({
            rigidBody: source2.rigidBody.object,
            collider: source2.collider.object,
            colliderObject: source2.collider.state?.object,
            rigidBodyObject: source2.rigidBody.state?.object
          });

          source2.collider.events?.onIntersectionEnter?.({
            rigidBody: source1.rigidBody.object,
            collider: source1.collider.object,
            colliderObject: source1.collider.state?.object,
            rigidBodyObject: source1.rigidBody.state?.object
          });
        }
      } else {
        source1.rigidBody.events?.onIntersectionExit?.({
          rigidBody: source2.rigidBody.object,
          collider: source2.collider.object
        });
        source2.rigidBody.events?.onIntersectionExit?.({
          rigidBody: source1.rigidBody.object,
          collider: source1.collider.object
        });
        source1.collider.events?.onIntersectionExit?.({
          rigidBody: source2.rigidBody.object,
          collider: source2.collider.object
        });
        source2.collider.events?.onIntersectionExit?.({
          rigidBody: source1.rigidBody.object,
          collider: source1.collider.object
        });
      }
    });

    eventQueue.drainContactForceEvents((event) => {
      const source1 = getSourceFromColliderHandle(event.collider1());
      const source2 = getSourceFromColliderHandle(event.collider2());

      // Collision Events
      if (!source1?.collider.object || !source2?.collider.object) {
        return;
      }

      source1.rigidBody.events?.onContactForce?.({
        rigidBody: source2.rigidBody.object,
        collider: source2.collider.object,
        colliderObject: source2.collider.state?.object,
        rigidBodyObject: source2.rigidBody.state?.object,
        totalForce: event.totalForce(),
        totalForceMagnitude: event.totalForceMagnitude(),
        maxForceDirection: event.maxForceDirection(),
        maxForceMagnitude: event.maxForceMagnitude()
      });

      source2.rigidBody.events?.onContactForce?.({
        rigidBody: source1.rigidBody.object,
        collider: source1.collider.object,
        colliderObject: source1.collider.state?.object,
        rigidBodyObject: source1.rigidBody.state?.object,
        totalForce: event.totalForce(),
        totalForceMagnitude: event.totalForceMagnitude(),
        maxForceDirection: event.maxForceDirection(),
        maxForceMagnitude: event.maxForceMagnitude()
      });

      source1.collider.events?.onContactForce?.({
        rigidBody: source2.rigidBody.object,
        collider: source2.collider.object,
        colliderObject: source2.collider.state?.object,
        rigidBodyObject: source2.rigidBody.state?.object,
        totalForce: event.totalForce(),
        totalForceMagnitude: event.totalForceMagnitude(),
        maxForceDirection: event.maxForceDirection(),
        maxForceMagnitude: event.maxForceMagnitude()
      });

      source2.collider.events?.onContactForce?.({
        rigidBody: source1.rigidBody.object,
        collider: source1.collider.object,
        colliderObject: source1.collider.state?.object,
        rigidBodyObject: source1.rigidBody.state?.object,
        totalForce: event.totalForce(),
        totalForceMagnitude: event.totalForceMagnitude(),
        maxForceDirection: event.maxForceDirection(),
        maxForceMagnitude: event.maxForceMagnitude()
      });
    });
  }, updatePriority);

  const api = useMemo(() => createWorldApi(getWorldRef), []);

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
      isPaused: paused
    }),
    [paused]
  );

  return (
    <RapierContext.Provider value={context}>{children}</RapierContext.Provider>
  );
};

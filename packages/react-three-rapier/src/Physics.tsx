import React, {
  createContext,
  FC,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAsset } from "use-asset";
import type Rapier from "@dimforge/rapier3d-compat";
import { useFrame } from "@react-three/fiber";
import { CollisionEnterHandler, CollisionExitHandler, IntersectionEnterHandler, IntersectionExitHandler, RigidBodyAutoCollider, Vector3Array, WorldApi } from "./types";
import {
  Collider,
  ColliderHandle,
  EventQueue,
  RigidBody,
  RigidBodyHandle,
  World,
} from "@dimforge/rapier3d-compat";
import { InstancedMesh, Matrix, Matrix4, Mesh, Object3D, Quaternion, Vector3, MathUtils  } from "three";

import {
  rapierQuaternionToQuaternion,
  vectorArrayToVector3,
} from "./utils";
import { createWorldApi } from "./api";
import { _matrix4, _object3d, _position, _quaternion, _rotation, _scale, _vector3 } from "./shared-objects";

export interface RigidBodyState {
  rigidBody: RigidBody;
  object: Object3D;
  invertedWorldMatrix: Matrix4
  setMatrix: (matrix: Matrix4) => void;
  getMatrix: (matrix: Matrix4) => Matrix4;
  /**
   * Required for instanced rigid bodies.
   */
  scale: Vector3;
  isSleeping: boolean
}

export type RigidBodyStateMap = Map<RigidBody['handle'], RigidBodyState>

export interface ColliderState {
  collider: Collider;
  object: Object3D;
  /**
   * The parent of which this collider needs to base its
   * world position on
   */
  worldParent: Object3D
}

export type ColliderStateMap = Map<Collider['handle'], ColliderState>

export interface RapierContext {
  rapier: typeof Rapier;
  world: WorldApi;

  rigidBodyStates: RigidBodyStateMap,
  colliderStates: ColliderStateMap,

  rigidBodyEvents: EventMap;
  colliderEvents: EventMap;

  physicsOptions: {
    colliders: RigidBodyAutoCollider;
  };

  isPaused: boolean;
}

export const RapierContext =
  createContext<RapierContext | undefined>(undefined);

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
  paused?: boolean

  /**
   * The update priority at which the physics simulation should run.
   *
   * @defaultValue undefined
   */
  updatePriority?: number
}

export const Physics: FC<RapierWorldProps> = ({
  colliders = "cuboid",
  gravity = [0, -9.81, 0],
  children,
  timeStep = 1 / 60,
  paused = false,
  updatePriority,
}) => {
  const rapier = useAsset(importRapier);

  const [isPaused, setIsPaused] = useState(paused)
  useEffect(() => {
    setIsPaused(paused)
  }, [paused])

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

  // Init world
  useEffect(() => {
    const world = getWorldRef.current();

    return () => {
      if (world) {
        world.free();
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

  const [steppingState] = useState({
    accumulator: 0
  })

  /* Check if the timestep is supposed to be variable. We'll do this here
  once so we don't have to string-check every frame. */
  const timeStepVariable = timeStep === "vary"

  useFrame((_, dt) => {
    const world = worldRef.current;
    if (!world) return;


    /**
     * Fixed timeStep simulation progression
     * @see https://gafferongames.com/post/fix_your_timestep/
    */

    const clampedDelta = MathUtils.clamp(dt, 0, 0.2)

    if (timeStepVariable) {
      world.timestep = clampedDelta
      if (!paused) world.step(eventQueue)
    } else {
      world.timestep = timeStep

      // don't step time forwards if paused
      // Increase accumulator
      steppingState.accumulator += paused ? 0 : clampedDelta

      if (!paused) {
        while (steppingState.accumulator >= timeStep) {
          world.step(eventQueue)
          steppingState.accumulator -= timeStep
        }
      }
    }

    const interpolationAlpha = timeStepVariable ? 1 : (steppingState.accumulator % timeStep) / timeStep

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

      if (
        !rigidBody ||
        rigidBody.isSleeping() ||
        !state.setMatrix
      ) {
        return;
      }

      let t = rigidBody.translation() as Vector3
      let r = rigidBody.rotation() as Quaternion

      // Get new position
      _matrix4.compose(
        t,
        rapierQuaternionToQuaternion(r),
        state.scale
      )
        .premultiply(state.invertedWorldMatrix)
        .decompose(_position, _rotation, _scale)

      if (state.object instanceof InstancedMesh) {
        state.setMatrix(_matrix4)
        state.object.instanceMatrix.needsUpdate = true;
      } else {
        // Interpolate from last position
        state.object.position.lerp(_position, interpolationAlpha)
        state.object.quaternion.slerp(_rotation, interpolationAlpha)
      }
    });

    eventQueue.drainCollisionEvents((handle1, handle2, started) => {
      const collider1 = world.getCollider(handle1);
      const collider2 = world.getCollider(handle2);

      const rigidBodyHandle1 = collider1.parent()?.handle;
      const rigidBodyHandle2 = collider2.parent()?.handle;

      // Collision Events
      if (!collider1 || !collider2) {
        return;
      }

      const collider1Events = colliderEvents.get(collider1.handle);
      const collider2Events = colliderEvents.get(collider2.handle);

      const rigidBody1 = rigidBodyHandle1 ? world.getRigidBody(rigidBodyHandle1) : undefined;
      const rigidBody2 = rigidBodyHandle2 ? world.getRigidBody(rigidBodyHandle2) : undefined;

      const rigidBody1Events = rigidBodyHandle1 ? rigidBodyEvents.get(rigidBodyHandle1) : undefined;
      const rigidBody2Events = rigidBodyHandle2 ? rigidBodyEvents.get(rigidBodyHandle2) : undefined;

      const collider1State = colliderStates.get(collider1.handle);
      const collider2State = colliderStates.get(collider2.handle);
      const rigidBody1State = rigidBodyHandle1 ? rigidBodyStates.get(rigidBodyHandle1) : undefined;
      const rigidBody2State = rigidBodyHandle2 ? rigidBodyStates.get(rigidBodyHandle2) : undefined;

      if (started) {
        world.contactPair(collider1, collider2, (manifold, flipped) => {
          /* RigidBody events */
          rigidBody1Events?.onCollisionEnter?.({
            rigidBody: rigidBody2,
            collider: collider2,
            colliderObject: collider2State?.object,
            rigidBodyObject: rigidBody2State?.object,
            manifold,
            flipped
          });

          rigidBody2Events?.onCollisionEnter?.({
            rigidBody: rigidBody1,
            collider: collider1,
            colliderObject: collider1State?.object,
            rigidBodyObject: rigidBody1State?.object,
            manifold,
            flipped,
          });

          /* Collider events */
          collider1Events?.onCollisionEnter?.({
            rigidBody: rigidBody2,
            collider: collider2,
            colliderObject: collider2State?.object,
            rigidBodyObject: rigidBody2State?.object,
            manifold,
            flipped
          })

          collider2Events?.onCollisionEnter?.({
            rigidBody: rigidBody1,
            collider: collider1,
            colliderObject: collider1State?.object,
            rigidBodyObject: rigidBody1State?.object,
            manifold,
            flipped
          })
        });
      } else {
        rigidBody1Events?.onCollisionExit?.({ rigidBody: rigidBody2, collider: collider2 });
        rigidBody2Events?.onCollisionExit?.({ rigidBody: rigidBody1, collider: collider1 });
        collider1Events?.onCollisionExit?.({ rigidBody: rigidBody2, collider: collider2 });
        collider2Events?.onCollisionExit?.({ rigidBody: rigidBody1, collider: collider1 });
      }

      // Sensor Intersections
      if (started) {
        if (world.intersectionPair(collider1, collider2)) {
          rigidBody1Events?.onIntersectionEnter?.({
            rigidBody: rigidBody2,
            collider: collider2,
            colliderObject: collider2State?.object,
            rigidBodyObject: rigidBody2State?.object,
          });

          rigidBody2Events?.onIntersectionEnter?.({
            rigidBody: rigidBody1,
            collider: collider1,
            colliderObject: collider1State?.object,
            rigidBodyObject: rigidBody1State?.object,
          });

          collider1Events?.onIntersectionEnter?.({
            rigidBody: rigidBody2,
            collider: collider2,
            colliderObject: collider2State?.object,
            rigidBodyObject: rigidBody2State?.object,
          })

          collider2Events?.onIntersectionEnter?.({
            rigidBody: rigidBody1,
            collider: collider1,
            colliderObject: collider1State?.object,
            rigidBodyObject: rigidBody1State?.object,
          })
        }
      } else {
        rigidBody1Events?.onIntersectionExit?.({ rigidBody: rigidBody2, collider: collider2 });
        rigidBody2Events?.onIntersectionExit?.({ rigidBody: rigidBody1, collider: collider1 });
        collider1Events?.onIntersectionExit?.({ rigidBody: rigidBody2, collider: collider2 });
        collider2Events?.onIntersectionExit?.({ rigidBody: rigidBody1, collider: collider1 });
      }
    });
  }, updatePriority);

  const api = useMemo(() => createWorldApi(getWorldRef), []);

  const context = useMemo<RapierContext>(
    () => ({
      rapier,
      world: api,
      physicsOptions: {
        colliders,
        gravity,
      },
      rigidBodyStates,
      colliderStates,
      rigidBodyEvents,
      colliderEvents,
      isPaused
    }),
    [isPaused]
  );

  return (
    <RapierContext.Provider value={context}>{children}</RapierContext.Provider>
  );
};

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
import { RigidBodyAutoCollider, Vector3Array, WorldApi } from "./types";
import {
  ColliderHandle,
  EventQueue,
  RigidBody,
  RigidBodyHandle,
  TempContactManifold,
  World,
} from "@dimforge/rapier3d-compat";
import { InstancedMesh, Matrix, Matrix4, Mesh, Object3D, Quaternion, Vector3 } from "three";
import {
  rapierQuaternionToQuaternion,
  rapierVector3ToVector3,
  vectorArrayToVector3,
} from "./utils";
import { createWorldApi } from "./api";
import { _matrix4, _object3d, _vector3 } from "./shared-objects";

export interface RapierContext {
  rapier: typeof Rapier;
  world: WorldApi;
  rigidBodyStates: Map<
    RigidBodyHandle,
    {
      mesh: Object3D;
      isSleeping: boolean;
      setMatrix(mat: Matrix4): void;
      getMatrix(): Matrix4;
      worldScale: Vector3;
      invertedMatrixWorld: Matrix4;
    }
  >;
  physicsOptions: {
    colliders: RigidBodyAutoCollider;
  };
  rigidBodyEvents: EventMap;
  isPaused: boolean;
}

export const RapierContext =
  createContext<RapierContext | undefined>(undefined);

const importRapier = async () => {
  let r = await import("@dimforge/rapier3d-compat");
  await r.init();
  return r;
};

type EventMap = Map<
  ColliderHandle | RigidBodyHandle,
  {
    onSleep?(): void;
    onWake?(): void;
    onCollisionEnter?({
      target,
      manifold,
      flipped,
    }: {
      target: RigidBody;
      manifold: TempContactManifold;
      flipped: boolean;
    }): void;
    onCollisionExit?({ target }: { target: RigidBody }): void;
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
   * simulation at that framerate.
   * 
   * @defaultValue 1/60
   */
  timeStep?: number;

  /**
   * Maximum number of fixed steps to take per function call.
   * 
   * @defaultValue 10
   */
  maxSubSteps?: number

  /**
   * Pause the physics simulation
   * 
   * @defaultValue false
   */
  paused?: boolean
}

export const Physics: FC<RapierWorldProps> = ({
  colliders = "cuboid",
  gravity = [0, -9.81, 0],
  children,
  timeStep = 1/60,
  maxSubSteps = 10,
  paused = false
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

  const [rigidBodyStates] = useState<
    Map<
      RigidBodyHandle,
      {
        mesh: Object3D;
        isSleeping: boolean;
        setMatrix(mat: Matrix4): void;
        getMatrix(): Matrix4;
        worldScale: Vector3;
        invertedMatrixWorld: Matrix4;
      }
    >
  >(() => new Map());
  const [rigidBodyEvents] = useState<EventMap>(() => new Map());
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
    time: 0,
    lastTime: 0,
    accumulator: 0
  })

  useFrame((_, delta) => {
    const world = worldRef.current;
    if (!world) return;

    world.timestep = timeStep;

    /**
     * Fixed timeStep simulation progression
     * @see https://gafferongames.com/post/fix_your_timestep/ 
    */
    let previousTranslations: Record<string, {
      rotation: Quaternion,
      translation: Vector3
    }> = {}

    // don't step time forwards if paused
    const nowTime = steppingState.time += paused ? 0 : delta * 1000;
    const timeStepMs = timeStep * 1000
    const timeSinceLast = nowTime - steppingState.lastTime
    steppingState.lastTime = nowTime
    steppingState.accumulator += timeSinceLast

    if (!paused) {
      let subSteps = 0
      while (steppingState.accumulator >= timeStepMs && subSteps < maxSubSteps) {
        // Collect previous state
        world.bodies.forEach(b => {
          previousTranslations[b.handle] = {
            rotation: rapierQuaternionToQuaternion(b.rotation()).normalize(),
            translation: rapierVector3ToVector3(b.translation())
          }
        })

        world.step(eventQueue)
        subSteps++
        steppingState.accumulator -= timeStepMs
      }
    }

    const interpolationAlpha = (steppingState.accumulator % timeStepMs) / timeStepMs

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

      let oldState = previousTranslations[rigidBody.handle]
      
      let newTranslation = rapierVector3ToVector3(rigidBody.translation())
      let newRotation = rapierQuaternionToQuaternion(rigidBody.rotation())
      let interpolatedTranslation = oldState ? oldState.translation.lerp(newTranslation, 1) : newTranslation
      let interpolatedRotation = oldState ? oldState.rotation.slerp(newRotation, interpolationAlpha) : newRotation

      state.setMatrix(
        _matrix4
          .compose(
            interpolatedTranslation,
            interpolatedRotation,
            state.worldScale
          )
          .premultiply(state.invertedMatrixWorld)
      );

      if (state.mesh instanceof InstancedMesh) {
        state.mesh.instanceMatrix.needsUpdate = true;
      }
    });

    // Collision events
    eventQueue.drainCollisionEvents((handle1, handle2, started) => {
      const collider1 = world.getCollider(handle1);
      const collider2 = world.getCollider(handle2);

      const rigidBodyHandle1 = collider1.parent()?.handle;
      const rigidBodyHandle2 = collider2.parent()?.handle;

      if (!collider1 || !collider2 || rigidBodyHandle1 === undefined || rigidBodyHandle2 === undefined) {
        return;
      }

      const rigidBody1 = world.getRigidBody(rigidBodyHandle1);
      const rigidBody2 = world.getRigidBody(rigidBodyHandle2);

      const events1 = rigidBodyEvents.get(rigidBodyHandle1);
      const events2 = rigidBodyEvents.get(rigidBodyHandle2);

      if (started) {
        world.contactPair(collider1, collider2, (manifold, flipped) => {
          events1?.onCollisionEnter?.({
            target: rigidBody2,
            manifold,
            flipped,
          });
          events2?.onCollisionEnter?.({
            target: rigidBody1,
            manifold,
            flipped,
          });
        });
      } else {
        events1?.onCollisionExit?.({ target: rigidBody2 });
        events2?.onCollisionExit?.({ target: rigidBody1 });
      }
    });
  });

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
      rigidBodyEvents,
      isPaused
    }),
    [isPaused]
  );

  return (
    <RapierContext.Provider value={context}>{children}</RapierContext.Provider>
  );
};

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
import { InstancedMesh, Matrix, Matrix4, Mesh, Object3D, Vector3 } from "three";
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
  colliderMeshes: Map<ColliderHandle, Object3D>;
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
   * "vary" will run the simulation at a delta-value based
   * on the users current framerate. This ensures simulations
   * run at the same percieved speed at all framerates, but
   * can also lead to instability.
   *
   * @defaultValue "vary"
   */
  timeStep?: number | "vary";

  /**
   * Pause the physics simulation
   * 
   * @defaultValue false
   */
  paused: boolean
}

export const Physics: FC<RapierWorldProps> = ({
  colliders = "cuboid",
  gravity = [0, -9.81, 0],
  children,
  timeStep = "vary",
  paused = false
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

  const [colliderMeshes] = useState<Map<ColliderHandle, Object3D>>(
    () => new Map()
  );
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

  const time = useRef(performance.now());

  useFrame((context) => {
    const world = worldRef.current;
    if (!world) return;

    // Set timestep to current delta, to allow for variable frame rates
    // We cap the delta at 100, so that the physics simulation doesn't get wild
    const now = performance.now();
    const delta = Math.min(100, now - time.current);

    if (timeStep === "vary") {
      world.timestep = delta / 1000;
    } else {
      world.timestep = timeStep;
    }

    if (!paused) world.step(eventQueue);

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
        rigidBody.isFixed() ||
        !state.setMatrix
      ) {
        return;
      }

      state.setMatrix(
        _matrix4
          .compose(
            rapierVector3ToVector3(rigidBody.translation()),
            rapierQuaternionToQuaternion(rigidBody.rotation()),
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

      if (!collider1 || !collider2 || !rigidBodyHandle1 || !rigidBodyHandle2) {
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

    time.current = now;
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
      colliderMeshes,
      rigidBodyStates,
      rigidBodyEvents,
    }),
    []
  );

  return (
    <RapierContext.Provider value={context}>{children}</RapierContext.Provider>
  );
};

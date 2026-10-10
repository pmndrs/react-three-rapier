import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { useEffect } from "react";
import ReactThreeTestRenderer from "@react-three/test-renderer";
import { getScheduler } from "@react-three/fiber";
import {
  BufferGeometry,
  Group,
  LineSegments,
  Object3D,
  Quaternion,
  Vector3
} from "three";
import {
  Physics,
  RapierContext,
  RapierRigidBody,
  RigidBody,
  RigidBodyProps,
  useAfterPhysicsStep,
  useBeforePhysicsStep,
  useRapier
} from "../src";
import { pause } from "./test-utils";

type Renderer = Awaited<ReturnType<typeof ReactThreeTestRenderer.create>>;

const scheduler = getScheduler();

let renderers: Renderer[] = [];
const create = async (element: React.ReactNode, options?: any) => {
  let renderer!: Renderer;
  await ReactThreeTestRenderer.act(async () => {
    renderer = await ReactThreeTestRenderer.create(
      element as React.ReactElement,
      options
    );
  });
  renderers.push(renderer);

  // <Physics> suspends while Rapier's wasm loads (first test only)
  for (let i = 0; i < 200 && renderer.scene.children.length === 0; i++) {
    await ReactThreeTestRenderer.act(async () => {
      await pause(10);
    });
  }
  return renderer;
};

afterEach(async () => {
  for (const renderer of renderers) {
    await ReactThreeTestRenderer.act(async () => {
      await renderer.unmount();
    });
  }
  renderers = [];
});

/**
 * Drives the scheduler like real rAF frames, without resetting the clocks
 * between calls (unlike `advanceFrames`), so banked time carries over.
 */
const createClock = () => {
  let time = 0;
  scheduler.resetTiming();
  scheduler.step(time);
  return (deltas: number | number[], count = 1) => {
    const list = Array.isArray(deltas) ? deltas : Array(count).fill(deltas);
    for (const delta of list) {
      time += delta * 1000;
      scheduler.step(time);
    }
  };
};

/** Records every before/after step call with its dt. */
const createRecorder = () => {
  const before: number[] = [];
  const after: number[] = [];
  const Recorder = () => {
    useBeforePhysicsStep((world, dt) => {
      expect(world).toBeDefined();
      before.push(dt);
    });
    useAfterPhysicsStep((_world, dt) => {
      after.push(dt);
    });
    return null;
  };
  return { before, after, Recorder };
};

const ContextCatcher = ({ onContext }: { onContext: (c: any) => void }) => {
  const ctx = useRapier();
  useEffect(() => {
    onContext(ctx);
  }, [ctx]);
  return null;
};

const Body = ({
  bodyRef,
  objectRef,
  ...props
}: RigidBodyProps & {
  bodyRef?: React.Ref<RapierRigidBody>;
  objectRef?: React.Ref<Object3D>;
}) => (
  <RigidBody ref={bodyRef} colliders="cuboid" {...props}>
    <mesh ref={objectRef as any}>
      <boxGeometry />
    </mesh>
  </RigidBody>
);

const FALLBACK = "accumulator fallback (no scheduler fixed-step)";
const FIXED = "scheduler fixed phase";

/** Hide the scheduler 0.3 fixed-step API to exercise the fallback path. */
const useFallback = () => {
  beforeEach(() => {
    (scheduler as any).getOverstep = undefined;
  });
  afterEach(() => {
    delete (scheduler as any).getOverstep;
  });
};

describe.each([FIXED, FALLBACK])("stepping: %s", (mode) => {
  if (mode === FALLBACK) useFallback();

  it("runs a deterministic number of fixed steps for varying frame deltas", async () => {
    const { before, after, Recorder } = createRecorder();
    await create(
      <Physics>
        <Recorder />
        <Body />
      </Physics>
    );

    const frames = createClock();

    // 1/120 + 1/40 = 1/30 -> two steps every pair of frames
    frames([1 / 120, 1 / 40], 1);
    for (let i = 0; i < 9; i++) frames([1 / 120, 1 / 40]);
    expect(before.length).toBe(20);

    // 0.3s in 30 uneven-ish frames of 10ms -> exactly 18 steps of 1/60
    frames(0.01, 30);
    expect(before.length).toBe(38);

    expect(new Set(before)).toEqual(new Set([1 / 60]));
    expect(after).toEqual(before);
  });

  it("caps catch-up at maxSubSteps and drops the surplus", async () => {
    const { before, Recorder } = createRecorder();
    await create(
      <Physics maxSubSteps={3}>
        <Recorder />
        <Body />
      </Physics>
    );

    const frames = createClock();
    frames(10.5 / 60);
    expect(before.length).toBe(3);

    // The dropped 7 steps are not owed later; only the half step carries over
    frames(1 / 60);
    expect(before.length).toBe(4);
  });

  it("does not step while paused, and does not burst on resume", async () => {
    const { before, Recorder } = createRecorder();
    const scene = (paused: boolean) => (
      <Physics paused={paused}>
        <Recorder />
        <Body />
      </Physics>
    );
    const renderer = await create(scene(true));

    const frames = createClock();
    frames(1 / 60, 30);
    expect(before.length).toBe(0);

    await ReactThreeTestRenderer.act(async () => {
      await renderer.update(scene(false));
    });

    frames(1 / 60);
    expect(before.length).toBe(1);
    frames(1 / 60);
    expect(before.length).toBe(2);
  });

  it("interpolates rendered transforms by the overstep", async () => {
    const object = React.createRef<Object3D>();
    const bodyObject = () => object.current!.parent!;
    await create(
      <Physics gravity={[0, 0, 0]}>
        <Body objectRef={object} linearVelocity={[6, 0, 0]} />
      </Physics>
    );

    const frames = createClock();
    // One step of 1/60 moves the body 0.1. Half a step remains banked.
    frames(1.5 / 60);
    expect(bodyObject().position.x).toBeCloseTo(0.05, 4);

    // 2.25 steps banked: two steps run (x = 0.2), a quarter of the next banked,
    // so the visual sits a quarter of the way from step 1 to step 2
    frames(0.75 / 60);
    expect(bodyObject().position.x).toBeCloseTo(0.125, 4);

    // 3.25 steps: a quarter of the way from step 2 to step 3
    frames(1 / 60);
    expect(bodyObject().position.x).toBeCloseTo(0.225, 4);
  });

  it("renders the latest step when interpolate is false", async () => {
    const object = React.createRef<Object3D>();
    await create(
      <Physics gravity={[0, 0, 0]} interpolate={false}>
        <Body objectRef={object} linearVelocity={[6, 0, 0]} />
      </Physics>
    );

    const frames = createClock();
    frames(1.5 / 60);
    expect(object.current!.parent!.position.x).toBeCloseTo(0.1, 4);
  });
});

describe("stepping", () => {
  it("passes dt to useBeforePhysicsStep/useAfterPhysicsStep and still supports single-argument callbacks", async () => {
    const legacy = vi.fn((world: any) => world);
    const { before, after, Recorder } = createRecorder();
    const Legacy = () => {
      useBeforePhysicsStep(legacy);
      return null;
    };

    await create(
      <Physics timeStep={1 / 30}>
        <Recorder />
        <Legacy />
        <Body />
      </Physics>
    );

    const frames = createClock();
    frames(1 / 30, 2);
    expect(before).toEqual([1 / 30, 1 / 30]);
    expect(after).toEqual([1 / 30, 1 / 30]);
    expect(legacy).toHaveBeenCalledTimes(2);
  });

  it("steps with the clamped frame delta in vary mode", async () => {
    const { before, Recorder } = createRecorder();
    await create(
      <Physics timeStep="vary">
        <Recorder />
        <Body />
      </Physics>
    );

    const frames = createClock();
    frames([1 / 30, 1 / 45, 0.75]);
    expect(before.length).toBe(3);
    expect(before[0]).toBeCloseTo(1 / 30, 9);
    expect(before[1]).toBeCloseTo(1 / 45, 9);
    expect(before[2]).toBe(0.5);
  });

  it("manual step() works while paused and syncs meshes", async () => {
    const object = React.createRef<Object3D>();
    let context!: RapierContext;
    await create(
      <Physics paused gravity={[0, 0, 0]}>
        <ContextCatcher onContext={(c) => (context = c)} />
        <Body objectRef={object} linearVelocity={[6, 0, 0]} />
      </Physics>
    );

    const frames = createClock();
    frames(1 / 60, 10);
    expect(object.current!.parent!.position.x).toBe(0);

    context.step(1 / 60);
    // Synced immediately, without waiting for a frame
    expect(object.current!.parent!.position.x).toBeCloseTo(0.1, 4);

    // Paused frames keep showing the stepped pose (alpha 1, no jitter)
    frames(0.7 / 60);
    expect(object.current!.parent!.position.x).toBeCloseTo(0.1, 4);
  });

  it("runs multiple worlds with different timeSteps in one canvas, without retiming the shared physics phase", async () => {
    const a = createRecorder();
    const b = createRecorder();

    await create(
      <>
        <Physics timeStep={1 / 60}>
          <a.Recorder />
          <Body />
        </Physics>
        <Physics timeStep={1 / 30}>
          <b.Recorder />
          <Body />
        </Physics>
      </>
    );

    const frames = createClock();
    frames(1 / 60, 12);

    expect(a.before.length).toBe(12);
    expect(b.before.length).toBe(6);
    expect(new Set(b.before)).toEqual(new Set([1 / 30]));
    expect(scheduler.getPhaseTimestep("physics")).toBe(1 / 60);
  });

  it("invalidates the canvas while bodies are awake (frameloop='demand')", async () => {
    const invalidateRoot = vi.spyOn(scheduler, "invalidateRoot");
    const { before, Recorder } = createRecorder();

    await create(
      <Physics>
        <Recorder />
        <Body />
      </Physics>,
      { frameloop: "demand" }
    );

    // The scheduler's own rAF driver keeps ticking the demand root only
    // because every synced frame with awake bodies invalidates it.
    await pause(200);
    expect(before.length).toBeGreaterThan(3);
    expect(invalidateRoot).toHaveBeenCalled();
    invalidateRoot.mockRestore();
  });

  it("does not invalidate when nothing is awake", async () => {
    const { Recorder } = createRecorder();
    await create(
      <Physics>
        <Recorder />
        <Body type="fixed" />
      </Physics>,
      { frameloop: "demand" }
    );

    const frames = createClock();
    frames(1 / 60, 2);
    const invalidateRoot = vi.spyOn(scheduler, "invalidateRoot");
    frames(1 / 60, 5);
    expect(invalidateRoot).not.toHaveBeenCalled();
    invalidateRoot.mockRestore();
  });

  it("steps in its own loop with updateLoop='independent'", async () => {
    const { before, Recorder } = createRecorder();
    await create(
      <Physics updateLoop="independent">
        <Recorder />
        <Body />
      </Physics>,
      { frameloop: "never" }
    );

    await pause(150);
    expect(before.length).toBeGreaterThan(1);
  });

  it("keeps body visuals on their bodies when an ancestor moves after mount (#36)", async () => {
    const group = React.createRef<Group>();
    const object = React.createRef<Object3D>();
    const body = React.createRef<RapierRigidBody>();

    await create(
      <Physics gravity={[0, 0, 0]}>
        <group ref={group} position={[0, 2, 0]}>
          <Body bodyRef={body} objectRef={object} position={[1, 0, 0]} />
        </group>
      </Physics>
    );

    const frames = createClock();
    frames(1 / 60, 2);

    const expectInSync = () => {
      const visual = object.current!.parent!;
      visual.updateWorldMatrix(true, false);
      const position = new Vector3();
      const quaternion = new Quaternion();
      visual.matrixWorld.decompose(position, quaternion, new Vector3());

      const t = body.current!.translation();
      const r = body.current!.rotation();
      expect(position.x).toBeCloseTo(t.x, 4);
      expect(position.y).toBeCloseTo(t.y, 4);
      expect(position.z).toBeCloseTo(t.z, 4);
      expect(
        Math.abs(quaternion.dot(new Quaternion(r.x, r.y, r.z, r.w)))
      ).toBeCloseTo(1, 4);
    };

    expect(body.current!.translation()).toMatchObject({ x: 1, y: 2, z: 0 });
    expectInSync();

    // Rotate and move the parent after mount
    group.current!.rotation.set(0.3, Math.PI / 2, 0);
    group.current!.position.set(5, -1, 3);
    frames(1 / 60, 2);
    expectInSync();

    // ...also when the body is asleep
    body.current!.sleep();
    group.current!.rotation.set(0, -Math.PI / 3, 0.2);
    group.current!.position.set(-4, 0, 0);
    frames(1 / 60, 2);
    expect(body.current!.isSleeping()).toBe(true);
    expectInSync();
  });

  it("debug renders into one persistent geometry and disposes it on toggle (#666)", async () => {
    const scene = (debug: boolean) => (
      <Physics debug={debug}>
        <Body />
        <Body position={[0, 3, 0]} />
      </Physics>
    );
    const renderer = await create(scene(false));

    const findDebugLines = () => {
      const found: LineSegments[] = [];
      (renderer.scene.instance as Object3D).traverse((o) => {
        if ((o as LineSegments).isLineSegments) found.push(o as LineSegments);
      });
      return found;
    };

    const frames = createClock();
    const disposed: BufferGeometry[] = [];
    const geometries = new Set<BufferGeometry>();

    for (let toggle = 0; toggle < 3; toggle++) {
      await ReactThreeTestRenderer.act(async () => {
        await renderer.update(scene(true));
      });

      const [lines] = findDebugLines();
      expect(lines).toBeDefined();
      const geometry = lines.geometry;
      geometries.add(geometry);

      frames(1 / 60);
      // (the first frame sizes the attributes, which disposes the empty ones)
      geometry.addEventListener("dispose", () => disposed.push(geometry));
      const position = geometry.getAttribute("position");
      const color = geometry.getAttribute("color");
      expect(geometry.drawRange.count).toBeGreaterThan(0);
      expect(color.itemSize).toBe(4);

      frames(1 / 60, 5);
      // Same geometry and same attributes: no per-frame allocation
      expect(lines.geometry).toBe(geometry);
      expect(geometry.getAttribute("position")).toBe(position);
      expect(geometry.getAttribute("color")).toBe(color);

      await ReactThreeTestRenderer.act(async () => {
        await renderer.update(scene(false));
      });
      expect(findDebugLines()).toHaveLength(0);
    }

    expect(geometries.size).toBe(3);
    expect(disposed).toHaveLength(3);
    expect(new Set(disposed)).toEqual(geometries);
  });
});

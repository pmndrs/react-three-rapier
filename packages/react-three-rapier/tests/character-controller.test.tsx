import React, { StrictMode, useEffect, useRef } from "react";
import ReactThreeTestRenderer from "@react-three/test-renderer";
import { describe, expect, it, vi } from "vitest";
import {
  CapsuleCollider,
  CharacterController,
  CharacterControllerOptions,
  CharacterControllerRef,
  CuboidCollider,
  Physics,
  RapierContext,
  RapierRigidBody,
  RigidBody,
  useCharacterController,
  useBeforePhysicsStep,
  useRapier
} from "../src";

type Harness = {
  step: (dt: number) => void;
  ctx: RapierContext;
  chars: CharacterControllerRef[];
  renderer: Awaited<ReturnType<typeof ReactThreeTestRenderer.create>>;
};

const Grab = ({ onReady }: { onReady: (ctx: RapierContext) => void }) => {
  const ctx = useRapier();
  useEffect(() => {
    onReady(ctx);
  }, []);
  return null;
};

const Character = ({
  index,
  chars,
  children,
  ...props
}: { index: number; chars: CharacterControllerRef[] } & Record<
  string,
  any
>) => {
  const ref = useRef<CharacterControllerRef>(null);
  useEffect(() => {
    chars[index] = ref.current!;
  }, []);
  return (
    <CharacterController ref={ref} position={[0, 0.81, 0]} {...props}>
      <CapsuleCollider args={[0.5, 0.3]} />
      {children}
    </CharacterController>
  );
};

const Floor = () => (
  <RigidBody type="fixed" position={[0, -0.5, 0]}>
    <CuboidCollider args={[50, 0.5, 50]} />
  </RigidBody>
);

const setup = async (
  children: (chars: CharacterControllerRef[]) => React.ReactNode,
  { strict = false } = {}
): Promise<Harness> => {
  const chars: CharacterControllerRef[] = [];
  let ctx!: RapierContext;
  let renderer!: Harness["renderer"];
  const tree = (
    <Physics paused timeStep={1 / 60}>
      {children(chars)}
      <Grab onReady={(c) => (ctx = c)} />
    </Physics>
  );
  await ReactThreeTestRenderer.act(async () => {
    renderer = await ReactThreeTestRenderer.create(
      strict ? <StrictMode>{tree}</StrictMode> : tree
    );
  });
  while (!ctx) await new Promise((r) => setTimeout(r, 10));
  return {
    ctx,
    chars,
    renderer,
    step: (dt) => ctx.step(dt)
  };
};

const run = async (h: Harness, seconds: number, dt = 1 / 60) => {
  await ReactThreeTestRenderer.act(async () => {
    const n = Math.round(seconds / dt);
    for (let i = 0; i < n; i++) h.step(dt);
  });
};

const pos = (c: CharacterControllerRef) => c.rigidBody!.translation();

describe("character controller", () => {
  it("creates and removes the controller on mount/unmount", async () => {
    const h = await setup((chars) => <Character index={0} chars={chars} />);
    expect(h.ctx.world.characterControllers.size).toBe(1);
    await ReactThreeTestRenderer.act(async () => {
      await h.renderer.unmount();
    });
    expect(h.ctx.world.characterControllers.size).toBe(0);
  });

  it("keeps exactly one controller under StrictMode", async () => {
    const h = await setup((chars) => <Character index={0} chars={chars} />, {
      strict: true
    });
    expect(h.ctx.world.characterControllers.size).toBe(1);
    await ReactThreeTestRenderer.act(async () => {
      await h.renderer.unmount();
    });
    expect(h.ctx.world.characterControllers.size).toBe(0);
  });

  it("applies options reactively", async () => {
    let controller: any;
    const Probe = ({ opts }: { opts: CharacterControllerOptions }) => {
      const cc = useCharacterController(opts);
      useEffect(() => {
        controller = cc.controller;
      });
      return null;
    };
    let renderer!: Awaited<ReturnType<typeof ReactThreeTestRenderer.create>>;
    await ReactThreeTestRenderer.act(async () => {
      renderer = await ReactThreeTestRenderer.create(
        <Physics paused>
          <Probe opts={{ slide: false, snapToGround: 0.3, autostep: false }} />
        </Physics>
      );
    });
    expect(controller.slideEnabled()).toBe(false);
    expect(controller.snapToGroundEnabled()).toBe(true);
    expect(controller.autostepEnabled()).toBe(false);
    await ReactThreeTestRenderer.act(async () => {
      await renderer.update(
        <Physics paused>
          <Probe
            opts={{
              slide: true,
              snapToGround: false,
              autostep: { maxHeight: 0.4, minWidth: 0.1 },
              maxSlopeClimbAngle: 0.5
            }}
          />
        </Physics>
      );
    });
    expect(controller.slideEnabled()).toBe(true);
    expect(controller.snapToGroundEnabled()).toBe(false);
    expect(controller.autostepEnabled()).toBe(true);
    expect(controller.autostepMaxHeight()).toBeCloseTo(0.4);
    expect(controller.maxSlopeClimbAngle()).toBeCloseTo(0.5);
  });

  it("moves along a floor and reports grounded", async () => {
    const h = await setup((chars) => (
      <>
        <Floor />
        <Character index={0} chars={chars} />
      </>
    ));
    const c = h.chars[0];
    c.setVelocity({ x: 2, y: -1, z: 0 });
    await run(h, 1);
    expect(pos(c).x).toBeGreaterThan(1.9);
    expect(pos(c).x).toBeLessThan(2.1);
    expect(c.grounded).toBe(true);
    expect(pos(c).y).toBeGreaterThan(0.7);
  });

  it("is blocked by a wall", async () => {
    const h = await setup((chars) => (
      <>
        <Floor />
        <RigidBody type="fixed" position={[2, 1, 0]}>
          <CuboidCollider args={[0.5, 1, 5]} />
        </RigidBody>
        <Character index={0} chars={chars} />
      </>
    ));
    const c = h.chars[0];
    c.setVelocity({ x: 3, y: -1, z: 0 });
    await run(h, 2);
    // wall face at x=1.5, capsule radius 0.3 + offset
    expect(pos(c).x).toBeLessThan(1.25);
    expect(pos(c).x).toBeGreaterThan(1.0);
  });

  it("fires edge-triggered grounded/airborne events", async () => {
    const onGrounded = vi.fn();
    const onAirborne = vi.fn();
    const h = await setup((chars) => (
      <>
        <Floor />
        <Character
          index={0}
          chars={chars}
          position={[0, 1.5, 0]}
          onGrounded={onGrounded}
          onAirborne={onAirborne}
        />
      </>
    ));
    const c = h.chars[0];
    c.setVelocity({ x: 0, y: -2, z: 0 });
    await run(h, 1);
    expect(c.grounded).toBe(true);
    expect(onGrounded).toHaveBeenCalledTimes(1);
    expect(onAirborne).not.toHaveBeenCalled();
    c.setVelocity({ x: 0, y: 5, z: 0 });
    await run(h, 0.2);
    expect(c.grounded).toBe(false);
    expect(onAirborne).toHaveBeenCalledTimes(1);
    expect(onGrounded).toHaveBeenCalledTimes(1);
  });

  it("reports character collisions", async () => {
    const onCollision = vi.fn();
    const h = await setup((chars) => (
      <>
        <Floor />
        <Character index={0} chars={chars} onCharacterCollision={onCollision} />
      </>
    ));
    h.chars[0].setVelocity({ x: 0, y: -1, z: 0 });
    await run(h, 0.2);
    expect(onCollision).toHaveBeenCalled();
  });

  const stepScene = (autostep: boolean) => (chars: CharacterControllerRef[]) =>
    (
      <>
        <Floor />
        <RigidBody type="fixed" position={[2, 0.1, 0]}>
          <CuboidCollider args={[1, 0.1, 5]} />
        </RigidBody>
        <Character
          index={0}
          chars={chars}
          autostep={autostep ? { maxHeight: 0.3, minWidth: 0.1 } : undefined}
        />
      </>
    );

  it("climbs a small step with autostep", async () => {
    const h = await setup(stepScene(true));
    h.chars[0].setVelocity({ x: 2, y: -1, z: 0 });
    await run(h, 1.5);
    expect(pos(h.chars[0]).x).toBeGreaterThan(2.0);
    expect(pos(h.chars[0]).y).toBeGreaterThan(0.95);
  });

  it("is blocked by the same step without autostep", async () => {
    const h = await setup(stepScene(false));
    h.chars[0].setVelocity({ x: 2, y: -1, z: 0 });
    await run(h, 1.5);
    expect(pos(h.chars[0]).x).toBeLessThan(1.0);
  });

  it("is framerate independent with a fixed timeStep", async () => {
    const dists: number[] = [];
    for (const dt of [1 / 30, 1 / 60, 1 / 120]) {
      const h = await setup((chars) => (
        <>
          <Floor />
          <Character index={0} chars={chars} />
        </>
      ));
      h.chars[0].setVelocity({ x: 3, y: -1, z: 0 });
      await run(h, 1, dt);
      dists.push(pos(h.chars[0]).x);
    }
    for (const d of dists)
      expect(Math.abs(d - dists[1])).toBeLessThan(3 / 60 + 1e-6);
    expect(dists[1]).toBeGreaterThan(2.9);
  });

  it("translate(delta) applies a one-off displacement", async () => {
    const h = await setup((chars) => (
      <>
        <Floor />
        <Character index={0} chars={chars} />
      </>
    ));
    const c = h.chars[0];
    c.translate({ x: 1, y: 0, z: 0 });
    await run(h, 0.5);
    expect(pos(c).x).toBeCloseTo(1, 1);
  });

  it("supports multiple independent characters", async () => {
    const h = await setup((chars) => (
      <>
        <Floor />
        <Character index={0} chars={chars} position={[0, 0.81, -2]} />
        <Character index={1} chars={chars} position={[0, 0.81, 2]} />
      </>
    ));
    expect(h.ctx.world.characterControllers.size).toBe(2);
    h.chars[0].setVelocity({ x: 2, y: -1, z: 0 });
    h.chars[1].setVelocity({ x: -2, y: -1, z: 0 });
    await run(h, 1);
    expect(pos(h.chars[0]).x).toBeGreaterThan(1.8);
    expect(pos(h.chars[1]).x).toBeLessThan(-1.8);
  });

  it("hook move() works from useBeforePhysicsStep and returns pooled results", async () => {
    let body!: RapierRigidBody;
    let first: any;
    let second: any;
    const Player = () => {
      const ref = useRef<RapierRigidBody>(null);
      const cc = useCharacterController();
      useBeforePhysicsStep(() => {
        body = ref.current!;
        const r = cc.move(body, { x: 0.1, y: -0.1, z: 0 });
        if (!first) first = r;
        else second = r;
      });
      return (
        <RigidBody ref={ref} type="kinematicPosition" position={[0, 0.81, 0]}>
          <CapsuleCollider args={[0.5, 0.3]} />
        </RigidBody>
      );
    };
    const h = await setup(() => (
      <>
        <Floor />
        <Player />
      </>
    ));
    await run(h, 0.1);
    expect(second).toBe(first);
    expect(body.translation().x).toBeGreaterThan(0.1);
  });

  it("reverts options to Rapier defaults when they become undefined", async () => {
    let controller: any;
    const Probe = ({ opts }: { opts: CharacterControllerOptions }) => {
      const cc = useCharacterController(opts);
      useEffect(() => {
        controller = cc.controller;
      });
      return null;
    };
    let renderer!: Awaited<ReturnType<typeof ReactThreeTestRenderer.create>>;
    await ReactThreeTestRenderer.act(async () => {
      renderer = await ReactThreeTestRenderer.create(
        <Physics paused>
          <Probe opts={{ slide: false, maxSlopeClimbAngle: 0.1 }} />
        </Physics>
      );
    });
    const defaultSlope = Math.PI / 4;
    expect(controller.maxSlopeClimbAngle()).toBeCloseTo(0.1);
    await ReactThreeTestRenderer.act(async () => {
      await renderer.update(
        <Physics paused>
          <Probe
            opts={{
              autostep: { maxHeight: 0.4, minWidth: 0.1 },
              snapToGround: 0.3
            }}
          />
        </Physics>
      );
    });
    expect(controller.autostepEnabled()).toBe(true);
    expect(controller.snapToGroundEnabled()).toBe(true);
    expect(controller.slideEnabled()).toBe(true);
    expect(controller.maxSlopeClimbAngle()).toBeCloseTo(defaultSlope);
    await ReactThreeTestRenderer.act(async () => {
      await renderer.update(
        <Physics paused>
          <Probe opts={{}} />
        </Physics>
      );
    });
    expect(controller.autostepEnabled()).toBe(false);
    expect(controller.snapToGroundEnabled()).toBe(false);
  });

  it("creates only the explicit collider for mesh children", async () => {
    const h = await setup((chars) => (
      <Character index={0} chars={chars}>
        <mesh>
          <boxGeometry />
        </mesh>
      </Character>
    ));
    expect(h.chars[0].rigidBody!.numColliders()).toBe(1);
  });

  it("move() after unmount is a no-op that does not leak a controller", async () => {
    let api: any;
    let body!: RapierRigidBody;
    const Player = () => {
      const ref = useRef<RapierRigidBody>(null);
      api = useCharacterController();
      useEffect(() => {
        body = ref.current!;
      }, []);
      return (
        <RigidBody ref={ref} type="kinematicPosition">
          <CapsuleCollider args={[0.5, 0.3]} />
        </RigidBody>
      );
    };
    const h = await setup(() => <Player />);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await ReactThreeTestRenderer.act(async () => {
      await h.renderer.unmount();
    });
    expect(() => api.move(body, { x: 1, y: 0, z: 0 })).not.toThrow();
    expect(h.ctx.world.characterControllers.size).toBe(0);
    warn.mockRestore();
  });

  // Needs the stepping rewrite (feat/v10-scheduler-stepping): before-step
  // callbacks receive the substep dt instead of a stale world.timestep.
  it.todo("is framerate independent with timeStep='vary'");
});

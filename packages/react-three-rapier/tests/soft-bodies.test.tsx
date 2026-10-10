import ReactThreeTestRenderer from "@react-three/test-renderer";
import { getScheduler } from "@react-three/fiber";
import React, { StrictMode } from "react";
import { describe, expect, it } from "vitest";
import { Physics, RapierContext, RapierRigidBody, RigidBody } from "../src";
import { SoftBodyMaterial } from "@dimforge/rapier3d-compat";
import { SoftBody, SoftBodyState, weldGeometry } from "../src/soft-bodies";
import { BufferGeometry, Mesh, SphereGeometry, Vector3 } from "three";
import { pause, UseRapierMounter } from "./test-utils";

const setup = async (
  children: React.ReactNode,
  { strict = false, paused = true }: { strict?: boolean; paused?: boolean } = {}
) => {
  // Await `create` itself (not just the mount callback): racing them leaves
  // act() scopes overlapping, which doesn't flush reliably on r3f v10.
  let resolveContext!: (context: RapierContext) => void;
  const ready = new Promise<RapierContext>((resolve) => {
    resolveContext = resolve;
  });
  const tree = (
    <Physics paused={paused}>
      <UseRapierMounter ready={resolveContext} />
      {children}
    </Physics>
  );
  let renderer!: Awaited<ReturnType<typeof ReactThreeTestRenderer.create>>;
  await ReactThreeTestRenderer.act(async () => {
    renderer = await ReactThreeTestRenderer.create(
      strict ? <StrictMode>{tree}</StrictMode> : tree
    );
  });
  const context = await ready;
  // let the effects of the children settle
  await ReactThreeTestRenderer.act(async () => {
    await pause(20);
  });
  return { renderer, context };
};

const stepFor = (context: RapierContext, seconds: number) => {
  const steps = Math.round(seconds * 60);
  for (let i = 0; i < steps; i++) context.step(1 / 60);
};

const clothMesh = (
  <mesh position={[0, 3, 0]}>
    <planeGeometry args={[1, 1, 4, 4]} />
    <meshBasicMaterial />
  </mesh>
);

const positions = (mesh: Mesh) =>
  Array.from(mesh.geometry.attributes.position.array as Float32Array);

describe("soft bodies", () => {
  it("creates a soft body from a mesh and removes it on unmount", async () => {
    const ref = React.createRef<SoftBodyState>();
    const { renderer, context } = await setup(
      <SoftBody type="cloth" ref={ref}>
        {clothMesh}
      </SoftBody>
    );

    expect(context.world.softBodies.len()).toBe(1);
    expect(ref.current).toBeInstanceOf(SoftBodyState);
    expect(ref.current!.body.numParticles()).toBe(25);

    await ReactThreeTestRenderer.act(async () => {
      await renderer.unmount();
    });
    expect(context.world.softBodies.len()).toBe(0);
  });

  it("is safe under StrictMode (no leaked or duplicated bodies)", async () => {
    const { renderer, context } = await setup(
      <SoftBody type="cloth">{clothMesh}</SoftBody>,
      { strict: true }
    );
    expect(context.world.softBodies.len()).toBe(1);
    await ReactThreeTestRenderer.act(async () => {
      await renderer.unmount();
    });
    expect(context.world.softBodies.len()).toBe(0);
  });

  it("moves the mesh vertices under gravity", async () => {
    const ref = React.createRef<SoftBodyState>();
    const { context } = await setup(
      <SoftBody type="cloth" ref={ref}>
        {clothMesh}
      </SoftBody>
    );
    const mesh = ref.current!.object as Mesh;
    const before = positions(mesh);
    // vertices are in the parent's space, with the mesh position baked in
    expect(Math.max(...before.filter((_, i) => i % 3 === 1))).toBeCloseTo(3.5);
    expect(mesh.position.y).toBe(0);

    stepFor(context, 0.5);

    const after = positions(mesh);
    const meanY = (p: number[]) =>
      p.filter((_, i) => i % 3 === 1).reduce((a, b) => a + b, 0) /
      (p.length / 3);
    expect(meanY(after)).toBeLessThan(meanY(before) - 0.2);
    // normals and bounds are recomputed
    expect(mesh.geometry.boundingSphere!.center.y).toBeLessThan(3);
    expect(mesh.geometry.attributes.normal).toBeDefined();
  });

  it("keeps pinned vertices in place", async () => {
    const ref = React.createRef<SoftBodyState>();
    const { context } = await setup(
      // a horizontal cloth, pinned along one edge (local y = +0.5)
      <SoftBody type="cloth" ref={ref} pinned={(p) => p.y > 0.49}>
        <mesh position={[0, 3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1, 1, 4, 4]} />
          <meshBasicMaterial />
        </mesh>
      </SoftBody>
    );
    const mesh = ref.current!.object as Mesh;
    const before = positions(mesh);
    stepFor(context, 1);
    const after = positions(mesh);

    let pinned = 0;
    let falling = 0;
    for (let i = 0; i < before.length / 3; i++) {
      const moved = Math.abs(after[i * 3 + 1] - before[i * 3 + 1]);
      if (moved < 1e-4) pinned++;
      else if (moved > 0.005) falling++;
    }
    expect(pinned).toBe(5);
    expect(falling).toBeGreaterThan(0);
  });

  it("writes vertices in the parent's space", async () => {
    const ref = React.createRef<SoftBodyState>();
    const { context } = await setup(
      <group position={[10, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <SoftBody type="cloth" ref={ref}>
          {clothMesh}
        </SoftBody>
      </group>
    );
    const mesh = ref.current!.object as Mesh;
    stepFor(context, 0.3);
    mesh.updateWorldMatrix(true, false);

    // the simulated particles are in world space...
    const world = ref.current!.body.particlePositions();
    const p = mesh.geometry.attributes.position;
    const v = new Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(mesh.matrixWorld);
      expect(v.x).toBeCloseTo(world[i * 3], 3);
      expect(v.y).toBeCloseTo(world[i * 3 + 1], 3);
      expect(v.z).toBeCloseTo(world[i * 3 + 2], 3);
    }
    // ...and the local ones are not (the parent is offset by 10 on x)
    expect(Math.abs(p.getX(0))).toBeLessThan(2);
  });

  describe.each([1, 3])(
    "material driven tears (%i substeps per frame)",
    (n) => {
      it("never exposes NaN vertices or bounds", async () => {
        const ref = React.createRef<SoftBodyState>();
        let tears = 0;
        const { context } = await setup(
          <SoftBody
            type="cloth"
            ref={ref}
            pinned={(p) => p.y > 0.49}
            material={() => {
              const material = SoftBodyMaterial.uniform(8, 0.4);
              material.tearStrain = 0.0005;
              return material;
            }}
            onTear={() => tears++}
          >
            {clothMesh}
          </SoftBody>
        );
        const mesh = ref.current!.object as Mesh;
        for (let frame = 0; frame < 90; frame++) {
          context.step(n / 60);
          const p = positions(mesh);
          expect(p.every((v) => Number.isFinite(v))).toBe(true);
          expect(mesh.geometry.boundingSphere!.radius).not.toBeNaN();
        }
        expect(tears).toBeGreaterThan(0);
      });
    }
  );

  it("keeps the original UVs and hard normals of the render mesh", async () => {
    const ref = React.createRef<SoftBodyState>();
    const { context } = await setup(
      <SoftBody type="volume" ref={ref} cellSize={0.4}>
        <mesh position={[0, 2, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial />
        </mesh>
      </SoftBody>
    );
    const geometry = ref.current!.object.geometry;
    // unwelded: 24 render vertices, each face keeps its own uv
    expect(geometry.attributes.position.count).toBe(24);
    expect(geometry.attributes.uv.count).toBe(24);
    stepFor(context, 0.2);
    expect(geometry.attributes.position.count).toBe(24);
  });

  it("welds vertices on position only (UV seams)", () => {
    const sphere = new SphereGeometry(1, 8, 6);
    const welded = weldGeometry(sphere);
    const unique = new Set<string>();
    const p = sphere.attributes.position;
    for (let i = 0; i < p.count; i++) {
      unique.add(
        [p.getX(i), p.getY(i), p.getZ(i)]
          .map((v) => (Math.round(v * 1e4) / 1e4 + 0).toFixed(4))
          .join(",")
      );
    }
    expect(welded.attributes.position.count).toBe(unique.size);
    expect(welded.attributes.uv.count).toBe(unique.size);
    expect(sphere.attributes.position.count).toBeGreaterThan(unique.size);
  });

  it("builds ropes from a line, and the free end swings", async () => {
    const ref = React.createRef<SoftBodyState>();
    const geometry = new BufferGeometry().setFromPoints(
      Array.from({ length: 6 }, (_, i) => ({ x: i * 0.4, y: 4, z: 0 }) as any)
    );
    const { context } = await setup(
      <SoftBody type="rope" ref={ref} pinned={[0]}>
        <line>
          <primitive object={geometry} attach="geometry" />
          <lineBasicMaterial />
        </line>
      </SoftBody>
    );
    const line = ref.current!.object;
    expect(ref.current!.body.numParticles()).toBe(6);
    stepFor(context, 1);
    const p = positions(line as unknown as Mesh);
    expect(p[0]).toBeCloseTo(0);
    expect(p[1]).toBeCloseTo(4);
    // last point dropped well below the start
    expect(p[5 * 3 + 1]).toBeLessThan(3);
  });

  it("fills a closed mesh with a volume and deforms the skin", async () => {
    const ref = React.createRef<SoftBodyState>();
    const { context } = await setup(
      <SoftBody type="volume" ref={ref} cellSize={0.4}>
        <mesh position={[0, 2, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial />
        </mesh>
      </SoftBody>
    );
    const mesh = ref.current!.object as Mesh;
    expect(ref.current!.body.numCells()).toBeGreaterThan(0);
    const before = positions(mesh);
    stepFor(context, 0.4);
    const after = positions(mesh);
    expect(after.some((v, i) => Math.abs(v - before[i]) > 0.05)).toBe(true);
  });

  it("collides with a fixed rigid body", async () => {
    const ref = React.createRef<SoftBodyState>();
    const { context } = await setup(
      <>
        <RigidBody type="fixed" colliders="cuboid">
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[10, 0.5, 10]} />
          </mesh>
        </RigidBody>
        <SoftBody type="cloth" ref={ref}>
          <mesh position={[0, 1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1, 1, 4, 4]} />
            <meshBasicMaterial />
          </mesh>
        </SoftBody>
      </>
    );
    stepFor(context, 2);
    const mesh = ref.current!.object as Mesh;
    const minY = Math.min(...positions(mesh).filter((_, i) => i % 3 === 1));
    // rests on the floor top (y = 0.25) instead of falling through
    expect(minY).toBeGreaterThan(0.1);
  });

  it("attaches particles to a rigid body", async () => {
    const body = React.createRef<RapierRigidBody>();
    const ref = React.createRef<SoftBodyState>();
    const { context } = await setup(
      <>
        <RigidBody type="kinematicPosition" ref={body} colliders={false}>
          <mesh position={[0, 3.5, 0]} />
        </RigidBody>
        <SoftBody
          type="cloth"
          ref={ref}
          attachments={[{ particles: (p) => p.y > 0.49, body }]}
        >
          {clothMesh}
        </SoftBody>
      </>
    );
    expect(ref.current!.body.numAttachments()).toBe(5);
    body.current!.setNextKinematicTranslation({ x: 3, y: 3.5, z: 0 });
    stepFor(context, 1);
    const p = positions(ref.current!.object as Mesh);
    const topX = p.filter((_, i) => i % 3 === 0 && p[i + 1] > 3.3);
    expect(Math.max(...topX)).toBeGreaterThan(1);
  });

  it("keeps attached vertices on their interpolated rigid body between steps", async () => {
    const body = React.createRef<RapierRigidBody>();
    const anchor = React.createRef<Mesh>();
    const ref = React.createRef<SoftBodyState>();
    await setup(
      <>
        <RigidBody
          type="kinematicVelocity"
          ref={body}
          colliders={false}
          position={[0, 3.5, 0]}
          linearVelocity={[6, 0, 0]}
        >
          <mesh ref={anchor} />
        </RigidBody>
        <SoftBody
          type="cloth"
          ref={ref}
          attachments={[{ particles: (p) => p.y > 0.49, body }]}
        >
          {clothMesh}
        </SoftBody>
      </>,
      { paused: false }
    );
    const cloth = ref.current!.object as Mesh;
    expect(ref.current!.body.numAttachments()).toBe(5);

    // Rendered (local) x offsets of the attached top row from the body.
    const topRow = (bodyX: number) => {
      const p = positions(cloth);
      const out: number[] = [];
      for (let i = 0; i < p.length; i += 3) {
        const world = cloth.localToWorld(new Vector3(p[i], p[i + 1], p[i + 2]));
        if (world.y > 3.45) out.push(world.x - bodyX);
      }
      return out.sort((a, b) => a - b);
    };

    // Drive real frames: 10 whole steps, then half a step, so the frame
    // renders with an interpolation alpha of 0.5.
    const scheduler = getScheduler();
    let time = 0;
    scheduler.resetTiming();
    scheduler.step(time);
    for (let i = 0; i < 10; i++) {
      time += 1000 / 60;
      scheduler.step(time);
    }
    time += 500 / 60;
    scheduler.step(time);

    const rendered = anchor.current!.getWorldPosition(new Vector3());
    const simulated = body.current!.translation();
    // The body itself renders half a step (6 m/s / 60 / 2) behind the simulation
    expect(simulated.x - rendered.x).toBeCloseTo(0.05, 3);

    // The attached vertices keep the offsets the simulation has between them
    // and the body (the engine's attachment trails a moving body slightly),
    // measured from the rendered body: they are not half a step ahead of it.
    const offsets = topRow(rendered.x);
    const particles = ref.current!.body.particlePositions();
    const expected: number[] = [];
    for (let i = 0; i < particles.length; i += 3) {
      if (particles[i + 1] > 3.45) expected.push(particles[i] - simulated.x);
    }
    expected.sort((a, b) => a - b);
    expect(offsets.length).toBe(5);
    expect(expected.length).toBe(5);
    expected.forEach((x, i) => expect(offsets[i]).toBeCloseTo(x, 3));
  });

  it("reports tears and gives the torn seam its own vertices", async () => {
    const ref = React.createRef<SoftBodyState>();
    const tears: number[] = [];
    const { context } = await setup(
      <SoftBody
        type="cloth"
        ref={ref}
        pinned={(p) => p.y > 0.49}
        onTear={(e) => tears.push(e.tornEdges.length)}
      >
        {clothMesh}
      </SoftBody>
    );
    const geometry = ref.current!.object.geometry;
    const before = geometry.index!.count;
    stepFor(context, 0.2);
    // tear every edge (bend edges included) that crosses the plane x = 0.01
    const body = ref.current!.body;
    const edges = body.edges();
    const crossing: number[] = [];
    for (let e = 0; e < edges.length / 2; e++) {
      const a = body.particlePosition(edges[e * 2]).x;
      const b = body.particlePosition(edges[e * 2 + 1]).x;
      if ((a - 0.01) * (b - 0.01) < 0) crossing.push(e);
    }
    expect(ref.current!.tear(crossing)).toBe(true);
    expect(tears.length).toBe(1);
    // the torn seam got its own vertices
    expect(ref.current!.vertexCount).toBeGreaterThan(25);
    expect(tears[0]).toBeGreaterThanOrEqual(crossing.length);
    expect(ref.current!.object.geometry.index!.count % 3).toBe(0);

    stepFor(context, 0.2);
    const p = positions(ref.current!.object as Mesh);
    expect(p.every((v) => Number.isFinite(v))).toBe(true);
  });
});

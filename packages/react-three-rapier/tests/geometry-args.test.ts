import RAPIER from "@dimforge/rapier3d-compat";
import {
  BufferAttribute,
  BufferGeometry,
  InterleavedBuffer,
  InterleavedBufferAttribute,
  Vector3
} from "three";
import { describe, expect, it } from "vitest";
import {
  createColliderFromOptions,
  scaleColliderArgs,
  getColliderArgsFromGeometry
} from "../src/utils/utils-collider";

const positions = [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1];

const interleavedGeometry = () => {
  // pos(3) + uv(2) interleaved per vertex
  const data: number[] = [];
  for (let i = 0; i < 4; i++) {
    data.push(...positions.slice(i * 3, i * 3 + 3), 0.5, 0.5);
  }
  const buffer = new InterleavedBuffer(new Float32Array(data), 5);
  const g = new BufferGeometry();
  g.setAttribute("position", new InterleavedBufferAttribute(buffer, 3, 0));
  return g;
};

describe("getColliderArgsFromGeometry", () => {
  it("hull: de-interleaves position attributes (#781)", () => {
    const { args } = getColliderArgsFromGeometry(interleavedGeometry(), "hull");
    expect(Array.from(args[0] as Float32Array)).toEqual(positions);
  });

  it("trimesh: de-interleaves position attributes and returns u32 indices (#781)", () => {
    const g = interleavedGeometry();
    g.setIndex(new BufferAttribute(new Uint16Array([0, 1, 2, 0, 2, 3]), 1));
    const { args } = getColliderArgsFromGeometry(g, "trimesh");
    expect(Array.from(args[0] as Float32Array)).toEqual(positions);
    expect(args[1]).toBeInstanceOf(Uint32Array);
    expect(Array.from(args[1] as Uint32Array)).toEqual([0, 1, 2, 0, 2, 3]);
  });

  it("trimesh: merges vertices of non-indexed geometry (#698)", () => {
    const g = new BufferGeometry();
    g.setAttribute(
      "position",
      new BufferAttribute(
        new Float32Array([...positions.slice(0, 9), ...positions.slice(0, 9)]),
        3
      )
    );
    const { args } = getColliderArgsFromGeometry(g, "trimesh");
    expect((args[0] as Float32Array).length).toBe(9);
    expect(Array.from(args[1] as Uint32Array)).toEqual([0, 1, 2, 0, 1, 2]);
  });

  it("hull: handles normalized quantized attributes (#627)", () => {
    const g = new BufferGeometry();
    g.setAttribute(
      "position",
      new BufferAttribute(
        new Uint16Array([0, 0, 0, 65535, 0, 0, 0, 65535, 0, 0, 0, 65535]),
        3,
        true
      )
    );
    const { args } = getColliderArgsFromGeometry(g, "hull");
    expect(Array.from(args[0] as Float32Array)).toEqual(positions);
  });
});

describe("createColliderFromOptions", () => {
  it("throws a clear error when the convex hull cannot be computed (#627)", async () => {
    await RAPIER.init();
    const world = new RAPIER.World({ x: 0, y: 0, z: 0 });
    // all points identical -> degenerate hull
    expect(() =>
      createColliderFromOptions(
        { shape: "convexHull", args: [new Float32Array(12)] } as any,
        world,
        new Vector3(1, 1, 1)
      )
    ).toThrow(/convex hull/i);
  });
});

describe("scaleColliderArgs", () => {
  it("scales heightfield x/y/z independently without mutating the args (#564)", () => {
    const heightfieldScale = { x: 2, y: 3, z: 4 };
    const args = [1, 1, [0, 0, 0, 0], heightfieldScale];
    const scale = new Vector3(10, 100, 1000);

    const first = scaleColliderArgs("heightfield", args, scale);
    expect(first[3]).toEqual({ x: 20, y: 300, z: 4000 });
    expect(heightfieldScale).toEqual({ x: 2, y: 3, z: 4 });

    const second = scaleColliderArgs("heightfield", args, scale);
    expect(second[3]).toEqual({ x: 20, y: 300, z: 4000 });
  });
});

import ReactThreeTestRenderer from "@react-three/test-renderer";
import React from "react";
import { describe, expect, it } from "vitest";
import { CuboidCollider, Physics, RapierCollider } from "../src";
import { pause } from "./test-utils";

const setup = async (
  render: (value: number) => React.ReactElement,
  initial: number
) => {
  const renderer = await ReactThreeTestRenderer.create(
    <Physics paused>{render(initial)}</Physics>
  );
  await pause(300);
  return renderer;
};

describe("mass options are mutable (#711)", () => {
  it("updates collider mass when the mass prop changes", async () => {
    let collider: RapierCollider | null = null;
    const tree = (mass: number) => (
      <CuboidCollider
        ref={(c) => {
          if (c) collider = c;
        }}
        args={[1, 1, 1]}
        mass={mass}
      />
    );
    const renderer = await setup(tree, 1);
    expect(collider!.mass()).toBeCloseTo(1);

    await ReactThreeTestRenderer.act(async () => {
      await renderer.update(<Physics paused>{tree(50)}</Physics>);
    });
    expect(collider!.mass()).toBeCloseTo(50);
  });

  it("updates collider density when the density prop changes", async () => {
    let collider: RapierCollider | null = null;
    const tree = (density: number) => (
      <CuboidCollider
        ref={(c) => {
          if (c) collider = c;
        }}
        args={[1, 1, 1]}
        density={density}
      />
    );
    const renderer = await setup(tree, 1);
    const before = collider!.mass();

    await ReactThreeTestRenderer.act(async () => {
      await renderer.update(<Physics paused>{tree(10)}</Physics>);
    });
    expect(collider!.mass()).toBeCloseTo(before * 10);
  });

  it("updates collider mass when massProperties change", async () => {
    let collider: RapierCollider | null = null;
    const tree = (mass: number) => (
      <CuboidCollider
        ref={(c) => {
          if (c) collider = c;
        }}
        args={[1, 1, 1]}
        massProperties={{
          mass,
          centerOfMass: { x: 0, y: 0, z: 0 },
          principalAngularInertia: { x: 1, y: 1, z: 1 },
          angularInertiaLocalFrame: { x: 0, y: 0, z: 0, w: 1 }
        }}
      />
    );
    const renderer = await setup(tree, 2);
    expect(collider!.mass()).toBeCloseTo(2);

    await ReactThreeTestRenderer.act(async () => {
      await renderer.update(<Physics paused>{tree(7)}</Physics>);
    });
    expect(collider!.mass()).toBeCloseTo(7);
  });
});

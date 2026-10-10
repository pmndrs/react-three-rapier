import { RigidBodyType } from "@dimforge/rapier3d-compat";
import ReactThreeTestRenderer from "@react-three/test-renderer";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { CuboidCollider, Physics, RapierRigidBody, RigidBody } from "../src";
import { pause } from "./test-utils";

describe("RigidBody type changes (#314)", () => {
  it("applies a changed `type` prop after mount", async () => {
    const ref = createRef<RapierRigidBody>();
    const tree = (type: "dynamic" | "fixed" | "kinematicPosition") => (
      <Physics paused>
        <RigidBody ref={ref} type={type}>
          <CuboidCollider args={[1, 1, 1]} />
        </RigidBody>
      </Physics>
    );

    const renderer = await ReactThreeTestRenderer.create(tree("dynamic"));
    await pause(50);
    expect(ref.current!.bodyType()).toBe(RigidBodyType.Dynamic);

    await ReactThreeTestRenderer.act(async () => {
      await renderer.update(tree("fixed"));
    });
    expect(ref.current!.bodyType()).toBe(RigidBodyType.Fixed);
    expect(ref.current!.isFixed()).toBe(true);
    // colliders must follow the new body
    expect(ref.current!.numColliders()).toBe(1);

    await ReactThreeTestRenderer.act(async () => {
      await renderer.update(tree("kinematicPosition"));
    });
    expect(ref.current!.bodyType()).toBe(RigidBodyType.KinematicPositionBased);
    expect(ref.current!.numColliders()).toBe(1);

    await ReactThreeTestRenderer.act(async () => {
      await renderer.update(tree("dynamic"));
    });
    expect(ref.current!.bodyType()).toBe(RigidBodyType.Dynamic);
  });
});

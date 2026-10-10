import ReactThreeTestRenderer from "@react-three/test-renderer";
import { createRef, StrictMode } from "react";
import { pause } from "./test-utils";
import { describe, expect, it } from "vitest";
import {
  CuboidCollider,
  InstancedRigidBodies,
  Physics,
  RapierCollider,
  RapierRigidBody,
  RigidBody
} from "../src";

describe("forwarded refs", () => {
  it("nulls RigidBody and collider object refs on unmount", async () => {
    const bodyRef = createRef<RapierRigidBody>();
    const colliderRef = createRef<RapierCollider>();

    const renderer = await ReactThreeTestRenderer.create(
      <Physics>
        <RigidBody ref={bodyRef}>
          <CuboidCollider ref={colliderRef} args={[1, 1, 1]} />
        </RigidBody>
      </Physics>
    );
    await pause(300);

    expect(bodyRef.current).toBeTruthy();
    expect(colliderRef.current).toBeTruthy();

    await ReactThreeTestRenderer.act(async () => {
      await renderer.unmount();
    });

    expect(bodyRef.current).toBeNull();
    expect(colliderRef.current).toBeNull();
  });

  it("calls callback refs with null on unmount", async () => {
    const bodyCalls: unknown[] = [];
    const colliderCalls: unknown[] = [];

    const renderer = await ReactThreeTestRenderer.create(
      <Physics>
        <RigidBody ref={(b) => void bodyCalls.push(b)}>
          <CuboidCollider
            ref={(c) => void colliderCalls.push(c)}
            args={[1, 1, 1]}
          />
        </RigidBody>
      </Physics>
    );
    await pause(300);
    await ReactThreeTestRenderer.act(async () => {
      await renderer.unmount();
    });

    expect(bodyCalls[bodyCalls.length - 1]).toBeNull();
    expect(colliderCalls[colliderCalls.length - 1]).toBeNull();
    expect(bodyCalls.some((b) => b !== null)).toBe(true);
  });

  it("keeps refs populated under StrictMode and nulls them on unmount", async () => {
    const bodyRef = createRef<RapierRigidBody>();

    const renderer = await ReactThreeTestRenderer.create(
      <StrictMode>
        <Physics>
          <RigidBody ref={bodyRef}>
            <CuboidCollider args={[1, 1, 1]} />
          </RigidBody>
        </Physics>
      </StrictMode>
    );
    await pause(300);

    expect(bodyRef.current).toBeTruthy();
    // must not be a freed body
    expect(() => bodyRef.current!.translation()).not.toThrow();

    await ReactThreeTestRenderer.act(async () => {
      await renderer.unmount();
    });
    expect(bodyRef.current).toBeNull();
  });

  it("nulls InstancedRigidBodies per-instance refs when instances are removed", async () => {
    const ref = createRef<(RapierRigidBody | null)[]>();
    const tree = (n: number) => (
      <Physics>
        <InstancedRigidBodies
          ref={ref}
          instances={Array.from({ length: n }, (_, i) => ({ key: i }))}
        >
          <instancedMesh args={[undefined, undefined, 3]} />
        </InstancedRigidBodies>
      </Physics>
    );
    const renderer = await ReactThreeTestRenderer.create(tree(3));
    await pause(300);
    expect(ref.current!.filter(Boolean).length).toBe(3);

    await ReactThreeTestRenderer.act(async () => {
      await renderer.update(tree(1));
    });
    expect(ref.current![1]).toBeNull();
    expect(ref.current![2]).toBeNull();
    expect(ref.current![0]).toBeTruthy();
  });
});

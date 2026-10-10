import ReactThreeTestRenderer from "@react-three/test-renderer";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InstancedRigidBodies, Physics } from "../src";
import { pause } from "./test-utils";

describe("InstancedRigidBodies", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not spread `key` into JSX (React 19 warning) (#691)", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    await ReactThreeTestRenderer.create(
      <Physics paused>
        <InstancedRigidBodies instances={[{ key: "a" }, { key: "b" }]}>
          <instancedMesh args={[undefined, undefined, 2]} />
        </InstancedRigidBodies>
      </Physics>
    );
    await pause(300);

    const keyWarnings = spy.mock.calls.filter((call) =>
      String(call[0]).includes('"key" prop is being spread into JSX')
    );
    expect(keyWarnings).toHaveLength(0);
  });

  it("disables frustum culling on the instanced mesh, since bounds go stale (#683)", async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <Physics paused>
        <InstancedRigidBodies instances={[{ key: "a" }]}>
          <instancedMesh args={[undefined, undefined, 1]} />
        </InstancedRigidBodies>
      </Physics>
    );
    await pause(300);

    const meshes = renderer.scene.findAll(
      (node) => "isInstancedMesh" in node.instance
    );
    expect(meshes).toHaveLength(1);
    expect(meshes[0].instance.frustumCulled).toBe(false);
  });

  it("lets users opt back in to frustum culling", async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <Physics paused>
        <InstancedRigidBodies instances={[{ key: "a" }]} frustumCulled>
          <instancedMesh args={[undefined, undefined, 1]} />
        </InstancedRigidBodies>
      </Physics>
    );
    await pause(300);

    const meshes = renderer.scene.findAll(
      (node) => "isInstancedMesh" in node.instance
    );
    expect(meshes[0].instance.frustumCulled).toBe(true);
  });
});

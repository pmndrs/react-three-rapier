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
});

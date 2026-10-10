import * as Rapier from "@dimforge/rapier3d-compat";
import { describe, expect, it } from "vitest";
import * as R3R from "../src";

describe("rapier enum re-exports (#703)", () => {
  it.each([
    "ActiveCollisionTypes",
    "ActiveEvents",
    "ActiveHooks",
    "QueryFilterFlags",
    "CoefficientCombineRule"
  ] as const)("re-exports %s", (name) => {
    expect(R3R[name]).toBeDefined();
    expect(R3R[name]).toBe(Rapier[name]);
  });
});

describe("@react-three/rapier/soft-bodies subpath", () => {
  it("resolves to the same source modules as the relative import", async () => {
    const subpath = await import("@react-three/rapier/soft-bodies");
    const relative = await import("../src/soft-bodies");
    expect(subpath.SoftBody).toBeDefined();
    expect(subpath.useSoftBody).toBeDefined();
    expect(subpath.SoftBodyState).toBe(relative.SoftBodyState);
  });

  it("shares core with the main entry (one rapier context)", async () => {
    const main = await import("@react-three/rapier");
    expect(main.useRapier).toBe(R3R.useRapier);
  });
});

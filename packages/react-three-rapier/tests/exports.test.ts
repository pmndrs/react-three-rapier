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

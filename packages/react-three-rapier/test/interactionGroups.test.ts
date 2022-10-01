import { interactionGroups } from "../src";
import { expect, describe, it } from "vitest";

describe("interactionGroups", () => {
  it("returns the correct bitmask for the given memberships and filters", () => {
    expect(interactionGroups([0], [0])).toBe(
      0b0000_0000_0000_0001_0000_0000_0000_0001
    );

    expect(interactionGroups([0, 1], [0, 1, 2, 3])).toBe(
      0b0000_0000_0000_0011_0000_0000_0000_1111
    );
  });

  it("defaults the second argument to interact with all groups", () => {
    expect(interactionGroups([0, 1])).toBe(
      0b0000_0000_0000_0011_1111_1111_1111_1111
    );
  });

  it("accepts scalar numerical values if only one group is referenced", () => {
    expect(interactionGroups(1, [0, 1])).toBe(
      0b0000_0000_0000_0010_0000_0000_0000_0011
    );
  });
});

import { interactionGroups } from "../src/bitmasks"

describe("interactionGroups", () => {
  it("returns the correct bitmask for the given memberships and filters", () => {
    expect(interactionGroups([1], [1]))
      .toBe(0b0000_0000_0000_0001_0000_0000_0000_0001)

    expect(interactionGroups([1, 2], [1, 2, 3, 4]))
      .toBe(0b0000_0000_0000_0011_0000_0000_0000_1111)
  })

  it("defaults the second argument to interact with all groups", () => {
    expect(interactionGroups([1, 2]))
      .toBe(0b0000_0000_0000_0011_1111_1111_1111_1111)
  })
})

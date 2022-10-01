import ReactThreeTestRenderer from "@react-three/test-renderer";
import { CuboidCollider, CuboidColliderProps, interactionGroups, Physics, Vector3Array } from "../src";
import React, { MutableRefObject, useEffect, useRef } from "react";
import { expect, describe, it, vi, beforeEach, SpyInstance, afterEach } from "vitest";
import { Collider, CoefficientCombineRule } from "@dimforge/rapier3d-compat";

type SpyHelper<T extends { prototype: Record<string, any> },
  TMethod extends keyof T["prototype"]> = SpyInstance<Parameters<T["prototype"][TMethod]>,
  ReturnType<T["prototype"][TMethod]>>

describe("colliders", () => {
  const TestComponent = ({ready, ...rest}: { ready: (colliders: Collider[]) => void }
    & Pick<CuboidColliderProps, "args">
    & Partial<CuboidColliderProps>
  ) => {
    const ref = useRef() as MutableRefObject<Collider[]>;

    useEffect(() => {
      ready(ref.current);
    }, []);

    return <>
      <CuboidCollider ref={ref} {...rest} />
    </>;
  };

  describe("mutable collider options", () => {
    it(`should have sensor property correctly assigned`, async () => {
      for (let value of [
        true,
        false,
        undefined,
      ]) {
        const spy = vi.spyOn(Collider.prototype, "setSensor");
        try {
          const colliders = await new Promise<Collider[]>(async resolve => {
            await ReactThreeTestRenderer.act(() => ReactThreeTestRenderer.create(
              <Physics>
                <TestComponent
                  ready={resolve}
                  args={[1, 2, 3]}
                  sensor={value}
                />
              </Physics>
            ));
          });

          expect(colliders).to.have.length(1);
          const collider = colliders[0];

          if (value === undefined) {
            expect(collider.isSensor()).to.equal(false);
          } else {
            expect(collider.isSensor()).to.equal(value);
          }

          expect(spy).toBeCalledTimes(1);
          expect(spy.mock.calls[0][0]).to.equal(value);
        } finally {
          spy.mockRestore();
        }
      }
    });

    describe("interaction groups", () => {
      const interactionGroupsValues = [
        interactionGroups([0], [0]),
        interactionGroups([0, 1], [0, 1, 2, 3]),
        interactionGroups([0, 1]),
        interactionGroups(1, [0, 1]),
      ];

      it(`should have collisionGroups property correctly assigned`, async () => {
        for (let value of interactionGroupsValues) {
          const spy = vi.spyOn(Collider.prototype, "setCollisionGroups");
          try {
            const colliders = await new Promise<Collider[]>(async resolve => {
              await ReactThreeTestRenderer.act(() => ReactThreeTestRenderer.create(
                <Physics>
                  <TestComponent
                    ready={resolve}
                    args={[1, 2, 3]}
                    collisionGroups={value}
                  />
                </Physics>
              ));
            });

            expect(colliders).to.have.length(1);
            const collider = colliders[0];

            expect(collider.collisionGroups()).to.equal(value);

            expect(spy).toBeCalledTimes(1);
            expect(spy.mock.calls[0][0]).to.equal(value);
          } finally {
            spy.mockRestore();
          }
        }
      });

      it(`should have solverGroups property correctly assigned`, async () => {
        for (let value of interactionGroupsValues) {
          const spy = vi.spyOn(Collider.prototype, "setSolverGroups");
          try {
            const colliders = await new Promise<Collider[]>(async resolve => {
              await ReactThreeTestRenderer.act(() => ReactThreeTestRenderer.create(
                <Physics>
                  <TestComponent
                    ready={resolve}
                    args={[1, 2, 3]}
                    solverGroups={value}
                  />
                </Physics>
              ));
            });

            expect(colliders).to.have.length(1);
            const collider = colliders[0];

            expect(collider.solverGroups()).to.equal(value);

            expect(spy).toBeCalledTimes(1);
            expect(spy.mock.calls[0][0]).to.equal(value);
          } finally {
            spy.mockRestore();
          }
        }
      });
    });

    it(`should have friction property correctly assigned`, async () => {
      for (let value of [1, 2, 5]) {
        const spy = vi.spyOn(Collider.prototype, "setFriction");
        try {
          const colliders = await new Promise<Collider[]>(async resolve => {
            await ReactThreeTestRenderer.act(() => ReactThreeTestRenderer.create(
              <Physics>
                <TestComponent
                  ready={resolve}
                  args={[1, 2, 3]}
                  friction={value}
                />
              </Physics>
            ));
          });

          expect(colliders).to.have.length(1);
          const collider = colliders[0];

          expect(collider.friction()).to.equal(value);

          expect(spy).toBeCalledTimes(1);
          expect(spy.mock.calls[0][0]).to.equal(value);
        } finally {
          spy.mockRestore();
        }
      }
    });
    it(`should have frictionCombineRule property correctly assigned`, async () => {
      for (let value of [
        CoefficientCombineRule.Max,
        CoefficientCombineRule.Min,
        CoefficientCombineRule.Multiply,
        CoefficientCombineRule.Average
      ]) {
        const spy = vi.spyOn(Collider.prototype, "setFrictionCombineRule");
        try {
          const colliders = await new Promise<Collider[]>(async resolve => {
            await ReactThreeTestRenderer.act(() => ReactThreeTestRenderer.create(
              <Physics>
                <TestComponent
                  ready={resolve}
                  args={[1, 2, 3]}
                  frictionCombineRule={value}
                />
              </Physics>
            ));
          });

          expect(colliders).to.have.length(1);
          const collider = colliders[0];

          expect(collider.frictionCombineRule()).to.equal(value);

          expect(spy).toBeCalledTimes(1);
          expect(spy.mock.calls[0][0]).to.equal(value);
        } finally {
          spy.mockRestore();
        }
      }
    });
    it(`should have restitutionCombineRule property correctly assigned`, async () => {
      for (let value of [
        CoefficientCombineRule.Max,
        CoefficientCombineRule.Min,
        CoefficientCombineRule.Multiply,
        CoefficientCombineRule.Average
      ]) {
        const spy = vi.spyOn(Collider.prototype, "setRestitutionCombineRule");
        try {
          const colliders = await new Promise<Collider[]>(async resolve => {
            await ReactThreeTestRenderer.act(() => ReactThreeTestRenderer.create(
              <Physics>
                <TestComponent
                  ready={resolve}
                  args={[1, 2, 3]}
                  restitutionCombineRule={value}
                />
              </Physics>
            ));
          });

          expect(colliders).to.have.length(1);
          const collider = colliders[0];

          expect(collider.restitutionCombineRule()).to.equal(value);

          expect(spy).toBeCalledTimes(1);
          expect(spy.mock.calls[0][0]).to.equal(value);
        } finally {
          spy.mockRestore();
        }
      }
    });
    it(`should have restitution property correctly assigned`, async () => {
      for (let value of [1, 2, 5]) {
        const spy = vi.spyOn(Collider.prototype, "setRestitution");
        try {
          const colliders = await new Promise<Collider[]>(async resolve => {
            await ReactThreeTestRenderer.act(() => ReactThreeTestRenderer.create(
              <Physics>
                <TestComponent
                  ready={resolve}
                  args={[1, 2, 3]}
                  restitution={value}
                />
              </Physics>
            ));
          });

          expect(colliders).to.have.length(1);
          const collider = colliders[0];

          expect(collider.restitution()).to.equal(value);

          expect(spy).toBeCalledTimes(1);
          expect(spy.mock.calls[0][0]).to.equal(value);
        } finally {
          spy.mockRestore();
        }
      }
    });
  });

  describe("mass-related", () => {
    let setDensity: SpyHelper<typeof Collider, "setDensity">;
    let setMass: SpyHelper<typeof Collider, "setMass">;
    let setMassProperties: SpyHelper<typeof Collider, "setMassProperties">;

    beforeEach(() => {
      setDensity = vi.spyOn(Collider.prototype, "setDensity");
      setMass = vi.spyOn(Collider.prototype, "setMass");
      setMassProperties = vi.spyOn(Collider.prototype, "setMassProperties");
    });

    afterEach(() => {
      setDensity.mockRestore();
      setMass.mockRestore();
      setMassProperties.mockRestore();
    });

    describe("should have mass property correctly assigned", async () => {
      const densityAtMass1 = 0.02083333395421505;

      for (let value of [1, 2, 5, undefined]) {
        it(`should work with value ${value}`, async () => {
          const colliders = await new Promise<Collider[]>(async resolve => {
            await ReactThreeTestRenderer.act(() => ReactThreeTestRenderer.create(
              <Physics>
                <TestComponent
                  ready={resolve}
                  args={[1, 2, 3]}
                  mass={value}
                />
              </Physics>
            ));
          });

          const expectedValue = value === undefined ? 1 : value;

          expect(colliders).to.have.length(1);
          const collider = colliders[0];
          expect(collider.mass()).to.eq(expectedValue);
          expect(collider.density()).to.approximately(densityAtMass1 * expectedValue, 0.000001);

          expect(setDensity).toBeCalledTimes(1);
          expect(setDensity.mock.calls[0][0]).to.equal(0);
          expect(setMass).toBeCalledTimes(1);
          expect(setMass.mock.calls[0][0]).to.equal(expectedValue);
          expect(setMassProperties).not.toBeCalled();
        });
      }
    });

    it("should have complex mass properties correctly assigned", async () => {
      const wantedMass = 4;
      const centerOfMass = [5, 6, 7] as Vector3Array;

      const colliders = await new Promise<Collider[]>(async resolve => {
        await ReactThreeTestRenderer.act(() => {
          return ReactThreeTestRenderer.create(
            <Physics>
              <TestComponent
                ready={resolve}
                args={[1, 2, 3]}
                mass={wantedMass}
                centerOfMass={centerOfMass}
              />
            </Physics>
          );
        });
      });

      expect(colliders).to.have.length(1);
      const collider = colliders[0];
      expect(collider.mass()).to.eq(wantedMass);
      expect(collider.density()).to.eq(0.0833333358168602);

      expect(setDensity).toBeCalledTimes(1);
      expect(setDensity.mock.calls[0][0]).to.equal(0);

      expect(setMass).not.toBeCalled();

      expect(setMassProperties).toBeCalledTimes(1);
      expect(setMassProperties.mock.calls[0][0]).to.equal(wantedMass); // mass
      expect(setMassProperties.mock.calls[0][1]).to.deep.equal({
        x: centerOfMass[0],
        y: centerOfMass[1],
        z: centerOfMass[2]
      });
      expect(setMassProperties.mock.calls[0][2]).to.deep.equal({
        x: wantedMass * 0.2,
        y: wantedMass * 0.2,
        z: wantedMass * 0.2,
      });
    });

    it("should have density property correctly assigned", async () => {
      const colliders = await new Promise<Collider[]>(async resolve => {
        await ReactThreeTestRenderer.act(() => ReactThreeTestRenderer.create(
          <Physics>
            <TestComponent
              ready={resolve}
              args={[1, 2, 3]}
              density={1}
            />
          </Physics>
        ));
      });

      expect(colliders).to.have.length(1);
      const collider = colliders[0];
      expect(collider.mass()).to.eq(48);
      expect(collider.density()).to.eq(1);

      expect(setDensity).toBeCalledTimes(1);
      expect(setMass).not.toBeCalled();
      expect(setMassProperties).not.toBeCalled();
    });
  });
});

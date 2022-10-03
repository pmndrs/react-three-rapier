import ReactThreeTestRenderer from "@react-three/test-renderer";
import {
  CuboidCollider,
  CuboidColliderProps,
  interactionGroups,
  Physics
} from "../src";
import React, { MutableRefObject, useEffect, useRef } from "react";
import {
  expect,
  describe,
  it,
  vi,
  beforeEach,
  SpyInstance,
  afterEach
} from "vitest";
import { Collider, CoefficientCombineRule } from "@dimforge/rapier3d-compat";
import { Vector } from "@dimforge/rapier3d-compat/math";

type SpyHelper<
  T extends { prototype: Record<string, any> },
  TMethod extends keyof T["prototype"]
> = SpyInstance<
  Parameters<T["prototype"][TMethod]>,
  ReturnType<T["prototype"][TMethod]>
>;

describe("colliders", () => {
  const TestComponent = ({
    ready,
    ...rest
  }: { ready: (colliders: Collider[]) => void } & Pick<
    CuboidColliderProps,
    "args"
  > &
    Partial<CuboidColliderProps>) => {
    const ref = useRef() as MutableRefObject<Collider[]>;

    useEffect(() => {
      ready(ref.current);
    }, []);

    return (
      <>
        <CuboidCollider ref={ref} {...rest} />
      </>
    );
  };

  describe("mutable collider options", () => {
    it(`should have sensor property correctly assigned`, async () => {
      for (let value of [true, false, undefined]) {
        const spy = vi.spyOn(Collider.prototype, "setSensor");
        try {
          const colliders = await new Promise<Collider[]>(
            async (resolve, reject) => {
              try {
                await ReactThreeTestRenderer.create(
                  <Physics>
                    <TestComponent
                      ready={resolve}
                      args={[1, 2, 3]}
                      sensor={value}
                    />
                  </Physics>
                );
              } catch (e) {
                reject(e);
              }
            }
          );

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
        interactionGroups(1, [0, 1])
      ];

      it(`should have collisionGroups property correctly assigned`, async () => {
        for (let value of interactionGroupsValues) {
          const spy = vi.spyOn(Collider.prototype, "setCollisionGroups");
          try {
            const colliders = await new Promise<Collider[]>(
              async (resolve, reject) => {
                try {
                  await ReactThreeTestRenderer.create(
                    <Physics>
                      <TestComponent
                        ready={resolve}
                        args={[1, 2, 3]}
                        collisionGroups={value}
                      />
                    </Physics>
                  );
                } catch (e) {
                  reject(e);
                }
              }
            );

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
            const colliders = await new Promise<Collider[]>(
              async (resolve, reject) => {
                try {
                  await ReactThreeTestRenderer.create(
                    <Physics>
                      <TestComponent
                        ready={resolve}
                        args={[1, 2, 3]}
                        solverGroups={value}
                      />
                    </Physics>
                  );
                } catch (e) {
                  reject(e);
                }
              }
            );

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
          const colliders = await new Promise<Collider[]>(
            async (resolve, reject) => {
              try {
                await ReactThreeTestRenderer.create(
                  <Physics>
                    <TestComponent
                      ready={resolve}
                      args={[1, 2, 3]}
                      friction={value}
                    />
                  </Physics>
                );
              } catch (e) {
                reject(e);
              }
            }
          );

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
          const colliders = await new Promise<Collider[]>(
            async (resolve, reject) => {
              try {
                await ReactThreeTestRenderer.create(
                  <Physics>
                    <TestComponent
                      ready={resolve}
                      args={[1, 2, 3]}
                      frictionCombineRule={value}
                    />
                  </Physics>
                );
              } catch (e) {
                reject(e);
              }
            }
          );

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
          const colliders = await new Promise<Collider[]>(
            async (resolve, reject) => {
              try {
                await ReactThreeTestRenderer.create(
                  <Physics>
                    <TestComponent
                      ready={resolve}
                      args={[1, 2, 3]}
                      restitutionCombineRule={value}
                    />
                  </Physics>
                );
              } catch (e) {
                reject(e);
              }
            }
          );

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
          const colliders = await new Promise<Collider[]>(
            async (resolve, reject) => {
              try {
                await ReactThreeTestRenderer.create(
                  <Physics>
                    <TestComponent
                      ready={resolve}
                      args={[1, 2, 3]}
                      restitution={value}
                    />
                  </Physics>
                );
              } catch (e) {
                reject(e);
              }
            }
          );

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
          const colliders = await new Promise<Collider[]>(
            async (resolve, reject) => {
              try {
                await ReactThreeTestRenderer.create(
                  <Physics>
                    <TestComponent
                      ready={resolve}
                      args={[1, 2, 3]}
                      mass={value}
                    />
                  </Physics>
                );
              } catch (e) {
                reject(e);
              }
            }
          );

          // Calculated with 1 density if undefined.
          const expectedMassValue = value === undefined ? 48 : value;

          expect(colliders).to.have.length(1);
          const collider = colliders[0];
          expect(collider.mass()).to.eq(expectedMassValue);
          expect(collider.density()).to.approximately(
            densityAtMass1 * expectedMassValue,
            0.000001
          );

          if (value === undefined) {
            expect(setDensity).not.toBeCalled();
            expect(setMass).not.toBeCalled();
            expect(setMassProperties).not.toBeCalled();
          } else {
            expect(setDensity).not.toBeCalled();
            expect(setMass).toBeCalledTimes(1);
            expect(setMass.mock.calls[0][0]).to.equal(expectedMassValue);
            expect(setMassProperties).not.toBeCalled();
          }
        });
      }
    });

    it("should have complex mass properties correctly assigned", async () => {
      const wantedMass = 4;
      const centerOfMass: Vector = { x: 4, y: 5, z: 6 };
      const principalAngularInertia = { x: 0.3, y: 0.2, z: 0.1 };
      const angularInertiaLocalFrame = { w: 1.0, x: 0.0, y: 0.0, z: 0.0 };

      const colliders = await new Promise<Collider[]>(
        async (resolve, reject) => {
          try {
            await ReactThreeTestRenderer.create(
              <Physics>
                <TestComponent
                  ready={resolve}
                  args={[1, 2, 3]}
                  massProperties={{
                    mass: wantedMass,
                    centerOfMass: centerOfMass,
                    principalAngularInertia: principalAngularInertia,
                    angularInertiaLocalFrame: angularInertiaLocalFrame
                  }}
                />
              </Physics>
            );
          } catch (e) {
            reject(e);
          }
        }
      );

      expect(colliders).to.have.length(1);
      const collider = colliders[0];
      expect(collider.mass()).to.eq(wantedMass);
      expect(collider.density()).to.eq(0.0833333358168602);

      expect(setDensity).not.toBeCalled();

      expect(setMass).not.toBeCalled();

      expect(setMassProperties).toBeCalledTimes(1);
      expect(setMassProperties.mock.calls[0][0]).to.equal(wantedMass); // mass
      expect(setMassProperties.mock.calls[0][1]).to.deep.equal(centerOfMass);
      expect(setMassProperties.mock.calls[0][2]).to.deep.equal(
        principalAngularInertia
      );
      expect(setMassProperties.mock.calls[0][3]).to.deep.equal(
        angularInertiaLocalFrame
      );
    });

    it("should have density property correctly assigned", async () => {
      const colliders = await new Promise<Collider[]>(
        async (resolve, reject) => {
          try {
            await ReactThreeTestRenderer.create(
              <Physics>
                <TestComponent ready={resolve} args={[1, 2, 3]} density={1} />
              </Physics>
            );
          } catch (e) {
            reject(e);
          }
        }
      );

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

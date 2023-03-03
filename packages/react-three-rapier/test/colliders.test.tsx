import ReactThreeTestRenderer from "@react-three/test-renderer";
import {
  ConeCollider,
  CuboidCollider,
  CuboidColliderProps,
  interactionGroups,
  Physics,
  RigidBody,
  useRapier
} from "../src";
import React, { MutableRefObject, useEffect, useRef, useState } from "react";
import {
  expect,
  describe,
  it,
  vi,
  beforeEach,
  SpyInstance,
  afterEach
} from "vitest";
import {
  Collider,
  CoefficientCombineRule,
  World
} from "@dimforge/rapier3d-compat";
import { Vector } from "@dimforge/rapier3d-compat/math";
import { createCollider } from "./test-utils";

type SpyHelper<
  T extends { prototype: Record<string, any> },
  TMethod extends keyof T["prototype"]
> = SpyInstance<
  Parameters<T["prototype"][TMethod]>,
  ReturnType<T["prototype"][TMethod]>
>;

describe("colliders", () => {
  describe("mutable collider options", () => {
    it(`should have sensor property correctly assigned`, async () => {
      for (let value of [true, false, undefined]) {
        const spy = vi.spyOn(Collider.prototype, "setSensor");

        try {
          const collider = await createCollider({
            args: [1, 2, 3],
            sensor: value
          });

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
            const collider = await createCollider({
              args: [1, 2, 3],
              collisionGroups: value
            });

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
            const collider = await createCollider({
              args: [1, 2, 3],
              solverGroups: value
            });

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
          const collider = await createCollider({
            args: [1, 2, 3],
            friction: value
          });

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
          const collider = await createCollider({
            args: [1, 2, 3],
            frictionCombineRule: value
          });

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
          const collider = await createCollider({
            args: [1, 2, 3],
            restitutionCombineRule: value
          });

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
          const collider = await createCollider({
            args: [1, 2, 3],
            restitution: value
          });

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
          const collider = await createCollider({
            args: [1, 2, 3],
            mass: value
          });

          // Calculated with 1 density if undefined.
          const expectedMassValue = value === undefined ? 48 : value;

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

      const collider = await createCollider({
        args: [1, 2, 3],
        massProperties: {
          mass: wantedMass,
          centerOfMass: centerOfMass,
          principalAngularInertia: principalAngularInertia,
          angularInertiaLocalFrame: angularInertiaLocalFrame
        }
      });

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
      const collider = await createCollider({
        args: [1, 2, 3],
        density: 1
      });

      expect(collider.mass()).to.eq(48);
      expect(collider.density()).to.eq(1);

      expect(setDensity).toBeCalledTimes(1);
      expect(setMass).not.toBeCalled();
      expect(setMassProperties).not.toBeCalled();
    });
  });

  describe("refs", () => {
    it("should be able to get ref to collider", async () => {
      const collider = await createCollider({ args: [1, 2, 3] });
      expect(collider).toBeInstanceOf(Collider);
    });
  });

  describe("mounting and unmounting", () => {
    it("should mount and unmount a colliders and rigidbodies", async () => {
      type TestSceneResult = {
        world: World;
        step: (delta: number) => void;
        setShowCollider: (flag: boolean) => void;
        setShowRigidBody: (flag: boolean) => void;
      };

      const TestScene = ({
        onMount
      }: {
        onMount: (result: TestSceneResult) => void;
      }) => {
        const { world, step } = useRapier();
        const [showCollider, setShowCollider] = useState(false);
        const [showRigidBody, setShowRigidBody] = useState(false);

        useEffect(() => {
          onMount({
            step,
            world: world.raw(),
            setShowCollider,
            setShowRigidBody
          });
        }, []);

        return (
          <group>
            {showRigidBody && (
              <RigidBody>
                <CuboidCollider args={[1, 1, 1]} />
                <CuboidCollider args={[1, 1, 1]} position={[1, 1, 1]} />
              </RigidBody>
            )}
            {showCollider && <ConeCollider args={[1, 2]} />}
          </group>
        );
      };

      const { world, step, setShowCollider, setShowRigidBody } =
        await new Promise<TestSceneResult>((resolve) => {
          ReactThreeTestRenderer.create(
            <Physics paused>
              <TestScene onMount={resolve} />
            </Physics>
          );
        });

      expect(world.colliders.len()).to.equal(0);

      await ReactThreeTestRenderer.act(async () => {
        step(1 / 60);
        setShowCollider(true);
      });

      expect(world.colliders.len()).to.equal(1);
      expect(world.bodies.len()).to.equal(0);

      await ReactThreeTestRenderer.act(async () => {
        step(1 / 60);
        setShowRigidBody(true);
      });

      expect(world.colliders.len()).to.equal(3);
      expect(world.bodies.len()).to.equal(1);

      await ReactThreeTestRenderer.act(async () => {
        step(1 / 60);
        setShowCollider(false);
      });

      expect(world.colliders.len()).to.equal(2);
      expect(world.bodies.len()).to.equal(1);

      await ReactThreeTestRenderer.act(async () => {
        step(1 / 60);
        setShowRigidBody(false);
      });

      expect(world.colliders.len()).to.equal(0);
      expect(world.bodies.len()).to.equal(0);
    });
  });
});

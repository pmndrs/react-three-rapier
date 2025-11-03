import React, { useCallback, useEffect, useRef } from "react";
import ReactThreeTestRenderer from "@react-three/test-renderer";
import { describe, expect, it, vi } from "vitest";
import {
  Physics,
  RigidBody,
  CuboidCollider,
  useRapier,
  useBeforePhysicsStep,
  useFilterContactPair,
  useFilterIntersectionPair,
  RapierRigidBody,
  RapierCollider
} from "../src";
import { SolverFlags, ActiveHooks } from "@dimforge/rapier3d-compat";
import { awaitReady } from "./test-utils";

describe("physics hooks", () => {
  describe("useFilterContactPair", () => {
    it("should register and call contact pair filter hooks", async () => {
      const filterHook = vi.fn(() => null);

      const TestComponent = () => {
        const colliderRef = useRef<RapierCollider>(null);

        useFilterContactPair(filterHook);

        useEffect(() => {
          if (colliderRef.current) {
            colliderRef.current.setActiveHooks(
              ActiveHooks.FILTER_CONTACT_PAIRS
            );
          }
        }, []);

        return (
          <RigidBody>
            <CuboidCollider ref={colliderRef} args={[1, 1, 1]} />
          </RigidBody>
        );
      };

      const step = await awaitReady(
        <>
          <TestComponent />
          <RigidBody position={[0, 2.1, 0]} linearVelocity={[0, -5, 0]}>
            <CuboidCollider args={[1, 1, 1]} />
          </RigidBody>
        </>
      );

      await ReactThreeTestRenderer.act(async () => {
        // Step multiple times to allow bodies to collide
        for (let i = 0; i < 30; i++) {
          step(1 / 60);
        }
      });

      expect(filterHook).toHaveBeenCalled();
    });

    it("should call hook with correct parameters when collision occurs", async () => {
      const filterHook = vi.fn(() => SolverFlags.COMPUTE_IMPULSE);

      const TestComponent = () => {
        const colliderRef = useRef<RapierCollider>(null);

        useFilterContactPair(filterHook);

        useEffect(() => {
          if (colliderRef.current) {
            colliderRef.current.setActiveHooks(
              ActiveHooks.FILTER_CONTACT_PAIRS
            );
          }
        }, []);

        return (
          <RigidBody>
            <CuboidCollider ref={colliderRef} args={[1, 1, 1]} />
          </RigidBody>
        );
      };

      const step = await awaitReady(
        <>
          <TestComponent />
          <RigidBody position={[0, 2.1, 0]} linearVelocity={[0, -5, 0]}>
            <CuboidCollider args={[1, 1, 1]} />
          </RigidBody>
        </>
      );

      await ReactThreeTestRenderer.act(async () => {
        for (let i = 0; i < 30; i++) {
          step(1 / 60);
        }
      });

      // Hook should be called with 4 numeric parameters (collider1, collider2, body1, body2)
      expect(filterHook).toHaveBeenCalled();
      expect(filterHook.mock.calls.length).toBeGreaterThan(0);

      const callArgs: any[] = filterHook.mock.calls[0];
      expect(callArgs.length).toBe(4);
      expect(typeof callArgs[0]).toBe("number"); // collider1
      expect(typeof callArgs[1]).toBe("number"); // collider2
      expect(typeof callArgs[2]).toBe("number"); // body1
      expect(typeof callArgs[3]).toBe("number"); // body2
    });

    it("should allow collisions when hook returns SolverFlags.COMPUTE_IMPULSE", async () => {
      const onCollisionEnter = vi.fn();

      const TestComponent = () => {
        const colliderRef = useRef<RapierCollider>(null);

        useFilterContactPair(
          useCallback(() => {
            return SolverFlags.COMPUTE_IMPULSE; // Allow collisions
          }, [])
        );

        useEffect(() => {
          if (colliderRef.current) {
            colliderRef.current.setActiveHooks(
              ActiveHooks.FILTER_CONTACT_PAIRS
            );
          }
        }, []);

        return (
          <RigidBody onCollisionEnter={onCollisionEnter}>
            <CuboidCollider ref={colliderRef} args={[1, 1, 1]} />
          </RigidBody>
        );
      };

      const step = await awaitReady(
        <>
          <TestComponent />
          <RigidBody position={[0, 2.1, 0]} linearVelocity={[0, -5, 0]}>
            <CuboidCollider args={[1, 1, 1]} />
          </RigidBody>
        </>
      );

      await ReactThreeTestRenderer.act(async () => {
        for (let i = 0; i < 30; i++) {
          step(1 / 60);
        }
      });

      // Collision should occur
      expect(onCollisionEnter).toHaveBeenCalled();
    });

    it("should work with cached body state from useBeforePhysicsStep", async () => {
      const filterHook = vi.fn(() => 1);

      const OneWayPlatform = () => {
        const platformRef = useRef<RapierRigidBody>(null);
        const ballRef = useRef<RapierRigidBody>(null);
        const colliderRef = useRef<RapierCollider>(null);
        const bodyStateCache = useRef(new Map());

        // Cache body states before physics step
        useBeforePhysicsStep(() => {
          if (platformRef.current && ballRef.current) {
            const ballPos = ballRef.current.translation();
            const ballVel = ballRef.current.linvel();

            bodyStateCache.current.set(ballRef.current.handle, {
              position: ballPos,
              velocity: ballVel
            });
          }
        });

        useFilterContactPair(
          useCallback((c1: number, c2: number, b1: number, b2: number) => {
            const state =
              bodyStateCache.current.get(b1) || bodyStateCache.current.get(b2);

            // If we have cached state, the test is successful
            if (state) {
              filterHook();
            }

            return SolverFlags.COMPUTE_IMPULSE; // Allow collision
          }, [])
        );

        useEffect(() => {
          if (colliderRef.current) {
            colliderRef.current.setActiveHooks(
              ActiveHooks.FILTER_CONTACT_PAIRS
            );
          }
        }, []);

        return (
          <>
            <RigidBody ref={platformRef} type="fixed">
              <CuboidCollider ref={colliderRef} args={[5, 0.1, 5]} />
            </RigidBody>
            <RigidBody ref={ballRef} position={[0, 3, 0]}>
              <CuboidCollider args={[1, 1, 1]} />
            </RigidBody>
          </>
        );
      };

      const step = await awaitReady(<OneWayPlatform />);

      await ReactThreeTestRenderer.act(async () => {
        for (let i = 0; i < 60; i++) {
          step(1 / 60);
        }
      });

      // Verify the filter hook was called with cached state
      expect(filterHook).toHaveBeenCalled();
    });
  });

  describe("useFilterIntersectionPair", () => {
    it("should register and call intersection pair filter hooks", async () => {
      const filterHook = vi.fn(() => true);

      const TestComponent = () => {
        const colliderRef = useRef<RapierCollider>(null);

        useFilterIntersectionPair(filterHook);

        useEffect(() => {
          if (colliderRef.current) {
            colliderRef.current.setActiveHooks(
              ActiveHooks.FILTER_INTERSECTION_PAIRS
            );
          }
        }, []);

        return (
          <RigidBody>
            <CuboidCollider ref={colliderRef} args={[1, 1, 1]} sensor />
          </RigidBody>
        );
      };

      const step = await awaitReady(
        <>
          <TestComponent />
          <RigidBody position={[0, 2.1, 0]} linearVelocity={[0, -5, 0]}>
            <CuboidCollider args={[1, 1, 1]} />
          </RigidBody>
        </>
      );

      await ReactThreeTestRenderer.act(async () => {
        for (let i = 0; i < 30; i++) {
          step(1 / 60);
        }
      });

      expect(filterHook).toHaveBeenCalled();
    });
  });
});

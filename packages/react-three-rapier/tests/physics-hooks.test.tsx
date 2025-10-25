import React, { useCallback, useEffect, useRef } from "react";
import ReactThreeTestRenderer from "@react-three/test-renderer";
import { describe, expect, it, vi } from "vitest";
import {
  Physics,
  RigidBody,
  CuboidCollider,
  useRapier,
  useBeforePhysicsStep,
  RapierRigidBody,
  RapierCollider
} from "../src";
import { awaitReady } from "./test-utils";

describe("physics hooks", () => {
  describe("filterContactPairHooks", () => {
    it("should register and call contact pair filter hooks", async () => {
      const filterHook = vi.fn(() => null);
      let hookRegistered = false;

      const TestComponent = () => {
        const { filterContactPairHooks } = useRapier();
        const colliderRef = useRef<RapierCollider>(null);

        useEffect(() => {
          if (colliderRef.current && !hookRegistered) {
            colliderRef.current.setActiveHooks(1);
            filterContactPairHooks.push(filterHook);
            hookRegistered = true;
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

    it("should allow blocking collisions when hook returns 0", async () => {
      const onCollisionEnter = vi.fn();
      let hookRegistered = false;

      const TestComponent = () => {
        const { filterContactPairHooks } = useRapier();
        const colliderRef = useRef<RapierCollider>(null);

        const filterHook = useCallback(() => {
          return 0; // Block all collisions
        }, []);

        useEffect(() => {
          if (colliderRef.current && !hookRegistered) {
            colliderRef.current.setActiveHooks(1);
            filterContactPairHooks.push(filterHook);
            hookRegistered = true;
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

      // Collision should be blocked
      expect(onCollisionEnter).not.toHaveBeenCalled();
    });

    it("should allow collisions when hook returns 1", async () => {
      const onCollisionEnter = vi.fn();
      let hookRegistered = false;

      const TestComponent = () => {
        const { filterContactPairHooks } = useRapier();
        const colliderRef = useRef<RapierCollider>(null);

        const filterHook = useCallback(() => {
          return 1; // Allow collisions
        }, []);

        useEffect(() => {
          if (colliderRef.current && !hookRegistered) {
            colliderRef.current.setActiveHooks(1);
            filterContactPairHooks.push(filterHook);
            hookRegistered = true;
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
      let hookRegistered = false;

      const OneWayPlatform = () => {
        const { filterContactPairHooks } = useRapier();
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

        const hook = useCallback((c1: number, c2: number, b1: number, b2: number) => {
          const state = bodyStateCache.current.get(b1) || 
                        bodyStateCache.current.get(b2);
          
          // If we have cached state, the test is successful
          if (state) {
            filterHook();
          }
          
          return 1; // Allow collision
        }, []);

        useEffect(() => {
          if (colliderRef.current && !hookRegistered) {
            colliderRef.current.setActiveHooks(1);
            filterContactPairHooks.push(hook);
            hookRegistered = true;
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

  describe("filterIntersectionPairHooks", () => {
    it("should register and call intersection pair filter hooks", async () => {
      const filterHook = vi.fn(() => true);
      let hookRegistered = false;

      const TestComponent = () => {
        const { filterIntersectionPairHooks } = useRapier();
        const colliderRef = useRef<RapierCollider>(null);

        useEffect(() => {
          if (colliderRef.current && !hookRegistered) {
            colliderRef.current.setActiveHooks(2); // Active hooks for intersection
            filterIntersectionPairHooks.push(filterHook);
            hookRegistered = true;
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


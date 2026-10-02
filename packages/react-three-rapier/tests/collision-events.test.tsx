import React, { ReactNode, Suspense, useEffect } from "react";
import ReactThreeTestRenderer from "@react-three/test-renderer";
import { describe, expect, it, vi } from "vitest";
import { Physics, useRapier } from "../src";
import { awaitReady, createRigidBody, TestRigidBody } from "./test-utils";

describe("collision events", () => {
  describe("collisions", () => {
    it("should trigger a single collision event", async () => {
      const collisionFn = vi.fn();

      const step = await awaitReady(
        <>
          <TestRigidBody onCollisionEnter={collisionFn} />
          <TestRigidBody />
        </>
      );

      await ReactThreeTestRenderer.act(async () => {
        step(1 / 60);
      });

      expect(collisionFn).toBeCalledTimes(1);
    });

    it("should expose current manifold material and world-space contact data", async () => {
      const collisionFn = vi.fn((event) => {
        const { manifold } = event;

        expect(manifold.friction()).toBeCloseTo(0.5);
        expect(manifold.restitution()).toBeCloseTo(0.25);
        expect(manifold.numSolverContacts()).toBeGreaterThan(0);

        const point = manifold.solverContactPoint(0);
        expect(Number.isFinite(point.x)).toBe(true);
        expect(Number.isFinite(point.y)).toBe(true);
        expect(Number.isFinite(point.z)).toBe(true);
      });

      const step = await awaitReady(
        <>
          <TestRigidBody
            friction={0.5}
            restitution={0.25}
            onCollisionEnter={collisionFn}
          />
          <TestRigidBody friction={0.5} restitution={0.25} />
        </>
      );

      await ReactThreeTestRenderer.act(async () => {
        step(1 / 60);
      });

      expect(collisionFn).toBeCalledTimes(1);
    });
  });

  describe("intersections", () => {
    it("should trigger a single intersection event", async () => {
      const intersectionFn = vi.fn();

      const step = await awaitReady(
        <>
          <TestRigidBody sensor onIntersectionEnter={intersectionFn} />
          <TestRigidBody />
        </>
      );

      await ReactThreeTestRenderer.act(async () => {
        step(1 / 60);
      });

      expect(intersectionFn).toBeCalledTimes(1);
    });
  });

  describe("contact forces", () => {
    it("should trigger a contact force event", async () => {
      const contactForceFn = vi.fn();

      const step = await awaitReady(
        <>
          <TestRigidBody
            position={[0, 1.1, 0]}
            onContactForce={contactForceFn}
            linearVelocity={[0, -2, 0]}
          />
          <TestRigidBody />
        </>
      );

      await ReactThreeTestRenderer.act(async () => {
        step(1 / 60);
      });

      expect(contactForceFn).toBeCalledTimes(1);
    });
  });

  describe("contact forces and collisions", () => {
    it("should trigger a contact force event", async () => {
      const callbackFn = vi.fn();

      const step = await awaitReady(
        <>
          <TestRigidBody
            position={[0, 1.1, 0]}
            onContactForce={callbackFn}
            onCollisionEnter={callbackFn}
            linearVelocity={[0, -2, 0]}
          />
          <TestRigidBody />
        </>
      );

      await ReactThreeTestRenderer.act(async () => {
        step(1 / 60);
      });

      expect(callbackFn).toBeCalledTimes(2);
    });
  });
});

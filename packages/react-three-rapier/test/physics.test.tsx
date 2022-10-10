import { it, describe, expect } from 'vitest';
import { Physics, RigidBody, RigidBodyApi, useRapier } from '../src';
import React, { useEffect } from 'react';
import { RapierContext } from '../src/Physics';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import * as THREE from 'three';
import { Box, Torus } from '@react-three/drei';

describe("physics", () => {
  const TestComponent = (
    {
      ready,
    }: { ready: (context: RapierContext) => void }) => {

    const rapierContext = useRapier();

    useEffect(() => {
      ready(rapierContext);
    }, []);

    return null;
  };

  it("exposes a manual step function", async () => {
    const rigidBody = React.createRef<RigidBodyApi>();
    const rapierContext = await new Promise<RapierContext>(
      async (resolve, reject) => {
        try {
          await ReactThreeTestRenderer.create(
            <Physics paused={true}>
              <TestComponent
                ready={resolve}
              />

              <RigidBody colliders={"hull"} restitution={2} ref={rigidBody}>
                <Torus/>
              </RigidBody>

              <RigidBody position={[0, -2, 0]} type="kinematicPosition">
                <Box args={[20, 0.5, 20]}/>
              </RigidBody>
            </Physics>
          );
        } catch (e) {
          reject(e);
        }
      }
    );

    // Without this, the rigid bodies seem to be stuck at 0, 0, 0.
    await new Promise(resolve => {
      setTimeout(resolve, 20);
    });

    expect(rigidBody.current?.translation()).to.deep.eq(new THREE.Vector3(0, 0, 0));

    rigidBody.current?.applyImpulse(new THREE.Vector3(1, 2, 3), true);

    rapierContext.step();

    expect(rigidBody.current?.translation().toArray()).to.deep.eq(
      [
        0.004840108100324869,
        0.006955215707421303,
        0.01452032383531332
      ]);

    rapierContext.step();

    expect(rigidBody.current?.translation().toArray()).to.deep.eq(
      [
        0.009680217131972313,
        0.011185429990291595,
        0.02904064767062664,
      ]);

    await new Promise(resolve => {
      setTimeout(resolve, 200);
    });

    // expect nothing to have changed
    expect(rigidBody.current?.translation().toArray()).to.deep.eq(
      [
        0.009680217131972313,
        0.011185429990291595,
        0.02904064767062664,
      ]);
  });
});

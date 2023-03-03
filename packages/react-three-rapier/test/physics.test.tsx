import { it, describe, expect } from "vitest";
import {
  Physics,
  RapierContext,
  RapierRigidBody,
  RigidBody,
  vec3
} from "../src";
import React, { useEffect } from "react";
import ReactThreeTestRenderer from "@react-three/test-renderer";
import { Box } from "@react-three/drei";
import { pause, UseRapierMounter } from "./test-utils";

describe("physics", () => {
  describe("useRapier exposed things", () => {
    it("exposes a manual step function", async () => {
      const rigidBody = React.createRef<RapierRigidBody>();
      const rapierContext = await new Promise<RapierContext>(
        async (resolve, reject) => {
          try {
            await ReactThreeTestRenderer.create(
              <Physics paused>
                <UseRapierMounter ready={resolve} />

                <RigidBody
                  colliders="cuboid"
                  restitution={2}
                  ref={rigidBody}
                  linearVelocity={[20, 20, 20]}
                >
                  <Box />
                </RigidBody>
              </Physics>
            );
          } catch (e) {
            reject(e);
          }
        }
      );

      expect(vec3(rigidBody.current?.translation()).toArray()).to.deep.eq([
        0, 0, 0
      ]);

      await ReactThreeTestRenderer.act(async () => {
        rapierContext.step(1 / 60);
      });

      expect(vec3(rigidBody.current?.translation()).toArray()).to.deep.eq([
        0.3333333432674408, 0.3333333432674408, 0.3333333432674408
      ]);

      await ReactThreeTestRenderer.act(async () => {
        rapierContext.step(1 / 60);
      });

      expect(vec3(rigidBody.current?.translation()).toArray()).to.deep.eq([
        0.6666666865348816, 0.6639417409896851, 0.6666666865348816
      ]);

      await pause(100);

      // expect nothing to have changed
      expect(vec3(rigidBody.current?.translation()).toArray()).to.deep.eq([
        0.6666666865348816, 0.6639417409896851, 0.6666666865348816
      ]);
    });
  });
});

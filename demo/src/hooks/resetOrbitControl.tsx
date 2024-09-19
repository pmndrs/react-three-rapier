import { useEffect } from "react";
import { useDemo } from "../App";
import { Vector3 } from "three";

const directionVector = new Vector3();

export const resetOrbitControl = (distance = 20, direction = [0, 0, 1]) => {
  const { orbitControlRef } = useDemo();

  useEffect(() => {
    if (
      orbitControlRef?.current === undefined ||
      orbitControlRef?.current === null
    )
      return;
    const controls = orbitControlRef.current;
    const camera = controls.object; // This is the camera that OrbitControls is controlling
    // Get the current look-at target
    const target = controls.target;

    // Calculate the direction vector from target to camera
    directionVector.fromArray(direction).normalize();

    // Set the new camera position
    camera.position.copy(target).add(directionVector.multiplyScalar(distance));

    // Update the controls
    controls.update();
  }, [distance, direction]);

  return null;
};

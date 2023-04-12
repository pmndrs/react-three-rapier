import React, { memo, useRef, useEffect } from 'react';
import { useRapier, useBeforePhysicsStep } from '@react-three/rapier/src/hooks/hooks';
import { Vector3, Mesh, SphereBufferGeometry, MeshBasicMaterial } from 'three';
import { _position, _vector3 } from '@react-three/rapier/src/utils/shared-objects';
import { useThree, useFrame } from '@react-three/fiber';
import { VertexNormalsHelper } from 'three-stdlib';

const _v3 = new Vector3();

const AttractorHelper = props => {
  const {
    scene
  } = useThree();
  const ref = useRef();
  const normalsHelper = useRef();
  const color = props.strength > 0 ? 0x0000ff : 0xff0000;
  useEffect(() => {
    ref.current = new Mesh(new SphereBufferGeometry(0.2, 6, 6), new MeshBasicMaterial({
      color,
      wireframe: true
    }));
    normalsHelper.current = new VertexNormalsHelper(ref.current, props.range, color);
    normalsHelper.current.frustumCulled = false;
    scene.add(ref.current);
    scene.add(normalsHelper.current);
    return () => {
      if (normalsHelper.current && ref.current) {
        scene.remove(normalsHelper.current);
        scene.remove(ref.current);
      }
    };
  }, [props, color]);
  useFrame(() => {
    if (ref.current && props.object.current) {
      var _normalsHelper$curren;

      const worldPosition = props.object.current.getWorldPosition(_v3);
      ref.current.position.copy(worldPosition);
      (_normalsHelper$curren = normalsHelper.current) === null || _normalsHelper$curren === void 0 ? void 0 : _normalsHelper$curren.update();
    }
  });
  return null;
};

const calcForceByType = {
  static: (s, m2, r, d, G) => s,
  linear: (s, m2, r, d, G) => s * (d / r),
  newtonian: (s, m2, r, d, G) => G * s * m2 / Math.pow(d, 2)
};

const applyAttractorForceOnRigidBody = (rigidBody, {
  object,
  strength,
  range,
  gravitationalConstant,
  collisionGroups,
  type
}) => {
  const rbPosition = rigidBody.translation();

  _position.set(rbPosition.x, rbPosition.y, rbPosition.z);

  const worldPosition = object.getWorldPosition(new Vector3());
  const distance = worldPosition.distanceTo(_position);

  if (distance < range) {
    let force = calcForceByType[type](strength, rigidBody.mass(), range, distance, gravitationalConstant); // Prevent wild forces when Attractors collide

    force = force === Infinity ? strength : force; // Naively test if the rigidBody contains a collider in one of the collision groups

    let isRigidBodyInCollisionGroup = collisionGroups === undefined ? true : false;

    if (collisionGroups !== undefined) {
      for (let i = 0; i < rigidBody.numColliders(); i++) {
        const collider = rigidBody.collider(i);
        const colliderCollisionGroups = collider.collisionGroups();

        if ((collisionGroups >> 16 & colliderCollisionGroups) != 0 && (colliderCollisionGroups >> 16 & collisionGroups) != 0) {
          isRigidBodyInCollisionGroup = true;
          break;
        }
      }
    }

    if (isRigidBodyInCollisionGroup) {
      _vector3.set(0, 0, 0).subVectors(worldPosition, _position).normalize().multiplyScalar(force);

      rigidBody.applyImpulse(_vector3, true);
    }
  }
};

const Attractor = /*#__PURE__*/memo(props => {
  const {
    position = [0, 0, 0],
    strength = 1,
    range = 10,
    type = "static",
    gravitationalConstant = 6.673e-11,
    collisionGroups
  } = props;
  const object = useRef(null);
  const {
    isDebug
  } = useRapier();
  useBeforePhysicsStep(world => {
    if (object.current) {
      world.raw().bodies.forEach(body => {
        if (body.isDynamic()) {
          applyAttractorForceOnRigidBody(body, {
            object: object.current,
            strength,
            range,
            type,
            gravitationalConstant,
            collisionGroups
          });
        }
      });
    }
  });
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("object3D", {
    ref: object,
    position: position
  }), isDebug && /*#__PURE__*/React.createElement(AttractorHelper, {
    strength: strength,
    gravitationalConstant: gravitationalConstant,
    range: range,
    type: type,
    collisionGroups: collisionGroups,
    object: object
  }));
});

const potato = () => {
  console.log("potato");
};

const mama = () => {
  console.log("mama");
};

export { Attractor, applyAttractorForceOnRigidBody, mama, potato };

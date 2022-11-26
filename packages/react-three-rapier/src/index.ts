import { ColliderDesc, ActiveEvents, RigidBodyDesc, EventQueue } from '@dimforge/rapier3d-compat';
export { CoefficientCombineRule, Collider as RapierCollider, RigidBody as RapierRigidBody } from '@dimforge/rapier3d-compat';
import { useFrame, useThree } from '@react-three/fiber';
import React, { useMemo, useEffect, useContext, useState, useRef, memo, createContext, useCallback, forwardRef, useImperativeHandle, useLayoutEffect } from 'react';
import { Quaternion, Euler, Vector3, Object3D, Matrix4, MathUtils, InstancedMesh, BufferAttribute, DynamicDrawUsage } from 'three';
import { useAsset } from 'use-asset';
import { mergeVertices, VertexNormalsHelper } from 'three-stdlib';

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);

  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    enumerableOnly && (symbols = symbols.filter(function (sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    })), keys.push.apply(keys, symbols);
  }

  return keys;
}

function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = null != arguments[i] ? arguments[i] : {};
    i % 2 ? ownKeys(Object(source), !0).forEach(function (key) {
      _defineProperty(target, key, source[key]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) {
      Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
    });
  }

  return target;
}

const _quaternion = new Quaternion();
new Euler();
const _vector3 = new Vector3();
const _object3d = new Object3D();
const _matrix4 = new Matrix4();
const _position = new Vector3();
const _rotation = new Quaternion();
const _scale = new Vector3();

const vectorArrayToVector3 = arr => {
  const [x, y, z] = arr;
  return new Vector3(x, y, z);
};
const rapierVector3ToVector3 = ({
  x,
  y,
  z
}) => _vector3.set(x, y, z);
const rapierQuaternionToQuaternion = ({
  x,
  y,
  z,
  w
}) => _quaternion.set(x, y, z, w);
const rigidBodyTypeMap = {
  fixed: 1,
  dynamic: 0,
  kinematicPosition: 2,
  kinematicVelocity: 3
};
const rigidBodyTypeFromString = type => rigidBodyTypeMap[type];
const scaleVertices = (vertices, scale) => {
  const scaledVerts = Array.from(vertices);

  for (let i = 0; i < vertices.length / 3; i++) {
    scaledVerts[i * 3] *= scale.x;
    scaledVerts[i * 3 + 1] *= scale.y;
    scaledVerts[i * 3 + 2] *= scale.z;
  }

  return scaledVerts;
};
const vectorToTuple = v => {
  if (!v) return [0];

  if (v instanceof Quaternion) {
    return [v.x, v.y, v.z, v.w];
  }

  if (v instanceof Vector3 || v instanceof Euler) {
    return [v.x, v.y, v.z];
  }

  if (Array.isArray(v)) {
    return v;
  }

  return [v];
};

const createRigidBodyApi = ref => {
  return {
    raw: () => ref.current(),

    get handle() {
      return ref.current().handle;
    },

    mass: () => ref.current().mass(),

    applyImpulse(impulseVector, wakeUp = true) {
      ref.current().applyImpulse(impulseVector, wakeUp);
    },

    applyTorqueImpulse(torqueVector, wakeUp = true) {
      ref.current().applyTorqueImpulse(torqueVector, wakeUp);
    },

    applyImpulseAtPoint: (impulseVector, impulsePoint, wakeUp = true) => ref.current().applyImpulseAtPoint(impulseVector, impulsePoint, wakeUp),
    addForce: (force, wakeUp = true) => ref.current().addForce(force, wakeUp),
    addForceAtPoint: (force, point, wakeUp = true) => ref.current().addForceAtPoint(force, point, wakeUp),
    addTorque: (torque, wakeUp = true) => ref.current().addTorque(torque, wakeUp),

    translation() {
      return rapierVector3ToVector3(ref.current().translation());
    },

    setTranslation: (translation, wakeUp = true) => ref.current().setTranslation(translation, wakeUp),

    rotation() {
      const {
        x,
        y,
        z,
        w
      } = ref.current().rotation();
      return new Quaternion(x, y, z, w);
    },

    setRotation: (rotation, wakeUp = true) => {
      ref.current().setRotation(rotation, wakeUp);
    },

    linvel() {
      const {
        x,
        y,
        z
      } = ref.current().linvel();
      return new Vector3(x, y, z);
    },

    setLinvel: (velocity, wakeUp = true) => ref.current().setLinvel(velocity, wakeUp),

    angvel() {
      const {
        x,
        y,
        z
      } = ref.current().angvel();
      return new Vector3(x, y, z);
    },

    setAngvel: (velocity, wakeUp = true) => ref.current().setAngvel(velocity, wakeUp),

    linearDamping() {
      return ref.current().linearDamping();
    },

    setLinearDamping: factor => ref.current().setLinearDamping(factor),

    angularDamping() {
      return ref.current().angularDamping();
    },

    setAngularDamping: factor => ref.current().setAngularDamping(factor),
    setNextKinematicRotation: rotation => {
      ref.current().setNextKinematicRotation(rotation);
    },
    setNextKinematicTranslation: translation => ref.current().setNextKinematicTranslation(translation),
    resetForces: (wakeUp = true) => ref.current().resetForces(wakeUp),
    resetTorques: (wakeUp = true) => ref.current().resetTorques(wakeUp),
    lockRotations: (locked, wakeUp = true) => ref.current().lockRotations(locked, wakeUp),
    lockTranslations: (locked, wakeUp = true) => ref.current().lockTranslations(locked, wakeUp),
    setEnabledRotations: (x, y, z, wakeUp = true) => ref.current().setEnabledRotations(x, y, z, wakeUp),
    setEnabledTranslations: (x, y, z, wakeUp = true) => ref.current().setEnabledTranslations(x, y, z, wakeUp)
  };
};
const createInstancedRigidBodiesApi = bodiesGetter => ({
  at: index => bodiesGetter.current()[index].api,

  forEach(callback) {
    return bodiesGetter.current().map(b => b.api).forEach(callback);
  },

  get count() {
    return bodiesGetter.current().length;
  }

}); // TODO: Flesh this out
const createWorldApi = ref => {
  return {
    raw: () => ref.current(),
    getCollider: handle => ref.current().getCollider(handle),
    getRigidBody: handle => ref.current().getRigidBody(handle),
    createRigidBody: desc => ref.current().createRigidBody(desc),
    createCollider: (desc, rigidBody) => ref.current().createCollider(desc, rigidBody),
    removeRigidBody: rigidBody => {
      if (!ref.current().bodies.contains(rigidBody.handle)) return;
      ref.current().removeRigidBody(rigidBody);
    },
    removeCollider: (collider, wakeUp = true) => {
      if (!ref.current().colliders.contains(collider.handle)) return;
      ref.current().removeCollider(collider, wakeUp);
    },
    createImpulseJoint: (params, rigidBodyA, rigidBodyB, wakeUp = true) => ref.current().createImpulseJoint(params, rigidBodyA, rigidBodyB, wakeUp),
    removeImpulseJoint: (joint, wakeUp = true) => {
      if (!ref.current().impulseJoints.contains(joint.handle)) return;
      ref.current().removeImpulseJoint(joint, wakeUp);
    },
    forEachCollider: callback => ref.current().forEachCollider(callback),
    setGravity: ({
      x,
      y,
      z
    }) => ref.current().gravity = {
      x,
      y,
      z
    },
    debugRender: () => ref.current().debugRender()
  };
}; // TODO: Broken currently, waiting for Rapier3D to fix

const createJointApi = ref => {
  return {
    raw: () => ref.current(),

    get handle() {
      return ref.current().handle;
    },

    configureMotorPosition: (targetPos, stiffness, damping) => ref.current().configureMotorPosition(targetPos, stiffness, damping),
    configureMotorVelocity: (targetVel, damping) => ref.current().configureMotorVelocity(targetVel, damping)
  };
};

const scaleColliderArgs = (shape, args, scale) => {
  const newArgs = args.slice(); // Heightfield uses a vector

  if (shape === "heightfield") {
    const s = newArgs[3];
    s.x *= scale.x;
    s.x *= scale.y;
    s.x *= scale.z;
    return newArgs;
  } // Trimesh and convex scale the vertices


  if (shape === "trimesh" || shape === "convexHull") {
    newArgs[0] = scaleVertices(newArgs[0], scale);
    return newArgs;
  } // Prepfill with some extra


  const scaleArray = [scale.x, scale.y, scale.z, scale.x, scale.x];
  return newArgs.map((arg, index) => scaleArray[index] * arg);
};
const createColliderFromOptions = (options, world, scale, rigidBody) => {
  const scaledArgs = scaleColliderArgs(options.shape, options.args, scale); // @ts-ignore

  const desc = ColliderDesc[options.shape](...scaledArgs);
  return world.createCollider(desc, rigidBody);
};
const massPropertiesConflictError = "Please pick ONLY ONE of the `density`, `mass` and `massProperties` options.";

const setColliderMassOptions = (collider, options) => {
  if (options.density !== undefined) {
    if (options.mass !== undefined || options.massProperties !== undefined) {
      throw new Error(massPropertiesConflictError);
    }

    collider.setDensity(options.density);
    return;
  }

  if (options.mass !== undefined) {
    if (options.massProperties !== undefined) {
      throw new Error(massPropertiesConflictError);
    }

    collider.setMass(options.mass);
    return;
  }

  if (options.massProperties !== undefined) {
    collider.setMassProperties(options.massProperties.mass, options.massProperties.centerOfMass, options.massProperties.principalAngularInertia, options.massProperties.angularInertiaLocalFrame);
  }
};

const mutableColliderOptions = {
  sensor: (collider, value) => {
    collider.setSensor(value);
  },
  collisionGroups: (collider, value) => {
    collider.setCollisionGroups(value);
  },
  solverGroups: (collider, value) => {
    collider.setSolverGroups(value);
  },
  friction: (collider, value) => {
    collider.setFriction(value);
  },
  frictionCombineRule: (collider, value) => {
    collider.setFrictionCombineRule(value);
  },
  restitution: (collider, value) => {
    collider.setRestitution(value);
  },
  restitutionCombineRule: (collider, value) => {
    collider.setRestitutionCombineRule(value);
  },
  // To make sure the options all mutalbe options are listed
  quaternion: () => {},
  position: () => {},
  rotation: () => {},
  scale: () => {}
};
const mutableColliderOptionKeys = Object.keys(mutableColliderOptions);
const setColliderOptions = (collider, options, states) => {
  const state = states.get(collider.handle);

  if (state) {
    var _state$worldParent;

    // Update collider position based on the object's position
    const parentWorldScale = state.object.parent.getWorldScale(_vector3);
    const parentInvertedWorldMatrix = (_state$worldParent = state.worldParent) === null || _state$worldParent === void 0 ? void 0 : _state$worldParent.matrixWorld.clone().invert();
    state.object.updateWorldMatrix(true, false);

    _matrix4.copy(state.object.matrixWorld);

    if (parentInvertedWorldMatrix) {
      _matrix4.premultiply(parentInvertedWorldMatrix);
    }

    _matrix4.decompose(_position, _rotation, _scale);

    if (collider.parent()) {
      collider.setTranslationWrtParent({
        x: _position.x * parentWorldScale.x,
        y: _position.y * parentWorldScale.y,
        z: _position.z * parentWorldScale.z
      });
      collider.setRotationWrtParent(_rotation);
    } else {
      collider.setTranslation({
        x: _position.x * parentWorldScale.x,
        y: _position.y * parentWorldScale.y,
        z: _position.z * parentWorldScale.z
      });
      collider.setRotation(_rotation);
    }

    mutableColliderOptionKeys.forEach(key => {
      if (key in options) {
        const option = options[key];
        mutableColliderOptions[key](collider, // @ts-ignore Option does not want to fit into the function, but it will
        option, options);
      }
    }); // handle mass separately, because the assignments
    // are exclusive.

    setColliderMassOptions(collider, options);
  }
};
const useUpdateColliderOptions = (collidersRef, props, states) => {
  // TODO: Improve this, split each prop into its own effect
  const mutablePropsAsFlatArray = useMemo(() => mutableColliderOptionKeys.flatMap(key => {
    return vectorToTuple(props[key]);
  }), [props]);
  useEffect(() => {
    collidersRef.current.forEach(collider => {
      setColliderOptions(collider, props, states);
    });
  }, mutablePropsAsFlatArray);
};

const isChildOfMeshCollider = child => {
  let flag = false;
  child.traverseAncestors(a => {
    if (a.userData.r3RapierType === "MeshCollider") flag = true;
  });
  return flag;
};

const createColliderState = (collider, object, rigidBodyObject) => {
  return {
    collider,
    worldParent: rigidBodyObject || undefined,
    object
  };
};
const autoColliderMap = {
  cuboid: "cuboid",
  ball: "ball",
  hull: "convexHull",
  trimesh: "trimesh"
};
const createColliderPropsFromChildren = ({
  object,
  ignoreMeshColliders: _ignoreMeshColliders = true,
  options
}) => {
  const colliderProps = [];
  object.updateWorldMatrix(true, false);
  const invertedParentMatrixWorld = object.matrixWorld.clone().invert();

  const colliderFromChild = child => {
    if ("isMesh" in child) {
      if (_ignoreMeshColliders && isChildOfMeshCollider(child)) return;
      const worldScale = child.getWorldScale(_scale);
      const shape = autoColliderMap[options.colliders || "cuboid"];
      child.updateWorldMatrix(true, false);

      _matrix4.copy(child.matrixWorld).premultiply(invertedParentMatrixWorld).decompose(_position, _rotation, _scale);

      const rotationEuler = new Euler().setFromQuaternion(_rotation, "XYZ");
      const {
        geometry
      } = child;
      const {
        args,
        offset
      } = getColliderArgsFromGeometry(geometry, options.colliders || "cuboid");
      colliderProps.push(_objectSpread2(_objectSpread2({}, options), {}, {
        args: args,
        shape: shape,
        rotation: [rotationEuler.x, rotationEuler.y, rotationEuler.z],
        position: [_position.x + offset.x * worldScale.x, _position.y + offset.y * worldScale.y, _position.z + offset.z * worldScale.z],
        scale: [worldScale.x, worldScale.y, worldScale.z]
      }));
    }
  };

  if (options.includeInvisible) {
    object.traverse(colliderFromChild);
  } else {
    object.traverseVisible(colliderFromChild);
  }

  return colliderProps;
};
const getColliderArgsFromGeometry = (geometry, colliders) => {
  switch (colliders) {
    case "cuboid":
      {
        geometry.computeBoundingBox();
        const {
          boundingBox
        } = geometry;
        const size = boundingBox.getSize(new Vector3());
        return {
          args: [size.x / 2, size.y / 2, size.z / 2],
          offset: boundingBox.getCenter(new Vector3())
        };
      }

    case "ball":
      {
        geometry.computeBoundingSphere();
        const {
          boundingSphere
        } = geometry;
        const radius = boundingSphere.radius;
        return {
          args: [radius],
          offset: boundingSphere.center
        };
      }

    case "trimesh":
      {
        var _clonedGeometry$index;

        const clonedGeometry = geometry.index ? geometry.clone() : mergeVertices(geometry);
        return {
          args: [clonedGeometry.attributes.position.array, (_clonedGeometry$index = clonedGeometry.index) === null || _clonedGeometry$index === void 0 ? void 0 : _clonedGeometry$index.array],
          offset: new Vector3()
        };
      }

    case "hull":
      {
        const g = geometry.clone();
        return {
          args: [g.attributes.position.array],
          offset: new Vector3()
        };
      }
  }

  return {
    args: [],
    offset: new Vector3()
  };
};
const useColliderEvents = (collidersRef, props, events) => {
  const {
    onCollisionEnter,
    onCollisionExit,
    onIntersectionEnter,
    onIntersectionExit,
    onContactForce
  } = props;
  useEffect(() => {
    var _collidersRef$current;

    (_collidersRef$current = collidersRef.current) === null || _collidersRef$current === void 0 ? void 0 : _collidersRef$current.forEach(collider => {
      const hasCollisionEvent = !!(onCollisionEnter || onCollisionExit || onIntersectionEnter || onIntersectionExit);
      const hasContactForceEvent = !!onContactForce;

      if (hasCollisionEvent && hasContactForceEvent) {
        collider.setActiveEvents(ActiveEvents.COLLISION_EVENTS | ActiveEvents.CONTACT_FORCE_EVENTS);
      } else if (hasCollisionEvent) {
        collider.setActiveEvents(ActiveEvents.COLLISION_EVENTS);
      } else if (hasContactForceEvent) {
        collider.setActiveEvents(ActiveEvents.CONTACT_FORCE_EVENTS);
      }

      events.set(collider.handle, {
        onCollisionEnter,
        onCollisionExit,
        onIntersectionEnter,
        onIntersectionExit,
        onContactForce
      });
    });
    return () => {
      var _collidersRef$current2;

      (_collidersRef$current2 = collidersRef.current) === null || _collidersRef$current2 === void 0 ? void 0 : _collidersRef$current2.forEach(collider => events.delete(collider.handle));
    };
  }, [onCollisionEnter, onCollisionExit, onIntersectionEnter, onIntersectionExit, onContactForce]);
};

const rigidBodyDescFromOptions = options => {
  const type = rigidBodyTypeFromString((options === null || options === void 0 ? void 0 : options.type) || "dynamic");
  const desc = new RigidBodyDesc(type);
  return desc;
};
const createRigidBodyState = ({
  rigidBody,
  object,
  setMatrix,
  getMatrix,
  worldScale
}) => {
  object.updateWorldMatrix(true, false);
  const invertedWorldMatrix = object.parent.matrixWorld.clone().invert();
  return {
    object,
    rigidBody,
    invertedWorldMatrix,
    setMatrix: setMatrix ? setMatrix : matrix => {
      object.matrix.copy(matrix);
    },
    getMatrix: getMatrix ? getMatrix : matrix => matrix.copy(object.matrix),
    scale: worldScale || object.getWorldScale(_scale).clone(),
    isSleeping: false
  };
};
const mutableRigidBodyOptions = {
  gravityScale: (rb, value) => {
    rb.setGravityScale(value, true);
  },
  linearDamping: (rb, value) => {
    rb.setLinearDamping(value);
  },
  angularDamping: (rb, value) => {
    rb.setAngularDamping(value);
  },
  enabledRotations: (rb, [x, y, z]) => {
    rb.setEnabledRotations(x, y, z, true);
  },
  enabledTranslations: (rb, [x, y, z]) => {
    rb.setEnabledTranslations(x, y, z, true);
  },
  lockRotations: (rb, value) => {
    rb.lockRotations(value, true);
  },
  lockTranslations: (rb, value) => {
    rb.lockTranslations(value, true);
  },
  angularVelocity: (rb, [x, y, z]) => {
    rb.setAngvel({
      x,
      y,
      z
    }, true);
  },
  linearVelocity: (rb, [x, y, z]) => {
    rb.setLinvel({
      x,
      y,
      z
    }, true);
  },
  ccd: (rb, value) => {
    rb.enableCcd(value);
  },
  userData: (rb, value) => {
    rb.userData = value;
  },
  position: () => {},
  rotation: () => {},
  quaternion: () => {},
  scale: () => {}
};
const mutableRigidBodyOptionKeys = Object.keys(mutableRigidBodyOptions);
const setRigidBodyOptions = (rigidBody, options, states, updateTranslations = true) => {
  if (!rigidBody) {
    return;
  }

  const state = states.get(rigidBody.handle);

  if (state) {
    if (updateTranslations) {
      state.object.updateWorldMatrix(true, false);

      _matrix4.copy(state.object.matrixWorld).decompose(_position, _rotation, _scale);

      rigidBody.setTranslation(_position, false);
      rigidBody.setRotation(_rotation, false);
    }

    mutableRigidBodyOptionKeys.forEach(key => {
      if (key in options) {
        mutableRigidBodyOptions[key](rigidBody, options[key]);
      }
    });
  }
};
const useUpdateRigidBodyOptions = (rigidBodyRef, props, states, updateTranslations = true) => {
  // TODO: Improve this, split each prop into its own effect
  const mutablePropsAsFlatArray = useMemo(() => mutableRigidBodyOptionKeys.flatMap(key => {
    return vectorToTuple(props[key]);
  }), [props]);
  useEffect(() => {
    if (Array.isArray(rigidBodyRef.current)) {
      for (const rigidBody of rigidBodyRef.current) {
        setRigidBodyOptions(rigidBody, props, states, updateTranslations);
      }
    } else if (rigidBodyRef.current) {
      setRigidBodyOptions(rigidBodyRef.current, props, states, updateTranslations);
    }
  }, mutablePropsAsFlatArray);
};
const useRigidBodyEvents = (rigidBodyRef, props, events) => {
  const {
    onWake,
    onSleep,
    onCollisionEnter,
    onCollisionExit,
    onIntersectionEnter,
    onIntersectionExit
  } = props;
  const eventHandlers = {
    onWake,
    onSleep,
    onCollisionEnter,
    onCollisionExit,
    onIntersectionEnter,
    onIntersectionExit
  };
  useEffect(() => {
    if (Array.isArray(rigidBodyRef.current)) {
      for (const rigidBody of rigidBodyRef.current) {
        events.set(rigidBody.handle, eventHandlers);
      }
    } else if (rigidBodyRef.current) {
      events.set(rigidBodyRef.current.handle, eventHandlers);
    }

    return () => {
      if (Array.isArray(rigidBodyRef.current)) {
        for (const rigidBody of rigidBodyRef.current) {
          events.delete(rigidBody.handle);
        }
      } else if (rigidBodyRef.current) {
        events.delete(rigidBodyRef.current.handle);
      }
    };
  }, [onWake, onSleep, onCollisionEnter, onCollisionExit, onIntersectionEnter, onIntersectionExit]);
};

const useRapier = () => {
  return useContext(RapierContext);
};
const useChildColliderProps = (ref, options, ignoreMeshColliders = true) => {
  const [colliderProps, setColliderProps] = useState([]);
  useEffect(() => {
    const object = ref.current;

    if (object && options.colliders !== false) {
      setColliderProps(createColliderPropsFromChildren({
        object: ref.current,
        options,
        ignoreMeshColliders
      }));
    }
  }, [options.colliders]);
  return colliderProps;
};
const useRigidBody = (options = {}) => {
  const {
    world,
    rigidBodyStates,
    physicsOptions,
    rigidBodyEvents
  } = useRapier();
  const ref = useRef();
  const mergedOptions = useMemo(() => {
    return _objectSpread2(_objectSpread2(_objectSpread2({}, physicsOptions), options), {}, {
      children: undefined
    });
  }, [physicsOptions, options]);
  const childColliderProps = useChildColliderProps(ref, mergedOptions); // Create rigidbody

  const rigidBodyRef = useRef();
  const getRigidBodyRef = useRef(() => {
    if (!rigidBodyRef.current) {
      const desc = rigidBodyDescFromOptions(options);
      const rigidBody = world.createRigidBody(desc);
      rigidBodyRef.current = world.getRigidBody(rigidBody.handle);
    }

    return rigidBodyRef.current;
  }); // Setup

  useEffect(() => {
    const rigidBody = getRigidBodyRef.current();
    rigidBodyRef.current = rigidBody;

    if (!ref.current) {
      ref.current = new Object3D();
    }

    rigidBodyStates.set(rigidBody.handle, createRigidBodyState({
      rigidBody,
      object: ref.current
    }));
    return () => {
      world.removeRigidBody(rigidBody);
      rigidBodyStates.delete(rigidBody.handle);
      rigidBodyRef.current = undefined;
    };
  }, []);
  useUpdateRigidBodyOptions(rigidBodyRef, mergedOptions, rigidBodyStates);
  useRigidBodyEvents(rigidBodyRef, mergedOptions, rigidBodyEvents);
  const api = useMemo(() => createRigidBodyApi(getRigidBodyRef), []);
  return [ref, api, childColliderProps];
}; // Joints

const useImpulseJoint = (body1, body2, params) => {
  const {
    world
  } = useRapier();
  const jointRef = useRef();
  const getJointRef = useRef(() => {
    if (!jointRef.current) {
      let rb1;
      let rb2;

      if ("current" in body1 && body1.current && "current" in body2 && body2.current) {
        rb1 = world.getRigidBody(body1.current.handle);
        rb2 = world.getRigidBody(body2.current.handle);
        const newJoint = world.createImpulseJoint(params, rb1, rb2);
        jointRef.current = newJoint;
      }
    }

    return jointRef.current;
  });
  useEffect(() => {
    const joint = getJointRef.current();
    return () => {
      if (joint) {
        world.removeImpulseJoint(joint);
        jointRef.current = undefined;
      }
    };
  }, []);
  const api = useMemo(() => createJointApi(getJointRef), []);
  return api;
};
/**
 *
 * A fixed joint ensures that two rigid-bodies don't move relative to each other.
 * Fixed joints are characterized by one local frame (represented by an isometry) on each rigid-body.
 * The fixed-joint makes these frames coincide in world-space.
 */

const useFixedJoint = (body1, body2, [body1Anchor, body1LocalFrame, body2Anchor, body2LocalFrame]) => {
  const {
    rapier
  } = useRapier();
  return useImpulseJoint(body1, body2, rapier.JointData.fixed(vectorArrayToVector3(body1Anchor), _objectSpread2(_objectSpread2({}, vectorArrayToVector3(body1LocalFrame)), {}, {
    w: 1
  }), vectorArrayToVector3(body2Anchor), _objectSpread2(_objectSpread2({}, vectorArrayToVector3(body2LocalFrame)), {}, {
    w: 1
  })));
};
/**
 * The spherical joint ensures that two points on the local-spaces of two rigid-bodies always coincide (it prevents any relative
 * translational motion at this points). This is typically used to simulate ragdolls arms, pendulums, etc.
 * They are characterized by one local anchor on each rigid-body. Each anchor represents the location of the
 * points that need to coincide on the local-space of each rigid-body.
 */

const useSphericalJoint = (body1, body2, [body1Anchor, body2Anchor]) => {
  const {
    rapier
  } = useRapier();
  return useImpulseJoint(body1, body2, rapier.JointData.spherical(vectorArrayToVector3(body1Anchor), vectorArrayToVector3(body2Anchor)));
};
/**
 * The revolute joint prevents any relative movement between two rigid-bodies, except for relative
 * rotations along one axis. This is typically used to simulate wheels, fans, etc.
 * They are characterized by one local anchor as well as one local axis on each rigid-body.
 */

const useRevoluteJoint = (body1, body2, [body1Anchor, body2Anchor, axis]) => {
  const {
    rapier
  } = useRapier();
  return useImpulseJoint(body1, body2, rapier.JointData.revolute(vectorArrayToVector3(body1Anchor), vectorArrayToVector3(body2Anchor), vectorArrayToVector3(axis)));
};
/**
 * The prismatic joint prevents any relative movement between two rigid-bodies, except for relative translations along one axis.
 * It is characterized by one local anchor as well as one local axis on each rigid-body. In 3D, an optional
 * local tangent axis can be specified for each rigid-body.
 */

const usePrismaticJoint = (body1, body2, [body1Anchor, body2Anchor, axis]) => {
  const {
    rapier
  } = useRapier();
  return useImpulseJoint(body1, body2, rapier.JointData.prismatic(vectorArrayToVector3(body1Anchor), vectorArrayToVector3(body2Anchor), vectorArrayToVector3(axis)));
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
  const {
    attractorStates
  } = useRapier();
  const object = useRef(null);
  useEffect(() => {
    var _object$current;

    let uuid = ((_object$current = object.current) === null || _object$current === void 0 ? void 0 : _object$current.uuid) || "_";

    if (object.current) {
      attractorStates.set(uuid, {
        object: object.current,
        strength,
        range,
        type,
        gravitationalConstant,
        collisionGroups
      });
    }

    return () => {
      attractorStates.delete(uuid);
    };
  }, [props]);
  return /*#__PURE__*/React.createElement("object3D", {
    ref: object,
    position: position
  });
});

const RapierContext = /*#__PURE__*/createContext(undefined);

const getCollisionPayloadFromSource = (target, other) => {
  var _target$collider$stat, _target$rigidBody$sta, _other$collider$state, _other$rigidBody$stat, _other$collider$state2, _other$rigidBody$stat2;

  return {
    target: {
      rigidBody: target.rigidBody.object,
      collider: target.collider.object,
      colliderObject: (_target$collider$stat = target.collider.state) === null || _target$collider$stat === void 0 ? void 0 : _target$collider$stat.object,
      rigidBodyObject: (_target$rigidBody$sta = target.rigidBody.state) === null || _target$rigidBody$sta === void 0 ? void 0 : _target$rigidBody$sta.object
    },
    other: {
      rigidBody: other.rigidBody.object,
      collider: other.collider.object,
      colliderObject: (_other$collider$state = other.collider.state) === null || _other$collider$state === void 0 ? void 0 : _other$collider$state.object,
      rigidBodyObject: (_other$rigidBody$stat = other.rigidBody.state) === null || _other$rigidBody$stat === void 0 ? void 0 : _other$rigidBody$stat.object
    },
    rigidBody: other.rigidBody.object,
    collider: other.collider.object,
    colliderObject: (_other$collider$state2 = other.collider.state) === null || _other$collider$state2 === void 0 ? void 0 : _other$collider$state2.object,
    rigidBodyObject: (_other$rigidBody$stat2 = other.rigidBody.state) === null || _other$rigidBody$stat2 === void 0 ? void 0 : _other$rigidBody$stat2.object
  };
};

const importRapier = async () => {
  let r = await import('@dimforge/rapier3d-compat');
  await r.init();
  return r;
};

const Physics = ({
  colliders: _colliders = "cuboid",
  gravity: _gravity = [0, -9.81, 0],
  children,
  timeStep: _timeStep = 1 / 60,
  paused: _paused = false,
  updatePriority,
  interpolate: _interpolate = true
}) => {
  const rapier = useAsset(importRapier);
  const worldRef = useRef();
  const getWorldRef = useRef(() => {
    if (!worldRef.current) {
      const world = new rapier.World(vectorArrayToVector3(_gravity));
      worldRef.current = world;
    }

    return worldRef.current;
  });
  const [rigidBodyStates] = useState(() => new Map());
  const [colliderStates] = useState(() => new Map());
  const [rigidBodyEvents] = useState(() => new Map());
  const [colliderEvents] = useState(() => new Map());
  const [eventQueue] = useState(() => new EventQueue(false));
  const [attractorStates] = useState(() => new Map()); // Init world

  useEffect(() => {
    const world = getWorldRef.current();
    return () => {
      if (world) {
        world.free();
        worldRef.current = undefined;
      }
    };
  }, []); // Update gravity

  useEffect(() => {
    const world = worldRef.current;

    if (world) {
      world.gravity = vectorArrayToVector3(_gravity);
    }
  }, [_gravity]);
  const getSourceFromColliderHandle = useCallback(handle => {
    const world = worldRef.current;

    if (world) {
      var _collider$parent;

      const collider = world.getCollider(handle);
      const colEvents = colliderEvents.get(handle);
      const colliderState = colliderStates.get(handle);
      const rigidBodyHandle = collider === null || collider === void 0 ? void 0 : (_collider$parent = collider.parent()) === null || _collider$parent === void 0 ? void 0 : _collider$parent.handle;
      const rigidBody = rigidBodyHandle !== undefined ? world.getRigidBody(rigidBodyHandle) : undefined;
      const rbEvents = rigidBody && rigidBodyHandle !== undefined ? rigidBodyEvents.get(rigidBodyHandle) : undefined;
      const rigidBodyState = rigidBodyHandle !== undefined ? rigidBodyStates.get(rigidBodyHandle) : undefined;
      const source = {
        collider: {
          object: collider,
          events: colEvents,
          state: colliderState
        },
        rigidBody: {
          object: rigidBody,
          events: rbEvents,
          state: rigidBodyState
        }
      };
      return source;
    }
  }, []);
  const [steppingState] = useState({
    previousState: {},
    accumulator: 0
  });
  const step = useCallback(dt => {
    const world = worldRef.current;
    if (!world) return;
    /* Check if the timestep is supposed to be variable. We'll do this here
      once so we don't have to string-check every frame. */

    const timeStepVariable = _timeStep === "vary";
    /**
     * Fixed timeStep simulation progression
     * @see https://gafferongames.com/post/fix_your_timestep/
     */

    const clampedDelta = MathUtils.clamp(dt, 0, 0.2);

    if (timeStepVariable) {
      world.timestep = clampedDelta;
      world.step(eventQueue);
    } else {
      world.timestep = _timeStep; // don't step time forwards if paused
      // Increase accumulator

      steppingState.accumulator += clampedDelta;

      while (steppingState.accumulator >= _timeStep) {
        world.forEachRigidBody(body => {
          // Set up previous state
          // needed for accurate interpolations if the world steps more than once
          if (_interpolate) {
            steppingState.previousState = {};
            steppingState.previousState[body.handle] = {
              position: body.translation(),
              rotation: body.rotation()
            };
          } // Apply attractors


          attractorStates.forEach(attractorState => {
            applyAttractorForceOnRigidBody(body, attractorState);
          });
        });
        world.step(eventQueue);
        steppingState.accumulator -= _timeStep;
      }
    }

    const interpolationAlpha = timeStepVariable || !_interpolate || _paused ? 1 : steppingState.accumulator / _timeStep; // Update meshes

    rigidBodyStates.forEach((state, handle) => {
      const rigidBody = world.getRigidBody(handle);
      const events = rigidBodyEvents.get(handle);

      if (events !== null && events !== void 0 && events.onSleep || events !== null && events !== void 0 && events.onWake) {
        if (rigidBody.isSleeping() && !state.isSleeping) {
          var _events$onSleep;

          events === null || events === void 0 ? void 0 : (_events$onSleep = events.onSleep) === null || _events$onSleep === void 0 ? void 0 : _events$onSleep.call(events);
        }

        if (!rigidBody.isSleeping() && state.isSleeping) {
          var _events$onWake;

          events === null || events === void 0 ? void 0 : (_events$onWake = events.onWake) === null || _events$onWake === void 0 ? void 0 : _events$onWake.call(events);
        }

        state.isSleeping = rigidBody.isSleeping();
      }

      if (!rigidBody || rigidBody.isSleeping() || !state.setMatrix) {
        return;
      } // New states


      let t = rigidBody.translation();
      let r = rigidBody.rotation();
      let previousState = steppingState.previousState[handle];

      if (previousState) {
        // Get previous simulated world position
        _matrix4.compose(previousState.position, rapierQuaternionToQuaternion(previousState.rotation), state.scale).premultiply(state.invertedWorldMatrix).decompose(_position, _rotation, _scale); // Apply previous tick position


        if (!(state.object instanceof InstancedMesh)) {
          state.object.position.copy(_position);
          state.object.quaternion.copy(_rotation);
        }
      } // Get new position


      _matrix4.compose(t, rapierQuaternionToQuaternion(r), state.scale).premultiply(state.invertedWorldMatrix).decompose(_position, _rotation, _scale);

      if (state.object instanceof InstancedMesh) {
        state.setMatrix(_matrix4);
        state.object.instanceMatrix.needsUpdate = true;
      } else {
        // Interpolate to new position
        state.object.position.lerp(_position, interpolationAlpha);
        state.object.quaternion.slerp(_rotation, interpolationAlpha);
      }
    });
    eventQueue.drainCollisionEvents((handle1, handle2, started) => {
      const source1 = getSourceFromColliderHandle(handle1);
      const source2 = getSourceFromColliderHandle(handle2); // Collision Events

      if (!(source1 !== null && source1 !== void 0 && source1.collider.object) || !(source2 !== null && source2 !== void 0 && source2.collider.object)) {
        return;
      }

      const collisionPayload1 = getCollisionPayloadFromSource(source1, source2);
      const collisionPayload2 = getCollisionPayloadFromSource(source2, source1);

      if (started) {
        world.contactPair(source1.collider.object, source2.collider.object, (manifold, flipped) => {
          var _source1$rigidBody$ev, _source1$rigidBody$ev2, _source2$rigidBody$ev, _source2$rigidBody$ev2, _source1$collider$eve, _source1$collider$eve2, _source2$collider$eve, _source2$collider$eve2;

          /* RigidBody events */
          (_source1$rigidBody$ev = source1.rigidBody.events) === null || _source1$rigidBody$ev === void 0 ? void 0 : (_source1$rigidBody$ev2 = _source1$rigidBody$ev.onCollisionEnter) === null || _source1$rigidBody$ev2 === void 0 ? void 0 : _source1$rigidBody$ev2.call(_source1$rigidBody$ev, _objectSpread2(_objectSpread2({}, collisionPayload1), {}, {
            manifold,
            flipped
          }));
          (_source2$rigidBody$ev = source2.rigidBody.events) === null || _source2$rigidBody$ev === void 0 ? void 0 : (_source2$rigidBody$ev2 = _source2$rigidBody$ev.onCollisionEnter) === null || _source2$rigidBody$ev2 === void 0 ? void 0 : _source2$rigidBody$ev2.call(_source2$rigidBody$ev, _objectSpread2(_objectSpread2({}, collisionPayload2), {}, {
            manifold,
            flipped
          }));
          /* Collider events */

          (_source1$collider$eve = source1.collider.events) === null || _source1$collider$eve === void 0 ? void 0 : (_source1$collider$eve2 = _source1$collider$eve.onCollisionEnter) === null || _source1$collider$eve2 === void 0 ? void 0 : _source1$collider$eve2.call(_source1$collider$eve, _objectSpread2(_objectSpread2({}, collisionPayload1), {}, {
            manifold,
            flipped
          }));
          (_source2$collider$eve = source2.collider.events) === null || _source2$collider$eve === void 0 ? void 0 : (_source2$collider$eve2 = _source2$collider$eve.onCollisionEnter) === null || _source2$collider$eve2 === void 0 ? void 0 : _source2$collider$eve2.call(_source2$collider$eve, _objectSpread2(_objectSpread2({}, collisionPayload2), {}, {
            manifold,
            flipped
          }));
        });
      } else {
        var _source1$rigidBody$ev3, _source1$rigidBody$ev4, _source2$rigidBody$ev3, _source2$rigidBody$ev4, _source1$collider$eve3, _source1$collider$eve4, _source2$collider$eve3, _source2$collider$eve4;

        (_source1$rigidBody$ev3 = source1.rigidBody.events) === null || _source1$rigidBody$ev3 === void 0 ? void 0 : (_source1$rigidBody$ev4 = _source1$rigidBody$ev3.onCollisionExit) === null || _source1$rigidBody$ev4 === void 0 ? void 0 : _source1$rigidBody$ev4.call(_source1$rigidBody$ev3, collisionPayload1);
        (_source2$rigidBody$ev3 = source2.rigidBody.events) === null || _source2$rigidBody$ev3 === void 0 ? void 0 : (_source2$rigidBody$ev4 = _source2$rigidBody$ev3.onCollisionExit) === null || _source2$rigidBody$ev4 === void 0 ? void 0 : _source2$rigidBody$ev4.call(_source2$rigidBody$ev3, collisionPayload2);
        (_source1$collider$eve3 = source1.collider.events) === null || _source1$collider$eve3 === void 0 ? void 0 : (_source1$collider$eve4 = _source1$collider$eve3.onCollisionExit) === null || _source1$collider$eve4 === void 0 ? void 0 : _source1$collider$eve4.call(_source1$collider$eve3, collisionPayload1);
        (_source2$collider$eve3 = source2.collider.events) === null || _source2$collider$eve3 === void 0 ? void 0 : (_source2$collider$eve4 = _source2$collider$eve3.onCollisionExit) === null || _source2$collider$eve4 === void 0 ? void 0 : _source2$collider$eve4.call(_source2$collider$eve3, collisionPayload2);
      } // Sensor Intersections


      if (started) {
        if (world.intersectionPair(source1.collider.object, source2.collider.object)) {
          var _source1$rigidBody$ev5, _source1$rigidBody$ev6, _source2$rigidBody$ev5, _source2$rigidBody$ev6, _source1$collider$eve5, _source1$collider$eve6, _source2$collider$eve5, _source2$collider$eve6;

          (_source1$rigidBody$ev5 = source1.rigidBody.events) === null || _source1$rigidBody$ev5 === void 0 ? void 0 : (_source1$rigidBody$ev6 = _source1$rigidBody$ev5.onIntersectionEnter) === null || _source1$rigidBody$ev6 === void 0 ? void 0 : _source1$rigidBody$ev6.call(_source1$rigidBody$ev5, collisionPayload1);
          (_source2$rigidBody$ev5 = source2.rigidBody.events) === null || _source2$rigidBody$ev5 === void 0 ? void 0 : (_source2$rigidBody$ev6 = _source2$rigidBody$ev5.onIntersectionEnter) === null || _source2$rigidBody$ev6 === void 0 ? void 0 : _source2$rigidBody$ev6.call(_source2$rigidBody$ev5, collisionPayload2);
          (_source1$collider$eve5 = source1.collider.events) === null || _source1$collider$eve5 === void 0 ? void 0 : (_source1$collider$eve6 = _source1$collider$eve5.onIntersectionEnter) === null || _source1$collider$eve6 === void 0 ? void 0 : _source1$collider$eve6.call(_source1$collider$eve5, collisionPayload1);
          (_source2$collider$eve5 = source2.collider.events) === null || _source2$collider$eve5 === void 0 ? void 0 : (_source2$collider$eve6 = _source2$collider$eve5.onIntersectionEnter) === null || _source2$collider$eve6 === void 0 ? void 0 : _source2$collider$eve6.call(_source2$collider$eve5, collisionPayload2);
        }
      } else {
        var _source1$rigidBody$ev7, _source1$rigidBody$ev8, _source2$rigidBody$ev7, _source2$rigidBody$ev8, _source1$collider$eve7, _source1$collider$eve8, _source2$collider$eve7, _source2$collider$eve8;

        (_source1$rigidBody$ev7 = source1.rigidBody.events) === null || _source1$rigidBody$ev7 === void 0 ? void 0 : (_source1$rigidBody$ev8 = _source1$rigidBody$ev7.onIntersectionExit) === null || _source1$rigidBody$ev8 === void 0 ? void 0 : _source1$rigidBody$ev8.call(_source1$rigidBody$ev7, collisionPayload1);
        (_source2$rigidBody$ev7 = source2.rigidBody.events) === null || _source2$rigidBody$ev7 === void 0 ? void 0 : (_source2$rigidBody$ev8 = _source2$rigidBody$ev7.onIntersectionExit) === null || _source2$rigidBody$ev8 === void 0 ? void 0 : _source2$rigidBody$ev8.call(_source2$rigidBody$ev7, collisionPayload2);
        (_source1$collider$eve7 = source1.collider.events) === null || _source1$collider$eve7 === void 0 ? void 0 : (_source1$collider$eve8 = _source1$collider$eve7.onIntersectionExit) === null || _source1$collider$eve8 === void 0 ? void 0 : _source1$collider$eve8.call(_source1$collider$eve7, collisionPayload1);
        (_source2$collider$eve7 = source2.collider.events) === null || _source2$collider$eve7 === void 0 ? void 0 : (_source2$collider$eve8 = _source2$collider$eve7.onIntersectionExit) === null || _source2$collider$eve8 === void 0 ? void 0 : _source2$collider$eve8.call(_source2$collider$eve7, collisionPayload2);
      }
    });
    eventQueue.drainContactForceEvents(event => {
      var _source1$rigidBody$ev9, _source1$rigidBody$ev10, _source2$rigidBody$ev9, _source2$rigidBody$ev10, _source1$collider$eve9, _source1$collider$eve10, _source2$collider$eve9, _source2$collider$eve10;

      const source1 = getSourceFromColliderHandle(event.collider1());
      const source2 = getSourceFromColliderHandle(event.collider2()); // Collision Events

      if (!(source1 !== null && source1 !== void 0 && source1.collider.object) || !(source2 !== null && source2 !== void 0 && source2.collider.object)) {
        return;
      }

      const collisionPayload1 = getCollisionPayloadFromSource(source1, source2);
      const collisionPayload2 = getCollisionPayloadFromSource(source2, source1);
      (_source1$rigidBody$ev9 = source1.rigidBody.events) === null || _source1$rigidBody$ev9 === void 0 ? void 0 : (_source1$rigidBody$ev10 = _source1$rigidBody$ev9.onContactForce) === null || _source1$rigidBody$ev10 === void 0 ? void 0 : _source1$rigidBody$ev10.call(_source1$rigidBody$ev9, _objectSpread2(_objectSpread2({}, collisionPayload1), {}, {
        totalForce: event.totalForce(),
        totalForceMagnitude: event.totalForceMagnitude(),
        maxForceDirection: event.maxForceDirection(),
        maxForceMagnitude: event.maxForceMagnitude()
      }));
      (_source2$rigidBody$ev9 = source2.rigidBody.events) === null || _source2$rigidBody$ev9 === void 0 ? void 0 : (_source2$rigidBody$ev10 = _source2$rigidBody$ev9.onContactForce) === null || _source2$rigidBody$ev10 === void 0 ? void 0 : _source2$rigidBody$ev10.call(_source2$rigidBody$ev9, _objectSpread2(_objectSpread2({}, collisionPayload2), {}, {
        totalForce: event.totalForce(),
        totalForceMagnitude: event.totalForceMagnitude(),
        maxForceDirection: event.maxForceDirection(),
        maxForceMagnitude: event.maxForceMagnitude()
      }));
      (_source1$collider$eve9 = source1.collider.events) === null || _source1$collider$eve9 === void 0 ? void 0 : (_source1$collider$eve10 = _source1$collider$eve9.onContactForce) === null || _source1$collider$eve10 === void 0 ? void 0 : _source1$collider$eve10.call(_source1$collider$eve9, _objectSpread2(_objectSpread2({}, collisionPayload1), {}, {
        totalForce: event.totalForce(),
        totalForceMagnitude: event.totalForceMagnitude(),
        maxForceDirection: event.maxForceDirection(),
        maxForceMagnitude: event.maxForceMagnitude()
      }));
      (_source2$collider$eve9 = source2.collider.events) === null || _source2$collider$eve9 === void 0 ? void 0 : (_source2$collider$eve10 = _source2$collider$eve9.onContactForce) === null || _source2$collider$eve10 === void 0 ? void 0 : _source2$collider$eve10.call(_source2$collider$eve9, _objectSpread2(_objectSpread2({}, collisionPayload2), {}, {
        totalForce: event.totalForce(),
        totalForceMagnitude: event.totalForceMagnitude(),
        maxForceDirection: event.maxForceDirection(),
        maxForceMagnitude: event.maxForceMagnitude()
      }));
    });
  }, [_paused, _timeStep, _interpolate]);
  useFrame((_, dt) => {
    if (!_paused) step(dt);
  }, updatePriority);
  const api = useMemo(() => createWorldApi(getWorldRef), []);
  const context = useMemo(() => ({
    rapier,
    world: api,
    physicsOptions: {
      colliders: _colliders,
      gravity: _gravity
    },
    rigidBodyStates,
    colliderStates,
    rigidBodyEvents,
    colliderEvents,
    attractorStates,
    isPaused: _paused,
    step
  }), [_paused, step]);
  return /*#__PURE__*/React.createElement(RapierContext.Provider, {
    value: context
  }, children);
};

function _extends() {
  _extends = Object.assign ? Object.assign.bind() : function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };
  return _extends.apply(this, arguments);
}

function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;

  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }

  return target;
}

function _objectWithoutProperties(source, excluded) {
  if (source == null) return {};
  var target = _objectWithoutPropertiesLoose(source, excluded);
  var key, i;

  if (Object.getOwnPropertySymbols) {
    var sourceSymbolKeys = Object.getOwnPropertySymbols(source);

    for (i = 0; i < sourceSymbolKeys.length; i++) {
      key = sourceSymbolKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
      target[key] = source[key];
    }
  }

  return target;
}

// Colliders
const AnyCollider = /*#__PURE__*/memo( /*#__PURE__*/React.forwardRef((props, forwardedRef) => {
  const {
    children,
    position,
    rotation,
    quaternion,
    scale,
    name
  } = props;
  const {
    world,
    colliderEvents,
    colliderStates
  } = useRapier();
  const rigidBodyContext = useRigidBodyContext();
  const ref = useRef(null);
  const collidersRef = useMemo(() => {
    if (forwardedRef !== null) {
      return forwardedRef;
    }

    const result = /*#__PURE__*/React.createRef();
    result.current = [];
    return result;
  }, []);
  useEffect(() => {
    const object = ref.current;
    const worldScale = object.getWorldScale(new Vector3());
    const colliders = []; // If this is an InstancedRigidBody api

    if (rigidBodyContext && "at" in rigidBodyContext.api) {
      rigidBodyContext.api.forEach((body, index) => {
        var _rigidBodyContext$opt, _rigidBodyContext$opt2;

        let instanceScale = worldScale;

        if ("scales" in rigidBodyContext.options && rigidBodyContext !== null && rigidBodyContext !== void 0 && (_rigidBodyContext$opt = rigidBodyContext.options) !== null && _rigidBodyContext$opt !== void 0 && (_rigidBodyContext$opt2 = _rigidBodyContext$opt.scales) !== null && _rigidBodyContext$opt2 !== void 0 && _rigidBodyContext$opt2[index]) {
          instanceScale = instanceScale.clone().multiply(vectorArrayToVector3(rigidBodyContext.options.scales[index]));
        }

        const collider = createColliderFromOptions(props, world, instanceScale, body.raw());
        colliderStates.set(collider.handle, createColliderState(collider, object, rigidBodyContext === null || rigidBodyContext === void 0 ? void 0 : rigidBodyContext.ref.current));
        colliders.push(collider);
      });
    } else {
      const collider = createColliderFromOptions(props, world, worldScale, rigidBodyContext && (rigidBodyContext === null || rigidBodyContext === void 0 ? void 0 : rigidBodyContext.api).raw());
      colliderStates.set(collider.handle, createColliderState(collider, object, rigidBodyContext === null || rigidBodyContext === void 0 ? void 0 : rigidBodyContext.ref.current));
      colliders.push(collider);
    }

    collidersRef.current = colliders;
    return () => {
      colliders.forEach(collider => {
        world.removeCollider(collider);
      });
    };
  }, []);
  const mergedProps = useMemo(() => {
    return _objectSpread2(_objectSpread2({}, rigidBodyContext === null || rigidBodyContext === void 0 ? void 0 : rigidBodyContext.options), props);
  }, [props, rigidBodyContext === null || rigidBodyContext === void 0 ? void 0 : rigidBodyContext.options]);
  useUpdateColliderOptions(collidersRef, mergedProps, colliderStates);
  useColliderEvents(collidersRef, mergedProps, colliderEvents);
  return /*#__PURE__*/React.createElement("object3D", {
    position: position,
    rotation: rotation,
    quaternion: quaternion,
    scale: scale,
    ref: ref,
    name: name
  }, children);
}));
const CuboidCollider = /*#__PURE__*/React.forwardRef((props, ref) => {
  return /*#__PURE__*/React.createElement(AnyCollider, _extends({}, props, {
    shape: "cuboid",
    ref: ref
  }));
});
const RoundCuboidCollider = /*#__PURE__*/React.forwardRef((props, ref) => {
  return /*#__PURE__*/React.createElement(AnyCollider, _extends({}, props, {
    shape: "roundCuboid",
    ref: ref
  }));
});
const BallCollider = /*#__PURE__*/React.forwardRef((props, ref) => {
  return /*#__PURE__*/React.createElement(AnyCollider, _extends({}, props, {
    shape: "ball",
    ref: ref
  }));
});
const CapsuleCollider = /*#__PURE__*/React.forwardRef((props, ref) => {
  return /*#__PURE__*/React.createElement(AnyCollider, _extends({}, props, {
    shape: "capsule",
    ref: ref
  }));
});
const HeightfieldCollider = /*#__PURE__*/React.forwardRef((props, ref) => {
  return /*#__PURE__*/React.createElement(AnyCollider, _extends({}, props, {
    shape: "heightfield",
    ref: ref
  }));
});
const TrimeshCollider = /*#__PURE__*/React.forwardRef((props, ref) => {
  return /*#__PURE__*/React.createElement(AnyCollider, _extends({}, props, {
    shape: "trimesh",
    ref: ref
  }));
});
const ConeCollider = /*#__PURE__*/React.forwardRef((props, ref) => {
  return /*#__PURE__*/React.createElement(AnyCollider, _extends({}, props, {
    shape: "cone",
    ref: ref
  }));
});
const CylinderCollider = /*#__PURE__*/React.forwardRef((props, ref) => {
  return /*#__PURE__*/React.createElement(AnyCollider, _extends({}, props, {
    shape: "cylinder",
    ref: ref
  }));
});
const ConvexHullCollider = /*#__PURE__*/React.forwardRef((props, ref) => {
  return /*#__PURE__*/React.createElement(AnyCollider, _extends({}, props, {
    shape: "convexHull",
    ref: ref
  }));
});
CuboidCollider.displayName = "CuboidCollider";
RoundCuboidCollider.displayName = "RoundCuboidCollider";
BallCollider.displayName = "BallCollider";
CapsuleCollider.displayName = "CapsuleCollider";
HeightfieldCollider.displayName = "HeightfieldCollider";
TrimeshCollider.displayName = "TrimeshCollider";
ConeCollider.displayName = "ConeCollider";
CylinderCollider.displayName = "CylinderCollider";
ConvexHullCollider.displayName = "ConvexHullCollider";

const _excluded$1 = ["children", "type", "position", "rotation", "scale", "quaternion"];
const RigidBodyContext = /*#__PURE__*/createContext(undefined);
const useRigidBodyContext = () => useContext(RigidBodyContext);
const RigidBody = /*#__PURE__*/memo( /*#__PURE__*/forwardRef((props, ref) => {
  const {
    children,
    type,
    position,
    rotation,
    scale,
    quaternion
  } = props,
        objectProps = _objectWithoutProperties(props, _excluded$1);

  const [object, api, childColliderProps] = useRigidBody(props);
  useImperativeHandle(ref, () => api);
  const contextValue = useMemo(() => ({
    ref: object,
    api,
    options: props
  }), [object, api, props]);
  return /*#__PURE__*/React.createElement(RigidBodyContext.Provider, {
    value: contextValue
  }, /*#__PURE__*/React.createElement("object3D", _extends({
    ref: object
  }, objectProps, {
    position: position,
    rotation: rotation,
    quaternion: quaternion,
    scale: scale
  }), children, childColliderProps.map((colliderProps, index) => /*#__PURE__*/React.createElement(AnyCollider, _extends({
    key: index
  }, colliderProps)))));
}));
RigidBody.displayName = "RigidBody";

const MeshCollider = props => {
  const {
    children,
    type
  } = props;
  const {
    physicsOptions,
    world
  } = useRapier();
  const object = useRef(null);
  const {
    options
  } = useRigidBodyContext();
  const mergedOptions = useMemo(() => {
    return _objectSpread2(_objectSpread2(_objectSpread2({}, physicsOptions), options), {}, {
      children: undefined,
      colliders: type
    });
  }, [physicsOptions, options]);
  const childColliderProps = useChildColliderProps(object, mergedOptions, false);
  return /*#__PURE__*/React.createElement("object3D", {
    ref: object,
    userData: {
      r3RapierType: "MeshCollider"
    }
  }, children, childColliderProps.map((colliderProps, index) => /*#__PURE__*/React.createElement(AnyCollider, _extends({
    key: index
  }, colliderProps))));
};
MeshCollider.displayName = "MeshCollider";

function mapsEqual(map1, map2) {
  var testVal;

  if (map1.size !== map2.size) {
    return false;
  }

  for (var [key, val] of map1) {
    testVal = map2.get(key);

    if (testVal !== val || testVal === undefined && !map2.has(key)) {
      return false;
    }
  }

  return true;
}

const AttractorHelper = props => {
  const {
    scene
  } = useThree();
  const ref = useRef(null);
  const normalsHelper = useRef();
  const color = props.strength > 0 ? 0x0000ff : 0xff0000;
  useEffect(() => {
    if (ref.current) {
      normalsHelper.current = new VertexNormalsHelper(ref.current, props.range, color);
      normalsHelper.current.frustumCulled = false;
      scene.add(normalsHelper.current);
    }

    return () => {
      if (normalsHelper.current) {
        scene.remove(normalsHelper.current);
      }
    };
  }, [props]);
  useFrame(() => {
    if (ref.current) {
      var _normalsHelper$curren;

      const worldPosition = props.object.getWorldPosition(_vector3);
      ref.current.position.copy(worldPosition);
      (_normalsHelper$curren = normalsHelper.current) === null || _normalsHelper$curren === void 0 ? void 0 : _normalsHelper$curren.update();
    }
  });
  return /*#__PURE__*/React.createElement("mesh", {
    ref: ref,
    position: props.object.position,
    frustumCulled: false
  }, /*#__PURE__*/React.createElement("sphereGeometry", {
    args: [0.2, 6, 6]
  }), /*#__PURE__*/React.createElement("meshBasicMaterial", {
    color: color,
    wireframe: true
  }));
};

const Debug = () => {
  const {
    world,
    attractorStates
  } = useRapier();
  const ref = useRef(null);
  const [attractors, setAttractors] = useState([]);
  const currMap = useRef(new Map());
  useFrame(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const buffers = world.debugRender();
    mesh.geometry.setAttribute("position", new BufferAttribute(buffers.vertices, 3));
    mesh.geometry.setAttribute("color", new BufferAttribute(buffers.colors, 4)); // Update attractors

    if (!mapsEqual(currMap.current, attractorStates)) {
      setAttractors([...attractorStates.values()]);
      currMap.current = new Map(attractorStates);
    }
  });
  return /*#__PURE__*/React.createElement("group", null, /*#__PURE__*/React.createElement("lineSegments", {
    ref: ref,
    frustumCulled: false
  }, /*#__PURE__*/React.createElement("lineBasicMaterial", {
    color: 0xffffff,
    vertexColors: true
  }), /*#__PURE__*/React.createElement("bufferGeometry", null)), attractors.map((attractor, i) => /*#__PURE__*/React.createElement(AttractorHelper, _extends({
    key: attractor.object.uuid
  }, attractor))));
};

const _excluded = ["positions", "rotations", "children"];
const InstancedRigidBodies = /*#__PURE__*/forwardRef((props, ref) => {
  const {
    world,
    rigidBodyStates,
    physicsOptions,
    rigidBodyEvents
  } = useRapier();
  const object = useRef(null);

  const {
    positions,
    rotations,
    children
  } = props,
        options = _objectWithoutProperties(props, _excluded);

  const instancesRef = useRef([]);
  const rigidBodyRefs = useRef([]);
  const instancesRefGetter = useRef(() => {
    if (!instancesRef.current) {
      instancesRef.current = [];
    }

    return instancesRef.current;
  });
  const mergedOptions = useMemo(() => {
    return _objectSpread2(_objectSpread2({}, physicsOptions), options);
  }, [physicsOptions, options]);
  const childColliderProps = useChildColliderProps(object, mergedOptions);
  useLayoutEffect(() => {
    object.current.updateWorldMatrix(true, false);
    const instances = instancesRefGetter.current();
    const invertedWorld = object.current.matrixWorld.clone().invert();
    object.current.traverseVisible(mesh => {
      if (mesh instanceof InstancedMesh) {
        mesh.instanceMatrix.setUsage(DynamicDrawUsage);
        const worldScale = mesh.getWorldScale(_scale);

        for (let index = 0; index < mesh.count; index++) {
          var _options$scales;

          const desc = rigidBodyDescFromOptions(props);
          const rigidBody = world.createRigidBody(desc);
          rigidBodyRefs.current.push(rigidBody);
          const scale = ((_options$scales = options.scales) === null || _options$scales === void 0 ? void 0 : _options$scales[index]) || [1, 1, 1];
          const instanceScale = worldScale.clone().multiply(vectorArrayToVector3(scale));
          rigidBodyStates.set(rigidBody.handle, createRigidBodyState({
            rigidBody,
            object: mesh,
            setMatrix: matrix => mesh.setMatrixAt(index, matrix),
            getMatrix: matrix => {
              mesh.getMatrixAt(index, matrix);
              return matrix;
            },
            worldScale: instanceScale
          }));
          const [x, y, z] = (positions === null || positions === void 0 ? void 0 : positions[index]) || [0, 0, 0];
          const [rx, ry, rz] = (rotations === null || rotations === void 0 ? void 0 : rotations[index]) || [0, 0, 0];

          _object3d.position.set(x, y, z);

          _object3d.rotation.set(rx, ry, rz);

          _object3d.applyMatrix4(invertedWorld);

          mesh.setMatrixAt(index, _object3d.matrix);
          rigidBody.setTranslation(_object3d.position, false);
          rigidBody.setRotation(_object3d.quaternion, false);
          const api = createRigidBodyApi({
            current() {
              return rigidBody;
            }

          });
          instances.push({
            rigidBody,
            api
          });
        }
      }
    });
    return () => {
      instances.forEach(rb => {
        world.removeRigidBody(rb.rigidBody);
        rigidBodyStates.delete(rb.rigidBody.handle);
      });
      rigidBodyRefs.current = [];
      instancesRef.current = [];
    };
  }, []);
  const api = useMemo(() => createInstancedRigidBodiesApi(instancesRefGetter), []);
  useImperativeHandle(ref, () => api);
  useUpdateRigidBodyOptions(rigidBodyRefs, mergedOptions, rigidBodyStates, false);
  useRigidBodyEvents(rigidBodyRefs, mergedOptions, rigidBodyEvents);
  const contextValue = useMemo(() => {
    return {
      ref: object,
      api,
      options: mergedOptions
    };
  }, [api, mergedOptions]);
  return /*#__PURE__*/React.createElement(RigidBodyContext.Provider, {
    value: contextValue
  }, /*#__PURE__*/React.createElement("object3D", {
    ref: object
  }, props.children, childColliderProps.map((colliderProps, index) => /*#__PURE__*/React.createElement(AnyCollider, _extends({
    key: index
  }, colliderProps)))));
});
InstancedRigidBodies.displayName = "InstancedRigidBodies";

/**
 * Calculates an InteractionGroup bitmask for use in the `collisionGroups` or `solverGroups`
 * properties of RigidBody or Collider components. The first argument represents a list of
 * groups the entity is in (expressed as numbers from 0 to 15). The second argument is a list
 * of groups that will be filtered against. When it is omitted, all groups are filtered against.
 *
 * @example
 * A RigidBody that is member of group 0 and will collide with everything from groups 0 and 1:
 *
 * ```tsx
 * <RigidBody collisionGroups={interactionGroups([0], [0, 1])} />
 * ```
 *
 * A RigidBody that is member of groups 0 and 1 and will collide with everything else:
 *
 * ```tsx
 * <RigidBody collisionGroups={interactionGroups([0, 1])} />
 * ```
 *
 * A RigidBody that is member of groups 0 and 1 and will not collide with anything:
 *
 * ```tsx
 * <RigidBody collisionGroups={interactionGroups([0, 1], [])} />
 * ```
 *
 * Please note that Rapier needs interaction filters to evaluate to true between _both_ colliding
 * entities for collision events to trigger.
 *
 * @param memberships Groups the collider is a member of. (Values can range from 0 to 15.)
 * @param filters Groups the interaction group should filter against. (Values can range from 0 to 15.)
 * @returns An InteractionGroup bitmask.
 */
const interactionGroups = (memberships, filters) => (bitmask(memberships) << 16) + (filters !== undefined ? bitmask(filters) : 0b1111111111111111);

const bitmask = groups => [groups].flat().reduce((acc, layer) => acc | 1 << layer, 0);

export { AnyCollider, Attractor, BallCollider, CapsuleCollider, ConeCollider, ConvexHullCollider, CuboidCollider, CylinderCollider, Debug, HeightfieldCollider, InstancedRigidBodies, MeshCollider, Physics, RigidBody, RoundCuboidCollider, TrimeshCollider, interactionGroups, useChildColliderProps, useFixedJoint, useImpulseJoint, usePrismaticJoint, useRapier, useRevoluteJoint, useRigidBody, useSphericalJoint };

import {
  ColliderDesc,
  SoftBody as RawSoftBody,
  SoftBodyDesc,
  SoftBodyMaterial,
  SoftBodyTearEvent,
  Vector,
  World
} from "@dimforge/rapier3d-compat";
import {
  BufferAttribute,
  BufferGeometry,
  Matrix4,
  Object3D,
  Vector3
} from "three";
import { applyWeldMap, weld } from "./geometry";
import type {
  SoftBodyOptions,
  SoftBodyParticleSelector,
  SoftBodyTearPayload
} from "./types";

const _matrix = new Matrix4();
const _inverse = new Matrix4();
const _vector = new Vector3();

type Renderable = Object3D & { geometry: BufferGeometry };

const hasGeometry = (object: Object3D): object is Renderable =>
  !!(object as Renderable).geometry?.isBufferGeometry;

/**
 * A live soft body: the Rapier soft body (or bodies, once it tore), and the
 * object whose geometry it drives. Created by {@link useSoftBody} and
 * {@link SoftBody}, exposed through their `ref`.
 *
 * @category Soft Bodies
 */
export class SoftBodyState {
  /** The object whose geometry is driven by the simulation. */
  readonly object: Renderable;
  /** The kind of soft body. */
  readonly type: NonNullable<SoftBodyOptions["type"]>;
  /** The Rapier soft body that was created from the geometry. */
  readonly body: RawSoftBody;
  /**
   * `body` and every piece it tore into. Pieces are removed with the state.
   */
  readonly bodies: RawSoftBody[];
  /** Number of vertices of the rendered geometry. */
  vertexCount: number;

  private readonly world: World;
  private disposed = false;
  private synced = false;

  // For cloth and rope every vertex is a particle; after a tear its particle
  // may live in a different (piece) soft body.
  private owners: RawSoftBody[] = [];
  private ownerParticles: Uint32Array = new Uint32Array(0);
  private torn = false;
  private warnedVolume = false;
  // Render vertex -> particle, while the render geometry is the original one
  // (UVs and hard normals intact). Null once a cloth tore, see handleTear.
  private weldMap: Uint32Array | null = null;
  private weldedCount = 0;
  private knownVersions = new Map<RawSoftBody, number>();
  // Particle buffers of the last two steps, for interpolation
  private prev: Float32Array | null = null;
  private curr: Float32Array | null = null;
  private readonly onTear?: SoftBodyOptions["onTear"];

  constructor(
    world: World,
    object: Renderable,
    options: SoftBodyOptions,
    resolveBody: (
      body: unknown
    ) => import("@dimforge/rapier3d-compat").RigidBody | null | undefined
  ) {
    const type = options.type ?? "cloth";
    this.world = world;
    this.object = object;
    this.type = type;
    this.onTear = options.onTear;

    // The object's current transform is baked into the particles: positions
    // handed to rapier are world space.
    object.updateWorldMatrix(true, false);
    const toWorld = object.matrixWorld.clone();
    const toLocal = toWorld.clone().invert();

    // The simulation runs on a position-welded copy of the geometry, while
    // the rendered geometry is the original one, skinned through the weld map:
    // UVs and hard edges survive.
    let localPositions: Float32Array;
    let weldIndex: Uint32Array | null = null;
    let renderGeometry: BufferGeometry;
    if (type === "rope") {
      renderGeometry = ropeGeometry(object.geometry);
      localPositions = new Float32Array(
        renderGeometry.attributes.position.array
      );
    } else {
      const welded = weld(object.geometry);
      localPositions = welded.positions;
      weldIndex = welded.index;
      this.weldMap = welded.map;
      renderGeometry = renderCopy(object.geometry);
    }
    const count = localPositions.length / 3;
    this.weldedCount = count;

    const worldPositions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      _vector.fromArray(localPositions, i * 3).applyMatrix4(toWorld);
      worldPositions[i * 3] = _vector.x;
      worldPositions[i * 3 + 1] = _vector.y;
      worldPositions[i * 3 + 2] = _vector.z;
    }

    let desc: SoftBodyDesc | null;
    if (type === "volume") {
      const cellSize = options.cellSize ?? defaultCellSize(worldPositions);
      desc = SoftBodyDesc.volumetric(
        worldPositions,
        weldIndex!,
        cellSize,
        true
      );
    } else if (type === "rope") {
      const edges: number[] = [];
      for (let i = 0; i < count - 1; i++) edges.push(i, i + 1);
      desc = new SoftBodyDesc(worldPositions).setEdges(edges).setWire(edges);
    } else {
      desc = SoftBodyDesc.trimesh(worldPositions, weldIndex!);
    }

    if (!desc) {
      throw new Error(
        `react-three-rapier: could not build a "${type}" soft body from this geometry` +
          (type === "volume" ? " (volume bodies need a closed surface)." : ".")
      );
    }

    // Particles' rest positions in the mesh's local space, for selectors
    const particleRest = desc.particlePositions();
    const resolve = (selector: SoftBodyParticleSelector | undefined) =>
      resolveSelector(selector, particleRest, toLocal);

    if (options.material) {
      desc.setMaterial(
        typeof options.material === "function"
          ? options.material()
          : options.material
      );
    } else if (
      options.stiffness !== undefined ||
      options.damping !== undefined
    ) {
      const material = SoftBodyMaterial.uniform(
        options.stiffness ?? 10,
        options.damping ?? 0.5
      );
      desc.setMaterial(material);
    }
    if (options.mass !== undefined) desc.setMass(options.mass);
    if (options.cellModel !== undefined) desc.setCellModel(options.cellModel);
    if (options.solver !== undefined) desc.setSolver(options.solver);
    if (options.volumePreservation !== undefined)
      desc.setVolumePreservation(options.volumePreservation);
    if (options.selfContacts !== undefined)
      desc.setSelfContacts(options.selfContacts);
    if (options.particleRadius !== undefined)
      desc.setParticleRadius(options.particleRadius);
    if (options.gravityScale !== undefined)
      desc.setGravityScale(options.gravityScale);
    if (options.linearDamping !== undefined)
      desc.setLinearDamping(options.linearDamping);
    if (options.additionalSolverIterations !== undefined)
      desc.setAdditionalSolverIterations(options.additionalSolverIterations);
    if (options.canSleep !== undefined) desc.setCanSleep(options.canSleep);

    if (options.collisions === false) {
      desc.setNoSurfaceCollider();
    } else if (
      options.friction !== undefined ||
      options.restitution !== undefined ||
      options.collisionGroups !== undefined ||
      options.solverGroups !== undefined
    ) {
      // Only the settings of the template are used, its shape is replaced.
      const template = ColliderDesc.ball(0.01);
      if (options.friction !== undefined)
        template.setFriction(options.friction);
      if (options.restitution !== undefined)
        template.setRestitution(options.restitution);
      if (options.collisionGroups !== undefined)
        template.setCollisionGroups(options.collisionGroups);
      if (options.solverGroups !== undefined)
        template.setSolverGroups(options.solverGroups);
      desc.setSurfaceCollider(template);
    }

    const pinned = resolve(options.pinned);
    if (pinned.length) desc.setPinnedParticles(pinned);

    if (options.configure) {
      desc = options.configure(desc) ?? desc;
    }

    const body = world.createSoftBody(desc);
    this.body = body;
    this.bodies = [body];
    this.vertexCount = renderGeometry.attributes.position.count;
    this.knownVersions.set(body, body.topologyVersion());

    if (type === "rope") this.resetOwners(body, count);

    // Attachments to rigid bodies
    for (const attachment of options.attachments ?? []) {
      const rigidBody = resolveBody(attachment.body);
      if (!rigidBody) {
        console.warn(
          "react-three-rapier: SoftBody attachment skipped, its rigid body is not available yet. Declare the <RigidBody> before the <SoftBody>."
        );
        continue;
      }
      for (const particle of resolve(attachment.particles)) {
        body.attachParticle(particle, rigidBody);
      }
    }

    // Swap the render geometry in and bake the pose into it: from now on the
    // geometry holds parent-space positions, so the object's own transform is
    // the identity.
    const previous = object.geometry;
    object.geometry = renderGeometry;
    previous.dispose();
    object.position.set(0, 0, 0);
    object.quaternion.set(0, 0, 0, 1);
    object.scale.set(1, 1, 1);
    object.updateMatrix();
    object.updateMatrixWorld(true);
    this.sync();
  }

  /**
   * Writes the simulated positions into the object's geometry, in the space
   * of the object's parent, then updates normals and bounds. Called after
   * every physics step; you rarely need to call it yourself.
   */
  sync(alpha = 1) {
    if (this.disposed) return;
    // A tear changes the particle layout; wait until handleTear has remapped.
    for (const body of this.bodies) {
      if (this.knownVersions.get(body) !== body.topologyVersion()) return;
    }
    if (this.synced && !this.torn && alpha >= 1 && this.body.isSleeping())
      return;

    const { object } = this;
    const geometry = object.geometry;
    const position = geometry.attributes.position as BufferAttribute;
    const array = position.array as Float32Array;

    // Particles are in world space, geometry is in the parent's space
    // (the object's own transform is the identity).
    const parent = object.parent;
    if (parent) {
      parent.updateWorldMatrix(true, false);
      _inverse.copy(parent.matrixWorld).invert();
    } else {
      _inverse.identity();
    }
    const identity = _inverse.equals(_matrix.identity());

    if (this.torn) {
      const cache = new Map<RawSoftBody, Float32Array>();
      this.write(array, null, null, 1, cache, identity);
    } else {
      const source =
        this.type === "volume"
          ? this.body.meshVertices(0)
          : this.body.particlePositions();
      if (alpha >= 1) {
        this.prev = this.curr;
        this.curr = source;
      }
      const prev = this.prev?.length === source.length ? this.prev : null;
      this.write(array, source, prev, alpha, null, identity);
    }

    position.needsUpdate = true;
    if (this.type !== "rope") geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    geometry.computeBoundingBox();
    this.synced = true;
  }

  private resetOwners(body: RawSoftBody, count: number) {
    this.owners = new Array(count).fill(body);
    this.ownerParticles = new Uint32Array(count).map((_, i) => i);
  }

  private write(
    target: Float32Array,
    source: Float32Array | null,
    prev: Float32Array | null,
    alpha: number,
    cache: Map<RawSoftBody, Float32Array> | null,
    identity: boolean
  ) {
    const weldMap = this.weldMap;
    for (let i = 0; i < this.vertexCount; i++) {
      let x: number, y: number, z: number;
      if (source) {
        const p = weldMap ? weldMap[i] : i;
        x = source[p * 3];
        y = source[p * 3 + 1];
        z = source[p * 3 + 2];
        if (prev && alpha < 1) {
          x = prev[p * 3] + (x - prev[p * 3]) * alpha;
          y = prev[p * 3 + 1] + (y - prev[p * 3 + 1]) * alpha;
          z = prev[p * 3 + 2] + (z - prev[p * 3 + 2]) * alpha;
        }
      } else {
        const owner = this.owners[i];
        let positions = cache!.get(owner);
        if (!positions) {
          positions = owner.particlePositions();
          cache!.set(owner, positions);
        }
        const p = this.ownerParticles[i];
        x = positions[p * 3];
        y = positions[p * 3 + 1];
        z = positions[p * 3 + 2];
      }
      // Never write garbage: keep the last good position
      if (!(Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z))) {
        continue;
      }

      if (identity) {
        target[i * 3] = x;
        target[i * 3 + 1] = y;
        target[i * 3 + 2] = z;
      } else {
        _vector.set(x, y, z).applyMatrix4(_inverse);
        target[i * 3] = _vector.x;
        target[i * 3 + 1] = _vector.y;
        target[i * 3 + 2] = _vector.z;
      }
    }
  }

  /**
   * Cuts the soft body along a blade (a triangle of three world-space points).
   * Pieces that disconnect become soft bodies of their own, and `onTear` is
   * called. Returns false if nothing was cut.
   */
  cut(blade: Vector[]): boolean {
    if (this.disposed) return false;
    let cut = false;
    for (const body of [...this.bodies]) {
      const event = this.world.cutSoftBody(body, blade);
      if (event) {
        this.handleTear(event);
        event.free();
        cut = true;
      }
    }
    return cut;
  }

  /**
   * Tears the given edges and cells (indices into `body.edges()` and
   * `body.cells()` of the main body) at once. Pieces that disconnect become
   * soft bodies of their own, and `onTear` is called.
   */
  tear(edges: number[], cells: number[] = []): boolean {
    if (this.disposed) return false;
    const event = this.world.tearSoftBody(this.body, edges, cells);
    if (!event) return false;
    this.handleTear(event);
    event.free();
    return true;
  }

  /**
   * @internal Handles a tear event drained after a world step.
   */
  handleTear(event: SoftBodyTearEvent) {
    if (this.disposed) return;
    const handle = event.softBody();
    const torn = this.bodies.find((b) => b.handle === handle);
    if (!torn) return;

    const pieces: RawSoftBody[] = [];
    for (let i = 0; i < event.numPieces(); i++) {
      const piece = this.world.softBodies.get(event.pieceSoftBody(i));
      if (piece) {
        pieces.push(piece);
        if (!this.bodies.includes(piece)) this.bodies.push(piece);
      }
    }

    if (this.type === "volume" && !this.warnedVolume) {
      this.warnedVolume = true;
      console.warn(
        "react-three-rapier: a volume SoftBody tore. The rendered skin only follows the main piece; pieces that split off are simulated but not rendered."
      );
    }

    if (this.type !== "volume") {
      this.torn = true;

      // Once a cloth tears, vertices are split per particle so each side of
      // the tear can follow its own piece. This drops the original seams
      // (UV/hard-edge duplicates) of the render geometry.
      if (this.weldMap) {
        const previous = this.object.geometry;
        this.object.geometry = applyWeldMap(
          previous,
          this.weldMap,
          this.weldedCount
        );
        previous.dispose();
        this.weldMap = null;
        this.vertexCount = this.weldedCount;
        this.resetOwners(this.body, this.weldedCount);
      }

      // Particles the engine split off to open the tear need a rendered
      // vertex of their own (cloth), or they would stay welded.
      if (this.type === "cloth") {
        const split = event.splitParticles();
        const byParticle = new Map<number, number>();
        for (let v = 0; v < this.vertexCount; v++) {
          if (this.owners[v].handle === handle) {
            byParticle.set(this.ownerParticles[v], v);
          }
        }
        const sources: number[] = [];
        const created: number[] = [];
        for (let i = 0; i + 1 < split.length; i += 2) {
          const source = byParticle.get(split[i + 1]);
          if (source === undefined) continue;
          created.push(split[i]);
          sources.push(source);
        }
        this.appendVertices(sources, torn, created);
      }

      for (let v = 0; v < this.vertexCount; v++) {
        if (this.owners[v].handle !== handle) continue;
        const destination = event.particleDestination(this.ownerParticles[v]);
        if (!destination) continue;
        const owner = this.world.softBodies.get(destination.softBody);
        if (!owner) continue;
        this.owners[v] = owner;
        this.ownerParticles[v] = destination.particle;
      }
      if (this.type === "cloth") this.rebuildClothIndex();
    }

    for (const body of this.bodies) {
      this.knownVersions.set(body, body.topologyVersion());
    }
    this.prev = this.curr = null;
    this.synced = false;
    // Show the new layout right away (sync was skipped while it was stale)
    this.sync();
    this.onTear?.({
      softBody: torn,
      pieces,
      tornEdges: Array.from(event.tornEdges()),
      tornCells: Array.from(event.tornCells())
    } as SoftBodyTearPayload);
  }

  /** Duplicates the given rendered vertices, owned by new particles. */
  private appendVertices(
    sources: number[],
    owner: RawSoftBody,
    particles: number[]
  ) {
    if (!sources.length) return;
    const geometry = this.object.geometry;
    const total = this.vertexCount + sources.length;
    for (const name of Object.keys(geometry.attributes)) {
      const attribute = geometry.attributes[name] as BufferAttribute;
      const { itemSize } = attribute;
      const array = new (attribute.array.constructor as new (
        length: number
      ) => typeof attribute.array)(total * itemSize);
      array.set(attribute.array);
      sources.forEach((source, i) => {
        for (let k = 0; k < itemSize; k++) {
          array[(this.vertexCount + i) * itemSize + k] =
            attribute.array[source * itemSize + k];
        }
      });
      const grown = new BufferAttribute(array, itemSize, attribute.normalized);
      grown.setUsage(attribute.usage);
      geometry.setAttribute(name, grown);
    }
    const owners = this.owners.slice();
    const ownerParticles = new Uint32Array(total);
    ownerParticles.set(this.ownerParticles);
    sources.forEach((_, i) => {
      owners.push(owner);
      ownerParticles[this.vertexCount + i] = particles[i];
    });
    this.owners = owners;
    this.ownerParticles = ownerParticles;
    this.vertexCount = total;
  }

  /**
   * Rebuilds the triangles of a torn cloth from the surfaces of its soft
   * bodies, so triangles do not span a tear.
   */
  private rebuildClothIndex() {
    const lookup = new Map<RawSoftBody, Map<number, number>>();
    for (let v = 0; v < this.vertexCount; v++) {
      let particles = lookup.get(this.owners[v]);
      if (!particles) lookup.set(this.owners[v], (particles = new Map()));
      particles.set(this.ownerParticles[v], v);
    }
    const indices: number[] = [];
    for (const body of this.bodies) {
      const particles = lookup.get(body);
      if (!particles) continue;
      const boundary = body.boundary();
      for (let i = 0; i + 2 < boundary.length; i += 3) {
        const a = particles.get(boundary[i]);
        const b = particles.get(boundary[i + 1]);
        const c = particles.get(boundary[i + 2]);
        if (a !== undefined && b !== undefined && c !== undefined) {
          indices.push(a, b, c);
        }
      }
    }
    this.object.geometry.setIndex(indices);
  }

  /**
   * Removes the soft body (and any pieces) from the world and releases the
   * geometry it created. Safe to call more than once.
   */
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    for (const body of this.bodies) {
      try {
        if (body.isValid()) this.world.removeSoftBody(body);
      } catch {
        // The world may already be gone (the <Physics> tree unmounted first).
      }
    }
    this.bodies.length = 0;
    this.object.geometry.dispose();
  }
}

/** A copy of the render geometry with its own dynamic float positions. */
const renderCopy = (source: BufferGeometry) => {
  const geometry = source.clone();
  const position = source.attributes.position as BufferAttribute;
  const copy = new BufferAttribute(new Float32Array(position.count * 3), 3);
  for (let i = 0; i < position.count; i++) {
    copy.setXYZ(i, position.getX(i), position.getY(i), position.getZ(i));
  }
  copy.setUsage(35048 /* DynamicDrawUsage */);
  geometry.setAttribute("position", copy);
  return geometry;
};

/** A rope keeps its vertex order: no welding, and no index is needed. */
const ropeGeometry = (source: BufferGeometry) => {
  const position = source.attributes.position as BufferAttribute | undefined;
  if (!position) {
    throw new Error(
      "react-three-rapier: SoftBody geometry must have a position attribute."
    );
  }
  const geometry = new BufferGeometry();
  const copy = new BufferAttribute(new Float32Array(position.count * 3), 3);
  for (let i = 0; i < position.count; i++) {
    copy.setXYZ(i, position.getX(i), position.getY(i), position.getZ(i));
  }
  copy.setUsage(35048);
  geometry.setAttribute("position", copy);
  if (source.index) geometry.setIndex(source.index.clone());
  for (const name of Object.keys(source.attributes)) {
    if (name !== "position") {
      geometry.setAttribute(name, source.attributes[name].clone());
    }
  }
  return geometry;
};

const defaultCellSize = (worldPositions: Float32Array) => {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < worldPositions.length; i++) {
    const axis = i % 3;
    min[axis] = Math.min(min[axis], worldPositions[i]);
    max[axis] = Math.max(max[axis], worldPositions[i]);
  }
  const largest = Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2]);
  return Math.max(largest / 5, 1e-3);
};

const resolveSelector = (
  selector: SoftBodyParticleSelector | undefined,
  worldRest: Float32Array,
  toLocal: Matrix4
): number[] => {
  if (!selector) return [];
  if (Array.isArray(selector)) return selector;
  const result: number[] = [];
  const count = worldRest.length / 3;
  for (let i = 0; i < count; i++) {
    _vector
      .set(worldRest[i * 3], worldRest[i * 3 + 1], worldRest[i * 3 + 2])
      .applyMatrix4(toLocal);
    if (selector(_vector, i)) result.push(i);
  }
  return result;
};

export { hasGeometry };

# @atp/geometry

> High-performance, zero-dependency 3D spatial math, polygon mesh data structures, and streaming Wavefront OBJ reader/writer for Node.js, Electron, and modern web environments.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

---

## Table of Contents

- [Architectural Overview](#architectural-overview)
- [Installation](#installation)
- [Module Exports](#module-exports)
- [Core API Reference](#core-api-reference)
  - [Vector3](#vector3)
  - [Vector2](#vector2)
  - [Rotation3](#rotation3)
  - [WavefrontMesh](#wavefrontmesh)
  - [WavefrontWriter](#wavefrontwriter)
  - [WavefrontReader](#wavefrontreader)
  - [Mesh Facade (@atp/geometry/mesh)](#mesh-facade-atpgeometrymesh)
- [Wavefront OBJ Syntax Support](#wavefront-obj-syntax-support)
- [Recipes & Integration Examples](#recipes--integration-examples)
  - [1. Procedural Hair Ribbon Mesh Generation](#1-procedural-hair-ribbon-mesh-generation)
  - [2. Streaming File Export in Electron](#2-streaming-file-export-in-electron)
  - [3. Converting to Three.js BufferGeometry](#3-converting-to-threejs-buffergeometry)
- [Performance & Memory Optimization](#performance--memory-optimization)
- [Developer Workflow & Testing](#developer-workflow--testing)

---

## Architectural Overview

`@atp/geometry` is a vendor-neutral 3D geometry engine converted from the core geometric components of the ATC C++ framework. It is strictly decoupled from rigging engines (such as Poser) and designed from the ground up for high-performance desktop applications (Electron) and graphics pipelines:

- **Zero Runtime Dependencies**: Pure TypeScript compiling to modern ES2022 JavaScript. Uses only native Node.js streams (`node:fs`, `node:stream`) for disk operations.
- **Allocation Efficiency**: Mathematical primitives (`Vector3`, `Vector2`, `Rotation3`) provide both immutable return-new and mutable in-place operations (`addInPlace`, `multiplyScalarInPlace`) to avoid garbage collector pressure in tight generation loops.
- **True Streaming Serialization**: Unlike traditional libraries that buffer gigabyte-sized OBJ strings in memory, `WavefrontWriter` writes directly to a Node.js `WritableStream`, allowing massive multi-million polygon meshes to export with low memory usage.
- **Group-Relative Indexing**: First-class support for mapping vertices between global mesh index space and local group index space (`getGroupVertexIndex`, `getTrueVertexIndex`), which is critical for skeletal deformation, rigging actors, morph targets, and blendshapes.

---

## Installation

```bash
# npm
npm install @atp/geometry

# yarn
yarn add @atp/geometry
```

---

## Module Exports

`@atp/geometry` provides both a root entry point and dedicated subpath imports:

```typescript
// Root entry point
import { Vector3, Vector2, Rotation3, WavefrontMesh, WavefrontWriter, WavefrontReader } from '@atp/geometry';

// Subpath imports
import { Vector3, Vector2, Rotation3 } from '@atp/geometry/math';
import { WavefrontMesh, WavefrontWriter, WavefrontReader } from '@atp/geometry/wavefront';
import { Mesh, Vertex, TextureCoordinate } from '@atp/geometry/mesh';
```

---

## Core API Reference

### Vector3

Represents a 3D Cartesian coordinate or direction vector `(x, y, z)`.

```typescript
import { Vector3 } from '@atp/geometry';

const v = new Vector3(1.0, 2.0, 3.0);
```

#### Properties
- `x: number` — X coordinate (default `0`).
- `y: number` — Y coordinate (default `0`).
- `z: number` — Z coordinate (default `0`).

#### Methods
| Method | Return | Description |
| :--- | :--- | :--- |
| `set(x, y, z)` | `this` | Mutates vector coordinates in place. |
| `clone()` | `Vector3` | Returns an exact duplicate of this vector. |
| `copyFrom(other)` | `this` | Copies coordinates from `other` into this vector. |
| `add(other)` | `Vector3` | Returns a new vector: `this + other`. |
| `addInPlace(other)` | `this` | In-place addition without allocation. |
| `subtract(other)` | `Vector3` | Returns a new vector: `this - other`. |
| `subtractInPlace(other)` | `this` | In-place subtraction without allocation. |
| `multiplyScalar(scalar)` | `Vector3` | Multiplies coordinates by `scalar`. Alias: `scale(scalar)`. |
| `multiplyScalarInPlace(s)` | `this` | In-place scalar multiplication. |
| `divideScalar(scalar)` | `Vector3` | Divides coordinates by `scalar`. |
| `dot(other)` | `number` | Calculates dot product: `x1*x2 + y1*y2 + z1*z2`. |
| `cross(other)` | `Vector3` | Calculates vector cross product: `this × other`. |
| `length()` | `number` | Euclidean length: `√(x² + y² + z²)`. |
| `lengthSq()` | `number` | Squared length: `x² + y² + z²` (fast comparison). |
| `distanceTo(other)` | `number` | Euclidean distance between this point and `other`. |
| `distanceToSq(other)` | `number` | Squared distance between this point and `other`. |
| `normalize()` | `Vector3` | Returns a unit vector with length 1.0. |
| `normalizeInPlace()` | `this` | Normalizes this vector in place. |
| `equals(other, epsilon?)` | `boolean` | Approximate equality check with customizable tolerance (default `1e-6`). |
| `toArray()` | `[number, number, number]` | Exports coordinates as a 3-element tuple. |
| `Vector3.fromArray(arr)` | `Vector3` | Static factory creating a `Vector3` from an array or tuple. |

---

### Vector2

Represents a 2D coordinate `(u, v)` primarily used for UV texture coordinates.

```typescript
import { Vector2 } from '@atp/geometry';

const uv = new Vector2(0.5, 1.0);
```

#### Properties
- `u: number` (alias: `x`) — Horizontal coordinate.
- `v: number` (alias: `y`) — Vertical coordinate.

#### Methods
- `set(u: number, v: number): this` — Mutates coordinates in place.
- `clone(): Vector2` — Returns a copy.
- `copyFrom(other: Vector2): this` — Copies values from `other`.
- `add(other: Vector2): Vector2` — Returns `this + other`.
- `scale(factor: number): Vector2` — Scales coordinates by `factor`.
- `equals(other: Vector2, epsilon?: number): boolean` — Approximate equality check.
- `toArray(): [number, number]` — Exports `[u, v]`.

---

### Rotation3

Represents 3D Euler angles in degrees `(xrot, yrot, zrot)`.

```typescript
import { Rotation3 } from '@atp/geometry';

const rot = new Rotation3(45, 90, 0);
```

#### Properties
- `xrot: number` — Pitch / rotation around X axis (degrees).
- `yrot: number` — Yaw / rotation around Y axis (degrees).
- `zrot: number` — Roll / rotation around Z axis (degrees).

#### Methods
- `normalizeAngles(): this` — Normalizes all angles to `[-180, 180)` degrees.
- `add(other: Rotation3): Rotation3` — Combines Euler angle offsets.
- `toArray(): [number, number, number]` — Exports `[xrot, yrot, zrot]`.
- `Rotation3.fromArray(arr): Rotation3` — Factory from array.

---

### WavefrontMesh

In-memory polygon mesh data structure holding 3D geometric vertices, UV texture coordinates, surface normals, and multi-group polygon faces.

```typescript
import { WavefrontMesh } from '@atp/geometry';

const mesh = new WavefrontMesh();
```

#### Data Storage
- `vertices: Vector3[]` — List of 3D spatial points.
- `uvs: Vector2[]` — List of 2D texture coordinates.
- `normals: Vector3[]` — List of surface normal vectors.
- `faces: MeshFace[]` — List of polygon faces.

#### Face & Vertex Types
```typescript
export interface FaceVertex {
  vIndex: number;   // 0-based index into mesh.vertices
  tIndex?: number;  // Optional 0-based index into mesh.uvs
  nIndex?: number;  // Optional 0-based index into mesh.normals
}

export interface MeshFace {
  vertices: FaceVertex[]; // Polygon vertices (3 = triangle, 4 = quad, n = ngone)
  group: string;          // Named group (e.g. 'hairRoot', 'head', 'arm')
  material: string;       // Material name (e.g. 'HairMaterial', 'Skin')
}
```

#### Methods

##### Mesh Construction
- `addVertex(x: number, y: number, z: number): number`
- `addVertex(v: Vector3): number`
  - Adds a 3D vertex to `mesh.vertices`. Returns the assigned 0-based vertex index.
- `addUV(u: number, v: number): number`
- `addUV(uv: Vector2): number`
  - Adds a UV coordinate to `mesh.uvs`. Returns the assigned 0-based UV index.
- `addNormal(x: number, y: number, z: number): number`
- `addNormal(n: Vector3): number`
  - Adds a surface normal to `mesh.normals`. Returns the assigned 0-based normal index.
- `addFace(vertices: FaceVertex[], group?: string, material?: string): number`
  - Adds a polygon face to the mesh assigned to `group` (default `'default'`) and `material` (default `'default'`). Returns the assigned face index.

##### Group & Material Queries
- `getGroups(): string[]` — Returns all unique named groups (`g`) present in the mesh faces.
- `getMaterials(): string[]` — Returns all unique material names (`usemtl`) assigned to faces.
- `getFacesByGroup(groupName: string): MeshFace[]` — Filters faces belonging to a specific group.

##### Group-Relative Indexing
- `getGroupVertices(groupName: string): { globalIndex: number; vertex: Vector3 }[]`
  - Returns an ordered list of unique vertices referenced by the specified group, including both their global index in `mesh.vertices` and the `Vector3` instance.
- `getGroupVertexIndex(groupName: string, globalIndex: number): number`
  - Maps a global vertex index to its 0-based local index within `groupName`. Returns `-1` if the vertex is not in the group.
- `getTrueVertexIndex(groupName: string, localGroupIndex: number): number`
  - Maps a 0-based local group vertex index back to the global mesh vertex index. Returns `-1` if out of bounds.

##### Normal Generation
- `calculateNormals(mode: 'smooth' | 'faceted' = 'smooth'): void`
  - Automatically computes surface normals for all polygon faces:
    - `'smooth'`: Computes area-weighted polygon normals, accumulates them per vertex, normalizes the result, and sets `nIndex` on every face vertex.
    - `'faceted'`: Computes flat per-face cross products $(v_1 - v_0) \times (v_2 - v_0)$ and assigns one normal per face.

##### Cloning & Memory Reset
- `clone(): WavefrontMesh` — Deep clones all vertices, UVs, normals, and face structures.
- `clear(): void` — Resets all internal arrays.

---

### WavefrontWriter

Streaming Wavefront `.obj` file serializer.

```typescript
import { WavefrontWriter } from '@atp/geometry';
```

#### Formatting Options
```typescript
export interface WavefrontWriteOptions {
  headerComment?: string; // Header comment at line 1 (default: 'Exported Wavefront OBJ')
  precision?: number;     // Decimal places for floats (default: 6)
  mtllib?: string;        // Optional .mtl file reference (e.g. 'hair.mtl')
}
```

#### Static Methods

##### 1. `exportToFile(mesh, filePath, options?): Promise<void>`
Streams the OBJ content directly to disk using `node:fs.createWriteStream`. Automatically formats groups (`g <group>`), materials (`usemtl <material>`), and 1-based face indices (`f v/vt/vn`).

```typescript
await WavefrontWriter.exportToFile(mesh, 'C:/assets/model.obj', {
  headerComment: 'Generated by ATP',
  precision: 6,
  mtllib: 'materials.mtl'
});
```

##### 2. `exportToStream(mesh, stream, options?): Promise<void>`
Pipes serialized OBJ output to any `NodeJS.WritableStream` (e.g. HTTP response, zip stream, IPC pipe):

```typescript
await WavefrontWriter.exportToStream(mesh, myWritableStream);
```

##### 3. `writeToString(mesh, options?): string`
Generates an in-memory string representation (recommended for small meshes or unit tests).

```typescript
const objContent = WavefrontWriter.writeToString(mesh);
```

---

### WavefrontReader

Robust, high-speed tokenizer for loading arbitrary Wavefront OBJ files into a `WavefrontMesh`.

```typescript
import { WavefrontReader } from '@atp/geometry';
```

#### Static Methods

##### 1. `parseString(content: string): WavefrontMesh`
Parses raw OBJ text into a populated `WavefrontMesh`:

```typescript
const mesh = WavefrontReader.parseString(objText);
console.log(`Loaded ${mesh.vertices.length} vertices, ${mesh.faces.length} faces.`);
```

##### 2. `loadFromFile(filePath: string): Promise<WavefrontMesh>`
Asynchronously reads and parses an OBJ file from disk:

```typescript
const mesh = await WavefrontReader.loadFromFile('C:/models/character.obj');
```

#### Parsing Features
- Directives: `v` (vertices), `vt` (texture coordinates), `vn` (normals), `f` (faces), `g` (groups), `o` (objects), `usemtl` (materials), `mtllib` (material library), `#` (comments).
- Indexing styles:
  - `f 1 2 3` (vertex only)
  - `f 1/1 2/2 3/3` (vertex + texture)
  - `f 1//1 2//2 3//3` (vertex + normal)
  - `f 1/1/1 2/2/1 3/3/1` (vertex + texture + normal)
- Negative relative indexing: correctly resolves relative offsets like `f -3 -2 -1`.

---

### Mesh Facade (`@atp/geometry/mesh`)

For interoperability with existing ATC codebases, `@atp/geometry/mesh` exports aliased types:

```typescript
import { Mesh, Vertex, TextureCoordinate, type FaceVertex, type MeshFace } from '@atp/geometry/mesh';

const m: Mesh = new Mesh();
const v: Vertex = new Vertex(0, 1, 0);
```

---

## Wavefront OBJ Syntax Support

| Directive | Format | Description |
| :---: | :--- | :--- |
| `v` | `v x y z` | 3D geometric vertex coordinates |
| `vt` | `vt u v` | 2D texture coordinates |
| `vn` | `vn x y z` | 3D surface normal vector |
| `f` | `f v/vt/vn ...` | Polygon face indices (strictly 1-based upon export) |
| `g` | `g groupName` | Polygon group name (used to bind bones in rigging) |
| `usemtl` | `usemtl matName` | Material assignment for subsequent faces |
| `mtllib` | `mtllib file.mtl` | Material library declaration |
| `#` | `# comment` | Header comments and metadata |

---

## Recipes & Integration Examples

### 1. Procedural Hair Ribbon Mesh Generation

Generate a multi-segmented hair strand mesh divided into three rigging groups (`hairRoot`, `hairMid`, `hairTip`) for Poser or game rigging:

```typescript
import { WavefrontMesh, WavefrontWriter, Vector3 } from '@atp/geometry';

function generateHairRibbon(strandLength: number = 2.0, segments: number = 10, width: number = 0.04): WavefrontMesh {
  const mesh = new WavefrontMesh();
  const step = strandLength / segments;

  for (let i = 0; i <= segments; i++) {
    const y = 2.0 - i * step;
    const zCurve = Math.sin((i / segments) * Math.PI * 0.5) * 0.15; // Natural drape curve
    const currentWidth = width * (1.0 - (i / segments) * 0.7); // Taper toward tip

    // Left vertex
    mesh.addVertex(-currentWidth * 0.5, y, zCurve);
    mesh.addUV(0.0, i / segments);

    // Right vertex
    mesh.addVertex(currentWidth * 0.5, y, zCurve);
    mesh.addUV(1.0, i / segments);
  }

  // Create quad faces grouped by bone region
  for (let i = 0; i < segments; i++) {
    const v0 = i * 2;
    const v1 = i * 2 + 1;
    const v2 = (i + 1) * 2 + 1;
    const v3 = (i + 1) * 2;

    // Segment group assignment
    let group = 'hairRoot';
    if (i >= segments * 0.66) group = 'hairTip';
    else if (i >= segments * 0.33) group = 'hairMid';

    // Quad as two triangles
    mesh.addFace(
      [{ vIndex: v0, tIndex: v0 }, { vIndex: v1, tIndex: v1 }, { vIndex: v2, tIndex: v2 }],
      group,
      'HairStrandMat'
    );
    mesh.addFace(
      [{ vIndex: v0, tIndex: v0 }, { vIndex: v2, tIndex: v2 }, { vIndex: v3, tIndex: v3 }],
      group,
      'HairStrandMat'
    );
  }

  // Compute smooth surface normals
  mesh.calculateNormals('smooth');
  return mesh;
}
```

---

### 2. Streaming File Export in Electron

In an Electron application main process (`ipcMain` handler):

```typescript
import { ipcMain, dialog } from 'electron';
import { WavefrontMesh, WavefrontWriter } from '@atp/geometry';

ipcMain.handle('export-obj', async (event, meshData) => {
  const { filePath } = await dialog.showSaveDialog({
    filters: [{ name: 'Wavefront OBJ', extensions: ['obj'] }],
  });

  if (!filePath) return false;

  const mesh = new WavefrontMesh();
  // ... populate mesh ...

  // Stream directly to the chosen file path
  await WavefrontWriter.exportToFile(mesh, filePath, {
    headerComment: 'Exported from Hair Studio 3D',
    precision: 6,
  });

  return true;
});
```

---

### 3. Converting to Three.js BufferGeometry

Easily bridge `@atp/geometry` meshes into Three.js viewports:

```typescript
import * as THREE from 'three';
import { WavefrontMesh } from '@atp/geometry';

export function toThreeBufferGeometry(mesh: WavefrontMesh): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry();

  // Position buffer
  const posArray = new Float32Array(mesh.vertices.length * 3);
  mesh.vertices.forEach((v, idx) => {
    posArray[idx * 3] = v.x;
    posArray[idx * 3 + 1] = v.y;
    posArray[idx * 3 + 2] = v.z;
  });
  geom.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

  // UV buffer
  if (mesh.uvs.length > 0) {
    const uvArray = new Float32Array(mesh.uvs.length * 2);
    mesh.uvs.forEach((uv, idx) => {
      uvArray[idx * 2] = uv.u;
      uvArray[idx * 2 + 1] = uv.v;
    });
    geom.setAttribute('uv', new THREE.BufferAttribute(uvArray, 2));
  }

  // Index buffer from triangulated faces
  const indices: number[] = [];
  for (const face of mesh.faces) {
    for (let i = 1; i < face.vertices.length - 1; i++) {
      indices.push(face.vertices[0].vIndex, face.vertices[i].vIndex, face.vertices[i + 1].vIndex);
    }
  }
  geom.setIndex(indices);
  geom.computeVertexNormals();

  return geom;
}
```

---

## Performance & Memory Optimization

1. **Avoid In-Memory Buffering for Large Meshes**:
   Always prefer `WavefrontWriter.exportToFile()` or `WavefrontWriter.exportToStream()` over `WavefrontWriter.writeToString()` when exporting meshes with > 50,000 polygons.
2. **Batch Face Grouping**:
   `WavefrontWriter` automatically batches faces by `group` then by `material`. This ensures minimal state switching (`g` and `usemtl` commands) when the resulting OBJ is ingested by 3D software (Blender, Poser, Maya, Three.js).
3. **In-Place Math Operations**:
   In procedural loops where vectors are updated iteratively (such as spline evaluation or physics relaxation), use `addInPlace()` and `multiplyScalarInPlace()` to eliminate temporary object allocations.

---

## Developer Workflow & Testing

This package is managed inside the `@atp` monorepo.

```bash
# Run unit tests
yarn test

# Watch mode for unit tests
yarn test:watch

# Typecheck and build to dist/
yarn build
```

---

## License

MIT © Darkwynd / ATC Library Authors

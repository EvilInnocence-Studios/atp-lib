# @atp/poser

> High-performance Poser CR2/PP2/PZ3 AST parser, streaming serializer, character rigging model, and fluent figure assembly engine for Electron and Node.js.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

---

## Table of Contents

- [Architectural Overview](#architectural-overview)
- [Installation](#installation)
- [Module Exports](#module-exports)
- [Poser File Format Specifications](#poser-file-format-specifications)
- [Core API Reference](#core-api-reference)
  - [AST Core Engine (@atp/poser/core)](#ast-core-engine-atpposercore)
    - [PoserNode](#posernode)
    - [NodeList](#nodelist)
    - [PoserWriter](#poserwriter)
    - [PoserReader](#poserreader)
    - [PoserPathResolver](#poserpathresolver)
  - [Character & Rigging Model (@atp/poser/model)](#character--rigging-model-atpposermodel)
    - [RootNode](#rootnode)
    - [ActorNode](#actornode)
    - [FigureNode](#figurenode)
    - [ChannelsNode](#channelsnode)
    - [JointNode](#jointnode)
    - [TargetGeomNode](#targetgeomnode)
    - [GroupsNode](#groupsnode)
    - [WeightMapNode](#weightmapnode)
    - [WeightMap](#weightmap)
    - [MaterialNode](#materialnode)
    - [PropNode](#propnode)
  - [Builder & Pipeline Engine (@atp/poser/builder)](#builder--pipeline-engine-atpposerbuilder)
    - [Cr2Builder](#cr2builder)
    - [PoserAssetPipeline](#poserassetpipeline)
- [Step-by-Step Recipes & Examples](#step-by-step-recipes--examples)
  - [1. Building a Complete 3-Bone Conforming Hair Figure](#1-building-a-complete-3-bone-conforming-hair-figure)
  - [2. Adding Morph Targets with Sparse Deltas](#2-adding-morph-targets-with-sparse-deltas)
  - [3. Organizing Dials into Collapsible UI Folders](#3-organizing-dials-into-collapsible-ui-folders)
  - [4. Adding Weight Maps for Smooth Joint Bending](#4-adding-weight-maps-for-smooth-joint-bending)
  - [5. One-Call Paired OBJ + CR2 Export](#5-one-call-paired-obj--cr2-export)
- [Developer Workflow & Testing](#developer-workflow--testing)

---

## Architectural Overview

`@atp/poser` is an industrial-strength Poser character and rigging engine. It provides complete AST parsing, serialization, and model definitions for generating Poser `.cr2` (character rigging), `.pp2` (smart and stationary props), and `.pz3` (scene) files in modern TypeScript.

- **AST Parity**: Directly models Poser's proprietary brace-delimited block structure with recursive nodes (`PoserNode`), supporting property inspection, tree mutation, and path queries (`findPath`).
- **High-Speed Parsing**: Tokenizes and parses massive 3.3MB CR2 files in **less than 3ms**, allowing template figures and library characters to load instantly in Electron UI threads.
- **Poser Standard Formatting**: Strictly enforces Poser formatting requirements: exact tab indentation (`\t`), matching braces `{ ... }`, 6-decimal float precision, and CRLF (`\r\n`) line endings for 100% compatibility across Poser 4 through Poser 13+ and DAZ Studio.
- **Full Rigging Hierarchy**: Complete support for skeleton trees, parent-child links (`addChildNodes`), weld definitions (`weldNodes`), joint constraints, rotation/scale channels, morph target dials, dial UI folders (`groupNode`), and Poser 9+ vertex weight maps.
- **Unified Asset Pipeline**: Integrates seamlessly with `@atp/geometry` to cross-validate that mesh polygon groups (`g <group>`) match bone actor names (`actor <group>:1`) before streaming paired exports to disk.

---

## Installation

```bash
# npm
npm install @atp/poser @atp/geometry

# yarn
yarn add @atp/poser @atp/geometry
```

---

## Module Exports

```typescript
// Root entry point (all modules)
import { Cr2Builder, PoserAssetPipeline, PoserReader, PoserWriter, RootNode, ActorNode } from '@atp/poser';

// Subpath imports
import { PoserNode, NodeList, PoserWriter, PoserReader, PoserPathResolver } from '@atp/poser/core';
import { RootNode, ActorNode, FigureNode, ChannelsNode, GroupsNode, WeightMapNode, TargetGeomNode } from '@atp/poser/model';
import { Cr2Builder, PoserAssetPipeline } from '@atp/poser/builder';
```

---

## Poser File Format Specifications

Poser files (`.cr2`, `.pp2`, `.pz3`, `.hr2`) use a proprietary brace-delimited AST syntax:

```text
{
	version
	{
		number 4.01
	}
	actor hairRoot:1
	{
		storageOffset 0.000000 0.000000 0.000000
		geomCustom
		{
			objFileGeom 0 0 :Runtime:Geometries:Hair:hair.obj
		}
		channels
		{
			groups
			{
				groupNode Styles
				{
					collapsed 1
					parmNode WindBlow
				}
			}
			targetGeom WindBlow
			{
				d 12 0.015000 -0.005000 0.030000
			}
		}
		origin 0.000000 1.800000 0.000000
		endPoint 0.000000 1.900000 0.000000
		orientation 0.000000 0.000000 0.000000
	}
	figure
	{
		name HairFigure
		addChildNodes hairTip:1 hairRoot:1
		weldNodes hairTip:1 hairRoot:1
	}
}
```

### Strict Rules Enforced by `@atp/poser`:
1. **CRLF Line Endings**: Every line terminates with `\r\n`.
2. **Tab Indentation**: Indentation is strictly formed using tab characters (`\t`), exactly matching AST depth.
3. **Float Formatting**: Real numbers in channels and morph deltas format with 6 decimal places (`0.015000`).
4. **Actor Identifier Syntax**: Bones in figures follow `actor <boneName>:<fileNumber>` (e.g. `actor hairRoot:1`).
5. **Runtime Geometry Path Syntax**: Geometry paths follow the Poser colon-separated format: `:Runtime:Geometries:<Folder>:<File>.obj`.

---

## Core API Reference

### AST Core Engine (`@atp/poser/core`)

#### PoserNode

Base hierarchical class for every block and property in a Poser document.

```typescript
import { PoserNode } from '@atp/poser/core';

const node = new PoserNode(parentNode, 'actor head:1');
```

##### Properties
- `name: string` — The token or statement (e.g. `'actor head:1'` or `'storageOffset 0 0 0'`).
- `children: PoserNode[]` — Ordered array of child nodes.
- `parent: PoserNode | null` — Pointer to parent node.
- `hasChildrenBlock: boolean` — Whether to wrap children in `{ ... }` braces during serialization.
- `depth: number` — Depth level in the AST hierarchy.
- `root: PoserNode` — Traverses up the ancestor chain to return the document root.

##### Methods
| Method | Return | Description |
| :--- | :--- | :--- |
| `addChild(nameOrNode, ifNotExists?)` | `PoserNode` | Adds a child block (enables `hasChildrenBlock = true`). |
| `addProperty(propertyLine)` | `PoserNode` | Appends a single-line statement without a child block. |
| `findChild(name, recursive?)` | `PoserNode \| null` | Finds the first direct or recursive child starting with `name`. |
| `findChildren(name, recursive?)` | `PoserNode[]` | Finds all child nodes matching or starting with `name`. |
| `findPath(pathStr)` | `PoserNode \| null` | Navigates slash/colon-separated paths (e.g. `'figure/channels/rotateY'`). |
| `subNode(indexOrName)` | `PoserNode \| null` | Accesses a child by 0-based index or name. |
| `subNodes()` | `PoserNode[]` | Returns direct children (`this.children`). |
| `subNodeCount()` | `number` | Returns number of direct children. |
| `deleteSubNode(indexOrName)` | `PoserNode \| null` | Removes and detaches a child node by index or name. |
| `removeChild(child)` | `boolean` | Removes a specific node instance from children. |
| `clear()` | `void` | Resets node name and clears all children. |

---

#### NodeList

Fluent collection wrapper over sets of `PoserNode` instances (port of `ATC::Poser::NodeList`), providing chainable batch queries and mutations:

```typescript
import { NodeList } from '@atp/poser/core';

const list = new NodeList(root.findChildren('actor'));

// Query all channels across all actors
const channels = list.findAll('channels');

// Batch delete
list.deleteSubNode('storageOffset');
```

##### Key Methods
- `size: number` / `length: number` — Element count in collection.
- `toArray(): PoserNode[]` — Exports as array.
- `first(): PoserNode | null` — Returns the first node in collection.
- `find(name, recursive?): PoserNode | null` — Finds first matching child across all nodes.
- `findAll(name, recursive?): NodeList` — Finds all matching children across all nodes into a new `NodeList`.
- `findPath(pathStr): NodeList` — Navigates paths across all nodes.
- `clearSubNodes(): this` — Clears children for every node in the collection.
- `remove(): void` — Detaches all nodes from their respective parents.
- `deleteSubNode(indexOrName): this` — Deletes child matching index or name across all nodes.
- `parent(): NodeList` — Collects parent nodes.
- `root(): NodeList` — Collects root document nodes.

---

#### PoserWriter

Exact Poser syntax streaming serializer.

```typescript
import { PoserWriter } from '@atp/poser/core';
```

##### Methods
- `PoserWriter.writeToString(node: PoserNode): string`
  - Generates the complete serialized document string with exact tabs, braces, and CRLF endings.
- `PoserWriter.writeNodeToStream(node: PoserNode, stream: Writable, tabCount?: number): void`
  - Recursively writes AST nodes into any Node.js `Writable` stream.
- `PoserWriter.exportNodeStream(node: PoserNode, targetFilePath: string): Promise<void>`
  - High-throughput direct stream export to disk with 64KB buffering (optimal for large CR2 figures with morphs).
- `PoserWriter.exportToFile(node: PoserNode, filePath: string): Promise<void>`
  - Alias for `exportNodeStream`.


---

#### PoserReader

High-performance tokenizer parsing Poser brace syntax files.

```typescript
import { PoserReader } from '@atp/poser/core';

// From string
const root = PoserReader.parseString(cr2Content);

// From disk (parses 3.3MB source.cr2 in < 3ms)
const root = await PoserReader.loadFromFile('C:/Poser/Runtime/Character/Figure.cr2');
```

---

#### PoserPathResolver

Normalizes Poser relative `:Runtime:` paths across Windows, macOS, and POSIX formats:

```typescript
import { PoserPathResolver } from '@atp/poser/core';

// Check if path is in a Poser Runtime
PoserPathResolver.inRuntime('C:\\Poser\\Runtime\\Geometries\\Hair\\Hair.obj'); // true

// Convert to Poser relative format
PoserPathResolver.toPoserRelativePath('C:\\Poser\\Runtime\\Geometries\\Hair\\Hair.obj');
// => ':Runtime:Geometries:Hair:Hair.obj'

// Convert back to native disk path
PoserPathResolver.toDiskPath(':Runtime:Geometries:Hair:Hair.obj', 'C:/Poser');
// => 'C:/Poser/Runtime/Geometries/Hair/Hair.obj'
```

---

### Character & Rigging Model (`@atp/poser/model`)

#### RootNode

Represents the root document of a `.cr2` or `.pp2` file.

- `setVersion(version: string): this` — Sets header version (default `'4.01'`).
- `setGeometryPath(relativeRuntimePath: string): this` — Sets global geometry path (e.g. `':Runtime:Geometries:Hair:hair.obj'`) and automatically updates all actor `geomCustom` nodes.
- `getGeometryPath(): string` — Gets current geometry path.
- `addActor(actorName: string): ActorNode` — Creates and appends an `ActorNode`.
- `getActor(actorName: string): ActorNode | undefined` — Looks up actor by base name or identifier.
- `getActors(): ActorNode[]` — Returns all actor nodes in document.
- `createFigure(figureName?: string): FigureNode` — Creates or returns the `FigureNode`.
- `addProp(propName: string): PropNode` — Appends a prop node.
- `addMaterial(materialName: string): MaterialNode` — Appends a material definition block.

---

#### ActorNode

Represents a single bone or rigging component in the skeleton (e.g. `actor hairRoot:1`).

- `setOrigin(v: Vector3): this` — Sets bone pivot center.
- `getOrigin(): Vector3` — Returns current pivot center.
- `setEndPoint(v: Vector3): this` — Sets joint endpoint.
- `getEndPoint(): Vector3` — Returns joint endpoint.
- `setOrientation(v: Vector3): this` — Sets joint rotational orientation.
- `getOrientation(): Vector3` — Returns joint orientation.
- `setObjPath(objRelativePath: string): this` — Sets external OBJ geometry reference.
- `createDefaultChannels(): this` — Instantiates standard Poser dials (`scale`, `xScale`, `yScale`, `zScale`, `rotateZ`, `rotateX`, `rotateY`, `translateX`, `translateY`, `translateZ`).
- `addWeightMap(mapId: string, numVerts?: number): WeightMapNode` — Adds a vertex weight map for this bone.
- `getWeightMap(mapId: string): WeightMapNode | undefined` — Retrieves a weight map by ID.

---

#### FigureNode

Represents the `figure` block defining skeleton relationships:

- `addChildNode(childActorName: string, parentActorName: string): this` — Links `childActor` to `parentActor` in the skeleton hierarchy (`addChildNodes childActor:1 parentActor:1`).
- `addWeldNode(childActorName: string, parentActorName: string): this` — Defines mesh surface welding between adjacent bone groups (`weldNodes childActor:1 parentActor:1`).
- `getChildrenLinks(): BoneLink[]` — Returns all parent-child bone links.
- `getWeldLinks(): BoneLink[]` — Returns all weld links.

---

#### ChannelsNode & JointNode

Manages rotation, translation, and morph dials:

- `addMorph(morphName: string): TargetGeomNode` — Creates or retrieves a morph dial.
- `getMorphs(): TargetGeomNode[]` — Returns all morph dials on this bone.
- `addGroup(groupName: string): GroupsNode | null` — Creates a UI dial folder (`groupNode <groupName>`).
- `addParamToGroup(groupName: string, paramName: string): PoserNode | null` — Places a dial inside a UI folder (`parmNode <paramName>`).

---

#### TargetGeomNode

Represents a morph target dial with sparse vertex deltas:

```typescript
const morph = actor.channels.addMorph('WindLeft');
morph.setDelta(12, new Vector3(0.015, -0.005, 0.03));
```

- `setDelta(vertexIndex: number, delta: Vector3): this` — Adds delta displacement for vertex `vertexIndex`.
- `setDeltas(deltas: Map<number, Vector3>): this` — Batch sets deltas.
- `getDelta(vertexIndex: number): Vector3 | undefined` — Returns delta for a vertex.
- `getDeltas(): Map<number, Vector3>` — Returns all sparse deltas.

---

#### GroupsNode

Organizes dials into collapsible UI folders in Poser's parameter palette:

```typescript
const groups = actor.channels.getOrCreateGroups();
const styleGroup = groups.group('Styles', true);
styleGroup.parameter('Length', true);
```

---

#### WeightMapNode & WeightMap

Supports Poser 9+ vertex weight-mapped rigging:

```typescript
import { WeightMapNode, WeightMap } from '@atp/poser/model';
import { Vector3 } from '@atp/geometry';

// 1. Spatial interpolation data structure
const map = new WeightMap();
map.addWeight(new Vector3(0, 1.8, 0), 1.0);
map.addWeight(new Vector3(0, 1.9, 0), 0.0);
const interpolated = map.getWeight(new Vector3(0, 1.85, 0)); // 0.5 via IDW

// 2. Formatted AST node
const wmNode = actor.addWeightMap('hairRoot_zrot', 100);
wmNode.setWeight(0, 1.0);
wmNode.setWeight(1, 0.75);
wmNode.syncToNodes(); // writes out 'numbVerts 100' and 'v index weight'
```

---

### Builder & Pipeline Engine (`@atp/poser/builder`)

#### Cr2Builder

Fluent builder API for constructing figures without manual AST manipulation:

```typescript
import { Cr2Builder } from '@atp/poser';

const cr2 = new Cr2Builder('HairFigure')
  .setVersion('4.01')
  .setGeometryPath(':Runtime:Geometries:Hair:hair.obj');

// Add root bone
cr2.addBone({
  name: 'hairRoot',
  origin: [0, 1.8, 0],
  endPoint: [0, 1.9, 0],
});

// Add child bone linked to root
cr2.addBone({
  name: 'hairTip',
  parentName: 'hairRoot',
  origin: [0, 1.9, 0],
  endPoint: [0, 2.0, -0.1],
});

// Add dial group and morph
cr2.addDialGroup('hairRoot', 'Styles', ['Wind', 'Length']);
cr2.addMorphDelta('hairRoot', 'Wind', deltaMap);

// Export to file
await cr2.exportToDisk('C:/Poser/Runtime/Libraries/Character/Hair/MyHair.cr2');
```

---

#### PoserAssetPipeline

Automates the simultaneous generation of paired `.obj` geometry and `.cr2` rigging files:

```typescript
import { PoserAssetPipeline } from '@atp/poser';
import { WavefrontMesh } from '@atp/geometry';

const result = await PoserAssetPipeline.exportAssetPair(mesh, cr2, {
  runtimeDir: 'C:/Poser/Runtime',
  figureName: 'MyHair',
  geometrySubfolder: 'Hair',   // defaults to figureName
  characterSubfolder: 'Hair',  // defaults to figureName
});

console.log('Exported OBJ:', result.objAbsolutePath);
console.log('Exported CR2:', result.cr2AbsolutePath);
```

##### Pipeline Verification
The pipeline automatically validates that:
1. Every bone declared in `Cr2Builder` has a matching polygon group (`g <boneName>`) in the `WavefrontMesh`.
2. The relative geometry path in the `.cr2` file precisely matches the exported OBJ location.

---

## Step-by-Step Recipes & Examples

### 1. Building a Complete 3-Bone Conforming Hair Figure

```typescript
import { Cr2Builder } from '@atp/poser';

export function createConformingHairRig(geometryRelativePath: string): Cr2Builder {
  const cr2 = new Cr2Builder('ConformingHair')
    .setVersion('4.01')
    .setGeometryPath(geometryRelativePath);

  // 1. Root bone (anchors to figure head)
  cr2.addBone({
    name: 'hairRoot',
    parentName: 'head', // linked to head in host figure
    origin: [0.0, 1.75, 0.0],
    endPoint: [0.0, 1.85, 0.0],
    orientation: [0, 0, 0],
    createDefaultChannels: true,
  });

  // 2. Mid bone (main hair body)
  cr2.addBone({
    name: 'hairMid',
    parentName: 'hairRoot',
    origin: [0.0, 1.85, 0.0],
    endPoint: [0.05, 1.70, -0.1],
    orientation: [0, 0, 0],
    createDefaultChannels: true,
  });

  // 3. Tip bone (drape and tips)
  cr2.addBone({
    name: 'hairTip',
    parentName: 'hairMid',
    origin: [0.05, 1.70, -0.1],
    endPoint: [0.1, 1.50, -0.2],
    orientation: [0, 0, 0],
    createDefaultChannels: true,
  });

  // Add standard hair material
  cr2.addMaterial('HairStrands', [0.85, 0.65, 0.45]);

  return cr2;
}
```

---

### 2. Adding Morph Targets with Sparse Deltas

```typescript
import { Vector3 } from '@atp/geometry';
import { Cr2Builder } from '@atp/poser';

export function addWindMorph(cr2: Cr2Builder, actorName: string, vertexCount: number) {
  const windDeltas = new Map<number, Vector3>();

  // Only store displaced vertices (sparse representation)
  for (let i = 0; i < vertexCount; i += 2) {
    const intensity = (i / vertexCount);
    // Displace outward along X and backward along Z
    windDeltas.set(i, new Vector3(intensity * 0.05, 0.0, intensity * -0.08));
  }

  cr2.addMorphDelta(actorName, 'WindLeft', windDeltas);
}
```

---

### 3. Organizing Dials into Collapsible UI Folders

```typescript
import { Cr2Builder } from '@atp/poser';

export function organizeHairDials(cr2: Cr2Builder) {
  // Group dials into "Hair Styles" folder in Poser UI
  cr2.addDialGroup('hairRoot', 'Hair Styles', [
    'LengthShort',
    'LengthLong',
    'VolumeUp',
    'BraidTight'
  ]);

  // Group physics dials into "Movement & Wind" folder
  cr2.addDialGroup('hairRoot', 'Movement & Wind', [
    'WindLeft',
    'WindRight',
    'WindBack',
    'GravityHeavy'
  ]);
}
```

---

### 4. Adding Weight Maps for Smooth Joint Bending

```typescript
import { Cr2Builder } from '@atp/poser';

export function applyWeightMaps(cr2: Cr2Builder) {
  // Gradual falloff for smooth bending across hairRoot to hairMid
  const falloffWeights: [number, number][] = [
    [0, 1.00],
    [1, 0.85],
    [2, 0.70],
    [3, 0.50],
    [4, 0.25],
    [5, 0.00],
  ];

  cr2.addWeightMap('hairRoot', 'hairRoot_zrot', falloffWeights, 100);
}
```

---

### 5. One-Call Paired OBJ + CR2 Export

```typescript
import { WavefrontMesh } from '@atp/geometry';
import { Cr2Builder, PoserAssetPipeline } from '@atp/poser';

export async function exportHairProduct(runtimeDir: string, figureName: string) {
  // 1. Build geometry (mesh groups: hairRoot, hairMid, hairTip)
  const mesh = new WavefrontMesh();
  // ... populate mesh ...

  // 2. Build rigging (actor bones: hairRoot, hairMid, hairTip)
  const cr2 = new Cr2Builder(figureName);
  // ... configure bones ...

  // 3. Export pair to Poser Runtime
  const result = await PoserAssetPipeline.exportAssetPair(mesh, cr2, {
    runtimeDir,
    figureName,
    geometrySubfolder: 'Hair',
    characterSubfolder: 'Hair',
  });

  return result;
}
```

---

## Developer Workflow & Testing

This package is managed inside the `@atp` monorepo.

```bash
# Run unit tests
yarn test

# Watch mode for unit tests
yarn test:watch

# Compile to dist/
yarn build
```

---

## License

MIT © Darkwynd / ATC Library Authors

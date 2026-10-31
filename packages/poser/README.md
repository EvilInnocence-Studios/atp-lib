# atp-poser

> High-performance Poser CR2/PP2/PZ3 AST parser, streaming serializer, character rigging model, CR2 validator, and fluent figure assembly engine for Electron and Node.js.

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
  - [AST Core Engine (atp-poser/core)](#ast-core-engine-atpposercore)
    - [PoserNode](#posernode)
    - [NodeList](#nodelist)
    - [PoserWriter](#poserwriter)
    - [PoserReader](#poserreader)
    - [PoserPathResolver](#poserpathresolver)
  - [Character & Rigging Model (atp-poser/model)](#character--rigging-model-atpposermodel)
    - [RootNode](#rootnode)
    - [ActorNode](#actornode)
    - [FigureNode](#figurenode)
    - [ChannelsNode & JointNode](#channelsnode--jointnode)
    - [TargetGeomNode](#targetgeomnode)
    - [GroupsNode](#groupsnode)
    - [WeightMapNode & WeightMap](#weightmapnode--weightmap)
    - [MaterialNode](#materialnode)
    - [PropNode](#propnode)
  - [Builder, Validator & Pipeline Engine (atp-poser/builder)](#builder-validator--pipeline-engine-atpposerbuilder)
    - [Cr2Builder](#cr2builder)
    - [validateCr2](#validatecr2)
    - [PoserAssetPipeline](#poserassetpipeline)
- [Step-by-Step Recipes & Examples](#step-by-step-recipes--examples)
  - [1. Building a Complete 3-Bone Conforming Hair Figure](#1-building-a-complete-3-bone-conforming-hair-figure)
  - [2. Validating CR2 Documents & In-Memory State](#2-validating-cr2-documents--in-memory-state)
  - [3. Adding Morph Targets with Sparse Deltas](#3-adding-morph-targets-with-sparse-deltas)
  - [4. Organizing Dials into Collapsible UI Folders](#4-organizing-dials-into-collapsible-ui-folders)
  - [5. Adding Weight Maps for Smooth Joint Bending](#5-adding-weight-maps-for-smooth-joint-bending)
  - [6. One-Call Paired OBJ + CR2 Export](#6-one-call-paired-obj--cr2-export)
- [Developer Workflow & Testing](#developer-workflow--testing)

---

## Architectural Overview

`atp-poser` is an industrial-strength Poser character and rigging engine. It provides complete AST parsing, serialization, structural validation, and model definitions for generating Poser `.cr2` (character rigging), `.pp2` (smart and stationary props), and `.pz3` (scene) files in modern TypeScript.

- **Guaranteed Valid State**: Every operation on `Cr2Builder`, `RootNode`, `ActorNode`, `FigureNode`, `ChannelsNode`, and `MaterialNode` maintains a valid Poser CR2 state by construction—preventing consumer apps from accidentally emitting malformed files.
- **Built-in CR2 Validator (`validateCr2`)**: Verifies 30+ Poser CR2 structural, syntactic, and rigging invariants (`C1.1`–`C7.4`) against both in-memory `PoserNode` ASTs and raw CR2 strings.
- **Two-Pass Poser CR2 Architecture**: Automatically manages Poser's required two-pass loading structure (Pass 1 `figureResFile` + lightweight actor geometry stubs with `storageOffset` and `geomHandlerGeom`, followed by Pass 2 `figureResFile` + full `actor` definitions, `figure`, and `setGeomHandlerOffset`).
- **Complete Joint & Channel Evaluation**: Automatically generates `groups` (`Transform` and `Other`), brackets rotation channels with `*OffsetA` (`+origin`) and `*OffsetB` (`-origin`), builds self and parent-side joint deformation channels (`joint*`, `twist*`, `smoothScale*`), and formats complete `keys { static <0|1> \n k 0 <val> }` blocks.
- **High-Speed Parsing**: Tokenizes and parses massive 3.3MB CR2 files in **less than 3ms**, allowing template figures and library characters to load instantly in Electron UI threads.
- **Unified Asset Pipeline**: Integrates seamlessly with `atp-geometry` to export paired Wavefront `.obj` and `.cr2` files to Poser Runtimes.

---

## Installation

```bash
# npm
npm install atp-poser atp-geometry

# yarn
yarn add atp-poser atp-geometry
```

---

## Module Exports

```typescript
// Root entry point (all modules)
import {
  Cr2Builder,
  validateCr2,
  PoserAssetPipeline,
  PoserReader,
  PoserWriter,
  RootNode,
  ActorNode,
} from 'atp-poser';

// Subpath imports
import { PoserNode, NodeList, PoserWriter, PoserReader, PoserPathResolver } from 'atp-poser/core';
import {
  RootNode,
  ActorNode,
  FigureNode,
  ChannelsNode,
  JointNode,
  GroupsNode,
  WeightMapNode,
  TargetGeomNode,
  MaterialNode,
} from 'atp-poser/model';
import {
  Cr2Builder,
  validateCr2,
  PoserAssetPipeline,
  type Cr2ValidationResult,
  type Cr2ValidationIssue,
} from 'atp-poser/builder';
```

---

## Poser File Format Specifications

Valid Poser figure files (`.cr2`) use a two-pass brace-delimited AST structure:

```text
{
	version
	{
		number 4.01
	}
	figureResFile ":Runtime:Geometries:Hair:hair.obj"
	actor BODY:1
	{
	}
	actor hairRoot:1
	{
		storageOffset 0 0 0
		geomHandlerGeom 13 hairRoot
	}
	figureResFile ":Runtime:Geometries:Hair:hair.obj"
	actor BODY:1
	{
		name BODY
		off
		bend 1
		dynamicsLock 1
		hidden 0
		addToMenu 1
		castsShadow 1
		includeInDepthCue 1
		useZBuffer 1
		parent UNIVERSE
		creaseAngle 80
		channels
		{
			...
		}
		endPoint 0.000000 1.000000 0.000000
		origin 0.000000 0.000000 0.000000
		orientation 0.000000 0.000000 0.000000
		displayOrigin 0
		displayMode USEPARENT
		customMaterial 0
		locked 0
		backfaceCull 0
		visibleInReflections 1
		visibleInRender 1
		displacementBounds 0
		shadingRate 0.2
		smoothPolys 1
	}
	actor hairRoot:1
	{
		...
	}
	figure
	{
		name HairFigure
		root BODY:1
		addChild hairRoot:1
			BODY:1
		defaultPick BODY:1
		displayOn 1
		allowsBending 1
		figureType 1318
		origFigureType 1318
		canonType 8
		conforming 0
		material Preview
		{
			...
		}
		displayMode USEPARENT
		locked 0
	}
	setGeomHandlerOffset 0 0 0
}
```

### Strict Rules Enforced by `atp-poser`:
1. **CRLF Line Endings & Tab Indentation**: Every line terminates with `\r\n` and indents with `\t` matching AST depth.
2. **Two-Pass Root Structure**: Root contains `version`, Pass 1 quoted `figureResFile` + actor geometry stubs, Pass 2 quoted `figureResFile` + full actor definitions, `figure`, and `setGeomHandlerOffset 0 0 0`.
3. **Channel Evaluation & Offset Bracketing**: Every actor's `channels` block includes a non-empty `groups` block (`Transform` and `Other`), brackets `rotateX/Y/Z` between `zOffsetA`/`yOffsetA`/`xOffsetA` (`+origin`) and `xOffsetB`/`yOffsetB`/`zOffsetB` (`-origin`), uses `scaleX`/`scaleY`/`scaleZ` (or `propagatingScale*` on `BODY`), and includes `keys { static <0|1> \n k 0 <val> }` and `interpStyleLocked 0` on every channel.
4. **Two-Line Hierarchy & Weld Syntax**: Inside `figure`, parent-child links use two-line `addChild <child>:<id>\r\n\t\t<parent>:<id>` and welds use two-line `weld <child>:<id>\r\n\t\t<parent>:<id>`.
5. **Materials Inside Figure**: All `material <name>` blocks reside inside `figure`, use capital `NsExponent`, place `0 0` on a new line after quoted texture map paths, and wire specular maps inside `shaderTree`.

---

## Core API Reference

### AST Core Engine (`atp-poser/core`)

#### PoserNode

Base hierarchical class for every block and property in a Poser document.

```typescript
import { PoserNode } from 'atp-poser/core';

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
import { NodeList } from 'atp-poser/core';

const list = new NodeList(root.findChildren('actor'));

// Query all channels across all actors
const channels = list.findAll('channels');

// Batch delete
list.deleteSubNode('storageOffset');
```

---

#### PoserWriter

Exact Poser syntax streaming serializer.

- `PoserWriter.writeToString(node: PoserNode): string` — Generates the complete serialized document string with exact tabs, braces, and CRLF endings.
- `PoserWriter.writeNodeToStream(node: PoserNode, stream: Writable, tabCount?: number): void` — Recursively writes AST nodes into any Node.js `Writable` stream.
- `PoserWriter.exportNodeStream(node: PoserNode, targetFilePath: string): Promise<void>` — High-throughput direct stream export to disk with 64KB buffering.
- `PoserWriter.exportToFile(node: PoserNode, filePath: string): Promise<void>` — Alias for `exportNodeStream`.

---

#### PoserReader

High-performance tokenizer parsing Poser brace syntax files.

```typescript
import { PoserReader } from 'atp-poser/core';

// From string
const root = PoserReader.parseString(cr2Content);

// From disk (parses 3.3MB source.cr2 in < 3ms)
const root = await PoserReader.loadFromFile('C:/Poser/Runtime/Character/Figure.cr2');
```

---

#### PoserPathResolver

Normalizes Poser relative `:Runtime:` paths across Windows, macOS, and POSIX formats:

```typescript
import { PoserPathResolver } from 'atp-poser/core';

PoserPathResolver.inRuntime('C:\\Poser\\Runtime\\Geometries\\Hair\\Hair.obj'); // true
PoserPathResolver.toPoserRelativePath('C:\\Poser\\Runtime\\Geometries\\Hair\\Hair.obj');
// => ':Runtime:Geometries:Hair:Hair.obj'
PoserPathResolver.toDiskPath(':Runtime:Geometries:Hair:Hair.obj', 'C:/Poser');
// => 'C:/Poser/Runtime/Geometries/Hair/Hair.obj'
```

---

### Character & Rigging Model (`atp-poser/model`)

#### RootNode

Represents the root document of a `.cr2` or `.pp2` file and automatically maintains the two-pass Poser CR2 structure:

- `setVersion(version: string): this` — Sets header version (default `'4.01'`).
- `setGeometryPath(relativeRuntimePath: string): this` — Sets and quotes both Pass 1 and Pass 2 `figureResFile "<path>"` declarations at the root level.
- `getGeometryPath(): string` — Gets current geometry path.
- `addActor(actorName: string): ActorNode` — Ensures `BODY:1` exists, creates both the Pass 1 geometry stub and Pass 2 full `ActorNode` in matching order, and registers the actor in `FigureNode`.
- `linkBoneHierarchy(childName: string, parentName: string): void` — Links `childName` to `parentName` across the document (updates `parent`, replaces `addChild` link, adds `weld` link, and injects `<child>_*` joint deformation channels into the parent bone).
- `syncActorStub(actor: ActorNode): void` — Synchronizes an actor's Pass 1 stub (`storageOffset` / `geomHandlerGeom` vs. empty `{}`) when `hasGeom` or `geomHandler` changes.
- `getActor(actorName: string): ActorNode | undefined` — Looks up the Pass 2 `ActorNode` by base name or identifier.
- `getActors(): ActorNode[]` — Returns all Pass 2 `ActorNode` instances in document order.
- `createFigure(figureName?: string): FigureNode` — Creates or returns the `FigureNode` (ensuring `BODY:1` is initialized).
- `addMaterial(materialName: string): MaterialNode` — Adds or retrieves a `MaterialNode` inside the `figure` block.
- `addProp(propName: string): PropNode` — Appends a prop node.

---

#### ActorNode

Represents a Pass 2 bone or rigging component in the skeleton (e.g. `actor hairRoot:1`), initialized with all required Poser pre-channel header properties, default channels, spatial vectors (`endPoint`, `origin`, `orientation`), and post-channel rendering attributes:

- `setOrigin(v: Vector3): this` — Sets bone pivot center and automatically updates `*OffsetA` (`+origin`), `*OffsetB` (`-origin`), and joint deformer `center`/`startPt` coordinates in `channels`.
- `getOrigin(): Vector3` — Returns current pivot center.
- `setEndPoint(v: Vector3): this` — Sets joint endpoint and automatically updates joint deformer `endPt` coordinates in `channels`.
- `getEndPoint(): Vector3` — Returns joint endpoint.
- `setOrientation(v: Vector3): this` — Sets joint rotational orientation.
- `getOrientation(): Vector3` — Returns joint orientation.
- `setRotateOrder(order?: string): this` — Sets Euler rotation order (e.g. `'zyx'`) and reorders `rotateX`, `rotateY`, `rotateZ` channels accordingly (twist axis first).
- `getRotateOrder(): string | null` — Returns Euler rotation order derived from metadata or channel ordering.
- `setGeomHandler(handlerType?: number, actorName?: string): this` — Configures Pass 1 stub `geomHandlerGeom <type> <name>` and syncs with `RootNode`.
- `getGeomHandler(): { handlerType: number; actorName: string } | null` — Gets geometry handler settings.
- `setHasGeom(hasGeom: boolean | number): this` — Configures whether this bone has geometry (`1` emits `storageOffset`/`geomHandlerGeom` in the Pass 1 stub; `0` emits an empty `{}` Pass 1 stub).
- `getHasGeom(): number | null` — Returns whether bone has geometry (`1` or `0`).
- `setParent(parentActorName: string): this` — Sets parent actor (`UNIVERSE` for `BODY`, or `<parent>:<id>`), automatically normalizing invalid `NONE` values.
- `getParent(): string | null` — Gets parent actor reference.
- `setSphereFalloff(center: Vector3, innerRadius: number, outerRadius: number): this` — Configures joint spherical falloff zones and writes `sphereMatsRaw` matrices into the bone's `joint*` channels.
- `getSphereFalloff(): { center: Vector3; innerRadius: number; outerRadius: number } | null` — Gets sphere falloff configuration.
- `createDefaultChannels(): this` — Rebuilds the bone's Poser channel evaluation stack while preserving any existing morphs and master dials.
- `addWeightMap(mapId: string, numVerts?: number): WeightMapNode` — Adds a vertex weight map for this bone.
- `getWeightMap(mapId: string): WeightMapNode | undefined` — Retrieves a weight map by ID.

---

#### FigureNode

Represents the `figure` block defining skeleton hierarchy, welds, figure flags, and materials:

- `addChildNode(childBone: string, parentBone: string): this` — Inserts a two-line `addChild <child>:<id>\r\n\t\t<parent>:<id>` hierarchy pair before `defaultPick`.
- `addWeldNode(childBone: string, parentBone: string): this` — Inserts a two-line `weld <child>:<id>\r\n\t\t<parent>:<id>` pair before `allowsBending`.
- `addMaterial(materialName: string): MaterialNode` — Adds or retrieves a `MaterialNode` inside the `figure` block before `displayMode USEPARENT`.
- `getMaterial(materialName: string): MaterialNode | undefined` — Finds a material by name inside `figure`.
- `getMaterials(): MaterialNode[]` — Returns all `MaterialNode` blocks inside `figure`.
- `getChildrenLinks(): BoneLink[]` — Returns all `{ child, parent }` bone links.
- `getWeldLinks(): BoneLink[]` — Returns all `{ child, parent }` weld links.

---

#### ChannelsNode & JointNode

Manages offset channels, scale channels, joint deformation channels, rotation/translation dials, morph dials, and ERC master/slave relationships:

- `createDefaultChannels(options?: CreateDefaultChannelsOptions): void` — Populates `groups` (`Transform` and `Other`), `zOffsetA`/`yOffsetA`/`xOffsetA`, `scale`/`scaleX`/`scaleY`/`scaleZ` (or `propagatingScale*` on `BODY`), self joint deformation channels (`joint*`, `twist*`, `smoothScale*`), `rotateX/Y/Z`, `xOffsetB`/`yOffsetB`/`zOffsetB`, and `translateX/Y/Z`.
- `createChannelsForChild(childBoneName: string, childOrigin: Vector3, childEndPoint: Vector3, fileNumber?: number, childRotateOrder?: string | null): void` — Injects `<child>_twist*`, `<child>_joint*`, and `<child>_smoo*` channels into a parent bone.
- `syncOriginAndEndPoint(origin: Vector3, endPoint: Vector3): void` — Synchronizes `*OffsetA`, `*OffsetB`, and deformer `center`/`startPt`/`endPt` values.
- `addMasterDial(dialId: string, displayName: string, min?: number, max?: number, trackingScale?: number): PoserNode` — Adds an ERC master control dial (`valueParm`) with `keys { static 0 \n k 0 0 }`, `interpStyleLocked 0`, and registers it in `groups`.
- `addSlaveLink(channelName: 'xrot' | 'yrot' | 'zrot', masterActor: string, masterDialName: string, deltaScale: number): this` — Binds a joint rotation channel to a master dial via `valueOpDeltaAdd` (`Figure`, `<masterActor>`, `<masterDialName>`) and `deltaAddDelta`.
- `addMorph(morphName: string): TargetGeomNode` — Creates or retrieves a morph dial and registers it in `groups`.
- `getMorphs(): TargetGeomNode[]` — Returns all morph dials on this bone.
- `addGroup(groupName: string): GroupsNode | null` — Creates a UI dial folder (`groupNode <groupName>`).
- `addParamToGroup(groupName: string, paramName: string): PoserNode | null` — Places a dial inside a UI folder (`parmNode <paramName>`).

---

#### TargetGeomNode

Represents a morph target dial (`targetGeom <name>`) with complete Poser channel properties (`hidden 0`, `forceLimits 1`, `keys { static 0 \n k 0 0 }`, `interpStyleLocked 0`, `indexes`, `numbDeltas`, `deltas`, `blendType 0`):

```typescript
const morph = actor.channels.addMorph('WindLeft');
morph.setDelta(12, new Vector3(0.015, -0.005, 0.03));
morph.setNumbDeltas(500);
```

- `setDelta(vertexIndex: number, delta: Vector3): this` — Adds delta displacement for vertex `vertexIndex`.
- `setDeltas(deltas: Map<number, Vector3>, totalMeshVertices?: number): this` — Batch sets sparse deltas and optional `numbDeltas`.
- `setNumbDeltas(totalMeshVertices: number): this` — Sets total vertex count of the target geometry.
- `getNumbDeltas(): number` — Returns `numbDeltas`.
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
import { WeightMapNode, WeightMap } from 'atp-poser/model';
import { Vector3 } from 'atp-geometry';

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

#### MaterialNode

Represents a Poser surface shader material definition block (`material <name>`) inside `figure`:

- `setColors(kd?: [number, number, number], ka?: [number, number, number], ks?: [number, number, number]): this` — Sets diffuse (`KdColor`), ambient (`KaColor`), and specular (`KsColor`) RGBA colors.
- `setDiffuseColor(r: number, g: number, b: number, a?: number): this` — Sets `KdColor`.
- `setNsExponent(ns: number): this` — Sets specular highlight sharpness exponent (`NsExponent <ns>`).
- `setTextureMap(texturePath: string): this` — Sets primary diffuse texture map (`textureMap "<path>"\r\n\t\t0 0` or `textureMap NO_MAP`).
- `getTextureMap(): string | null` — Retrieves path of active diffuse texture map (or `null` if `NO_MAP`).
- `setTransparencyMap(texturePath: string, tMin?: number, tMax?: number, tExpo?: number): this` — Sets transparency texture map with thresholds and exponent (`transparencyMap "<path>"\r\n\t\t0 0`).
- `getTransparencyMap(): string | null` — Retrieves transparency texture map path.
- `setBumpMap(texturePath: string, bumpStrength?: number): this` — Sets bump/normal map texture with strength (`bumpMap "<path>"\r\n\t\t0 0`).
- `getBumpMap(): string | null` — Retrieves bump map path.
- `setSpecularMap(texturePath: string): this` — Wires a specular `image_map` node inside the material's `shaderTree`.
- `getSpecularMap(): string | null` — Retrieves specular map path from `shaderTree`.

```typescript
const mat = cr2.addMaterial('Hair_Material');
mat.setColors([1.0, 1.0, 1.0], [0.0, 0.0, 0.0], [0.35, 0.35, 0.35])
   .setNsExponent(45)
   .setTextureMap(':Runtime:Textures:Hair:diffuse.png')
   .setTransparencyMap(':Runtime:Textures:Hair:trans.png', 1, 0, 0.6)
   .setBumpMap(':Runtime:Textures:Hair:normal.png', 1)
   .setSpecularMap(':Runtime:Textures:Hair:spec.png');
```

---

### Builder, Validator & Pipeline Engine (`atp-poser/builder`)

#### Cr2Builder

Fluent builder API for constructing Poser-compliant figures where every method leaves the in-memory CR2 document in a valid state:

```typescript
import { Cr2Builder } from 'atp-poser';

const cr2 = new Cr2Builder('HairFigure')
  .setVersion('4.01')
  .setGeometryPath(':Runtime:Geometries:Hair:hair.obj');

// Add root bone (automatically parented to BODY:1)
cr2.addBone({
  name: 'hairRoot',
  origin: [0, 1.8, 0],
  endPoint: [0, 1.9, 0],
});

// Add child bone linked and welded to hairRoot
cr2.addBone({
  name: 'hairTip',
  parentName: 'hairRoot',
  origin: [0, 1.9, 0],
  endPoint: [0, 2.0, -0.1],
  rotateOrder: 'zyx',
  sphereFalloff: {
    center: [0, 1.9, 0],
    innerRadius: 0.02,
    outerRadius: 0.04,
  },
});

// Add dial group and morph
cr2.addDialGroup('hairRoot', 'Styles', ['Wind', 'Length']);
cr2.addMorphDelta('hairRoot', 'Wind', deltaMap);

// Add ERC master dial and slave rotation link
cr2.addMasterDial('hairRoot', 'tail_Curl', 'Curl (tail)', -100, 100, 0.02);
cr2.addSlaveLink('hairTip', 'xrot', 'hairRoot:1', 'tail_Curl', 0.85);

// Validate in-memory CR2 before exporting
const validation = cr2.validate();
if (!validation.valid) {
  console.error('CR2 validation errors:', validation.errors);
}

// Export to file
await cr2.exportToDisk('C:/Poser/Runtime/Libraries/Character/Hair/MyHair.cr2');
```

---

#### validateCr2

Validates either an in-memory `PoserNode` AST or a raw CR2 string against Poser CR2 structural, syntactic, and rigging criteria (`C1.1` through `C7.4`):

```typescript
import { validateCr2, PoserReader } from 'atp-poser';

const result = validateCr2(cr2StringOrNode);

if (result.valid) {
  console.log('CR2 is valid!');
} else {
  for (const err of result.errors) {
    console.error(`[${err.code}] (${err.path}): ${err.message}`);
  }
}
```

##### Validation Return Types
```typescript
export type Cr2IssueSeverity = 'error' | 'warning';

export interface Cr2ValidationIssue {
  code: string;
  severity: Cr2IssueSeverity;
  message: string;
  path?: string;
}

export interface Cr2ValidationResult {
  valid: boolean;
  issues: Cr2ValidationIssue[];
  errors: Cr2ValidationIssue[];
  warnings: Cr2ValidationIssue[];
}
```

##### Key Invariants Checked by `validateCr2`:
| Category | Codes | What is Validated |
| :--- | :--- | :--- |
| **1. Lexical & Quoting** | `C1.2`–`C1.4` | Balanced `{}` braces, consistent `:<fileNumber>` actor suffixes, quoted `:Runtime:` paths in `figureResFile`, `morphBinaryFile`, and texture maps. |
| **2. Two-Pass Root** | `C2.1`–`C2.7` | `version` first child, two matching `figureResFile` declarations, Pass 1 actor stubs matching Pass 2 full actors in count and order, `figure` block, and trailing `setGeomHandlerOffset`. |
| **3. Actor Blocks** | `C3.1`–`C3.7` | Pass 1 stubs contain only `storageOffset`/`geomHandlerGeom`; Pass 2 actors contain required header/footer props, `parent UNIVERSE` on `BODY`, and no prohibited `geomCustom`, `hasGeom`, `rotateOrder`, or `sphere` properties. |
| **4. Channels & Rigging** | `C4.1`–`C4.8` | Non-empty `groups`, valid `scaleX`/`scaleY`/`scaleZ` types, `keys { static ... k 0 ... }` and `interpStyleLocked 0` on all channels, `*OffsetA` / `rotate*` / `*OffsetB` bracketing, and joint deformation channels (`joint*`, `twist*`, `smoothScale*`). |
| **5. Figure Hierarchy** | `C5.1`–`C5.6` | `root BODY:<id>`, `defaultPick`, `allowsBending`, two-line `addChild` and `weld` syntax, and all `material` blocks placed inside `figure` (never at root). |
| **6. Materials** | `C6.1`–`C6.2` | Capital `NsExponent`, multiline `"<path>"\n\t0 0` texture map flags, and no invalid top-level `specularMap` keyword. |

---

#### PoserAssetPipeline

Automates the simultaneous generation of paired `.obj` geometry and `.cr2` rigging files:

```typescript
import { PoserAssetPipeline } from 'atp-poser';
import { WavefrontMesh } from 'atp-geometry';

const result = await PoserAssetPipeline.exportAssetPair(mesh, cr2, {
  runtimeDir: 'C:/Poser/Runtime',
  figureName: 'MyHair',
  geometrySubfolder: 'Hair',   // defaults to figureName
  characterSubfolder: 'Hair',  // defaults to figureName
});

console.log('Exported OBJ:', result.objAbsolutePath);
console.log('Exported CR2:', result.cr2AbsolutePath);
```

---

## Step-by-Step Recipes & Examples

### 1. Building a Complete 3-Bone Conforming Hair Figure

```typescript
import { Cr2Builder } from 'atp-poser';

export function createConformingHairRig(geometryRelativePath: string): Cr2Builder {
  const cr2 = new Cr2Builder('ConformingHair')
    .setVersion('4.01')
    .setGeometryPath(geometryRelativePath);

  // 1. Head anchor bone (parented to BODY)
  cr2.addBone({
    name: 'head',
    parentName: 'BODY',
    origin: [0.0, 1.484, 0.0],
    endPoint: [0.0, 1.651, 0.0],
    rotateOrder: 'zyx',
    hasGeom: 1,
  });

  // 2. Root hair bone (parented and welded to head)
  cr2.addBone({
    name: 'hairRoot',
    parentName: 'head',
    origin: [0.0, 1.75, 0.0],
    endPoint: [0.0, 1.85, 0.0],
    rotateOrder: 'zyx',
  });

  // 3. Mid hair bone (parented and welded to hairRoot)
  cr2.addBone({
    name: 'hairMid',
    parentName: 'hairRoot',
    origin: [0.0, 1.85, 0.0],
    endPoint: [0.05, 1.70, -0.1],
    rotateOrder: 'zyx',
  });

  // 4. Tip hair bone (parented and welded to hairMid)
  cr2.addBone({
    name: 'hairTip',
    parentName: 'hairMid',
    origin: [0.05, 1.70, -0.1],
    endPoint: [0.1, 1.50, -0.2],
    rotateOrder: 'zyx',
  });

  // Add standard hair material inside figure
  cr2.addMaterial('HairStrands', [0.85, 0.65, 0.45]);

  return cr2;
}
```

---

### 2. Validating CR2 Documents & In-Memory State

```typescript
import * as fs from 'node:fs/promises';
import { validateCr2, Cr2Builder } from 'atp-poser';

// Validate an existing CR2 file on disk
const rawCr2 = await fs.readFile('C:/Poser/Runtime/Libraries/Character/MyFigure.cr2', 'utf-8');
const check = validateCr2(rawCr2);
if (!check.valid) {
  console.error('Invalid CR2 file:', check.errors);
}

// Validate a Cr2Builder instance at any stage of construction
const builder = new Cr2Builder('TestFigure');
console.log(builder.validate().valid); // true immediately after construction
```

---

### 3. Adding Morph Targets with Sparse Deltas

```typescript
import { Vector3 } from 'atp-geometry';
import { Cr2Builder } from 'atp-poser';

export function addWindMorph(cr2: Cr2Builder, actorName: string, vertexCount: number) {
  const windDeltas = new Map<number, Vector3>();

  // Only store displaced vertices (sparse representation)
  for (let i = 0; i < vertexCount; i += 2) {
    const intensity = i / vertexCount;
    // Displace outward along X and backward along Z
    windDeltas.set(i, new Vector3(intensity * 0.05, 0.0, intensity * -0.08));
  }

  cr2.addMorphDelta(actorName, 'WindLeft', windDeltas);
}
```

---

### 4. Organizing Dials into Collapsible UI Folders

```typescript
import { Cr2Builder } from 'atp-poser';

export function organizeHairDials(cr2: Cr2Builder) {
  // Group dials into "Hair Styles" folder in Poser UI
  cr2.addDialGroup('hairRoot', 'Hair Styles', [
    'LengthShort',
    'LengthLong',
    'VolumeUp',
    'BraidTight',
  ]);

  // Group physics dials into "Movement & Wind" folder
  cr2.addDialGroup('hairRoot', 'Movement & Wind', [
    'WindLeft',
    'WindRight',
    'WindBack',
    'GravityHeavy',
  ]);
}
```

---

### 5. Adding Weight Maps for Smooth Joint Bending

```typescript
import { Cr2Builder } from 'atp-poser';

export function applyWeightMaps(cr2: Cr2Builder) {
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

### 6. One-Call Paired OBJ + CR2 Export

```typescript
import { WavefrontMesh } from 'atp-geometry';
import { Cr2Builder, PoserAssetPipeline } from 'atp-poser';

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

This package is managed inside the ATP monorepo.

```bash
# Run unit tests
yarn test

# Watch mode for unit tests
yarn test:watch

# Compile to dist/
yarn build

# Build, test, and package only atp-poser from monorepo root
yarn deploy:poser
```

---

## License

MIT © Darkwynd / ATC Library Authors

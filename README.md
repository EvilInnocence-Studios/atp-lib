# ATP TypeScript Monorepo

High-performance 3D spatial geometry, polygon mesh data structures, Wavefront OBJ streaming engine, and Poser character rigging / CR2 AST generation designed for modern **Node.js**, **Electron**, and **Web** environments.

---

## Packages

The monorepo contains two independent, highly optimized packages:

| Package | Version | Description | Documentation |
| :--- | :---: | :--- | :--- |
| **[atp-geometry](file:///p:/Libraries/atc/typescript/packages/geometry)** | `1.1.0` | Generic 3D spatial math (`Vector2`, `Vector3`, `Rotation3`), polygon mesh structures, and streaming Wavefront OBJ / MTL material library reader and writer. Completely agnostic of Poser with zero runtime dependencies. | [Geometry README](file:///p:/Libraries/atc/typescript/packages/geometry/README.md) |
| **[atp-poser](file:///p:/Libraries/atc/typescript/packages/poser)** | `1.1.0` | Poser CR2/PP2/PZ3 AST parser, serializer, character rigging model, joint hierarchies, ERC master/slave dials, shader materials, morph deltas, weight maps, fluent `Cr2Builder`, and `PoserAssetPipeline`. | [Poser README](file:///p:/Libraries/atc/typescript/packages/poser/README.md) |

---

## Architectural Highlights

- **Pure TypeScript & Native ESM**: Modern ES2022 output with native Node.js ES modules (`"type": "module"`), strict type-checking, and full TypeScript `.d.ts` declaration map generation.
- **Subpath Package Exports**: Optimized subpath entry points enable granular tree-shaking and targeted imports:
  - `atp-geometry/math`, `atp-geometry/mesh`, `atp-geometry/wavefront`
  - `atp-poser/core`, `atp-poser/model`, `atp-poser/builder`
- **High-Throughput Streaming & Speed**:
  - Tokenizes and parses 3.3MB production CR2 files in **< 3ms**.
  - Stream-based disk writers (`exportNodeStream`, `WavefrontWriter.writeToStream`, `WavefrontMtlWriter.writeToStream`) utilize 64KB buffering to output massive figures with thousands of morph targets without blocking Electron main or renderer processes.
- **Poser Standard Compliance**:
  - Enforces exact tab indentation (`\t`), matching braces `{ ... }`, 6-decimal float formatting, and CRLF (`\r\n`) line breaks for 100% interoperability across Poser 4 through Poser 13+ and DAZ Studio.
- **100% Code Coverage**:
  - Both packages maintain **100% Statement, Branch, Function, and Line coverage** across 77 unit tests evaluated with Vitest and the native V8 coverage provider.

---

## Directory Structure

```text
p:/Libraries/atc/typescript/
├── packages/
│   ├── geometry/                  # atp-geometry package
│   │   ├── src/
│   │   │   ├── math/              # Vector2, Vector3, Rotation3
│   │   │   ├── mesh/              # MeshVertex, MeshFace polygon structures
│   │   │   ├── wavefront/         # WavefrontMesh, WavefrontReader, WavefrontWriter
│   │   │   └── index.ts           # Root package barrel export
│   │   ├── test/
│   │   │   ├── fixtures/          # Real-world OBJ meshes (sphere.obj)
│   │   │   ├── math.test.ts       # Spatial math unit tests
│   │   │   └── wavefront.test.ts  # OBJ engine unit tests
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── poser/                     # atp-poser package
│       ├── src/
│       │   ├── core/              # PoserNode, PoserReader, PoserWriter, PathResolver, NodeList
│       │   ├── model/             # ActorNode, JointNode, FigureNode, ChannelsNode, WeightMap
│       │   ├── builder/           # Cr2Builder fluent API, PoserAssetPipeline
│       │   └── index.ts           # Root package barrel export
│       ├── test/
│       │   ├── fixtures/          # Real-world Poser figures (source.cr2, target.cr2)
│       │   ├── core.test.ts       # AST core and serializer unit tests
│       │   ├── models.test.ts     # Rigging and actor component tests
│       │   ├── cr2-builder.test.ts# Figure assembly and asset pipeline tests
│       │   ├── advanced.test.ts   # Welding and morph delta tests
│       │   └── node.test.ts       # Poser file format round-trip verification tests
│       ├── package.json
│       └── tsconfig.json
│
├── scripts/
│   ├── build-and-deploy.mjs       # Universal cross-platform build, pack, link & deploy script
│   └── deploy.ps1                 # PowerShell convenience runner
│
├── package.json                   # Monorepo root workspace configuration
└── tsconfig.json                  # Monorepo root TypeScript settings
```

---

## Quick Start Example

Exporting paired Wavefront OBJ geometry and a conforming Poser CR2 character figure in Node.js or Electron:

```typescript
import { WavefrontMesh } from 'atp-geometry';
import { Cr2Builder, PoserAssetPipeline } from 'atp-poser';

// 1. Construct 3D Geometry
const mesh = new WavefrontMesh();
const v0 = mesh.addVertex(0, 0, 0);
const v1 = mesh.addVertex(1, 0, 0);
const v2 = mesh.addVertex(0, 1, 0);
mesh.addFace([{ vIndex: v0 }, { vIndex: v1 }, { vIndex: v2 }], 'hairRoot', 'HairMaterial');

// 2. Construct Character Rigging
const cr2 = new Cr2Builder('MyConformingHair')
  .setVersion('4.01');

// Add root bone (matches polygon group 'hairRoot')
cr2.addBone({
  name: 'hairRoot',
  parentName: 'head',
  origin: [0, 1.75, 0],
  endPoint: [0, 1.85, 0],
  createDefaultChannels: true,
});

// 3. One-Call Paired Asset Pipeline Export
const result = await PoserAssetPipeline.exportAssetPair(mesh, cr2, {
  runtimeDir: 'C:/Poser/Runtime',
  figureName: 'MyConformingHair',
  geometrySubfolder: 'Hair',
  characterSubfolder: 'Hair',
});

console.log('Saved OBJ:', result.objAbsolutePath);
console.log('Saved CR2:', result.cr2AbsolutePath);
```

---

## Developer Commands

Run from `p:/Libraries/atc/typescript`:

### Building
```bash
# Build all packages in dependency order (atp-geometry then atp-poser)
yarn build

# Build individual packages
yarn build:geometry
yarn build:poser
```

### Testing & Code Coverage
```bash
# Run all unit tests across both packages
yarn test

# Run tests with complete V8 coverage reports
yarn test:coverage

# Run coverage for individual packages
yarn test:coverage:geometry
yarn test:coverage:poser
```

### Packaging & Deployment
```bash
# Pack tarballs (.tgz) into the release/ directory for distribution
yarn deploy:pack

# Link packages globally via yarn link for local development in consumer apps
yarn deploy:link

# Publish packages to npm in dependency order
yarn deploy:publish
```

### Advanced Script Options
The root deployment script ([scripts/build-and-deploy.mjs](file:///p:/Libraries/atc/typescript/scripts/build-and-deploy.mjs)) provides granular CLI control:

```bash
# Full clean, test, build, and package
node scripts/build-and-deploy.mjs --clean --test --build --pack

# Copy compiled dist/ directly into an external consumer project (e.g. Electron app)
node scripts/build-and-deploy.mjs --clean --build --copy-to C:/Projects/MyElectronApp

# Display all available options
node scripts/build-and-deploy.mjs --help
```

---

## License

MIT

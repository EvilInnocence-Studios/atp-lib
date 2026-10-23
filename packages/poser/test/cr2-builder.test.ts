import { describe, it, expect } from 'vitest';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { Vector3, WavefrontMesh } from '@atp/geometry';
import {
  Cr2Builder,
  PoserAssetPipeline,
  PoserReader,
  MaterialNode,
} from '../src/index.js';

describe('Cr2Builder & Poser Asset Pipeline', () => {
  it('should assemble a complete rigged figure with bones, channels, and morph deltas', () => {
    const builder = new Cr2Builder('TestHairFigure');
    builder.setVersion('4.01');
    builder.setGeometryPath(':Runtime:Geometries:Hair:TestHair.obj');

    // Add root bone
    const rootActor = builder.addBone({
      name: 'hairRoot',
      origin: [0, 1.8, 0],
      endPoint: [0, 1.9, 0],
    });
    expect(rootActor.actorName).toBe('hairRoot');

    // Add child bone linked to root
    const tipActor = builder.addBone({
      name: 'hairTip',
      parentName: 'hairRoot',
      origin: [0, 1.9, 0],
      endPoint: [0, 2.0, -0.1],
    });
    expect(tipActor.actorName).toBe('hairTip');

    // Add morph delta to hairTip
    const deltaMap = new Map<number, Vector3>();
    deltaMap.set(12, new Vector3(0.015, -0.005, 0.03));
    deltaMap.set(13, new Vector3(0.02, -0.008, 0.045));
    builder.addMorphDelta('hairTip', 'BreezeLeft', deltaMap);

    // Add material
    builder.addMaterial('HairStrands', [0.8, 0.6, 0.3]);

    const cr2Text = builder.toString();

    // Verify key Poser blocks in output
    expect(cr2Text).toContain('version\r\n\t{\r\n\t\tnumber 4.01');
    expect(cr2Text).toContain('actor hairRoot:1');
    expect(cr2Text).toContain('objFileGeom 0 0 :Runtime:Geometries:Hair:TestHair.obj');
    expect(cr2Text).toContain('actor hairTip:1');
    expect(cr2Text).toContain('targetGeom BreezeLeft');
    expect(cr2Text).toContain('d 12 0.015000 -0.005000 0.030000');
    expect(cr2Text).toContain('figure\r\n\t{\r\n\t\tname TestHairFigure');
    expect(cr2Text).toContain('addChildNodes hairTip:1 hairRoot:1');
    expect(cr2Text).toContain('weldNodes hairTip:1 hairRoot:1');
    expect(cr2Text).toContain('material HairStrands');
  });

  it('should export paired Wavefront OBJ and CR2 files via PoserAssetPipeline', async () => {
    const tmpDir = path.resolve(__dirname, '../temp_export');

    // 1. Build mesh
    const mesh = new WavefrontMesh();
    const v0 = mesh.addVertex(0, 0, 0);
    const v1 = mesh.addVertex(1, 0, 0);
    const v2 = mesh.addVertex(0, 1, 0);

    mesh.addFace(
      [{ vIndex: v0 }, { vIndex: v1 }, { vIndex: v2 }],
      'hairRoot',
      'HairMat'
    );

    // 2. Build CR2
    const cr2 = new Cr2Builder('SampleHair');
    cr2.addBone({
      name: 'hairRoot',
      origin: [0, 0, 0],
      endPoint: [0, 1, 0],
    });

    // 3. Export pair
    const result = await PoserAssetPipeline.exportAssetPair(mesh, cr2, {
      runtimeDir: tmpDir,
      figureName: 'SampleHair',
    });

    expect(result.objRelativePoserPath).toBe(
      ':Runtime:Geometries:SampleHair:SampleHair.obj'
    );

    // Verify files were actually written to disk
    const objContent = await fs.readFile(result.objAbsolutePath, 'utf-8');
    const cr2Content = await fs.readFile(result.cr2AbsolutePath, 'utf-8');

    expect(objContent).toContain('g hairRoot');
    expect(objContent).toContain('usemtl HairMat');
    expect(cr2Content).toContain('actor hairRoot:1');
    expect(cr2Content).toContain(result.objRelativePoserPath);

    // Round-trip parse the generated CR2
    const parsedNode = await PoserReader.loadFromFile(result.cr2AbsolutePath);
    expect(parsedNode.findChild('figure')).not.toBeNull();
    expect(parsedNode.findChild('actor hairRoot:1')).not.toBeNull();

    // Clean up temporary files
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('should test Cr2Builder error and material color branches', () => {
    const builder = new Cr2Builder('Test');

    // addMaterial with diffuse color
    builder.addMaterial('Cloth', [0.1, 0.2, 0.3]);
    const mat = builder.root.children.find((c) => c.name === 'material Cloth') as MaterialNode;
    expect(mat).not.toBeUndefined();
    expect(mat.getDiffuseColor()?.slice(0, 3)).toEqual([0.1, 0.2, 0.3]);

    // addMorphDelta throwing Error when actor not found
    expect(() => {
      builder.addMorphDelta('nonexistent', 'morph', new Map());
    }).toThrow("Actor 'nonexistent' not found in CR2 document");

    // addDialGroup throwing Error when actor not found
    expect(() => {
      builder.addDialGroup('nonexistent', 'group');
    }).toThrow("Actor 'nonexistent' not found in CR2 document");

    // addWeightMap throwing Error when actor not found
    expect(() => {
      builder.addWeightMap('nonexistent', 'map');
    }).toThrow("Actor 'nonexistent' not found in CR2 document");
  });

  it('should add bone with Vector3 instances, array orientation, and channels', () => {
    const builder = new Cr2Builder('TestFig');

    const actor = builder.addBone({
      name: 'testBone',
      origin: new Vector3(1, 2, 3),
      endPoint: new Vector3(4, 5, 6),
      orientation: new Vector3(0, 45, 0),
      createDefaultChannels: false,
    });

    expect(actor.getOrigin().toArray()).toEqual([1, 2, 3]);
    expect(actor.getEndPoint().toArray()).toEqual([4, 5, 6]);
    expect(actor.getOrientation().toArray()).toEqual([0, 45, 0]);
    expect(actor.channels.children.length).toBe(0);

    // Orientation as array [x, y, z]
    const b = new Cr2Builder('TestArrayOrient');
    b.addBone({
      name: 'boneArray',
      orientation: [10, 20, 30],
      origin: [0, 1, 2],
      endPoint: [3, 4, 5],
    });
    expect(b.root.getActor('boneArray')?.getOrientation().toArray()).toEqual([10, 20, 30]);
  });

  it('should add weightmap using Map instance in Cr2Builder', () => {
    const builder = new Cr2Builder('TestFig');
    builder.addBone({ name: 'bone1' });

    const wMap = new Map<number, number>();
    wMap.set(0, 1.0);
    wMap.set(5, 0.5);

    builder.addWeightMap('bone1', 'bone1_zrot', wMap, 10);
    const wm = builder.root.getActor('bone1')?.getWeightMap('bone1_zrot');
    expect(wm?.getWeight(0)).toBe(1.0);
    expect(wm?.getWeight(5)).toBe(0.5);
  });
});

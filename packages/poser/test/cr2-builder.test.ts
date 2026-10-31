import { describe, it, expect } from 'vitest';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { Vector3, WavefrontMesh } from 'atp-geometry';
import {
  Cr2Builder,
  PoserAssetPipeline,
  PoserReader,
  MaterialNode,
  validateCr2,
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
    expect(cr2Text).toContain('figureResFile ":Runtime:Geometries:Hair:TestHair.obj"');
    expect(cr2Text).toContain('actor hairRoot:1');
    expect(cr2Text).toContain('geomHandlerGeom 13 hairRoot');
    expect(cr2Text).toContain('actor hairTip:1');
    expect(cr2Text).toContain('targetGeom BreezeLeft');
    expect(cr2Text).toContain('d 12 0.015000 -0.005000 0.030000');
    expect(cr2Text).toContain('figure\r\n\t{\r\n\t\tname TestHairFigure');
    expect(cr2Text).toContain('addChild hairTip:1\r\n\t\thairRoot:1');
    expect(cr2Text).toContain('weld hairTip:1\r\n\t\thairRoot:1');
    expect(cr2Text).toContain('material HairStrands');

    // Verify generated CR2 passes full validation with 0 errors and 0 warnings
    const validation = validateCr2(cr2Text);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toEqual([]);
    expect(builder.validate().valid).toBe(true);
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
    expect(validateCr2(cr2Content).valid).toBe(true);

    // Round-trip parse the generated CR2
    const parsedNode = await PoserReader.loadFromFile(result.cr2AbsolutePath);
    expect(parsedNode.findChild('figure')).not.toBeNull();
    expect(parsedNode.findChild('actor hairRoot:1')).not.toBeNull();
    expect(validateCr2(parsedNode).valid).toBe(true);

    // Clean up temporary files
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('should test Cr2Builder error and material color branches', () => {
    const builder = new Cr2Builder('Test');

    // addMaterial with diffuse color (placed inside figure block)
    builder.addMaterial('Cloth', [0.1, 0.2, 0.3]);
    const mat = builder.figure.getMaterial('Cloth') as MaterialNode;
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
    expect(b.validate().valid).toBe(true);
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
    expect(builder.validate().valid).toBe(true);
  });

  it('should support full rigging options in addBone and ERC methods in Cr2Builder', () => {
    const builder = new Cr2Builder('HairRig');

    // Root bone
    const head = builder.addBone({
      name: 'head',
      origin: [0, 1.7, 0],
      endPoint: [0, 1.8, 0],
    });
    expect(head.actorName).toBe('head');

    // Bone with rotateOrder, hasGeom, geomHandler, sphereFalloff array, parentName
    const tail1 = builder.addBone({
      name: 'tail_1',
      parentName: 'head',
      origin: [0, 1.55, 0],
      endPoint: [0.05, 1.48, -0.06],
      rotateOrder: 'zyx',
      hasGeom: 1,
      geomHandler: 13,
      sphereFalloff: {
        center: [0, 1.55, 0],
        innerRadius: 0.02,
        outerRadius: 0.04,
      },
    });

    expect(tail1.getRotateOrder()).toBe('zyx');
    expect(tail1.getHasGeom()).toBe(1);
    expect(tail1.getGeomHandler()).toEqual({ handlerType: 13, actorName: 'tail_1' });
    expect(tail1.getParent()).toBe('head:1');

    // Bone with sphereFalloff as Vector3
    const tail2 = builder.addBone({
      name: 'tail_2',
      parentName: 'tail_1',
      origin: [0.05, 1.48, -0.06],
      endPoint: [0.1, 1.35, -0.1],
      sphereFalloff: {
        center: new Vector3(0.05, 1.48, -0.06),
        innerRadius: 0.015,
        outerRadius: 0.035,
      },
    });
    expect(tail2.getSphereFalloff()?.innerRadius).toBe(0.015);

    // ERC Master dial on head
    const dial = builder.addMasterDial('head', 'tail_Curl', 'Curl (tail)', -100, 100, 0.02);
    expect(dial.name).toBe('valueParm tail_Curl');

    // Slave links on tail bones
    builder.addSlaveLink('tail_1', 'xrot', 'head:1', 'tail_Curl', 0.85);
    builder.addSlaveLink('tail_2', 'xrot', 'head:1', 'tail_Curl', 0.95);

    const cr2Text = builder.toString();
    expect(cr2Text).toContain('geomHandlerGeom 13 tail_1\r\n');
    expect(cr2Text).toContain('parent head:1\r\n');
    expect(cr2Text).toContain('sphereMatsRaw\r\n');
    expect(cr2Text).toContain('0.020000 0 0 0\r\n');
    expect(cr2Text).toContain('valueParm tail_Curl\r\n');
    expect(cr2Text).toContain('valueOpDeltaAdd\r\n');
    expect(cr2Text).toContain('deltaAddDelta 0.850000\r\n');

    const validation = validateCr2(cr2Text);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toEqual([]);
    expect(validation.warnings).toEqual([]);

    // Error handling for missing actors
    expect(() =>
      builder.addMasterDial('missingActor', 'dial', 'Dial')
    ).toThrow("Actor 'missingActor' not found in CR2 document");

    expect(() =>
      builder.addSlaveLink('missingActor', 'xrot', 'head', 'dial', 1.0)
    ).toThrow("Actor 'missingActor' not found in CR2 document");
  });
});

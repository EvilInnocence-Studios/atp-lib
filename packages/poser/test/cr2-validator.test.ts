import { describe, it, expect } from 'vitest';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { Vector3 } from 'atp-geometry';
import { PoserReader, PoserNode, Cr2Builder, validateCr2 } from '../src/index.js';

describe('CR2 Validator (validateCr2)', () => {
  it('should validate known-good Cookie Shirt.cr2 as valid with 0 errors', async () => {
    const goodPath = path.resolve(__dirname, 'fixtures/Cookie Shirt.cr2');
    const content = await fs.readFile(goodPath, 'utf-8');

    // Test both string and PoserNode inputs
    const resFromStr = validateCr2(content);
    expect(resFromStr.errors).toEqual([]);
    expect(resFromStr.valid).toBe(true);

    const parsedNode = PoserReader.parseString(content);
    const resFromNode = validateCr2(parsedNode);
    expect(resFromNode.errors).toEqual([]);
    expect(resFromNode.valid).toBe(true);
  });

  it('should validate known-good source.cr2 as valid with 0 errors', async () => {
    const sourcePath = path.resolve(__dirname, 'fixtures/source.cr2');
    const parsedNode = await PoserReader.loadFromFile(sourcePath);

    const res = validateCr2(parsedNode);
    expect(res.errors).toEqual([]);
    expect(res.valid).toBe(true);
  });

  it('should detect all structural and syntactic violations in known-bad my_hairstyle.cr2', async () => {
    const badPath = path.resolve(__dirname, 'fixtures/my_hairstyle.cr2');
    const content = await fs.readFile(badPath, 'utf-8');

    const res = validateCr2(content);
    expect(res.valid).toBe(false);

    const codes = new Set(res.errors.map((e) => e.code));

    // Verify all 10 categories of defects are caught:
    // 1. Unquoted figureResFile path & missing 2nd figureResFile / Pass 1 stubs
    expect(codes.has('C1.4_UNQUOTED_RUNTIME_PATH')).toBe(true);
    expect(codes.has('C2.2_MISSING_TWO_PASS_FIGURERESFILE')).toBe(true);
    expect(codes.has('C2.3_MISSING_ACTOR_STUBS')).toBe(true);

    // 2. Prohibited properties in Pass 2 actors (geomCustom, storageOffset, hasGeom, rotateOrder, sphere)
    expect(codes.has('C3.3_GEOMCUSTOM_IN_FIGURE_ACTOR')).toBe(true);
    expect(codes.has('C3.3_STUB_PROPS_IN_FULL_ACTOR')).toBe(true);
    expect(codes.has('C3.7_PROHIBITED_ACTOR_PROPERTY')).toBe(true);

    // 3. Missing actor header/footer props & invalid parent NONE:1 on BODY
    expect(codes.has('C3.4_MISSING_ACTOR_HEADER_PROPS')).toBe(true);
    expect(codes.has('C3.4_INVALID_BODY_PARENT')).toBe(true);
    expect(codes.has('C3.6_MISSING_ACTOR_FOOTER_PROPS')).toBe(true);

    // 4. Empty groups, bare keys, missing interpStyleLocked, invalid scale channel types
    expect(codes.has('C4.4_EMPTY_GROUPS')).toBe(true);
    expect(codes.has('C4.2_INVALID_SCALE_CHANNEL_TYPE')).toBe(true);
    expect(codes.has('C4.1_BARE_KEYS_NODE')).toBe(true);
    expect(codes.has('C4.1_MISSING_INTERP_STYLE_LOCKED')).toBe(true);

    // 5. Missing *OffsetA/*OffsetB and joint/twist deformer channels
    expect(codes.has('C4.6_MISSING_OFFSET_CHANNELS')).toBe(true);
    expect(codes.has('C4.8_MISSING_JOINT_DEFORMERS')).toBe(true);

    // 6. Figure hierarchy syntax errors, missing welds, prohibited directives inside figure
    expect(codes.has('C5.2_INVALID_ADDCHILD_SYNTAX')).toBe(true);
    expect(codes.has('C5.4_MISSING_WELDS')).toBe(true);
    expect(codes.has('C5.5_PROHIBITED_FIGURE_DIRECTIVE')).toBe(true);

    // 7. Materials at root instead of inside figure, invalid doc { addTree }, missing setGeomHandlerOffset
    expect(codes.has('C5.6_MATERIAL_AT_ROOT')).toBe(true);
    expect(codes.has('C5.6_MISSING_MATERIALS_IN_FIGURE')).toBe(true);
    expect(codes.has('C2.7_INVALID_DOC_ADDTREE')).toBe(true);
    expect(codes.has('C2.7_MISSING_GEOM_HANDLER_OFFSET')).toBe(true);

    // Also check warnings (e.g. _SELF_ in valueOpDeltaAdd)
    const warnCodes = new Set(res.warnings.map((w) => w.code));
    expect(warnCodes.has('C4.3_ERC_SELF_SYNTAX')).toBe(true);
  });

  it('should catch unbalanced braces, empty root, and edge-case material/figure errors', () => {
    const unbalanced = validateCr2('{\r\n\tversion\r\n\t{\r\n\t\tnumber 7\r\n');
    expect(unbalanced.valid).toBe(false);
    expect(unbalanced.errors.some((e) => e.code === 'C1.2_UNBALANCED_BRACES')).toBe(true);

    const emptyNode = new PoserNode(null, '');
    const emptyRes = validateCr2(emptyNode);
    expect(emptyRes.valid).toBe(false);
    expect(emptyRes.errors.some((e) => e.code === 'C1.2_EMPTY_ROOT')).toBe(true);

    // Test mismatched figureResFile, unquoted morphBinaryFile, invalid stub content,
    // weldNodes, addChildNodes, and material formatting errors
    const syntheticCr2 = [
      '{',
      '\tinvalidFirstChild',
      '\tmorphBinaryFile :Runtime:Geometries:unquoted.pmd',
      '\tfigureResFile ":Runtime:Geometries:a.obj"',
      '\tactor BODY',
      '\t{',
      '\t\tinvalidStubProp 1',
      '\t}',
      '\tfigureResFile ":Runtime:Geometries:b.obj"',
      '\tactor hip:2',
      '\t{',
      '\t\tparent NONE:2',
      '\t}',
      '\tfigure',
      '\t{',
      '\t\taddChildNodes hip:2 BODY:1',
      '\t\tweldNodes hip:2 BODY:1',
      '\t\taddChild orphan:2',
      '\t\tweld orphan:2',
      '\t\tmaterial BadMat',
      '\t\t{',
      '\t\t\tnsExponent 45',
      '\t\t\tspecularMap ":Runtime:Textures:spec.png" 0 0',
      '\t\t\ttextureMap :Runtime:Textures:unquoted.png',
      '\t\t\tbumpMap ":Runtime:Textures:bump.png" 0 0',
      '\t\t}',
      '\t}',
      '}',
    ].join('\r\n');

    const synRes = validateCr2(syntheticCr2);
    expect(synRes.valid).toBe(false);
    const synCodes = new Set(synRes.errors.map((e) => e.code));

    expect(synCodes.has('C2.1_MISSING_VERSION')).toBe(true);
    expect(synCodes.has('C1.4_UNQUOTED_RUNTIME_PATH')).toBe(true);
    expect(synCodes.has('C2.4_MISMATCHED_FIGURERESFILE')).toBe(true);
    expect(synCodes.has('C1.3_MISSING_ACTOR_SUFFIX')).toBe(true);
    expect(synCodes.has('C3.1_INVALID_STUB_CONTENT')).toBe(true);
    expect(synCodes.has('C3.4_INVALID_PARENT_NONE')).toBe(true);
    expect(synCodes.has('C5.2_INVALID_ADDCHILD_SYNTAX')).toBe(true);
    expect(synCodes.has('C5.4_INVALID_WELD_SYNTAX')).toBe(true);
    expect(synCodes.has('C5.2_MISSING_ADDCHILD_PARENT_LINE')).toBe(true);
    expect(synCodes.has('C5.4_MISSING_WELD_PARENT_LINE')).toBe(true);
    expect(synCodes.has('C6.1_LOWERCASE_NSEXPONENT')).toBe(true);
    expect(synCodes.has('C6.2_INVALID_SPECULARMAP_KEYWORD')).toBe(true);
    expect(synCodes.has('C1.4_UNQUOTED_MAP_PATH')).toBe(true);
    expect(synCodes.has('C6.2_INLINE_MAP_FLAGS')).toBe(true);
  });

  it('should guarantee that every operation on Cr2Builder leaves the in-memory CR2 in a valid state', () => {
    const assertValid = (builder: Cr2Builder) => {
      const memRes = builder.validate();
      expect(memRes.errors).toEqual([]);
      expect(memRes.warnings).toEqual([]);
      expect(memRes.valid).toBe(true);

      const textRes = validateCr2(builder.toString());
      expect(textRes.errors).toEqual([]);
      expect(textRes.warnings).toEqual([]);
      expect(textRes.valid).toBe(true);
    };

    // Step 1: Newly constructed Cr2Builder
    const builder = new Cr2Builder('MyHair');
    assertValid(builder);

    // Step 2: Set version & geometry path
    builder.setVersion('7');
    builder.setGeometryPath(':Runtime:Geometries:PoserHairMaker:MyHair.obj');
    assertValid(builder);

    // Step 3: Add BODY and head bones
    builder.addBone({
      name: 'BODY',
      origin: [0, 0, 0],
      endPoint: [0, 1, 0],
      hasGeom: 0,
    });
    assertValid(builder);

    builder.addBone({
      name: 'head',
      parentName: 'BODY',
      origin: [0, 1.484, 0],
      endPoint: [0, 1.651, 0],
      rotateOrder: 'zyx',
      hasGeom: 1,
      geomHandler: 13,
    });
    assertValid(builder);

    // Step 4: Add strand bone chain with sphereFalloff
    builder.addBone({
      name: 'Ponytail_1_1',
      parentName: 'head',
      origin: [0, 1.547, -0.029],
      endPoint: [0.056, 1.481, -0.06],
      rotateOrder: 'zyx',
      hasGeom: 1,
      geomHandler: 13,
      sphereFalloff: {
        center: [0, 1.547, -0.029],
        innerRadius: 0.0175,
        outerRadius: 0.035,
      },
    });
    assertValid(builder);

    builder.addBone({
      name: 'Ponytail_1_2',
      parentName: 'Ponytail_1_1',
      origin: [0.056, 1.481, -0.06],
      endPoint: [0.088, 1.385, -0.068],
      rotateOrder: 'zyx',
      hasGeom: 1,
      geomHandler: 13,
      sphereFalloff: {
        center: [0.056, 1.481, -0.06],
        innerRadius: 0.02,
        outerRadius: 0.04,
      },
    });
    assertValid(builder);

    // Step 5: Add ERC master dial and slave links
    builder.addMasterDial('head', 'Ponytail_Curl', 'Curl (Ponytail)', -100, 100, 0.02);
    assertValid(builder);

    builder.addSlaveLink('Ponytail_1_1', 'xrot', 'head:1', 'Ponytail_Curl', 0.85);
    builder.addSlaveLink('Ponytail_1_2', 'xrot', 'head:1', 'Ponytail_Curl', 1.0);
    assertValid(builder);

    // Step 6: Add morph deltas
    const deltas = new Map<number, Vector3>([[0, new Vector3(0.01, 0.02, 0.03)]]);
    builder.addMorphDelta('head', 'WindBlow', deltas);
    assertValid(builder);

    // Step 7: Add full material with diffuse, transparency, bump, and specular maps
    const mat = builder.addMaterial('Hair_Material', [1, 1, 1]);
    mat.setColors([1, 1, 1], [0, 0, 0], [0.35, 0.35, 0.35]);
    mat.setNsExponent(45);
    mat.setTextureMap(':Runtime:Textures:PoserHairMaker:MyHair_diffuse.png');
    mat.setTransparencyMap(':Runtime:Textures:PoserHairMaker:MyHair_trans.png', 1, 0, 0.6);
    mat.setBumpMap(':Runtime:Textures:PoserHairMaker:MyHair_normal.png', 1);
    mat.setSpecularMap(':Runtime:Textures:PoserHairMaker:MyHair_spec.png');
    assertValid(builder);
  });
});


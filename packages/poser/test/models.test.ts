import { describe, it, expect } from 'vitest';
import { Vector3 } from 'atp-geometry';
import {
  PoserNode,
  RootNode,
  ActorNode,
  FigureNode,
  PropNode,
  MaterialNode,
  VectorNode,
  GeomCustomNode,
  ChannelsNode,
  GroupsNode,
  WeightMapNode,
  WeightMap,
  PoserWriter,
} from '../src/index.js';

describe('Poser Models & Rigging Components Coverage', () => {
  describe('PropNode', () => {
    it('should create prop and set external obj path', () => {
      const prop = new PropNode(null, 'HairComb');
      expect(prop.propName).toBe('HairComb');
      expect(prop.name).toBe('prop HairComb');

      prop.setObjPath(':Runtime:Geometries:Props:Comb.obj');
      const output = PoserWriter.writeToString(prop);
      expect(output).toContain('prop HairComb');
      expect(output).toContain('objFileGeom 0 0 :Runtime:Geometries:Props:Comb.obj');
    });
  });

  describe('VectorNode & GeomCustomNode', () => {
    it('should set and get 3D coordinates on VectorNode', () => {
      const vn = new VectorNode(null, 'origin', new Vector3(1, 2, 3));
      const v = vn.getVector();
      expect(v.toArray()).toEqual([1, 2, 3]);

      vn.setVector('origin', new Vector3(4, 5, 6));
      expect(vn.getVector().toArray()).toEqual([4, 5, 6]);
      expect(vn.name).toBe('origin 4.000000 5.000000 6.000000');
    });

    it('should test VectorNode with custom property name and fallback parsing', () => {
      const vn = new VectorNode(null, 'customProp');
      expect(vn.name).toBe('customProp 0.000000 0.000000 0.000000');

      const unknownVn = new VectorNode(null);
      unknownVn.name = 'origin';
      expect(unknownVn.getVector().toArray()).toEqual([0, 0, 0]);
    });

    it('should set and get path on GeomCustomNode', () => {
      const gc = new GeomCustomNode(null);
      gc.setObjPath(':Runtime:Geometries:test.obj');
      expect(gc.getObjPath()).toBe(':Runtime:Geometries:test.obj');
    });

    it('should test GeomCustomNode constructor with path and objFileGeom replacement', () => {
      const parent = new PoserNode(null, 'actor test:1');
      const gc = new GeomCustomNode(parent);
      expect(gc.getObjPath()).toBe('');

      gc.setObjPath(':Runtime:path1.obj');
      gc.setObjPath(':Runtime:path2.obj');
      expect(gc.getObjPath()).toBe(':Runtime:path2.obj');

      const gcWithPath = new GeomCustomNode(null, ':Runtime:path.obj');
      expect(gcWithPath.getObjPath()).toBe(':Runtime:path.obj');
    });
  });

  describe('MaterialNode', () => {
    it('should set diffuse color and texture maps', () => {
      const mat = new MaterialNode(null, 'HairMat');
      mat.setDiffuseColor(0.8, 0.5, 0.2);
      expect(mat.getDiffuseColor()).toEqual([0.8, 0.5, 0.2, 1]);

      mat.setTextureMap(':Runtime:Textures:Hair.jpg');
      expect(mat.getTextureMap()).toBe(':Runtime:Textures:Hair.jpg');

      const output = PoserWriter.writeToString(mat);
      expect(output).toContain('material HairMat');
      expect(output).toContain('KdColor 0.8000 0.5000 0.2000 1.0000');
      expect(output).toContain('textureMap ":Runtime:Textures:Hair.jpg" 0 0');
    });

    it('should support full hair shaders with setColors, transparency, bump, specular, and nsExponent', () => {
      const mat = new MaterialNode(null, 'Hair_Material');
      mat.setColors([1.0, 1.0, 1.0], [0.0, 0.0, 0.0], [0.35, 0.35, 0.35]);
      mat.setNsExponent(45);
      mat.setTextureMap(':Runtime:Textures:PoserHairMaker:MyHair_diffuse.png');
      mat.setTransparencyMap(':Runtime:Textures:PoserHairMaker:MyHair_trans.png', 1, 0, 0.6);
      mat.setBumpMap(':Runtime:Textures:PoserHairMaker:MyHair_normal.png', 1);
      mat.setSpecularMap(':Runtime:Textures:PoserHairMaker:MyHair_spec.png');

      expect(mat.getTextureMap()).toBe(':Runtime:Textures:PoserHairMaker:MyHair_diffuse.png');
      expect(mat.getTransparencyMap()).toBe(':Runtime:Textures:PoserHairMaker:MyHair_trans.png');
      expect(mat.getBumpMap()).toBe(':Runtime:Textures:PoserHairMaker:MyHair_normal.png');
      expect(mat.getSpecularMap()).toBe(':Runtime:Textures:PoserHairMaker:MyHair_spec.png');

      const output = PoserWriter.writeToString(mat);
      expect(output).toContain('material Hair_Material\r\n');
      expect(output).toContain('KdColor 1.000000 1.000000 1.000000 1\r\n');
      expect(output).toContain('KaColor 0.000000 0.000000 0.000000 1\r\n');
      expect(output).toContain('KsColor 0.350000 0.350000 0.350000 1\r\n');
      expect(output).toContain('nsExponent 45\r\n');
      expect(output).toContain('tMin 1\r\n');
      expect(output).toContain('tMax 0\r\n');
      expect(output).toContain('tExpo 0.6\r\n');
      expect(output).toContain('bumpStrength 1\r\n');
      expect(output).toContain('textureMap ":Runtime:Textures:PoserHairMaker:MyHair_diffuse.png" 0 0\r\n');
      expect(output).toContain('transparencyMap ":Runtime:Textures:PoserHairMaker:MyHair_trans.png" 0 0\r\n');
      expect(output).toContain('bumpMap ":Runtime:Textures:PoserHairMaker:MyHair_normal.png" 0 0\r\n');
      expect(output).toContain('specularMap ":Runtime:Textures:PoserHairMaker:MyHair_spec.png" 0 0\r\n');
    });

    it('should test MaterialNode updating existing lines, blank node getters, and bare textureMap', () => {
      const mat = new MaterialNode(null, 'Mat');

      // Updating existing KdColor
      mat.setDiffuseColor(0.1, 0.2, 0.3, 0.4);
      mat.setDiffuseColor(0.5, 0.6, 0.7, 0.8);
      expect(mat.getDiffuseColor()).toEqual([0.5, 0.6, 0.7, 0.8]);

      // Updating existing textureMap, bumpMap, transparencyMap, specularMap
      mat.setTextureMap('path1.jpg');
      mat.setTextureMap('path2.jpg');
      expect(mat.getTextureMap()).toBe('path2.jpg');

      mat.setTransparencyMap('trans1.png', 0, 1, 0.5);
      mat.setTransparencyMap('trans2.png');
      expect(mat.getTransparencyMap()).toBe('trans2.png');

      mat.setBumpMap('bump1.png', 0.5);
      mat.setBumpMap('bump2.png');
      expect(mat.getBumpMap()).toBe('bump2.png');

      mat.setSpecularMap('spec1.png');
      mat.setSpecularMap('spec2.png');
      expect(mat.getSpecularMap()).toBe('spec2.png');

      // Pre-quoted paths (starts with quote)
      mat.setTextureMap('"quoted_tex.png"');
      expect(mat.getTextureMap()).toBe('quoted_tex.png');
      mat.setTransparencyMap('"quoted_trans.png"');
      expect(mat.getTransparencyMap()).toBe('quoted_trans.png');
      mat.setBumpMap('"quoted_bump.png"');
      expect(mat.getBumpMap()).toBe('quoted_bump.png');
      mat.setSpecularMap('"quoted_spec.png"');
      expect(mat.getSpecularMap()).toBe('quoted_spec.png');

      // Unquoted map property in children
      const unquotedMat = new MaterialNode(null, 'UnquotedMat');
      unquotedMat.children = [new PoserNode(unquotedMat, 'textureMap unquoted.png 0 0')];
      expect(unquotedMat.getTextureMap()).toBe('unquoted.png');

      // Unclosed quote map property in children
      const unclosedMat = new MaterialNode(null, 'Unclosed');
      unclosedMat.children = [new PoserNode(unclosedMat, 'textureMap "unclosed')];
      expect(unclosedMat.getTextureMap()).toBeNull();

      // Partial setColors
      mat.setColors([0.2, 0.3, 0.4]);
      mat.setColors(undefined, [0.1, 0.1, 0.1]);
      mat.setColors(undefined, undefined, [0.9, 0.9, 0.9]);

      // Getters on blank node
      const blank = new PoserNode(null, 'material Blank') as unknown as MaterialNode;
      Object.setPrototypeOf(blank, MaterialNode.prototype);
      blank.children = [];
      expect(blank.getTextureMap()).toBeNull();
      expect(blank.getTransparencyMap()).toBeNull();
      expect(blank.getBumpMap()).toBeNull();
      expect(blank.getSpecularMap()).toBeNull();
      expect(blank.getDiffuseColor()).toBeNull();

      // setDiffuseColor and setColors when properties not present
      const bareMat = new PoserNode(null, 'material Bare') as unknown as MaterialNode;
      Object.setPrototypeOf(bareMat, MaterialNode.prototype);
      bareMat.children = [];
      bareMat.setDiffuseColor(0.2, 0.4, 0.6);
      expect(bareMat.getDiffuseColor()?.slice(0, 3)).toEqual([0.2, 0.4, 0.6]);

      // getTextureMap when property is bare without argument
      const bareTexMat = new MaterialNode(null, 'BareTex');
      bareTexMat.children = [];
      bareTexMat.addPropertyNode('textureMap');
      bareTexMat.addPropertyNode('transparencyMap');
      bareTexMat.addPropertyNode('bumpMap');
      bareTexMat.addPropertyNode('specularMap');
      bareTexMat.addPropertyNode('KdColor 1');
      expect(bareTexMat.getTextureMap()).toBeNull();
      expect(bareTexMat.getTransparencyMap()).toBeNull();
      expect(bareTexMat.getBumpMap()).toBeNull();
      expect(bareTexMat.getSpecularMap()).toBeNull();
      expect(bareTexMat.getDiffuseColor()).toBeNull();
    });
  });

  describe('FigureNode & Bone Links', () => {
    it('should record child links and weld links accurately', () => {
      const fig = new FigureNode(null, 'MyFigure', 1);
      fig.addChildNode('hairMid', 'hairRoot');
      fig.addChildNode('hairTip', 'hairMid');
      fig.addWeldNode('hairMid', 'hairRoot');

      const children = fig.getChildrenLinks();
      expect(children.length).toBe(2);
      expect(children[0]).toEqual({ child: 'hairMid:1', parent: 'hairRoot:1' });

      const welds = fig.getWeldLinks();
      expect(welds.length).toBe(1);
      expect(welds[0]).toEqual({ child: 'hairMid:1', parent: 'hairRoot:1' });
    });

    it('should test FigureNode with pre-colonized bone names', () => {
      const fig = new FigureNode(null, 'Fig', 1);
      fig.addChildNode('child:1', 'parent:1');
      fig.addWeldNode('child:1', 'parent:1');

      const children = fig.getChildrenLinks();
      expect(children[0]).toEqual({ child: 'child:1', parent: 'parent:1' });

      const welds = fig.getWeldLinks();
      expect(welds[0]).toEqual({ child: 'child:1', parent: 'parent:1' });
    });
  });

  describe('ActorNode queries and setters', () => {
    it('should test origin, endPoint, orientation getters and weightmaps', () => {
      const actor = new ActorNode(null, 'hairRoot', 1);

      actor.setOrigin(new Vector3(0, 1.8, 0));
      expect(actor.getOrigin().toArray()).toEqual([0, 1.8, 0]);

      actor.setEndPoint(new Vector3(0, 1.9, 0));
      expect(actor.getEndPoint().toArray()).toEqual([0, 1.9, 0]);

      actor.setOrientation(new Vector3(0, 0, 45));
      expect(actor.getOrientation().toArray()).toEqual([0, 0, 45]);

      const wm = actor.addWeightMap('hairRoot_zrot', 50);
      expect(actor.getWeightMaps().length).toBe(1);
      expect(actor.getWeightMap('hairRoot_zrot')).toBe(wm);

      // Re-adding existing returns same instance with updated numVerts
      const readded = actor.addWeightMap('hairRoot_zrot', 60);
      expect(readded).toBe(wm);
      expect(readded.numVerts).toBe(60);
    });

    it('should support rigging enhancements: rotateOrder, geomHandler, hasGeom, parent, and sphereFalloff', () => {
      const actor = new ActorNode(null, 'tail_1', 1);
      actor.setRotateOrder('zyx');
      actor.setGeomHandler(13, 'tail_1');
      actor.setHasGeom(1);
      actor.setParent('head:1');
      actor.setOrigin(new Vector3(0, 1.55, 0));
      actor.setEndPoint(new Vector3(0.05, 1.48, -0.06));
      actor.setOrientation(new Vector3(0, 0, 0));
      actor.setSphereFalloff(new Vector3(0, 1.55, 0), 0.02, 0.04);

      expect(actor.getRotateOrder()).toBe('zyx');
      expect(actor.getGeomHandler()).toEqual({ handlerType: 13, actorName: 'tail_1' });
      expect(actor.getHasGeom()).toBe(1);
      expect(actor.getParent()).toBe('head:1');

      const falloff = actor.getSphereFalloff();
      expect(falloff?.center.toArray()).toEqual([0, 1.55, 0]);
      expect(falloff?.innerRadius).toBe(0.02);
      expect(falloff?.outerRadius).toBe(0.04);

      const output = PoserWriter.writeToString(actor);
      expect(output).toContain('actor tail_1:1\r\n');
      expect(output).toContain('geomHandlerGeom 13 tail_1\r\n');
      expect(output).toContain('hasGeom 1\r\n');
      expect(output).toContain('parent head:1\r\n');
      expect(output).toContain('rotateOrder zyx\r\n');
      expect(output).toContain('sphere\r\n');
      expect(output).toContain('center 0.000000 1.550000 0.000000\r\n');
      expect(output).toContain('innerRad 0.020000\r\n');
      expect(output).toContain('outerRad 0.040000\r\n');
    });

    it('should test updating existing rigging lines and edge case getters on ActorNode', () => {
      const actor = new ActorNode(null, 'tail', 1);

      // Default arguments
      actor.setRotateOrder();
      expect(actor.getRotateOrder()).toBe('zyx');
      actor.setRotateOrder('xyz');
      expect(actor.getRotateOrder()).toBe('xyz');

      actor.setGeomHandler();
      expect(actor.getGeomHandler()).toEqual({ handlerType: 13, actorName: 'tail' });
      actor.setGeomHandler(14, 'customTail');
      expect(actor.getGeomHandler()).toEqual({ handlerType: 14, actorName: 'customTail' });

      actor.setHasGeom(true);
      expect(actor.getHasGeom()).toBe(1);
      actor.setHasGeom(false);
      expect(actor.getHasGeom()).toBe(0);

      actor.setParent('head');
      expect(actor.getParent()).toBe('head:1');
      actor.setParent('UNIVERSE');
      expect(actor.getParent()).toBe('UNIVERSE');

      actor.setSphereFalloff(new Vector3(1, 2, 3), 0.1, 0.2);
      actor.setSphereFalloff(new Vector3(4, 5, 6), 0.3, 0.4);
      expect(actor.getSphereFalloff()?.center.toArray()).toEqual([4, 5, 6]);

      // Blank actor node getters
      const blank = new PoserNode(null, 'actor blank:1') as unknown as ActorNode;
      Object.setPrototypeOf(blank, ActorNode.prototype);
      blank.children = [];
      expect(blank.getRotateOrder()).toBeNull();
      expect(blank.getGeomHandler()).toBeNull();
      expect(blank.getHasGeom()).toBeNull();
      expect(blank.getParent()).toBeNull();
      expect(blank.getSphereFalloff()).toBeNull();

      // Incomplete node getters (bare properties without values)
      const barePropsActor = new PoserNode(null, 'actor bare:1') as unknown as ActorNode;
      Object.setPrototypeOf(barePropsActor, ActorNode.prototype);
      barePropsActor.actorName = 'bare';
      barePropsActor.children = [
        new PoserNode(barePropsActor, 'rotateOrder'),
        new PoserNode(barePropsActor, 'geomHandlerGeom 13'),
        new PoserNode(barePropsActor, 'parent'),
      ];
      expect(barePropsActor.getRotateOrder()).toBeNull();
      expect(barePropsActor.getGeomHandler()).toEqual({ handlerType: 13, actorName: 'bare' });
      expect(barePropsActor.getParent()).toBeNull();

      // Incomplete sphere node getters (missing center, missing innerRad, missing outerRad)
      const incompleteSphereActor = new PoserNode(null, 'actor test:1') as unknown as ActorNode;
      Object.setPrototypeOf(incompleteSphereActor, ActorNode.prototype);
      incompleteSphereActor.children = [new PoserNode(incompleteSphereActor, 'sphere')];
      expect(incompleteSphereActor.getSphereFalloff()).toBeNull();

      const sphereWithCenterOnly = new PoserNode(null, 'sphere');
      sphereWithCenterOnly.children = [new PoserNode(sphereWithCenterOnly, 'center 0 0 0')];
      incompleteSphereActor.children = [sphereWithCenterOnly];
      expect(incompleteSphereActor.getSphereFalloff()).toBeNull();

      const sphereWithInnerOnly = new PoserNode(null, 'sphere');
      sphereWithInnerOnly.children = [
        new PoserNode(sphereWithInnerOnly, 'center 0 0 0'),
        new PoserNode(sphereWithInnerOnly, 'innerRad 1'),
      ];
      incompleteSphereActor.children = [sphereWithInnerOnly];
      expect(incompleteSphereActor.getSphereFalloff()).toBeNull();
    });
  });

  describe('ChannelsNode and GroupsNode edge cases', () => {
    it('should return existing morph when addMorph called twice', () => {
      const ch = new ChannelsNode(null);
      const m1 = ch.addMorph('Wind');
      const m2 = ch.addMorph('Wind');
      expect(m1).toBe(m2);
      expect(ch.getMorphs().length).toBe(1);
    });

    it('should support ERC master control dials (addMasterDial) and joint slave links (addSlaveLink)', () => {
      const ch = new ChannelsNode(null);
      ch.createDefaultChannels();

      const master = ch.addMasterDial('tail_Curl', 'Curl (tail)', -100, 100, 0.02);
      expect(ch.getMasterDials().length).toBe(1);
      expect(ch.getMasterDial('tail_Curl')).toBe(master);

      // Re-adding returns existing
      const readded = ch.addMasterDial('tail_Curl', 'Curl (tail)');
      expect(readded).toBe(master);

      ch.addSlaveLink('xrot', 'head:1', 'tail_Curl', 0.85);
      ch.addSlaveLink('yrot', 'head', 'tail_Curl', 0.5);
      ch.addSlaveLink('zrot', '_SELF_', 'tail_Curl', 1.0);

      // Calling addSlaveLink on missing channels auto-creates xrot, yrot, zrot
      const emptyCh = new ChannelsNode(null);
      emptyCh.addSlaveLink('xrot', 'head:1', 'tail_Curl', 0.5);
      emptyCh.addSlaveLink('yrot', 'Figure', 'tail_Curl', 0.5);
      emptyCh.addSlaveLink('zrot', 'Figure', 'tail_Curl', 0.5);
      expect(emptyCh.children.some((c) => c.name.includes('xrot'))).toBe(true);
      expect(emptyCh.children.some((c) => c.name.includes('yrot'))).toBe(true);
      expect(emptyCh.children.some((c) => c.name.includes('zrot'))).toBe(true);

      const output = PoserWriter.writeToString(ch);
      expect(output).toContain('valueParm tail_Curl\r\n');
      expect(output).toContain('name Curl (tail)\r\n');
      expect(output).toContain('initValue 0\r\n');
      expect(output).toContain('hidden 0\r\n');
      expect(output).toContain('forceLimits 0\r\n');
      expect(output).toContain('min -100\r\n');
      expect(output).toContain('max 100\r\n');
      expect(output).toContain('trackingScale 0.02\r\n');
      expect(output).toContain('keys\r\n');
      expect(output).toContain('static 0\r\n');
      expect(output).toContain('k 0 0\r\n');
      expect(output).toContain('interpStyleLocked 0\r\n');

      expect(output).toContain('valueOpDeltaAdd\r\n');
      expect(output).toContain('\t\t\t_SELF_\r\n');
      expect(output).toContain('\t\t\thead:1\r\n');
      expect(output).toContain('\t\t\ttail_Curl\r\n');
      expect(output).toContain('\t\tdeltaAddDelta 0.8500\r\n');
    });

    it('should query group names and parameter names on GroupsNode', () => {
      const grp = new GroupsNode(null, 'groups');
      const sub = grp.group('SubGroup', true);
      sub?.parameter('Param1', true);

      expect(grp.getGroupNames()).toContain('SubGroup');
      expect(sub?.getParameterNames()).toContain('Param1');
      expect(grp.hasGroup('missing')).toBe(false);
      expect(sub?.hasParameter('missing')).toBe(false);
    });

    it('should test ChannelsNode groups caching, raw node upgrade, existing instance, and null addGroup branch', () => {
      const ch = new ChannelsNode(null);
      const grp1 = ch.getOrCreateGroups();
      const grp2 = ch.getOrCreateGroups();
      expect(grp1).toBe(grp2);

      const param = ch.addParamToGroup('NewGroup', 'NewParam');
      expect(param?.name).toBe('parmNode NewParam');

      // Raw PoserNode named 'groups' upgraded to GroupsNode
      const chRaw = new ChannelsNode(null);
      chRaw.addChild('groups');
      expect(chRaw.getOrCreateGroups()).toBeInstanceOf(GroupsNode);

      // Existing GroupsNode instance in children
      const ch2 = new ChannelsNode(null);
      const existingGrp = new GroupsNode(ch2, 'groups');
      ch2.children.push(existingGrp);
      expect(ch2.getOrCreateGroups()).toBe(existingGrp);

      // addParamToGroup when addGroup returns null
      const chNull = new ChannelsNode(null);
      chNull.addGroup = () => null;
      expect(chNull.addParamToGroup('any', 'param')).toBeNull();
    });

    it('should test GroupsNode query branches, parmNode sync, and parameter caching', () => {
      const grp = new GroupsNode(null, 'groups');
      expect(grp.group('', false)).toBe(grp);
      expect(grp.group('')).toBe(grp);
      expect(grp.group('Nonexistent', false)).toBeNull();
      expect(grp.parameter('Nonexistent', false)).toBeNull();

      // syncFromChildren with parmNode
      const rawGroup = new PoserNode(null, 'groups');
      rawGroup.hasChildrenBlock = true;
      rawGroup.addProperty('parmNode MyDial');
      const typedGroup = new GroupsNode(null, 'groups');
      typedGroup.children = rawGroup.children;
      typedGroup.syncFromChildren();
      expect(typedGroup.hasParameter('MyDial')).toBe(true);

      // parameter hit when already present
      const testGrp = new GroupsNode(null, 'groups');
      testGrp.parameter('CachedParm', true);
      expect(testGrp.parameter('CachedParm')).not.toBeNull();

      // syncFromChildren when child is already GroupsNode instance
      const parentGrp = new GroupsNode(null, 'groups');
      const childGrpNode = new GroupsNode(parentGrp, 'groupNode Sub');
      parentGrp.children.push(childGrpNode);
      parentGrp.syncFromChildren();
      expect(parentGrp.hasGroup('Sub')).toBe(true);
    });
  });

  describe('RootNode operations', () => {
    it('should test setGeometryPath, addProp, addMaterial, and figure caching', () => {
      const root = new RootNode();
      root.setVersion('4.02');
      root.setGeometryPath(':Runtime:Geometries:test.obj');
      expect(root.getGeometryPath()).toBe(':Runtime:Geometries:test.obj');

      const actor = root.addActor('bone1');
      expect(actor.geomCustom.getObjPath()).toBe(':Runtime:Geometries:test.obj');

      const prop = root.addProp('hat');
      expect(prop.propName).toBe('hat');

      const mat = root.addMaterial('Cloth');
      expect(mat.materialName).toBe('Cloth');

      const fig1 = root.createFigure('Fig1');
      const fig2 = root.createFigure('Fig2');
      expect(fig1).toBe(fig2); // cached

      expect(root.getActor('bone1')).toBe(actor);
      expect(root.getActor('missing')).toBeUndefined();
    });
  });

  describe('WeightMapNode', () => {
    it('should test WeightMapNode bulge renaming variants, zero weight deletion, clearWeights, and syncFromNodes', () => {
      // Bulge with 2 parts: bulge_joint
      const wm2 = new WeightMapNode(null, 'bulge_zrot');
      expect(wm2.mapId).toBe('bulge_zrot');

      // Bulge with 3 parts and left actor: bulge_left arm_zrot
      const wm3 = new WeightMapNode(null, 'bulge_left arm_zrot');
      expect(wm3.mapId).toContain('larm');

      // Bulge with 4 parts
      const wm4 = new WeightMapNode(null, 'bulge_a_b_c_d');
      expect(wm4.mapId).toContain('bulge');

      // Setting weight to 0 deletes it
      const wm = new WeightMapNode(null, 'testMap');
      wm.setWeight(5, 1.0);
      expect(wm.getWeight(5)).toBe(1.0);
      wm.setWeight(5, 0);
      expect(wm.getWeight(5)).toBe(0);

      // clearWeights
      wm.setWeight(1, 0.5);
      wm.clearWeights();
      expect(wm.getNonZeroWeights().length).toBe(0);
      expect(wm.getWeights().size).toBe(0);

      // setMapId
      const wmTest = new WeightMapNode(null, 'initial');
      wmTest.setMapId('updated_id');
      expect(wmTest.mapId).toBe('updated_id');
      expect(wmTest.name).toBe('weightMap updated_id');

      // constructor with empty string cleanId
      const emptyWm = new WeightMapNode(null, '');
      expect(emptyWm.name).toBe('weightMap');
      expect(emptyWm.mapId).toBe('');

      // syncFromNodes with NaN numbVerts
      const nanWm = new WeightMapNode(null, 'nanMap');
      nanWm.addChild(new PoserNode(nanWm, 'numbVerts invalid'));
      nanWm.syncFromNodes();
      expect(nanWm.numVerts).toBe(0);
    });
  });

  describe('Spatial WeightMap', () => {
    it('should test reset, clear, and fallback to single closest point', () => {
      const wm = new WeightMap();
      wm.addWeight(new Vector3(0, 0, 0), 0.8);
      wm.addWeight(new Vector3(10, 0, 0), 0.2);

      // Reset
      wm.reset([{ point: new Vector3(5, 5, 5), weight: 0.5 }]);
      expect(wm.size).toBe(1);

      // Query point outside maxDistance: falls back to closest point
      wm.maxDistance = 1.0;
      const outsideWeight = wm.getWeight(new Vector3(100, 100, 100));
      expect(outsideWeight).toBe(0.5);

      // Clear
      wm.clear();
      expect(wm.size).toBe(0);
      expect(wm.getWeight(new Vector3(0, 0, 0))).toBe(0);
    });

    it('should test Spatial WeightMap with empty weights and zero influence points', () => {
      const emptyWeightMap = new WeightMap();
      expect(emptyWeightMap.getWeight(new Vector3(1, 2, 3))).toBe(0);

      const zeroKMap = new WeightMap();
      zeroKMap.addWeight(new Vector3(10, 10, 10), 1.0);
      zeroKMap.numInfluencePoints = 0;
      expect(zeroKMap.getWeight(new Vector3(0, 0, 0))).toBe(0);
    });
  });
});


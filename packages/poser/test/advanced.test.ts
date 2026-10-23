import { describe, it, expect } from 'vitest';
import {
  PoserNode,
  NodeList,
  GroupsNode,
  WeightMapNode,
  WeightMap,
  Cr2Builder,
  PoserWriter,
  PoserReader,
} from '../src/index.js';
import { Vector3 } from '@atp/geometry';

describe('Poser Advanced Models (NodeList, GroupsNode, WeightMap)', () => {
  describe('NodeList', () => {
    it('should manage and query node collections fluently', () => {
      const root = new PoserNode(null, 'root');
      const child1 = root.addChild('actor head:1');
      const child2 = root.addChild('actor hair:1');
      const sub1 = child1.addChild('channels');
      sub1.addChild('rotateY');

      const list = new NodeList([child1, child2]);
      expect(list.size).toBe(2);

      const allChannels = list.findAll('channels');
      expect(allChannels.size).toBe(1);

      const foundPath = list.findPath('channels/rotateY');
      expect(foundPath.size).toBe(1);
      expect(foundPath.first()?.name).toBe('rotateY');

      const roots = list.root();
      expect(roots.size).toBe(1);
      expect(roots.first()?.name).toBe('root');

      // deleteSubNode
      child1.deleteSubNode('channels');
      expect(child1.findChild('channels')).toBeNull();
    });
  });

  describe('GroupsNode', () => {
    it('should create hierarchical dial groups with parmNodes', () => {
      const groups = new GroupsNode(null, 'groups');
      const morphGroup = groups.group('HairMorphs', true);
      expect(morphGroup).not.toBeNull();
      expect(groups.hasGroup('HairMorphs')).toBe(true);

      const parm = morphGroup!.parameter('WindBlow', true);
      expect(parm).not.toBeNull();
      expect(morphGroup!.hasParameter('WindBlow')).toBe(true);

      const exported = PoserWriter.writeToString(groups);
      expect(exported).toContain('groupNode HairMorphs');
      expect(exported).toContain('collapsed 1');
      expect(exported).toContain('parmNode WindBlow');

      // Test syncFromChildren roundtrip
      const parsed = PoserReader.parseString(exported);
      const restored = new GroupsNode(null, 'groups');
      restored.children = parsed.children[0].children;
      restored.syncFromChildren();

      expect(restored.hasGroup('HairMorphs')).toBe(true);
      const restoredSub = restored.group('HairMorphs');
      expect(restoredSub?.hasParameter('WindBlow')).toBe(true);
    });
  });

  describe('WeightMapNode', () => {
    it('should normalize mapId and format sparse weights', () => {
      const wm = new WeightMapNode(null, 'bulge_RightArm_zrot');
      expect(wm.mapId).toBe('bulge_rArm_zrot');
      expect(wm.name).toBe('weightMap bulge_rArm_zrot');

      wm.setNumVerts(500);
      wm.setWeight(0, 1.0);
      wm.setWeight(15, 0.75);
      wm.setWeight(42, 0.25);

      expect(wm.getWeight(0)).toBe(1.0);
      expect(wm.getWeight(15)).toBe(0.75);
      expect(wm.getWeight(999)).toBe(0.0);

      wm.syncToNodes();
      const output = PoserWriter.writeToString(wm);

      expect(output).toContain('weightMap bulge_rArm_zrot');
      expect(output).toContain('numbVerts 500');
      expect(output).toContain('v 0 1.000000');
      expect(output).toContain('v 15 0.750000');
      expect(output).toContain('v 42 0.250000');

      // Roundtrip syncFromNodes
      const parsed = PoserReader.parseString(output);
      const restored = new WeightMapNode(null, 'bulge_rArm_zrot');
      restored.children = parsed.children[0].children;
      restored.syncFromNodes();

      expect(restored.numVerts).toBe(500);
      expect(restored.getWeight(0)).toBe(1.0);
      expect(restored.getWeight(15)).toBe(0.75);
      expect(restored.getWeight(42)).toBe(0.25);
    });
  });

  describe('WeightMap spatial interpolation', () => {
    it('should interpolate weights using inverse distance weighting', () => {
      const map = new WeightMap();
      map.addWeight(new Vector3(0, 0, 0), 1.0);
      map.addWeight(new Vector3(10, 0, 0), 0.0);

      expect(map.size).toBe(2);

      // Query exactly at first point
      const w0 = map.getWeight(new Vector3(0, 0, 0));
      expect(w0).toBe(1.0);

      // Query exactly at second point
      const w10 = map.getWeight(new Vector3(10, 0, 0));
      expect(w10).toBe(0.0);

      // Query midway: with equal distance to 0 and 10, IDW gives exactly 0.5
      const mid = map.getWeight(new Vector3(5, 0, 0));
      expect(mid).toBeCloseTo(0.5, 3);
    });
  });

  describe('Cr2Builder with dial groups and weight maps', () => {
    it('should build and export figure with dial groups and weight maps', () => {
      const builder = new Cr2Builder('TestRiggedHair')
        .setGeometryPath(':Runtime:Geometries:Hair:hair.obj');

      builder.addBone({
        name: 'hairRoot',
        origin: [0, 1.8, 0],
        endPoint: [0, 1.9, 0],
      });

      builder.addDialGroup('hairRoot', 'Styles', ['Wind', 'Length']);
      builder.addWeightMap('hairRoot', 'hairRoot_zrot', [[0, 1.0], [1, 0.5]], 100);

      const cr2Output = builder.toString();
      expect(cr2Output).toContain('actor hairRoot:1');
      expect(cr2Output).toContain('groupNode Styles');
      expect(cr2Output).toContain('parmNode Wind');
      expect(cr2Output).toContain('parmNode Length');
      expect(cr2Output).toContain('weightMap hairRoot_zrot');
      expect(cr2Output).toContain('numbVerts 100');
      expect(cr2Output).toContain('v 0 1.000000');
      expect(cr2Output).toContain('v 1 0.500000');
    });
  });
});

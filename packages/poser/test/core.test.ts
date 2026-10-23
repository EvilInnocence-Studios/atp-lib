import { describe, it, expect } from 'vitest';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import {
  PoserNode,
  NodeList,
  PoserPathResolver,
  PoserWriter,
} from '../src/core/index.js';

describe('Poser Core & AST Edge Case Coverage', () => {
  describe('PoserNode', () => {
    it('should test depth calculation across hierarchy', () => {
      const root = new PoserNode(null, 'root');
      expect(root.depth).toBe(0);

      const level1 = root.addChild('level1');
      expect(level1.depth).toBe(1);

      const level2 = level1.addChild('level2');
      expect(level2.depth).toBe(2);
    });

    it('should addChild with PoserNode instance and ifNotExists', () => {
      const root = new PoserNode(null, 'root');
      const child = new PoserNode(null, 'actor head:1');

      // Add by instance
      const added = root.addChild(child);
      expect(added).toBe(child);
      expect(child.parent).toBe(root);

      // ifNotExists = true when already present
      const dup = new PoserNode(null, 'actor head:1');
      const existing = root.addChild(dup, true);
      expect(existing).toBe(child);

      // ifNotExists = true when string already present
      const strDup = root.addChild('actor head:1', true);
      expect(strDup).toBe(child);
    });

    it('should test subNode and deleteSubNode boundary cases', () => {
      const root = new PoserNode(null, 'root');
      const c0 = root.addChild('c0');
      const c1 = root.addChild('c1');

      expect(root.subNodeCount()).toBe(2);
      expect(root.subNodes().length).toBe(2);

      // subNode by index
      expect(root.subNode(0)).toBe(c0);
      expect(root.subNode(10)).toBeNull();

      // deleteSubNode by invalid index
      expect(root.deleteSubNode(-1)).toBeNull();
      expect(root.deleteSubNode(999)).toBeNull();

      // deleteSubNode by non-existent name
      expect(root.deleteSubNode('nonexistent')).toBeNull();

      // removeChild that is not a child
      const foreign = new PoserNode(null, 'foreign');
      expect(root.removeChild(foreign)).toBe(false);

      // Successful deleteSubNode by index
      const deleted0 = root.deleteSubNode(0);
      expect(deleted0).toBe(c0);
      expect(root.children.length).toBe(1);

      // Delete last remaining child resets hasChildrenBlock
      root.deleteSubNode(0);
      expect(root.children.length).toBe(0);
      expect(root.hasChildrenBlock).toBe(false);
    });

    it('should test findPath with multiple separators and non-existent segments', () => {
      const root = new PoserNode(null, 'root');
      const fig = root.addChild('figure');
      const ch = fig.addChild('channels');
      ch.addChild('rotateX');

      expect(root.findPath('figure/channels/rotateX')?.name).toBe('rotateX');
      expect(root.findPath('figure:channels:rotateX')?.name).toBe('rotateX');
      expect(root.findPath('figure/channels/missing')).toBeNull();
      expect(root.findPath('missing/channels')).toBeNull();
    });

    it('should test clear method', () => {
      const root = new PoserNode(null, 'root');
      root.addChild('child');
      root.clear();
      expect(root.name).toBe('');
      expect(root.children.length).toBe(0);
      expect(root.hasChildrenBlock).toBe(false);
    });

    it('should test recursive findChild and findChildren', () => {
      const root = new PoserNode(null, 'root');
      const branch1 = root.addChild('branch1');
      const leaf = branch1.addChild('targetNode');
      const branch2 = root.addChild('branch2');
      branch2.addChild('targetNode');

      // recursive findChild
      const found = root.findChild('targetNode', true);
      expect(found).toBe(leaf);

      // recursive findChildren
      const allFound = root.findChildren('targetNode', true);
      expect(allFound.length).toBe(2);
    });
  });

  describe('NodeList', () => {
    it('should test constructor variants and iteration', () => {
      const n1 = new PoserNode(null, 'n1');
      const n2 = new PoserNode(null, 'n2');

      // Construct with Set
      const listFromSet = new NodeList(new Set([n1, n2]));
      expect(listFromSet.length).toBe(2);

      // Construct empty
      const emptyList = new NodeList();
      expect(emptyList.size).toBe(0);
      expect(emptyList.first()).toBeNull();

      // Test iterator
      const collected: string[] = [];
      for (const node of listFromSet) {
        collected.push(node.name);
      }
      expect(collected).toEqual(['n1', 'n2']);
    });

    it('should test add, clear, toArray, setName, parent, remove', () => {
      const root = new PoserNode(null, 'root');
      const a1 = root.addChild('a1');
      const a2 = root.addChild('a2');

      const list = new NodeList();
      list.add(a1).add(a2);
      expect(list.size).toBe(2);
      expect(list.toArray()).toEqual([a1, a2]);

      // setName
      list.setName('renamed');
      expect(a1.name).toBe('renamed');
      expect(a2.name).toBe('renamed');

      // parent
      const parents = list.parent();
      expect(parents.size).toBe(1);
      expect(parents.first()).toBe(root);

      // remove detaches from parent
      list.remove();
      expect(root.children.length).toBe(0);
      expect(list.size).toBe(0);

      // clear
      const freshList = new NodeList([new PoserNode()]);
      freshList.clear();
      expect(freshList.size).toBe(0);
    });

    it('should test addSubNode, subNode, subNodes, and find', () => {
      const p1 = new PoserNode(null, 'p1');
      const p2 = new PoserNode(null, 'p2');
      const list = new NodeList([p1, p2]);

      const added = list.addSubNode('childBlock');
      expect(added.size).toBe(2);

      const subs = list.subNode('childBlock');
      expect(subs.size).toBe(2);

      const allSubs = list.subNodes();
      expect(allSubs.size).toBe(2);

      const found = list.find('childBlock');
      expect(found).not.toBeNull();
      expect(list.find('nonexistent')).toBeNull();
    });

    it('should test NodeList clearSubNodes and deleteSubNode', () => {
      const parent1 = new PoserNode(null, 'p1');
      const child1 = parent1.addChild('c1');
      child1.addChild('sub1');

      const parent2 = new PoserNode(null, 'p2');
      const child2 = parent2.addChild('c2');
      child2.addChild('sub2');

      const list = new NodeList([parent1, parent2]);
      list.deleteSubNode('c1');
      expect(parent1.children.length).toBe(0);

      // clearSubNodes
      const subList = new NodeList([child2]);
      subList.clearSubNodes();
      expect(child2.children.length).toBe(0);
      expect(child2.hasChildrenBlock).toBe(false);
    });
  });

  describe('PoserPathResolver', () => {
    it('should test getRuntimeRoot edge cases', () => {
      expect(PoserPathResolver.getRuntimeRoot('C:/Poser/Runtime/Geometries/hair.obj')).toBe(
        'C:/Poser/Runtime'
      );
      expect(PoserPathResolver.getRuntimeRoot('C:/Outside/Folder/file.obj')).toBe('');
    });

    it('should test toPoserRelativePath without runtime', () => {
      expect(PoserPathResolver.toPoserRelativePath('C:/Outside/file.obj')).toBe(
        'C:/Outside/file.obj'
      );
    });

    it('should test inRuntime with leading colon and varied slashes', () => {
      expect(PoserPathResolver.inRuntime(':Runtime:Geometries:hair.obj')).toBe(true);
      expect(PoserPathResolver.inRuntime('/some/path/Runtime/hair.obj')).toBe(true);
      expect(PoserPathResolver.inRuntime('C:\\Libraries\\hair.obj')).toBe(false);
    });
  });

  describe('PoserWriter stream export', () => {
    it('should export node tree via PoserWriter.exportNodeStream and exportToFile', async () => {
      const tmpFile = path.resolve(__dirname, '../temp_stream_export.cr2');
      const root = new PoserNode(null, '');
      root.hasChildrenBlock = true;
      root.addChild('version').addChild('number 4.01');

      await PoserWriter.exportNodeStream(root, tmpFile);

      const content = await fs.readFile(tmpFile, 'utf-8');
      expect(content).toContain('version');
      expect(content).toContain('number 4.01');

      // Test exportToFile alias
      await PoserWriter.exportToFile(root, tmpFile);
      const content2 = await fs.readFile(tmpFile, 'utf-8');
      expect(content2).toContain('version');

      await fs.unlink(tmpFile);
    });
  });
});

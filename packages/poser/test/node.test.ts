import { describe, it, expect } from 'vitest';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import {
  PoserNode,
  PoserWriter,
  PoserReader,
  PoserPathResolver,
} from '../src/core/index.js';

describe('Poser AST Core & Node Engine', () => {
  it('should build a hierarchical PoserNode tree and serialize with exact tabs and braces', () => {
    const root = new PoserNode(null, '');
    root.hasChildrenBlock = true;

    const versionNode = root.addChild('version');
    versionNode.addChild('number 4.01').hasChildrenBlock = false;

    const actorNode = root.addChild('actor hairRoot:1');
    actorNode.addChild('storageOffset 0 0 0').hasChildrenBlock = false;

    const channelsNode = actorNode.addChild('channels');
    channelsNode.addChild('rotateX xrot').hasChildrenBlock = false;

    const output = PoserWriter.writeToString(root);

    expect(output).toContain('{\r\n');
    expect(output).toContain('\tversion\r\n');
    expect(output).toContain('\t{\r\n');
    expect(output).toContain('\t\tnumber 4.01\r\n');
    expect(output).toContain('\t}\r\n');
    expect(output).toContain('\tactor hairRoot:1\r\n');
    expect(output).toContain('\t{\r\n');
    expect(output).toContain('\t\tstorageOffset 0 0 0\r\n');
    expect(output).toContain('\t\tchannels\r\n');
    expect(output).toContain('\t\t{\r\n');
    expect(output).toContain('\t\t\trotateX xrot\r\n');
    expect(output).toContain('\t\t}\r\n');
    expect(output).toContain('\t}\r\n');
    expect(output).toContain('}\r\n');
  });

  it('should parse Poser brace syntax round-trip', () => {
    const snippet = [
      '{',
      '\tversion',
      '\t{',
      '\t\tnumber 4.01',
      '\t}',
      '\tactor head:1',
      '\t{',
      '\t\tstorageOffset 0 1.5 0',
      '\t}',
      '}',
    ].join('\r\n');

    const parsed = PoserReader.parseString(snippet);
    expect(parsed.children.length).toBe(2);

    const version = parsed.findChild('version');
    expect(version).not.toBeNull();
    expect(version?.children[0]?.name).toBe('number 4.01');

    const actor = parsed.findChild('actor head:1');
    expect(actor).not.toBeNull();
    expect(actor?.children[0]?.name).toBe('storageOffset 0 1.5 0');
  });

  it('should resolve Poser Runtime paths accurately', () => {
    const winPath = 'P:\\Poser\\Runtime\\Geometries\\Hair\\MyHair.obj';
    expect(PoserPathResolver.inRuntime(winPath)).toBe(true);

    const relPath = PoserPathResolver.toPoserRelativePath(winPath);
    expect(relPath).toBe(':Runtime:Geometries:Hair:MyHair.obj');

    const diskPath = PoserPathResolver.toDiskPath(relPath, 'P:/Poser');
    expect(diskPath.replace(/\\/g, '/')).toBe('P:/Poser/Runtime/Geometries/Hair/MyHair.obj');
  });

  it('should parse the real 3.3MB Poser test fixture source.cr2 without error', async () => {
    const fixturePath = path.resolve(__dirname, 'fixtures/source.cr2');

    const root = await PoserReader.loadFromFile(fixturePath);
    expect(root.children.length).toBeGreaterThan(0);

    // Verify version node
    const versionNode = root.findChild('version');
    expect(versionNode).not.toBeNull();

    // Verify actors exist in the real file
    const actors = root.findChildren('actor');
    expect(actors.length).toBeGreaterThan(10);

    // Verify figure node exists
    const figure = root.findChild('figure');
    expect(figure).not.toBeNull();
  });
});

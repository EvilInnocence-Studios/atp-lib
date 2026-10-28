import { describe, it, expect } from 'vitest';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import {
  Vector3,
  Vector2,
  WavefrontMesh,
  WavefrontWriter,
  WavefrontReader,
  WavefrontMtlWriter,
} from '../src/index.js';

describe('Wavefront OBJ Engine & Extended Mesh Features', () => {
  it('should support vector and primitive overloads for addVertex, addUV, addNormal', () => {
    const mesh = new WavefrontMesh();

    const v0 = mesh.addVertex(new Vector3(1, 2, 3));
    const uv0 = mesh.addUV(new Vector2(0.1, 0.2));
    const n0 = mesh.addNormal(new Vector3(0, 1, 0));

    expect(v0).toBe(0);
    expect(uv0).toBe(0);
    expect(n0).toBe(0);
    expect(mesh.vertices[0].toArray()).toEqual([1, 2, 3]);
    expect(mesh.uvs[0].toArray()).toEqual([0.1, 0.2]);
    expect(mesh.normals[0].toArray()).toEqual([0, 1, 0]);
  });

  it('should build, export, and parse a mesh with groups and materials', () => {
    const mesh = new WavefrontMesh();

    const v0 = mesh.addVertex(0, 0, 0);
    const v1 = mesh.addVertex(1, 0, 0);
    const v2 = mesh.addVertex(1, 1, 0);
    const v3 = mesh.addVertex(0, 1, 0);

    const uv0 = mesh.addUV(0, 0);
    const uv1 = mesh.addUV(1, 0);
    const uv2 = mesh.addUV(1, 1);
    const uv3 = mesh.addUV(0, 1);

    const n0 = mesh.addNormal(0, 0, 1);

    mesh.addFace(
      [
        { vIndex: v0, tIndex: uv0, nIndex: n0 },
        { vIndex: v1, tIndex: uv1, nIndex: n0 },
        { vIndex: v2, tIndex: uv2, nIndex: n0 },
      ],
      'hairRoot',
      'HairMat'
    );

    mesh.addFace(
      [
        { vIndex: v0, tIndex: uv0, nIndex: n0 },
        { vIndex: v2, tIndex: uv2, nIndex: n0 },
        { vIndex: v3, tIndex: uv3, nIndex: n0 },
      ],
      'hairTip',
      'HairMat'
    );

    expect(mesh.vertices.length).toBe(4);
    expect(mesh.uvs.length).toBe(4);
    expect(mesh.normals.length).toBe(1);
    expect(mesh.faces.length).toBe(2);
    expect(mesh.getGroups()).toEqual(['hairRoot', 'hairTip']);
    expect(mesh.getMaterials()).toEqual(['HairMat']);

    const objString = WavefrontWriter.writeToString(mesh, {
      headerComment: 'Test Hair Mesh',
      precision: 4,
      mtllib: 'hair.mtl',
    });

    expect(objString).toContain('v 0.0000 0.0000 0.0000');
    expect(objString).toContain('mtllib hair.mtl');
    expect(objString).toContain('g hairRoot');
    expect(objString).toContain('usemtl HairMat');
    expect(objString).toContain('f 1/1/1 2/2/1 3/3/1');
    expect(objString).toContain('g hairTip');

    const parsedMesh = WavefrontReader.parseString(objString);
    expect(parsedMesh.vertices.length).toBe(4);
    expect(parsedMesh.uvs.length).toBe(4);
    expect(parsedMesh.normals.length).toBe(1);
    expect(parsedMesh.faces.length).toBe(2);
    expect(parsedMesh.getGroups()).toEqual(['hairRoot', 'hairTip']);
    expect(parsedMesh.getMaterials()).toEqual(['HairMat']);
  });

  it('should test group vertex indexing and edge cases', () => {
    const mesh = new WavefrontMesh();
    const v0 = mesh.addVertex(0, 0, 0);
    const v1 = mesh.addVertex(1, 0, 0);
    const v2 = mesh.addVertex(0, 1, 0);

    mesh.addFace([{ vIndex: v0 }, { vIndex: v1 }, { vIndex: v2 }], 'groupA', 'matA');

    expect(mesh.getFacesByGroup('groupA').length).toBe(1);
    expect(mesh.getFacesByGroup('unknown').length).toBe(0);

    expect(mesh.getGroupVertexIndex('groupA', v1)).toBe(1);
    expect(mesh.getGroupVertexIndex('groupA', 999)).toBe(-1);

    expect(mesh.getTrueVertexIndex('groupA', 1)).toBe(v1);
    expect(mesh.getTrueVertexIndex('groupA', -1)).toBe(-1);
    expect(mesh.getTrueVertexIndex('groupA', 999)).toBe(-1);
  });

  it('should calculate normals in both smooth and faceted modes', () => {
    const mesh = new WavefrontMesh();

    // calculateNormals on empty mesh
    mesh.calculateNormals();
    expect(mesh.normals.length).toBe(0);

    const v0 = mesh.addVertex(0, 0, 0);
    const v1 = mesh.addVertex(1, 0, 0);
    const v2 = mesh.addVertex(0, 1, 0);

    mesh.addFace([{ vIndex: v0 }, { vIndex: v1 }, { vIndex: v2 }], 'groupA');

    // Add degenerate face (< 3 vertices) to test branch coverage
    mesh.addFace([{ vIndex: v0 }, { vIndex: v1 }], 'groupA');

    // Faceted mode
    mesh.calculateNormals('faceted');
    expect(mesh.normals.length).toBe(1);
    expect(mesh.faces[0].vertices[0].nIndex).toBe(0);

    // Smooth mode
    mesh.calculateNormals('smooth');
    expect(mesh.normals.length).toBe(3);

    // Test zero length fallback in smooth normal
    const degenerateMesh = new WavefrontMesh();
    const d0 = degenerateMesh.addVertex(0, 0, 0);
    const d1 = degenerateMesh.addVertex(0, 0, 0);
    const d2 = degenerateMesh.addVertex(0, 0, 0);
    degenerateMesh.addFace([{ vIndex: d0 }, { vIndex: d1 }, { vIndex: d2 }]);
    degenerateMesh.calculateNormals('smooth');
    expect(degenerateMesh.normals[0].y).toBe(1); // fallback unit normal
  });

  it('should test clone and clear methods', () => {
    const mesh = new WavefrontMesh();
    mesh.addVertex(1, 2, 3);
    mesh.addUV(0.5, 0.5);
    mesh.addNormal(0, 1, 0);
    mesh.addFace([{ vIndex: 0, tIndex: 0, nIndex: 0 }], 'g1', 'm1');

    const cloned = mesh.clone();
    expect(cloned.vertices.length).toBe(1);
    expect(cloned.uvs.length).toBe(1);
    expect(cloned.normals.length).toBe(1);
    expect(cloned.faces.length).toBe(1);

    mesh.clear();
    expect(mesh.vertices.length).toBe(0);
    expect(mesh.uvs.length).toBe(0);
    expect(mesh.normals.length).toBe(0);
    expect(mesh.faces.length).toBe(0);
  });

  it('should export all 4 face format variations (v, v/vt, v//vn, v/vt/vn)', () => {
    const mesh = new WavefrontMesh();
    const v0 = mesh.addVertex(0, 0, 0);
    const v1 = mesh.addVertex(1, 0, 0);
    const v2 = mesh.addVertex(0, 1, 0);

    const uv0 = mesh.addUV(0, 0);
    const n0 = mesh.addNormal(0, 0, 1);

    // Face 1: vertex only
    mesh.addFace([{ vIndex: v0 }, { vIndex: v1 }, { vIndex: v2 }], 'f1');
    // Face 2: vertex + UV
    mesh.addFace(
      [{ vIndex: v0, tIndex: uv0 }, { vIndex: v1, tIndex: uv0 }, { vIndex: v2, tIndex: uv0 }],
      'f2'
    );
    // Face 3: vertex + Normal
    mesh.addFace(
      [{ vIndex: v0, nIndex: n0 }, { vIndex: v1, nIndex: n0 }, { vIndex: v2, nIndex: n0 }],
      'f3'
    );

    const output = WavefrontWriter.writeToString(mesh);
    expect(output).toContain('f 1 2 3');
    expect(output).toContain('f 1/1 2/1 3/1');
    expect(output).toContain('f 1//1 2//1 3//1');
  });

  it('should stream exportToFile and handle loadFromFile', async () => {
    const tmpFile = path.resolve(__dirname, '../temp_test.obj');

    const mesh = new WavefrontMesh();
    mesh.addVertex(1, 2, 3);
    mesh.addVertex(4, 5, 6);
    mesh.addVertex(7, 8, 9);
    mesh.addFace([{ vIndex: 0 }, { vIndex: 1 }, { vIndex: 2 }]);

    await WavefrontWriter.exportToFile(mesh, tmpFile);

    const loaded = await WavefrontReader.loadFromFile(tmpFile);
    expect(loaded.vertices.length).toBe(3);
    expect(loaded.faces.length).toBe(1);

    // Test verticesOnly option
    const vertsOnly = await WavefrontReader.loadFromFile(tmpFile, true);
    expect(vertsOnly.vertices.length).toBe(3);
    expect(vertsOnly.faces.length).toBe(0);

    await fs.unlink(tmpFile);
  });

  it('should parse negative relative indices and comments in WavefrontReader', () => {
    const objText = `
      # Header comment
      v 0 0 0
      v 1 0 0
      v 0 1 0
      vt 0.0 0.0
      vn 0 0 1
      # Face using relative negative indexing
      f -3/-1/-1 -2/-1/-1 -1/-1/-1
      o TestObject
    `;

    const mesh = WavefrontReader.parseString(objText);
    expect(mesh.vertices.length).toBe(3);
    expect(mesh.uvs.length).toBe(1);
    expect(mesh.normals.length).toBe(1);
    expect(mesh.faces.length).toBe(1);
    expect(mesh.faces[0].vertices[0].vIndex).toBe(0);
    expect(mesh.faces[0].vertices[1].vIndex).toBe(1);
    expect(mesh.faces[0].vertices[2].vIndex).toBe(2);
  });

  it('should cover branch defaults for addVertex, addUV, addNormal, out-of-range faces, and empty group/mat', () => {
    const mesh = new WavefrontMesh();

    // addVertex / addUV / addNormal with missing optional parameters
    const vIdx = (mesh.addVertex as any)(5);
    expect(mesh.vertices[vIdx].x).toBe(5);
    expect(mesh.vertices[vIdx].y).toBe(0);
    expect(mesh.vertices[vIdx].z).toBe(0);

    const uvIdx = (mesh.addUV as any)(0.5);
    expect(mesh.uvs[uvIdx].u).toBe(0.5);
    expect(mesh.uvs[uvIdx].v).toBe(0);

    const nIdx = (mesh.addNormal as any)(1);
    expect(mesh.normals[nIdx].x).toBe(1);
    expect(mesh.normals[nIdx].y).toBe(0);
    expect(mesh.normals[nIdx].z).toBe(0);

    // Face with non-existent vertex indices in calculateNormals
    const badMeshFaceted = new WavefrontMesh();
    badMeshFaceted.addVertex(0, 0, 0);
    badMeshFaceted.addFace([{ vIndex: 999 }, { vIndex: 1000 }, { vIndex: 1001 }]);
    badMeshFaceted.calculateNormals('faceted');
    expect(badMeshFaceted.normals.length).toBe(0);

    const badMeshSmooth = new WavefrontMesh();
    badMeshSmooth.addVertex(0, 0, 0);
    badMeshSmooth.addFace([{ vIndex: 999 }, { vIndex: 1000 }, { vIndex: 1001 }]);
    badMeshSmooth.calculateNormals('smooth');
    expect(badMeshSmooth.normals.length).toBe(1); // vertexNormals default fallback

    // WavefrontReader with extra whitespace in face definitions
    const parsed = WavefrontReader.parseString(`
      v 1 2 3
      v 4 5 6
      v 7 8 9
      f  1  2  3  
    `);
    expect(parsed.faces.length).toBe(1);

    // WavefrontWriter with empty string group and material
    const defaultGroupMatMesh = new WavefrontMesh();
    defaultGroupMatMesh.addVertex(0, 0, 0);
    defaultGroupMatMesh.addVertex(1, 0, 0);
    defaultGroupMatMesh.addVertex(0, 1, 0);
    defaultGroupMatMesh.addFace(
      [{ vIndex: 0 }, { vIndex: 1 }, { vIndex: 2 }],
      '',
      ''
    );
    const written = WavefrontWriter.writeToString(defaultGroupMatMesh);
    expect(written).toContain('g default');
    expect(written).not.toContain('usemtl');
  });

  it('should load real Wavefront OBJ test fixture sphere.obj without error', async () => {
    const fixturePath = path.resolve(__dirname, 'fixtures/sphere.obj');
    const mesh = await WavefrontReader.loadFromFile(fixturePath);
    expect(mesh.vertices.length).toBeGreaterThan(100);
    expect(mesh.faces.length).toBeGreaterThan(100);
  });

  describe('WavefrontMtlWriter', () => {
    it('should format default material attributes with illum 2 and 4-decimal precision', () => {
      const materials = [{ name: 'Hair_Material' }];
      const output = WavefrontMtlWriter.writeToString(materials);

      expect(output).toContain('# Wavefront MTL Material Library\r\n');
      expect(output).toContain('newmtl Hair_Material\r\n');
      expect(output).toContain('Ka 0.2000 0.2000 0.2000\r\n');
      expect(output).toContain('Kd 0.7200 0.4800 0.3200\r\n');
      expect(output).toContain('Ks 0.4500 0.4500 0.4500\r\n');
      expect(output).toContain('Ns 45.0000\r\n');
      expect(output).toContain('illum 2\r\n');
      expect(output).toContain('d 1.0000\r\n');
    });

    it('should emit map channels (map_Kd, map_d, map_Bump, map_Ks) and custom properties when defined', () => {
      const materials = [
        {
          name: 'Hair_Material',
          kaColor: [0.1, 0.15, 0.2] as [number, number, number],
          kdColor: [0.8, 0.5, 0.3] as [number, number, number],
          ksColor: [0.3, 0.3, 0.3] as [number, number, number],
          nsExponent: 50,
          illum: 1,
          dissolve: 0.95,
          diffuseMap: ':Runtime:Textures:PoserHairMaker:Figure_diffuse.png',
          transparencyMap: ':Runtime:Textures:PoserHairMaker:Figure_trans.png',
          bumpMap: ':Runtime:Textures:PoserHairMaker:Figure_normal.png',
          specularMap: ':Runtime:Textures:PoserHairMaker:Figure_spec.png',
        },
      ];

      const output = WavefrontMtlWriter.writeToString(materials, {
        headerComment: 'Custom MTL Header',
        precision: 2,
      });

      expect(output).toContain('# Custom MTL Header\r\n');
      expect(output).toContain('newmtl Hair_Material\r\n');
      expect(output).toContain('Ka 0.10 0.15 0.20\r\n');
      expect(output).toContain('Kd 0.80 0.50 0.30\r\n');
      expect(output).toContain('Ks 0.30 0.30 0.30\r\n');
      expect(output).toContain('Ns 50.00\r\n');
      expect(output).toContain('illum 1\r\n');
      expect(output).toContain('d 0.95\r\n');
      expect(output).toContain('map_Kd :Runtime:Textures:PoserHairMaker:Figure_diffuse.png\r\n');
      expect(output).toContain('map_d :Runtime:Textures:PoserHairMaker:Figure_trans.png\r\n');
      expect(output).toContain('map_Bump :Runtime:Textures:PoserHairMaker:Figure_normal.png\r\n');
      expect(output).toContain('map_Ks :Runtime:Textures:PoserHairMaker:Figure_spec.png\r\n');
    });

    it('should omit header comment when headerComment is empty string', () => {
      const output = WavefrontMtlWriter.writeToString([{ name: 'Test' }], {
        headerComment: '',
      });
      expect(output.startsWith('newmtl Test\r\n')).toBe(true);
    });

    it('should export materials to a file on disk via exportToFile', async () => {
      const tmpFile = path.resolve(__dirname, 'test_export_output.mtl');
      await WavefrontMtlWriter.exportToFile(
        [{ name: 'File_Material', diffuseMap: 'tex.png' }],
        tmpFile
      );

      const content = await fs.readFile(tmpFile, 'utf-8');
      expect(content).toContain('newmtl File_Material\r\n');
      expect(content).toContain('map_Kd tex.png\r\n');

      await fs.unlink(tmpFile);
    });

    it('should reject exportToFile on invalid path', async () => {
      const invalidPath = path.resolve(__dirname, 'non_existent_dir_123/bad.mtl');
      await expect(
        WavefrontMtlWriter.exportToFile([{ name: 'Fail' }], invalidPath)
      ).rejects.toThrow();
    });
  });
});


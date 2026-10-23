import * as fs from 'node:fs';
import type { Writable } from 'node:stream';
import { WavefrontMesh, MeshFace } from './wavefront-mesh.js';

export interface WavefrontWriterOptions {
  /**
   * Header comment written at top of file
   */
  headerComment?: string;
  /**
   * Floating-point precision for vertex coordinates (default: 6)
   */
  precision?: number;
  /**
   * Optional material library file link (mtllib <filename>)
   */
  mtllib?: string;
}

export class WavefrontWriter {
  /**
   * Write mesh contents to any Node.js Writable stream.
   */
  static writeToStream(
    mesh: WavefrontMesh,
    stream: Writable,
    options: WavefrontWriterOptions = {}
  ): void {
    const prec = options.precision ?? 6;
    const header = options.headerComment ?? 'Wavefront OBJ export';

    stream.write(`# ${header}\r\n`);
    if (options.mtllib) {
      stream.write(`mtllib ${options.mtllib}\r\n`);
    }

    // 1. Export Vertices (v)
    for (const v of mesh.vertices) {
      stream.write(
        `v ${v.x.toFixed(prec)} ${v.y.toFixed(prec)} ${v.z.toFixed(prec)}\r\n`
      );
    }

    // 2. Export Texture Coordinates (vt)
    for (const vt of mesh.uvs) {
      stream.write(`vt ${vt.u.toFixed(prec)} ${vt.v.toFixed(prec)}\r\n`);
    }

    // 3. Export Normals (vn)
    for (const vn of mesh.normals) {
      stream.write(
        `vn ${vn.x.toFixed(prec)} ${vn.y.toFixed(prec)} ${vn.z.toFixed(prec)}\r\n`
      );
    }

    // 4. Group Faces: Group -> Material -> Face[]
    const groupMatMap = new Map<string, Map<string, MeshFace[]>>();
    for (const face of mesh.faces) {
      const g = face.group || 'default';
      const m = face.material || 'default';

      if (!groupMatMap.has(g)) {
        groupMatMap.set(g, new Map());
      }
      const matMap = groupMatMap.get(g)!;
      if (!matMap.has(m)) {
        matMap.set(m, []);
      }
      matMap.get(m)!.push(face);
    }

    // 5. Write grouped faces
    for (const [groupName, matMap] of groupMatMap.entries()) {
      stream.write(`g ${groupName}\r\n`);

      for (const [matName, faces] of matMap.entries()) {
        if (matName !== 'default') {
          stream.write(`usemtl ${matName}\r\n`);
        }

        for (const face of faces) {
          const tokens = face.vertices.map((fv) => {
            const vIdx = fv.vIndex + 1; // 1-based index
            const hasVt = fv.tIndex !== undefined;
            const hasVn = fv.nIndex !== undefined;

            if (hasVn && hasVt) {
              return `${vIdx}/${fv.tIndex! + 1}/${fv.nIndex! + 1}`;
            } else if (hasVt) {
              return `${vIdx}/${fv.tIndex! + 1}`;
            } else if (hasVn) {
              return `${vIdx}//${fv.nIndex! + 1}`;
            } else {
              return `${vIdx}`;
            }
          });

          stream.write(`f ${tokens.join(' ')}\r\n`);
        }
      }
    }
  }

  /**
   * Serialize mesh directly to a formatted string.
   */
  static writeToString(
    mesh: WavefrontMesh,
    options: WavefrontWriterOptions = {}
  ): string {
    const chunks: string[] = [];
    const stream = {
      write(str: string): boolean {
        chunks.push(str);
        return true;
      },
    } as unknown as Writable;

    this.writeToStream(mesh, stream, options);
    return chunks.join('');
  }

  /**
   * Stream mesh directly to a file on disk (optimal for large meshes in Electron).
   */
  static async exportToFile(
    mesh: WavefrontMesh,
    filePath: string,
    options: WavefrontWriterOptions = {}
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const stream = fs.createWriteStream(filePath, { encoding: 'utf-8' });
      stream.on('finish', resolve);
      stream.on('error', reject);
      this.writeToStream(mesh, stream, options);
      stream.end();
    });
  }
}

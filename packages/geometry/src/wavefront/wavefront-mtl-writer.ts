import * as fs from 'node:fs';
import type { Writable } from 'node:stream';

export interface WavefrontMaterialDef {
  name: string;
  kdColor?: [number, number, number]; // Kd r g b (default: [0.72, 0.48, 0.32])
  kaColor?: [number, number, number]; // Ka r g b (default: [0.2, 0.2, 0.2])
  ksColor?: [number, number, number]; // Ks r g b (default: [0.45, 0.45, 0.45])
  nsExponent?: number; // Ns (default: 45)
  illum?: number; // illum (default: 2)
  dissolve?: number; // d (default: 1.0)
  diffuseMap?: string; // map_Kd
  transparencyMap?: string; // map_d
  bumpMap?: string; // map_Bump
  specularMap?: string; // map_Ks
}

export interface WavefrontMtlWriterOptions {
  headerComment?: string;
  precision?: number; // default: 4 decimals
}

export class WavefrontMtlWriter {
  /**
   * Writes materials to any Node.js Writable stream.
   */
  static writeToStream(
    materials: WavefrontMaterialDef[],
    stream: Writable,
    options: WavefrontMtlWriterOptions = {}
  ): void {
    const prec = options.precision ?? 4;
    const header = options.headerComment !== undefined
      ? options.headerComment
      : 'Wavefront MTL Material Library';

    if (header) {
      stream.write(`# ${header}\r\n`);
    }

    for (const mat of materials) {
      stream.write(`newmtl ${mat.name}\r\n`);

      const ka = mat.kaColor ?? [0.2, 0.2, 0.2];
      stream.write(
        `Ka ${ka[0].toFixed(prec)} ${ka[1].toFixed(prec)} ${ka[2].toFixed(prec)}\r\n`
      );

      const kd = mat.kdColor ?? [0.72, 0.48, 0.32];
      stream.write(
        `Kd ${kd[0].toFixed(prec)} ${kd[1].toFixed(prec)} ${kd[2].toFixed(prec)}\r\n`
      );

      const ks = mat.ksColor ?? [0.45, 0.45, 0.45];
      stream.write(
        `Ks ${ks[0].toFixed(prec)} ${ks[1].toFixed(prec)} ${ks[2].toFixed(prec)}\r\n`
      );

      const ns = mat.nsExponent ?? 45;
      stream.write(`Ns ${ns.toFixed(prec)}\r\n`);

      const illum = mat.illum ?? 2;
      stream.write(`illum ${illum}\r\n`);

      const d = mat.dissolve ?? 1.0;
      stream.write(`d ${d.toFixed(prec)}\r\n`);

      if (mat.diffuseMap) {
        stream.write(`map_Kd ${mat.diffuseMap}\r\n`);
      }
      if (mat.transparencyMap) {
        stream.write(`map_d ${mat.transparencyMap}\r\n`);
      }
      if (mat.bumpMap) {
        stream.write(`map_Bump ${mat.bumpMap}\r\n`);
      }
      if (mat.specularMap) {
        stream.write(`map_Ks ${mat.specularMap}\r\n`);
      }
    }
  }

  /**
   * Serializes a list of materials to a formatted MTL string with CRLF line breaks.
   */
  static writeToString(
    materials: WavefrontMaterialDef[],
    options: WavefrontMtlWriterOptions = {}
  ): string {
    const chunks: string[] = [];
    const stream = {
      write(str: string): boolean {
        chunks.push(str);
        return true;
      },
    } as unknown as Writable;

    this.writeToStream(materials, stream, options);
    return chunks.join('');
  }

  /**
   * Asynchronously writes material definitions to a file on disk.
   */
  static async exportToFile(
    materials: WavefrontMaterialDef[],
    filePath: string,
    options: WavefrontMtlWriterOptions = {}
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const stream = fs.createWriteStream(filePath, { encoding: 'utf-8' });
      stream.on('finish', resolve);
      stream.on('error', reject);
      this.writeToStream(materials, stream, options);
      stream.end();
    });
  }
}

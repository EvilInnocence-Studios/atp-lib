import * as path from 'node:path';
import { WavefrontMesh, WavefrontWriter } from '@atp/geometry';
import { Cr2Builder } from './cr2-builder.js';
import { PoserPathResolver } from '../core/path-resolver.js';


export interface ExportPairOptions {
  /**
   * Root directory of the Poser runtime or target export folder
   */
  runtimeDir: string;
  /**
   * Name of figure (e.g. 'MyHairFigure')
   */
  figureName: string;
  /**
   * Relative subfolder inside Runtime/Geometries (default: figureName)
   */
  geometrySubfolder?: string;
  /**
   * Relative subfolder inside Runtime/Libraries/Character (default: figureName)
   */
  characterSubfolder?: string;
}

export interface ExportPairResult {
  objAbsolutePath: string;
  cr2AbsolutePath: string;
  objRelativePoserPath: string;
}

export class PoserAssetPipeline {
  /**
   * Validates and exports both the Wavefront OBJ geometry and the matching Poser CR2 rigging file.
   */
  static async exportAssetPair(
    mesh: WavefrontMesh,
    cr2: Cr2Builder,
    options: ExportPairOptions
  ): Promise<ExportPairResult> {
    const geomFolder = options.geometrySubfolder ?? options.figureName;
    const charFolder = options.characterSubfolder ?? options.figureName;

    const relativeObjPath = `:Runtime:Geometries:${geomFolder}:${options.figureName}.obj`;
    const absoluteObjPath = path.join(
      options.runtimeDir,
      'Runtime',
      'Geometries',
      geomFolder,
      `${options.figureName}.obj`
    );
    const absoluteCr2Path = path.join(
      options.runtimeDir,
      'Runtime',
      'Libraries',
      'Character',
      charFolder,
      `${options.figureName}.cr2`
    );

    // Ensure output directories exist
    await import('node:fs/promises').then(async (fs) => {
      await fs.mkdir(path.dirname(absoluteObjPath), { recursive: true });
      await fs.mkdir(path.dirname(absoluteCr2Path), { recursive: true });
    });

    // 1. Export OBJ file
    await WavefrontWriter.exportToFile(mesh, absoluteObjPath, {
      headerComment: `Geometry for ${options.figureName}`,
    });

    // 2. Link CR2 to the OBJ relative runtime path and export CR2
    cr2.setGeometryPath(relativeObjPath);
    await cr2.exportToDisk(absoluteCr2Path);

    return {
      objAbsolutePath: absoluteObjPath,
      cr2AbsolutePath: absoluteCr2Path,
      objRelativePoserPath: relativeObjPath,
    };
  }
}

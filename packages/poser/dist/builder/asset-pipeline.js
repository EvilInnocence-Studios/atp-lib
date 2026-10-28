import * as path from 'node:path';
import { WavefrontWriter } from 'atp-geometry';
export class PoserAssetPipeline {
    /**
     * Validates and exports both the Wavefront OBJ geometry and the matching Poser CR2 rigging file.
     */
    static async exportAssetPair(mesh, cr2, options) {
        const geomFolder = options.geometrySubfolder ?? options.figureName;
        const charFolder = options.characterSubfolder ?? options.figureName;
        const relativeObjPath = `:Runtime:Geometries:${geomFolder}:${options.figureName}.obj`;
        const absoluteObjPath = path.join(options.runtimeDir, 'Runtime', 'Geometries', geomFolder, `${options.figureName}.obj`);
        const absoluteCr2Path = path.join(options.runtimeDir, 'Runtime', 'Libraries', 'Character', charFolder, `${options.figureName}.cr2`);
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
//# sourceMappingURL=asset-pipeline.js.map
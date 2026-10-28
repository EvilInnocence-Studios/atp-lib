import { WavefrontMesh } from 'atp-geometry';
import { Cr2Builder } from './cr2-builder.js';
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
export declare class PoserAssetPipeline {
    /**
     * Validates and exports both the Wavefront OBJ geometry and the matching Poser CR2 rigging file.
     */
    static exportAssetPair(mesh: WavefrontMesh, cr2: Cr2Builder, options: ExportPairOptions): Promise<ExportPairResult>;
}
//# sourceMappingURL=asset-pipeline.d.ts.map
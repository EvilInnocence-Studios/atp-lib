import { WavefrontMesh } from './wavefront-mesh.js';
export declare class WavefrontReader {
    /**
     * Parse OBJ content string into a WavefrontMesh.
     */
    static parseString(content: string, verticesOnly?: boolean): WavefrontMesh;
    /**
     * Load and parse an OBJ file from disk.
     */
    static loadFromFile(filePath: string, verticesOnly?: boolean): Promise<WavefrontMesh>;
}
//# sourceMappingURL=wavefront-reader.d.ts.map
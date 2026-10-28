import type { Writable } from 'node:stream';
import { WavefrontMesh } from './wavefront-mesh.js';
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
export declare class WavefrontWriter {
    /**
     * Write mesh contents to any Node.js Writable stream.
     */
    static writeToStream(mesh: WavefrontMesh, stream: Writable, options?: WavefrontWriterOptions): void;
    /**
     * Serialize mesh directly to a formatted string.
     */
    static writeToString(mesh: WavefrontMesh, options?: WavefrontWriterOptions): string;
    /**
     * Stream mesh directly to a file on disk (optimal for large meshes in Electron).
     */
    static exportToFile(mesh: WavefrontMesh, filePath: string, options?: WavefrontWriterOptions): Promise<void>;
}
//# sourceMappingURL=wavefront-writer.d.ts.map
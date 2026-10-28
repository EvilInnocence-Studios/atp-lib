import type { Writable } from 'node:stream';
export interface WavefrontMaterialDef {
    name: string;
    kdColor?: [number, number, number];
    kaColor?: [number, number, number];
    ksColor?: [number, number, number];
    nsExponent?: number;
    illum?: number;
    dissolve?: number;
    diffuseMap?: string;
    transparencyMap?: string;
    bumpMap?: string;
    specularMap?: string;
}
export interface WavefrontMtlWriterOptions {
    headerComment?: string;
    precision?: number;
}
export declare class WavefrontMtlWriter {
    /**
     * Writes materials to any Node.js Writable stream.
     */
    static writeToStream(materials: WavefrontMaterialDef[], stream: Writable, options?: WavefrontMtlWriterOptions): void;
    /**
     * Serializes a list of materials to a formatted MTL string with CRLF line breaks.
     */
    static writeToString(materials: WavefrontMaterialDef[], options?: WavefrontMtlWriterOptions): string;
    /**
     * Asynchronously writes material definitions to a file on disk.
     */
    static exportToFile(materials: WavefrontMaterialDef[], filePath: string, options?: WavefrontMtlWriterOptions): Promise<void>;
}
//# sourceMappingURL=wavefront-mtl-writer.d.ts.map
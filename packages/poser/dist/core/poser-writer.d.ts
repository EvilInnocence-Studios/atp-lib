import type { Writable } from 'node:stream';
import { PoserNode } from './poser-node.js';
export declare class PoserWriter {
    /**
     * Recursively write PoserNode to a stream using tabs and CRLF line breaks.
     */
    static writeNodeToStream(node: PoserNode, stream: Writable, tabCount?: number): void;
    /**
     * Serialize PoserNode tree to a formatted string.
     */
    static writeToString(rootNode: PoserNode): string;
    /**
     * Stream PoserNode tree directly to a file stream using Node.js streams (optimal for large CR2 files with morphs).
     */
    static exportNodeStream(rootNode: PoserNode, targetFilePath: string): Promise<void>;
    /**
     * Stream PoserNode tree directly to disk (alias for exportNodeStream).
     */
    static exportToFile(rootNode: PoserNode, filePath: string): Promise<void>;
}
//# sourceMappingURL=poser-writer.d.ts.map
import { PoserNode } from './poser-node.js';
export declare class PoserReader {
    /**
     * Parse Poser brace syntax content string into a PoserNode tree.
     */
    static parseString(content: string): PoserNode;
    /**
     * Load and parse a Poser file (.cr2, .pp2, .pz3) from disk.
     */
    static loadFromFile(filePath: string): Promise<PoserNode>;
}
//# sourceMappingURL=poser-reader.d.ts.map
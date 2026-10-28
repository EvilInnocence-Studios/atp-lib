import * as fs from 'node:fs/promises';
import { PoserNode } from './poser-node.js';
export class PoserReader {
    /**
     * Parse Poser brace syntax content string into a PoserNode tree.
     */
    static parseString(content) {
        const root = new PoserNode(null, '');
        root.hasChildrenBlock = true;
        const lines = content.split(/\r?\n/);
        let lineIdx = 0;
        const parseBlock = (parent) => {
            while (lineIdx < lines.length) {
                const line = lines[lineIdx++].trim();
                if (!line)
                    continue;
                if (line === '{') {
                    // Open block for the previous sibling
                    if (parent.children.length > 0) {
                        const lastChild = parent.children[parent.children.length - 1];
                        lastChild.hasChildrenBlock = true;
                        parseBlock(lastChild);
                    }
                    else {
                        // Root special case or empty block
                        parseBlock(parent);
                    }
                }
                else if (line === '}') {
                    // Close current block and return to parent
                    return;
                }
                else {
                    // A property line or new node declaration
                    const node = new PoserNode(parent, line);
                    parent.children.push(node);
                }
            }
        };
        parseBlock(root);
        return root;
    }
    /**
     * Load and parse a Poser file (.cr2, .pp2, .pz3) from disk.
     */
    static async loadFromFile(filePath) {
        const content = await fs.readFile(filePath, 'utf-8');
        return this.parseString(content);
    }
}
//# sourceMappingURL=poser-reader.js.map
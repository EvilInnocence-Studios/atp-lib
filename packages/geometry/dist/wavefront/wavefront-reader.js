import * as fs from 'node:fs/promises';
import { WavefrontMesh } from './wavefront-mesh.js';
export class WavefrontReader {
    /**
     * Parse OBJ content string into a WavefrontMesh.
     */
    static parseString(content, verticesOnly = false) {
        const mesh = new WavefrontMesh();
        const lines = content.split(/\r?\n/);
        let curGroup = 'default';
        let curMaterial = 'default';
        for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line || line.startsWith('#'))
                continue;
            const tokens = line.split(/\s+/);
            const command = tokens[0].toLowerCase();
            switch (command) {
                case 'v': {
                    if (tokens.length >= 4) {
                        mesh.addVertex(parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3]));
                    }
                    break;
                }
                case 'vt': {
                    if (!verticesOnly && tokens.length >= 3) {
                        mesh.addUV(parseFloat(tokens[1]), parseFloat(tokens[2]));
                    }
                    break;
                }
                case 'vn': {
                    if (!verticesOnly && tokens.length >= 4) {
                        mesh.addNormal(parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3]));
                    }
                    break;
                }
                case 'g': {
                    if (tokens.length >= 2) {
                        curGroup = tokens[1];
                    }
                    break;
                }
                case 'usemtl': {
                    if (tokens.length >= 2) {
                        curMaterial = tokens[1];
                    }
                    break;
                }
                case 'f': {
                    if (verticesOnly)
                        break;
                    if (tokens.length >= 4) {
                        const faceVertices = [];
                        for (let i = 1; i < tokens.length; i++) {
                            const part = tokens[i];
                            /* v8 ignore next */
                            if (!part)
                                continue;
                            const subTokens = part.split('/');
                            // subTokens[0] = vertex index (1-based or negative)
                            let vIdx = parseInt(subTokens[0], 10);
                            if (vIdx < 0) {
                                vIdx = mesh.vertices.length + vIdx; // negative offset
                            }
                            else {
                                vIdx = vIdx - 1; // convert 1-based to 0-based
                            }
                            let tIdx;
                            if (subTokens.length > 1 && subTokens[1] !== '') {
                                tIdx = parseInt(subTokens[1], 10);
                                if (tIdx < 0) {
                                    tIdx = mesh.uvs.length + tIdx;
                                }
                                else {
                                    tIdx = tIdx - 1;
                                }
                            }
                            let nIdx;
                            if (subTokens.length > 2 && subTokens[2] !== '') {
                                nIdx = parseInt(subTokens[2], 10);
                                if (nIdx < 0) {
                                    nIdx = mesh.normals.length + nIdx;
                                }
                                else {
                                    nIdx = nIdx - 1;
                                }
                            }
                            faceVertices.push({
                                vIndex: vIdx,
                                tIndex: tIdx,
                                nIndex: nIdx,
                            });
                        }
                        if (faceVertices.length >= 3) {
                            mesh.addFace(faceVertices, curGroup, curMaterial);
                        }
                    }
                    break;
                }
                default:
                    // Ignore other directives (s, o, mtllib, etc.)
                    break;
            }
        }
        return mesh;
    }
    /**
     * Load and parse an OBJ file from disk.
     */
    static async loadFromFile(filePath, verticesOnly = false) {
        const text = await fs.readFile(filePath, 'utf-8');
        return this.parseString(text, verticesOnly);
    }
}
//# sourceMappingURL=wavefront-reader.js.map
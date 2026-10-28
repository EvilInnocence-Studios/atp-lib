import { PoserNode } from '../core/poser-node.js';
import { Vector3 } from 'atp-geometry';
export declare class VectorNode extends PoserNode {
    constructor(parent?: PoserNode | null, directive?: 'origin' | 'endPoint' | 'orientation', vector?: Vector3);
    setVector(directive: string, vector: Vector3): void;
    getVector(): Vector3;
}
//# sourceMappingURL=vector-node.d.ts.map
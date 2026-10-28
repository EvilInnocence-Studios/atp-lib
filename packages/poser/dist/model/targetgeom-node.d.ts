import { PoserNode } from '../core/poser-node.js';
import { Vector3 } from 'atp-geometry';
export declare class TargetGeomNode extends PoserNode {
    private deltasNode;
    private indexesNode;
    private numbDeltasNode;
    deltas: Map<number, Vector3>;
    constructor(parent?: PoserNode | null, morphName?: string);
    addDelta(vertexIndex: number, dx: number, dy: number, dz: number): this;
    setDeltas(deltas: Map<number, Vector3>): this;
}
//# sourceMappingURL=targetgeom-node.d.ts.map
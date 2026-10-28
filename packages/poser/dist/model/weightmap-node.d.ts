import { PoserNode } from '../core/poser-node.js';
export interface WeightEntry {
    vertexIndex: number;
    weight: number;
}
/**
 * Models a Poser vertex weight map node (Poser 9 / 2012+ weight-mapped figures).
 * Corresponds to ATC::Poser::Nodes::WeightMapNode.
 *
 * Poser syntax:
 * weightMap <mapId>
 * {
 *   numbVerts <count>
 *   v <vertexIndex> <weight>
 *   ...
 * }
 */
export declare class WeightMapNode extends PoserNode {
    mapId: string;
    numVerts: number;
    private weightMap;
    constructor(parent?: PoserNode | null, mapId?: string);
    /**
     * Normalizes bulge and joint weight map identifiers.
     * e.g. bulge_RightArm_zrot -> bulge_rArm_zrot
     */
    static normalizeMapId(id: string): string;
    setMapId(id: string): this;
    setNumVerts(count: number): this;
    setWeight(vertexIndex: number, weight: number): this;
    getWeight(vertexIndex: number): number;
    getWeights(): Map<number, number>;
    getNonZeroWeights(): WeightEntry[];
    clearWeights(): this;
    /**
     * Serialize internal weights to AST child nodes for export.
     */
    syncToNodes(): this;
    /**
     * Parse weights from child AST nodes after loading from file.
     */
    syncFromNodes(): this;
}
//# sourceMappingURL=weightmap-node.d.ts.map
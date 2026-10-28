import { PoserNode } from '../core/poser-node.js';
import { Vector3 } from 'atp-geometry';
import { VectorNode } from './vector-node.js';
import { GeomCustomNode } from './geomcustom-node.js';
import { ChannelsNode } from './channels-node.js';
import { WeightMapNode } from './weightmap-node.js';
export declare class ActorNode extends PoserNode {
    actorName: string;
    fileNumber: number;
    storageOffsetNode: PoserNode;
    geomCustom: GeomCustomNode;
    channels: ChannelsNode;
    originNode: VectorNode;
    endPointNode: VectorNode;
    orientationNode: VectorNode;
    constructor(parent?: PoserNode | null, actorName?: string, fileNumber?: number);
    setOrigin(v: Vector3): this;
    getOrigin(): Vector3;
    setEndPoint(v: Vector3): this;
    getEndPoint(): Vector3;
    setOrientation(v: Vector3): this;
    getOrientation(): Vector3;
    setObjPath(objRelativePath: string): this;
    createDefaultChannels(): this;
    addWeightMap(mapId: string, numVerts?: number): WeightMapNode;
    getWeightMap(mapId: string): WeightMapNode | undefined;
    getWeightMaps(): WeightMapNode[];
    setRotateOrder(order?: string): this;
    getRotateOrder(): string | null;
    setGeomHandler(handlerType?: number, actorName?: string): this;
    getGeomHandler(): {
        handlerType: number;
        actorName: string;
    } | null;
    setHasGeom(hasGeom: boolean | number): this;
    getHasGeom(): number | null;
    setParent(parentActorName: string): this;
    getParent(): string | null;
    setSphereFalloff(center: Vector3, innerRadius: number, outerRadius: number): this;
    getSphereFalloff(): {
        center: Vector3;
        innerRadius: number;
        outerRadius: number;
    } | null;
}
//# sourceMappingURL=actor-node.d.ts.map
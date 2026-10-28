import { RootNode } from '../model/root-node.js';
import { ActorNode } from '../model/actor-node.js';
import { FigureNode } from '../model/figure-node.js';
import { MaterialNode } from '../model/material-node.js';
import { Vector3 } from 'atp-geometry';
import { PoserNode } from '../core/poser-node.js';
export interface AddBoneOptions {
    name: string;
    parentName?: string;
    origin?: Vector3 | [number, number, number];
    endPoint?: Vector3 | [number, number, number];
    orientation?: Vector3 | [number, number, number];
    createDefaultChannels?: boolean;
    rotateOrder?: string;
    hasGeom?: boolean | number;
    geomHandler?: number;
    sphereFalloff?: {
        center: Vector3 | [number, number, number];
        innerRadius: number;
        outerRadius: number;
    };
}
export declare class Cr2Builder {
    root: RootNode;
    figure: FigureNode;
    constructor(figureName?: string);
    setVersion(version: string): this;
    setGeometryPath(relativeRuntimePath: string): this;
    addBone(options: AddBoneOptions): ActorNode;
    addMorphDelta(actorName: string, morphName: string, deltas: Map<number, Vector3>): this;
    addMaterial(materialName: string, diffuseColor?: [number, number, number]): MaterialNode;
    addWeightMap(actorName: string, mapId: string, weights?: Map<number, number> | [number, number][], numVerts?: number): this;
    addDialGroup(actorName: string, groupName: string, paramNames?: string[]): this;
    addMasterDial(actorName: string, dialId: string, displayName: string, min?: number, max?: number, trackingScale?: number): PoserNode;
    addSlaveLink(actorName: string, channelName: 'xrot' | 'yrot' | 'zrot', masterActor: string, masterDialName: string, deltaScale: number): this;
    toString(): string;
    exportToDisk(outputPath: string): Promise<void>;
}
//# sourceMappingURL=cr2-builder.d.ts.map
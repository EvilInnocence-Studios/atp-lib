import { PoserNode } from '../core/poser-node.js';
import { TargetGeomNode } from './targetgeom-node.js';
import { GroupsNode } from './groups-node.js';
export declare class ChannelsNode extends PoserNode {
    groupsNode: GroupsNode | null;
    constructor(parent?: PoserNode | null);
    createDefaultChannels(): void;
    addMorph(morphName: string): TargetGeomNode;
    getMorphs(): TargetGeomNode[];
    getOrCreateGroups(): GroupsNode;
    addGroup(groupName: string): GroupsNode | null;
    addParamToGroup(groupName: string, paramName: string): PoserNode | null;
    /**
     * Adds an ERC master control dial (valueParm) with tracking scale and static keyframes.
     */
    addMasterDial(dialId: string, displayName: string, min?: number, max?: number, trackingScale?: number): PoserNode;
    /**
     * Binds a joint rotation channel (e.g. Bend/xrot) to a master dial via valueOpDeltaAdd.
     */
    addSlaveLink(channelName: 'xrot' | 'yrot' | 'zrot', masterActor: string, masterDialName: string, deltaScale: number): this;
    getMasterDials(): PoserNode[];
    getMasterDial(dialId: string): PoserNode | undefined;
}
//# sourceMappingURL=channels-node.d.ts.map
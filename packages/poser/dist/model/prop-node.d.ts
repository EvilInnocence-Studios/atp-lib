import { PoserNode } from '../core/poser-node.js';
import { GeomCustomNode } from './geomcustom-node.js';
import { ChannelsNode } from './channels-node.js';
export declare class PropNode extends PoserNode {
    propName: string;
    geomCustom: GeomCustomNode;
    channels: ChannelsNode;
    constructor(parent?: PoserNode | null, propName?: string);
    setObjPath(objRelativePath: string): this;
}
//# sourceMappingURL=prop-node.d.ts.map
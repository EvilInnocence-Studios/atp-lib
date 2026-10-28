import { PoserNode } from '../core/poser-node.js';
export interface BoneLink {
    child: string;
    parent: string;
}
export declare class FigureNode extends PoserNode {
    figureName: string;
    fileNumber: number;
    constructor(parent?: PoserNode | null, figureName?: string, fileNumber?: number);
    addChildNode(childBone: string, parentBone: string): this;
    addWeldNode(childBone: string, parentBone: string): this;
    getChildrenLinks(): BoneLink[];
    getWeldLinks(): BoneLink[];
}
//# sourceMappingURL=figure-node.d.ts.map
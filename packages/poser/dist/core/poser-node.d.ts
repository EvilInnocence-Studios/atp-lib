export declare class PoserNode {
    name: string;
    children: PoserNode[];
    parent: PoserNode | null;
    hasChildrenBlock: boolean;
    constructor(parent?: PoserNode | null, name?: string);
    get depth(): number;
    addChild(nameOrNode: string | PoserNode, ifNotExists?: boolean): PoserNode;
    addProperty(propertyLine: string): PoserNode;
    findChild(name: string, recursive?: boolean): PoserNode | null;
    findChildren(name: string, recursive?: boolean): PoserNode[];
    removeChild(child: PoserNode): boolean;
    get root(): PoserNode;
    subNodes(): PoserNode[];
    subNodeCount(): number;
    subNode(indexOrName: number | string): PoserNode | null;
    deleteSubNode(indexOrName: number | string): PoserNode | null;
    /**
     * Traverse a hierarchical path separated by / or : (e.g., 'figure/channels/rotateY').
     */
    findPath(pathStr: string): PoserNode | null;
    clear(): void;
}
//# sourceMappingURL=poser-node.d.ts.map
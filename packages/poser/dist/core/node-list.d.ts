import { PoserNode } from './poser-node.js';
/**
 * Fluent collection wrapper over a set/list of Poser AST nodes,
 * mirroring ATC's ATC::Poser::NodeList.
 */
export declare class NodeList implements Iterable<PoserNode> {
    private nodes;
    constructor(nodes?: PoserNode[] | Set<PoserNode>);
    get size(): number;
    get length(): number;
    [Symbol.iterator](): Iterator<PoserNode>;
    toArray(): PoserNode[];
    first(): PoserNode | null;
    add(node: PoserNode): this;
    clear(): this;
    clearSubNodes(): this;
    remove(): void;
    deleteSubNode(indexOrName: number | string): this;
    addSubNode(name: string): NodeList;
    subNode(indexOrName: number | string): NodeList;
    subNodes(): NodeList;
    find(name: string, recursive?: boolean): PoserNode | null;
    findAll(name: string, recursive?: boolean): NodeList;
    findPath(pathStr: string): NodeList;
    parent(): NodeList;
    root(): NodeList;
    setName(name: string): this;
}
//# sourceMappingURL=node-list.d.ts.map
import { PoserNode } from '../core/poser-node.js';
/**
 * Models Poser parameter and dial organization groups (groupNode / parmNode).
 * Corresponds to ATC::Poser::Nodes::GroupsNode.
 */
export declare class GroupsNode extends PoserNode {
    private groups;
    private parameters;
    constructor(parent?: PoserNode | null, name?: string);
    /**
     * Find or create a sub-group with the specified name.
     */
    group(name: string, createIfMissing?: boolean): GroupsNode | null;
    /**
     * Find or add a parameter/dial to this group.
     */
    parameter(paramName: string, createIfMissing?: boolean): PoserNode | null;
    hasGroup(name: string): boolean;
    hasParameter(name: string): boolean;
    getGroupNames(): string[];
    getParameterNames(): string[];
    /**
     * Synchronize internal maps if loaded from external file or parsed from AST.
     */
    syncFromChildren(): void;
}
//# sourceMappingURL=groups-node.d.ts.map
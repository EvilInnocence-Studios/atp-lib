import { PoserNode } from '../core/poser-node.js';
/**
 * Models Poser parameter and dial organization groups (groupNode / parmNode).
 * Corresponds to ATC::Poser::Nodes::GroupsNode.
 */
export class GroupsNode extends PoserNode {
    groups = new Map();
    parameters = new Map();
    constructor(parent = null, name = '') {
        super(parent, name);
        this.hasChildrenBlock = true;
    }
    /**
     * Find or create a sub-group with the specified name.
     */
    group(name, createIfMissing = false) {
        if (!name)
            return this;
        if (this.groups.has(name)) {
            return this.groups.get(name);
        }
        if (createIfMissing) {
            const groupSubNode = new GroupsNode(this, `groupNode ${name}`);
            groupSubNode.addProperty('collapsed 1');
            this.children.push(groupSubNode);
            this.groups.set(name, groupSubNode);
            return groupSubNode;
        }
        return null;
    }
    /**
     * Find or add a parameter/dial to this group.
     */
    parameter(paramName, createIfMissing = false) {
        if (this.parameters.has(paramName)) {
            return this.parameters.get(paramName);
        }
        if (createIfMissing) {
            const parmNode = new PoserNode(this, `parmNode ${paramName}`);
            parmNode.hasChildrenBlock = false;
            this.children.push(parmNode);
            this.parameters.set(paramName, parmNode);
            return parmNode;
        }
        return null;
    }
    hasGroup(name) {
        return this.groups.has(name);
    }
    hasParameter(name) {
        return this.parameters.has(name);
    }
    getGroupNames() {
        return Array.from(this.groups.keys());
    }
    getParameterNames() {
        return Array.from(this.parameters.keys());
    }
    /**
     * Synchronize internal maps if loaded from external file or parsed from AST.
     */
    syncFromChildren() {
        this.groups.clear();
        this.parameters.clear();
        for (const child of this.children) {
            const name = child.name.trim();
            if (name.startsWith('groupNode ')) {
                const groupName = name.replace(/^groupNode\s+/, '').trim();
                let groupNode;
                if (child instanceof GroupsNode) {
                    groupNode = child;
                }
                else {
                    groupNode = new GroupsNode(this, child.name);
                    groupNode.children = child.children;
                    groupNode.hasChildrenBlock = child.hasChildrenBlock;
                }
                groupNode.syncFromChildren();
                this.groups.set(groupName, groupNode);
            }
            else if (name.startsWith('parmNode ')) {
                const parmName = name.replace(/^parmNode\s+/, '').trim();
                this.parameters.set(parmName, child);
            }
        }
    }
}
//# sourceMappingURL=groups-node.js.map
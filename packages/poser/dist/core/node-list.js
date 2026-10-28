/**
 * Fluent collection wrapper over a set/list of Poser AST nodes,
 * mirroring ATC's ATC::Poser::NodeList.
 */
export class NodeList {
    nodes;
    constructor(nodes) {
        if (nodes instanceof Set) {
            this.nodes = new Set(nodes);
        }
        else if (Array.isArray(nodes)) {
            this.nodes = new Set(nodes);
        }
        else {
            this.nodes = new Set();
        }
    }
    get size() {
        return this.nodes.size;
    }
    get length() {
        return this.nodes.size;
    }
    [Symbol.iterator]() {
        return this.nodes.values();
    }
    toArray() {
        return Array.from(this.nodes);
    }
    first() {
        const iter = this.nodes.values().next();
        return iter.done ? null : iter.value;
    }
    add(node) {
        this.nodes.add(node);
        return this;
    }
    clear() {
        this.nodes.clear();
        return this;
    }
    clearSubNodes() {
        for (const node of this.nodes) {
            node.children = [];
            node.hasChildrenBlock = false;
        }
        return this;
    }
    remove() {
        for (const node of this.nodes) {
            if (node.parent) {
                node.parent.removeChild(node);
            }
        }
        this.nodes.clear();
    }
    deleteSubNode(indexOrName) {
        for (const node of this.nodes) {
            node.deleteSubNode(indexOrName);
        }
        return this;
    }
    addSubNode(name) {
        const result = new NodeList();
        for (const node of this.nodes) {
            const created = node.addChild(name);
            result.add(created);
        }
        return result;
    }
    subNode(indexOrName) {
        const result = new NodeList();
        for (const node of this.nodes) {
            const child = node.subNode(indexOrName);
            if (child)
                result.add(child);
        }
        return result;
    }
    subNodes() {
        const result = new NodeList();
        for (const node of this.nodes) {
            for (const child of node.children) {
                result.add(child);
            }
        }
        return result;
    }
    find(name, recursive = false) {
        for (const node of this.nodes) {
            const found = node.findChild(name, recursive);
            if (found)
                return found;
        }
        return null;
    }
    findAll(name, recursive = false) {
        const result = new NodeList();
        for (const node of this.nodes) {
            const matches = node.findChildren(name, recursive);
            for (const m of matches) {
                result.add(m);
            }
        }
        return result;
    }
    findPath(pathStr) {
        const result = new NodeList();
        for (const node of this.nodes) {
            const match = node.findPath(pathStr);
            if (match)
                result.add(match);
        }
        return result;
    }
    parent() {
        const result = new NodeList();
        for (const node of this.nodes) {
            if (node.parent)
                result.add(node.parent);
        }
        return result;
    }
    root() {
        const result = new NodeList();
        for (const node of this.nodes) {
            result.add(node.root);
        }
        return result;
    }
    setName(name) {
        for (const node of this.nodes) {
            node.name = name;
        }
        return this;
    }
}
//# sourceMappingURL=node-list.js.map
import { PoserNode } from './poser-node.js';

/**
 * Fluent collection wrapper over a set/list of Poser AST nodes,
 * mirroring ATC's ATC::Poser::NodeList.
 */
export class NodeList implements Iterable<PoserNode> {
  private nodes: Set<PoserNode>;

  constructor(nodes?: PoserNode[] | Set<PoserNode>) {
    if (nodes instanceof Set) {
      this.nodes = new Set(nodes);
    } else if (Array.isArray(nodes)) {
      this.nodes = new Set(nodes);
    } else {
      this.nodes = new Set();
    }
  }

  get size(): number {
    return this.nodes.size;
  }

  get length(): number {
    return this.nodes.size;
  }

  [Symbol.iterator](): Iterator<PoserNode> {
    return this.nodes.values();
  }

  toArray(): PoserNode[] {
    return Array.from(this.nodes);
  }

  first(): PoserNode | null {
    const iter = this.nodes.values().next();
    return iter.done ? null : iter.value;
  }

  add(node: PoserNode): this {
    this.nodes.add(node);
    return this;
  }

  clear(): this {
    this.nodes.clear();
    return this;
  }

  clearSubNodes(): this {
    for (const node of this.nodes) {
      node.children = [];
      node.hasChildrenBlock = false;
    }
    return this;
  }

  remove(): void {
    for (const node of this.nodes) {
      if (node.parent) {
        node.parent.removeChild(node);
      }
    }
    this.nodes.clear();
  }

  deleteSubNode(indexOrName: number | string): this {
    for (const node of this.nodes) {
      node.deleteSubNode(indexOrName);
    }
    return this;
  }

  addSubNode(name: string): NodeList {
    const result = new NodeList();
    for (const node of this.nodes) {
      const created = node.addChild(name);
      result.add(created);
    }
    return result;
  }

  subNode(indexOrName: number | string): NodeList {
    const result = new NodeList();
    for (const node of this.nodes) {
      const child = node.subNode(indexOrName);
      if (child) result.add(child);
    }
    return result;
  }

  subNodes(): NodeList {
    const result = new NodeList();
    for (const node of this.nodes) {
      for (const child of node.children) {
        result.add(child);
      }
    }
    return result;
  }

  find(name: string, recursive: boolean = false): PoserNode | null {
    for (const node of this.nodes) {
      const found = node.findChild(name, recursive);
      if (found) return found;
    }
    return null;
  }

  findAll(name: string, recursive: boolean = false): NodeList {
    const result = new NodeList();
    for (const node of this.nodes) {
      const matches = node.findChildren(name, recursive);
      for (const m of matches) {
        result.add(m);
      }
    }
    return result;
  }

  findPath(pathStr: string): NodeList {
    const result = new NodeList();
    for (const node of this.nodes) {
      const match = node.findPath(pathStr);
      if (match) result.add(match);
    }
    return result;
  }

  parent(): NodeList {
    const result = new NodeList();
    for (const node of this.nodes) {
      if (node.parent) result.add(node.parent);
    }
    return result;
  }

  root(): NodeList {
    const result = new NodeList();
    for (const node of this.nodes) {
      result.add(node.root);
    }
    return result;
  }

  setName(name: string): this {
    for (const node of this.nodes) {
      node.name = name;
    }
    return this;
  }
}

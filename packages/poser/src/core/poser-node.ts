export class PoserNode {
  public name: string = '';
  public children: PoserNode[] = [];
  public parent: PoserNode | null = null;
  public hasChildrenBlock: boolean = false;

  constructor(parent: PoserNode | null = null, name: string = '') {
    this.parent = parent;
    this.name = name;
  }

  get depth(): number {
    let d = 0;
    let curr: PoserNode | null = this.parent;
    while (curr) {
      d++;
      curr = curr.parent;
    }
    return d;
  }

  addChild(nameOrNode: string | PoserNode, ifNotExists: boolean = false): PoserNode {
    if (typeof nameOrNode === 'string') {
      if (ifNotExists) {
        const existing = this.findChild(nameOrNode);
        if (existing) return existing;
      }
      const node = new PoserNode(this, nameOrNode);
      this.children.push(node);
      this.hasChildrenBlock = true;
      return node;
    } else {
      if (ifNotExists) {
        const existing = this.findChild(nameOrNode.name);
        if (existing) return existing;
      }
      nameOrNode.parent = this;
      this.children.push(nameOrNode);
      this.hasChildrenBlock = true;
      return nameOrNode;
    }
  }

  addProperty(propertyLine: string): PoserNode {
    const propNode = new PoserNode(this, propertyLine);
    propNode.hasChildrenBlock = false;
    this.children.push(propNode);
    this.hasChildrenBlock = true;
    return propNode;
  }

  findChild(name: string, recursive: boolean = false): PoserNode | null {
    for (const child of this.children) {
      if (child.name === name || child.name.startsWith(name + ' ') || child.name.startsWith(name + '\t')) {
        return child;
      }
      if (recursive) {
        const found = child.findChild(name, true);
        if (found) return found;
      }
    }
    return null;
  }

  findChildren(name: string, recursive: boolean = false): PoserNode[] {
    const results: PoserNode[] = [];
    for (const child of this.children) {
      if (child.name === name || child.name.startsWith(name + ' ') || child.name.startsWith(name + '\t')) {
        results.push(child);
      }
      if (recursive) {
        results.push(...child.findChildren(name, true));
      }
    }
    return results;
  }

  removeChild(child: PoserNode): boolean {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      child.parent = null;
      if (this.children.length === 0) {
        this.hasChildrenBlock = false;
      }
      return true;
    }
    return false;
  }

  get root(): PoserNode {
    let curr: PoserNode = this;
    while (curr.parent) {
      curr = curr.parent;
    }
    return curr;
  }

  subNodes(): PoserNode[] {
    return this.children;
  }

  subNodeCount(): number {
    return this.children.length;
  }

  subNode(indexOrName: number | string): PoserNode | null {
    if (typeof indexOrName === 'number') {
      return this.children[indexOrName] ?? null;
    }
    return this.findChild(indexOrName);
  }

  deleteSubNode(indexOrName: number | string): PoserNode | null {
    if (typeof indexOrName === 'number') {
      if (indexOrName >= 0 && indexOrName < this.children.length) {
        const [deleted] = this.children.splice(indexOrName, 1);
        deleted.parent = null;
        if (this.children.length === 0) this.hasChildrenBlock = false;
        return deleted;
      }
      return null;
    }
    const found = this.findChild(indexOrName);
    if (found) {
      this.removeChild(found);
      return found;
    }
    return null;
  }

  /**
   * Traverse a hierarchical path separated by / or : (e.g., 'figure/channels/rotateY').
   */
  findPath(pathStr: string): PoserNode | null {
    const parts = pathStr.split(/[/:]+/).filter((p) => p.trim().length > 0);
    let current: PoserNode | null = this;
    for (const part of parts) {
      if (!current) return null;
      current = current.findChild(part);
    }
    return current;
  }

  clear(): void {
    this.name = '';
    this.children = [];
    this.hasChildrenBlock = false;
  }
}


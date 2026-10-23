import { PoserNode } from '../core/poser-node.js';

export interface BoneLink {
  child: string;
  parent: string;
}

export class FigureNode extends PoserNode {
  public figureName: string;
  public fileNumber: number;

  constructor(
    parent: PoserNode | null = null,
    figureName: string = 'Figure',
    fileNumber: number = 1
  ) {
    super(parent, 'figure');
    this.hasChildrenBlock = true;
    this.figureName = figureName;
    this.fileNumber = fileNumber;

    const nameNode = new PoserNode(this, `name ${figureName}`);
    nameNode.hasChildrenBlock = false;
    this.children.push(nameNode);
  }

  addChildNode(childBone: string, parentBone: string): this {
    const childName = childBone.includes(':') ? childBone : `${childBone}:${this.fileNumber}`;
    const parentName = parentBone.includes(':') ? parentBone : `${parentBone}:${this.fileNumber}`;

    const linkNode = new PoserNode(this, `addChildNodes ${childName} ${parentName}`);
    linkNode.hasChildrenBlock = false;
    this.children.push(linkNode);
    return this;
  }

  addWeldNode(childBone: string, parentBone: string): this {
    const childName = childBone.includes(':') ? childBone : `${childBone}:${this.fileNumber}`;
    const parentName = parentBone.includes(':') ? parentBone : `${parentBone}:${this.fileNumber}`;

    const weldNode = new PoserNode(this, `weldNodes ${childName} ${parentName}`);
    weldNode.hasChildrenBlock = false;
    this.children.push(weldNode);
    return this;
  }

  getChildrenLinks(): BoneLink[] {
    const links: BoneLink[] = [];
    for (const child of this.children) {
      if (child.name.startsWith('addChildNodes ')) {
        const parts = child.name.split(/\s+/);
        if (parts.length >= 3) {
          links.push({ child: parts[1], parent: parts[2] });
        }
      }
    }
    return links;
  }

  getWeldLinks(): BoneLink[] {
    const links: BoneLink[] = [];
    for (const child of this.children) {
      if (child.name.startsWith('weldNodes ')) {
        const parts = child.name.split(/\s+/);
        if (parts.length >= 3) {
          links.push({ child: parts[1], parent: parts[2] });
        }
      }
    }
    return links;
  }
}


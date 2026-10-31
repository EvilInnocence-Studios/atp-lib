import { PoserNode } from '../core/poser-node.js';
import { MaterialNode } from './material-node.js';

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

    const addProp = (text: string): PoserNode => {
      const node = new PoserNode(this, text);
      node.hasChildrenBlock = false;
      this.children.push(node);
      return node;
    };

    addProp(`name ${figureName}`);
    addProp(`root BODY:${fileNumber}`);
    addProp(`defaultPick BODY:${fileNumber}`);
    addProp('displayOn 1');
    addProp('allowsBending 1');
    addProp('figureType 1318');
    addProp('origFigureType 1318');
    addProp('canonType 8');
    addProp('conforming 0');

    // Default Preview material so every figure has at least one valid material block
    const previewMat = new MaterialNode(this, 'Preview');
    this.children.push(previewMat);

    addProp('displayMode USEPARENT');
    addProp('locked 0');
  }

  addChildNode(childBone: string, parentBone: string): this {
    const childName = childBone.includes(':') ? childBone : `${childBone}:${this.fileNumber}`;
    const parentName = parentBone.includes(':') ? parentBone : `${parentBone}:${this.fileNumber}`;

    if (
      this.getChildrenLinks().some(
        (l) => l.child === childName && l.parent === parentName
      )
    ) {
      return this;
    }

    const addChildLine = new PoserNode(this, `addChild ${childName}`);
    addChildLine.hasChildrenBlock = false;

    const parentLine = new PoserNode(this, parentName);
    parentLine.hasChildrenBlock = false;

    const defaultPickIdx = this.children.findIndex((c) => c.name.startsWith('defaultPick '));
    if (defaultPickIdx !== -1) {
      this.children.splice(defaultPickIdx, 0, addChildLine, parentLine);
    } else {
      this.children.push(addChildLine, parentLine);
    }
    return this;
  }

  addWeldNode(childBone: string, parentBone: string): this {
    const childName = childBone.includes(':') ? childBone : `${childBone}:${this.fileNumber}`;
    const parentName = parentBone.includes(':') ? parentBone : `${parentBone}:${this.fileNumber}`;

    if (
      this.getWeldLinks().some(
        (l) => l.child === childName && l.parent === parentName
      )
    ) {
      return this;
    }

    const weldLine = new PoserNode(this, `weld ${childName}`);
    weldLine.hasChildrenBlock = false;

    const parentLine = new PoserNode(this, parentName);
    parentLine.hasChildrenBlock = false;

    const allowsBendingIdx = this.children.findIndex((c) => c.name.startsWith('allowsBending '));
    if (allowsBendingIdx !== -1) {
      this.children.splice(allowsBendingIdx, 0, weldLine, parentLine);
    } else {
      this.children.push(weldLine, parentLine);
    }
    return this;
  }

  addMaterial(materialName: string): MaterialNode {
    const existing = this.getMaterial(materialName);
    if (existing) {
      return existing;
    }
    const mat = new MaterialNode(this, materialName);
    const displayModeIdx = this.children.findIndex((c) => c.name.startsWith('displayMode '));
    if (displayModeIdx !== -1) {
      this.children.splice(displayModeIdx, 0, mat);
    } else {
      this.children.push(mat);
    }
    return mat;
  }

  getMaterial(materialName: string): MaterialNode | undefined {
    return this.getMaterials().find(
      (m) => m.materialName === materialName || m.name === `material ${materialName}`
    );
  }

  getMaterials(): MaterialNode[] {
    return this.children.filter((c) => c instanceof MaterialNode) as MaterialNode[];
  }

  getChildrenLinks(): BoneLink[] {
    const links: BoneLink[] = [];
    for (let i = 0; i < this.children.length; i++) {
      const line = this.children[i].name.trim();
      if (line.startsWith('addChildNodes ')) {
        const parts = line.split(/\s+/);
        if (parts.length >= 3) {
          links.push({ child: parts[1], parent: parts[2] });
        }
      } else if (line.startsWith('addChild ')) {
        const childRef = line.replace(/^addChild\s+/, '').trim();
        const nextLine = this.children[i + 1]?.name.trim() ?? '';
        if (nextLine && nextLine.includes(':')) {
          links.push({ child: childRef, parent: nextLine });
          i++;
        }
      }
    }
    return links;
  }

  getWeldLinks(): BoneLink[] {
    const links: BoneLink[] = [];
    for (let i = 0; i < this.children.length; i++) {
      const line = this.children[i].name.trim();
      if (line.startsWith('weldNodes ')) {
        const parts = line.split(/\s+/);
        if (parts.length >= 3) {
          links.push({ child: parts[1], parent: parts[2] });
        }
      } else if (line.startsWith('weld ')) {
        const childRef = line.replace(/^weld\s+/, '').trim();
        const nextLine = this.children[i + 1]?.name.trim() ?? '';
        if (nextLine && nextLine.includes(':')) {
          links.push({ child: childRef, parent: nextLine });
          i++;
        }
      }
    }
    return links;
  }
}



import { PoserNode } from '../core/poser-node.js';
import { Vector3 } from 'atp-geometry';

export class TargetGeomNode extends PoserNode {
  public keysNode: PoserNode;
  private deltasNode: PoserNode;
  private indexesNode: PoserNode;
  private numbDeltasNode: PoserNode;
  public deltas: Map<number, Vector3> = new Map();

  constructor(parent: PoserNode | null = null, public morphName: string = 'Morph') {
    super(parent, `targetGeom ${morphName}`);
    this.hasChildrenBlock = true;

    // Standard Poser morph dial attributes
    this.addPropertyNode(`name ${morphName}`);
    this.addPropertyNode('initValue 0');
    this.addPropertyNode('hidden 0');
    this.addPropertyNode('forceLimits 1');
    this.addPropertyNode('min -10000');
    this.addPropertyNode('max 10000');
    this.addPropertyNode('trackingScale 0.01');

    this.keysNode = new PoserNode(this, 'keys');
    this.keysNode.hasChildrenBlock = true;

    const staticNode = new PoserNode(this.keysNode, 'static  0');
    staticNode.hasChildrenBlock = false;
    this.keysNode.children.push(staticNode);

    const kNode = new PoserNode(this.keysNode, 'k  0  0');
    kNode.hasChildrenBlock = false;
    this.keysNode.children.push(kNode);

    this.children.push(this.keysNode);

    this.addPropertyNode('interpStyleLocked 0');

    this.indexesNode = this.addPropertyNode('indexes 0');
    this.numbDeltasNode = this.addPropertyNode('numbDeltas 0');

    this.deltasNode = new PoserNode(this, 'deltas');
    this.deltasNode.hasChildrenBlock = true;
    this.children.push(this.deltasNode);

    this.addPropertyNode('blendType 0');
  }

  addDelta(vertexIndex: number, dx: number, dy: number, dz: number): this {
    const deltaVec = new Vector3(dx, dy, dz);
    this.deltas.set(vertexIndex, deltaVec);

    const deltaLine = `d ${vertexIndex} ${dx.toFixed(6)} ${dy.toFixed(6)} ${dz.toFixed(6)}`;
    const dNode = new PoserNode(this.deltasNode, deltaLine);
    dNode.hasChildrenBlock = false;
    this.deltasNode.children.push(dNode);

    const count = this.deltas.size;
    this.indexesNode.name = `indexes ${count}`;
    if (this.numbDeltasNode.name === 'numbDeltas 0' || count > this.getNumbDeltas()) {
      this.numbDeltasNode.name = `numbDeltas ${count}`;
    }

    return this;
  }

  setNumbDeltas(totalVertices: number): this {
    this.numbDeltasNode.name = `numbDeltas ${totalVertices}`;
    return this;
  }

  getNumbDeltas(): number {
    const parts = this.numbDeltasNode.name.split(/\s+/);
    return parseInt(parts[1], 10) || 0;
  }

  setDeltas(deltas: Map<number, Vector3>, totalVertices?: number): this {
    this.deltasNode.children = [];
    this.deltas.clear();
    for (const [idx, v] of deltas.entries()) {
      this.addDelta(idx, v.x, v.y, v.z);
    }
    if (totalVertices !== undefined) {
      this.setNumbDeltas(totalVertices);
    }
    return this;
  }

  private addPropertyNode(text: string): PoserNode {
    const node = new PoserNode(this, text);
    node.hasChildrenBlock = false;
    this.children.push(node);
    return node;
  }
}

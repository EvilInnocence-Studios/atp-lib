import { PoserNode } from '../core/poser-node.js';
import { Vector3 } from 'atp-geometry';

export class TargetGeomNode extends PoserNode {
  private deltasNode: PoserNode;
  private indexesNode: PoserNode;
  private numbDeltasNode: PoserNode;
  public deltas: Map<number, Vector3> = new Map();

  constructor(parent: PoserNode | null = null, morphName: string = 'Morph') {
    super(parent, `targetGeom ${morphName}`);
    this.hasChildrenBlock = true;

    // Standard Poser morph dial attributes
    const nameNode = new PoserNode(this, `name ${morphName}`);
    nameNode.hasChildrenBlock = false;
    this.children.push(nameNode);

    const initNode = new PoserNode(this, `initValue 0`);
    initNode.hasChildrenBlock = false;
    this.children.push(initNode);

    const minNode = new PoserNode(this, `min -10`);
    minNode.hasChildrenBlock = false;
    this.children.push(minNode);

    const maxNode = new PoserNode(this, `max 10`);
    maxNode.hasChildrenBlock = false;
    this.children.push(maxNode);

    const trackingNode = new PoserNode(this, `trackingScale 0.001`);
    trackingNode.hasChildrenBlock = false;
    this.children.push(trackingNode);

    this.indexesNode = new PoserNode(this, 'indexes 0');
    this.indexesNode.hasChildrenBlock = false;
    this.children.push(this.indexesNode);

    this.numbDeltasNode = new PoserNode(this, 'numbDeltas 0');
    this.numbDeltasNode.hasChildrenBlock = false;
    this.children.push(this.numbDeltasNode);

    this.deltasNode = new PoserNode(this, 'deltas');
    this.deltasNode.hasChildrenBlock = true;
    this.children.push(this.deltasNode);
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
    this.numbDeltasNode.name = `numbDeltas ${count}`;

    return this;
  }

  setDeltas(deltas: Map<number, Vector3>): this {
    this.deltasNode.children = [];
    this.deltas.clear();
    for (const [idx, v] of deltas.entries()) {
      this.addDelta(idx, v.x, v.y, v.z);
    }
    return this;
  }
}

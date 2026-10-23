import { PoserNode } from '../core/poser-node.js';
import { Vector3 } from '@atp/geometry';
import { VectorNode } from './vector-node.js';
import { GeomCustomNode } from './geomcustom-node.js';
import { ChannelsNode } from './channels-node.js';
import { WeightMapNode } from './weightmap-node.js';

export class ActorNode extends PoserNode {
  public storageOffsetNode: PoserNode;
  public geomCustom: GeomCustomNode;
  public channels: ChannelsNode;
  public originNode: VectorNode;
  public endPointNode: VectorNode;
  public orientationNode: VectorNode;

  constructor(
    parent: PoserNode | null = null,
    public actorName: string = 'bone',
    public fileNumber: number = 1
  ) {
    super(parent, `actor ${actorName}:${fileNumber}`);
    this.hasChildrenBlock = true;

    // storageOffset
    this.storageOffsetNode = new PoserNode(this, 'storageOffset 0 0 0');
    this.storageOffsetNode.hasChildrenBlock = false;
    this.children.push(this.storageOffsetNode);

    // geomCustom
    this.geomCustom = new GeomCustomNode(this);
    this.children.push(this.geomCustom);

    // channels
    this.channels = new ChannelsNode(this);
    this.children.push(this.channels);

    // default endPoint, origin, orientation
    this.endPointNode = new VectorNode(this, 'endPoint', new Vector3(0, 1, 0));
    this.children.push(this.endPointNode);

    this.originNode = new VectorNode(this, 'origin', new Vector3(0, 0, 0));
    this.children.push(this.originNode);

    this.orientationNode = new VectorNode(this, 'orientation', new Vector3(0, 0, 0));
    this.children.push(this.orientationNode);
  }

  setOrigin(v: Vector3): this {
    this.originNode.setVector('origin', v);
    return this;
  }

  getOrigin(): Vector3 {
    return this.originNode.getVector();
  }

  setEndPoint(v: Vector3): this {
    this.endPointNode.setVector('endPoint', v);
    return this;
  }

  getEndPoint(): Vector3 {
    return this.endPointNode.getVector();
  }

  setOrientation(v: Vector3): this {
    this.orientationNode.setVector('orientation', v);
    return this;
  }

  getOrientation(): Vector3 {
    return this.orientationNode.getVector();
  }

  setObjPath(objRelativePath: string): this {
    this.geomCustom.setObjPath(objRelativePath);
    return this;
  }

  createDefaultChannels(): this {
    this.channels.createDefaultChannels();
    return this;
  }

  addWeightMap(mapId: string, numVerts?: number): WeightMapNode {
    const existing = this.getWeightMap(mapId);
    if (existing) {
      if (numVerts !== undefined) existing.setNumVerts(numVerts);
      return existing;
    }

    const wmNode = new WeightMapNode(this, mapId);
    if (numVerts !== undefined) wmNode.setNumVerts(numVerts);
    this.children.push(wmNode);
    return wmNode;
  }

  getWeightMap(mapId: string): WeightMapNode | undefined {
    const cleanId = WeightMapNode.normalizeMapId(mapId);
    return this.getWeightMaps().find((wm) => wm.mapId === cleanId);
  }

  getWeightMaps(): WeightMapNode[] {
    return this.children.filter((c) => c instanceof WeightMapNode) as WeightMapNode[];
  }
}


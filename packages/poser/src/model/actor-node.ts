import { PoserNode } from '../core/poser-node.js';
import { Vector3 } from 'atp-geometry';
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

  setRotateOrder(order: string = 'zyx'): this {
    const text = `rotateOrder ${order}`;
    const existing = this.children.find((c) => c.name.startsWith('rotateOrder'));
    if (existing) {
      existing.name = text;
    } else {
      const node = new PoserNode(this, text);
      node.hasChildrenBlock = false;
      this.children.push(node);
    }
    return this;
  }

  getRotateOrder(): string | null {
    const node = this.children.find((c) => c.name.startsWith('rotateOrder'));
    if (!node) return null;
    return node.name.split(/\s+/)[1] ?? null;
  }

  setGeomHandler(handlerType: number = 13, actorName?: string): this {
    const target = actorName ?? this.actorName;
    const text = `geomHandlerGeom ${handlerType} ${target}`;
    const existing = this.children.find((c) => c.name.startsWith('geomHandlerGeom'));
    if (existing) {
      existing.name = text;
    } else {
      const node = new PoserNode(this, text);
      node.hasChildrenBlock = false;
      this.children.push(node);
    }
    return this;
  }

  getGeomHandler(): { handlerType: number; actorName: string } | null {
    const node = this.children.find((c) => c.name.startsWith('geomHandlerGeom'));
    if (!node) return null;
    const parts = node.name.split(/\s+/);
    return {
      handlerType: parseInt(parts[1], 10),
      actorName: parts[2] ?? this.actorName,
    };
  }

  setHasGeom(hasGeom: boolean | number): this {
    const val = typeof hasGeom === 'boolean' ? (hasGeom ? 1 : 0) : hasGeom;
    const text = `hasGeom ${val}`;
    const existing = this.children.find((c) => c.name.startsWith('hasGeom'));
    if (existing) {
      existing.name = text;
    } else {
      const node = new PoserNode(this, text);
      node.hasChildrenBlock = false;
      this.children.push(node);
    }
    return this;
  }

  getHasGeom(): number | null {
    const node = this.children.find((c) => c.name.startsWith('hasGeom'));
    if (!node) return null;
    return parseInt(node.name.split(/\s+/)[1], 10);
  }

  setParent(parentActorName: string): this {
    const target =
      parentActorName.includes(':') || parentActorName === 'UNIVERSE'
        ? parentActorName
        : `${parentActorName}:1`;
    const text = `parent ${target}`;
    const existing = this.children.find((c) => c.name.startsWith('parent'));
    if (existing) {
      existing.name = text;
    } else {
      const node = new PoserNode(this, text);
      node.hasChildrenBlock = false;
      this.children.push(node);
    }
    return this;
  }

  getParent(): string | null {
    const node = this.children.find((c) => c.name.startsWith('parent'));
    if (!node) return null;
    return node.name.split(/\s+/)[1] ?? null;
  }

  setSphereFalloff(center: Vector3, innerRadius: number, outerRadius: number): this {
    let sphereNode = this.children.find(
      (c) => c.name === 'sphere' || c.name.startsWith('sphere ')
    );
    if (!sphereNode) {
      sphereNode = new PoserNode(this, 'sphere');
      sphereNode.hasChildrenBlock = true;
      this.children.push(sphereNode);
    }

    const centerText = `center ${center.x.toFixed(6)} ${center.y.toFixed(6)} ${center.z.toFixed(6)}`;
    const innerText = `innerRad ${innerRadius.toFixed(6)}`;
    const outerText = `outerRad ${outerRadius.toFixed(6)}`;

    let centerChild = sphereNode.children.find((c) => c.name.startsWith('center'));
    if (centerChild) {
      centerChild.name = centerText;
    } else {
      centerChild = new PoserNode(sphereNode, centerText);
      centerChild.hasChildrenBlock = false;
      sphereNode.children.push(centerChild);
    }

    let innerChild = sphereNode.children.find((c) => c.name.startsWith('innerRad'));
    if (innerChild) {
      innerChild.name = innerText;
    } else {
      innerChild = new PoserNode(sphereNode, innerText);
      innerChild.hasChildrenBlock = false;
      sphereNode.children.push(innerChild);
    }

    let outerChild = sphereNode.children.find((c) => c.name.startsWith('outerRad'));
    if (outerChild) {
      outerChild.name = outerText;
    } else {
      outerChild = new PoserNode(sphereNode, outerText);
      outerChild.hasChildrenBlock = false;
      sphereNode.children.push(outerChild);
    }

    return this;
  }

  getSphereFalloff(): { center: Vector3; innerRadius: number; outerRadius: number } | null {
    const sphereNode = this.children.find(
      (c) => c.name === 'sphere' || c.name.startsWith('sphere ')
    );
    if (!sphereNode) return null;

    const centerChild = sphereNode.children.find((c) => c.name.startsWith('center'));
    const innerChild = sphereNode.children.find((c) => c.name.startsWith('innerRad'));
    const outerChild = sphereNode.children.find((c) => c.name.startsWith('outerRad'));

    if (!centerChild || !innerChild || !outerChild) return null;

    const cParts = centerChild.name.split(/\s+/);
    const center = new Vector3(
      parseFloat(cParts[1]),
      parseFloat(cParts[2]),
      parseFloat(cParts[3])
    );
    const innerRadius = parseFloat(innerChild.name.split(/\s+/)[1]);
    const outerRadius = parseFloat(outerChild.name.split(/\s+/)[1]);

    return { center, innerRadius, outerRadius };
  }
}


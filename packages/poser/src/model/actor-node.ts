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

  private rotateOrderMetadata: string | null = null;
  private geomHandlerMetadata: { handlerType: number; actorName: string } | null = null;
  private hasGeomMetadata: number | null = null;
  private sphereFalloffMetadata: {
    center: Vector3;
    innerRadius: number;
    outerRadius: number;
  } | null = null;

  constructor(
    parent: PoserNode | null = null,
    public actorName: string = 'bone',
    public fileNumber: number = 1
  ) {
    super(parent, `actor ${actorName}:${fileNumber}`);
    this.hasChildrenBlock = true;

    const isBody = actorName === 'BODY';
    this.hasGeomMetadata = isBody ? 0 : 1;
    if (!isBody) {
      this.geomHandlerMetadata = { handlerType: 13, actorName };
    }

    // Kept as detached helper nodes for backwards compatibility; Pass 1 stubs hold storageOffset/geomHandlerGeom
    this.storageOffsetNode = new PoserNode(null, 'storageOffset 0 0 0');
    this.storageOffsetNode.hasChildrenBlock = false;
    this.geomCustom = new GeomCustomNode(null);

    const addProp = (text: string): PoserNode => {
      const node = new PoserNode(this, text);
      node.hasChildrenBlock = false;
      this.children.push(node);
      return node;
    };

    // Required Pass 2 pre-channel header properties
    addProp(`name ${actorName}`);
    addProp(isBody ? 'off' : 'on');
    addProp('bend 1');
    addProp(`dynamicsLock ${isBody ? 1 : 0}`);
    addProp('hidden 0');
    addProp('addToMenu 1');
    addProp('castsShadow 1');
    addProp('includeInDepthCue 1');
    addProp('useZBuffer 1');
    addProp(`parent ${isBody ? 'UNIVERSE' : `BODY:${fileNumber}`}`);
    addProp('creaseAngle 80');

    // channels block
    this.channels = new ChannelsNode(this);
    this.children.push(this.channels);

    // Post-channel spatial vectors: endPoint, origin, orientation
    this.endPointNode = new VectorNode(this, 'endPoint', new Vector3(0, 1, 0));
    this.children.push(this.endPointNode);

    this.originNode = new VectorNode(this, 'origin', new Vector3(0, 0, 0));
    this.children.push(this.originNode);

    this.orientationNode = new VectorNode(this, 'orientation', new Vector3(0, 0, 0));
    this.children.push(this.orientationNode);

    // Required Pass 2 post-channel rendering and display properties
    addProp('displayOrigin 0');
    addProp('displayMode USEPARENT');
    addProp('customMaterial 0');
    addProp('locked 0');
    addProp('backfaceCull 0');
    addProp('visibleInReflections 1');
    addProp('visibleInRender 1');
    addProp('displacementBounds 0');
    addProp('shadingRate 0.2');
    addProp('smoothPolys 1');

    // Populate valid default channels immediately so ActorNode is valid by default
    this.channels.createDefaultChannels({
      isBody,
      origin: this.getOrigin(),
      endPoint: this.getEndPoint(),
      parentActorFull: isBody ? 'UNIVERSE' : `BODY:${fileNumber}`,
    });
  }

  setOrigin(v: Vector3): this {
    this.originNode.setVector('origin', v);
    if (this.channels) {
      this.channels.syncOriginAndEndPoint(v, this.getEndPoint());
    }
    return this;
  }

  getOrigin(): Vector3 {
    return this.originNode ? this.originNode.getVector() : new Vector3(0, 0, 0);
  }

  setEndPoint(v: Vector3): this {
    this.endPointNode.setVector('endPoint', v);
    if (this.channels) {
      this.channels.syncOriginAndEndPoint(this.getOrigin(), v);
    }
    return this;
  }

  getEndPoint(): Vector3 {
    return this.endPointNode ? this.endPointNode.getVector() : new Vector3(0, 1, 0);
  }

  setOrientation(v: Vector3): this {
    this.orientationNode.setVector('orientation', v);
    return this;
  }

  getOrientation(): Vector3 {
    return this.orientationNode ? this.orientationNode.getVector() : new Vector3(0, 0, 0);
  }

  setObjPath(objRelativePath: string): this {
    this.geomCustom.setObjPath(objRelativePath);
    return this;
  }

  createDefaultChannels(): this {
    this.channels.createDefaultChannels({
      isBody: this.actorName === 'BODY',
      origin: this.getOrigin(),
      endPoint: this.getEndPoint(),
      parentActorFull: this.getParent() ?? `BODY:${this.fileNumber}`,
      rotateOrder: this.rotateOrderMetadata ?? undefined,
    });
    if (this.sphereFalloffMetadata) {
      this.applySphereFalloffToJoints();
    }
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
    this.rotateOrderMetadata = order;
    if (this.channels) {
      this.channels.setRotationOrder(order);
    }
    return this;
  }

  getRotateOrder(): string | null {
    if (this.rotateOrderMetadata) {
      return this.rotateOrderMetadata;
    }
    const node = this.children?.find((c) => c.name.startsWith('rotateOrder'));
    if (node) {
      return node.name.split(/\s+/)[1] ?? null;
    }
    if (this.channels) {
      const fromChannels = this.channels.getRotationOrder();
      if (fromChannels) return fromChannels;
    }
    return null;
  }

  setGeomHandler(handlerType: number = 13, actorName?: string): this {
    const target = actorName ?? this.actorName;
    this.geomHandlerMetadata = { handlerType, actorName: target };
    if (this.hasGeomMetadata === null) {
      this.hasGeomMetadata = 1;
    }
    this.notifyParentStubSync();
    return this;
  }

  getGeomHandler(): { handlerType: number; actorName: string } | null {
    if (this.geomHandlerMetadata) {
      return { ...this.geomHandlerMetadata };
    }
    const node = this.children?.find((c) => c.name.startsWith('geomHandlerGeom'));
    if (!node) return null;
    const parts = node.name.split(/\s+/);
    return {
      handlerType: parseInt(parts[1], 10),
      actorName: parts[2] ?? this.actorName,
    };
  }

  setHasGeom(hasGeom: boolean | number): this {
    const val = typeof hasGeom === 'boolean' ? (hasGeom ? 1 : 0) : hasGeom;
    this.hasGeomMetadata = val;
    if (val === 1 && !this.geomHandlerMetadata) {
      this.geomHandlerMetadata = { handlerType: 13, actorName: this.actorName };
    }
    this.notifyParentStubSync();
    return this;
  }

  getHasGeom(): number | null {
    if (this.hasGeomMetadata !== null && this.hasGeomMetadata !== undefined) {
      return this.hasGeomMetadata;
    }
    const node = this.children?.find((c) => c.name.startsWith('hasGeom'));
    if (!node) return null;
    return parseInt(node.name.split(/\s+/)[1], 10);
  }

  private notifyParentStubSync(): void {
    const parentAny = this.parent as unknown as {
      syncActorStub?: (actor: ActorNode) => void;
    } | null;
    if (parentAny && typeof parentAny.syncActorStub === 'function') {
      parentAny.syncActorStub(this);
    }
  }

  setParent(parentActorName: string): this {
    const fileNum = this.fileNumber ?? 1;
    let normalized = parentActorName.trim();
    if (normalized === 'NONE' || normalized.startsWith('NONE:')) {
      normalized = this.actorName === 'BODY' ? 'UNIVERSE' : `BODY:${fileNum}`;
    } else if (this.actorName === 'BODY') {
      normalized = 'UNIVERSE';
    }

    const target =
      normalized.includes(':') || normalized === 'UNIVERSE'
        ? normalized
        : `${normalized}:${fileNum}`;
    const text = `parent ${target}`;
    const existing = this.children.find(
      (c) => c.name === 'parent' || c.name.startsWith('parent ')
    );
    if (existing) {
      existing.name = text;
    } else {
      const node = new PoserNode(this, text);
      node.hasChildrenBlock = false;
      const creaseIdx = this.children.findIndex((c) => c.name.startsWith('creaseAngle'));
      if (creaseIdx !== -1) {
        this.children.splice(creaseIdx, 0, node);
      } else {
        this.children.push(node);
      }
    }
    return this;
  }

  getParent(): string | null {
    const node = this.children?.find(
      (c) => c.name === 'parent' || c.name.startsWith('parent ')
    );
    if (!node) return null;
    return node.name.split(/\s+/)[1] ?? null;
  }

  setSphereFalloff(center: Vector3, innerRadius: number, outerRadius: number): this {
    this.sphereFalloffMetadata = {
      center: new Vector3(center.x, center.y, center.z),
      innerRadius,
      outerRadius,
    };
    this.applySphereFalloffToJoints();
    return this;
  }

  private applySphereFalloffToJoints(): void {
    if (!this.sphereFalloffMetadata || !this.channels) return;
    const { center, innerRadius, outerRadius } = this.sphereFalloffMetadata;
    const innerScale = innerRadius > 0 ? innerRadius : 0.01;
    const outerScale = outerRadius > 0 ? outerRadius : 0.02;

    for (const ch of this.channels.children) {
      if (!ch.name.startsWith('joint')) continue;
      let sphereMats = ch.children.find((c) => c.name.startsWith('sphereMatsRaw'));
      if (!sphereMats) {
        sphereMats = new PoserNode(ch, 'sphereMatsRaw');
        sphereMats.hasChildrenBlock = false;
        const calcIdx = ch.children.findIndex((c) => c.name === 'calcWeights');
        if (calcIdx !== -1) {
          ch.children.splice(calcIdx, 0, sphereMats);
        } else {
          ch.children.push(sphereMats);
        }
      }
      sphereMats.children = [];
      const addMatLine = (line: string) => {
        const l = new PoserNode(sphereMats!, line);
        l.hasChildrenBlock = false;
        sphereMats!.children.push(l);
      };
      // Inner sphere 4x4 matrix rows
      addMatLine(`${innerScale.toFixed(6)} 0 0 0`);
      addMatLine(`0 ${innerScale.toFixed(6)} 0 0`);
      addMatLine(`0 0 ${innerScale.toFixed(6)} 0`);
      addMatLine(`${center.x.toFixed(6)} ${center.y.toFixed(6)} ${center.z.toFixed(6)} 1`);
      // Outer sphere 4x4 matrix rows
      addMatLine(`${outerScale.toFixed(6)} 0 0 0`);
      addMatLine(`0 ${outerScale.toFixed(6)} 0 0`);
      addMatLine(`0 0 ${outerScale.toFixed(6)} 0`);
      addMatLine(`${center.x.toFixed(6)} ${center.y.toFixed(6)} ${center.z.toFixed(6)} 1`);
    }
  }

  getSphereFalloff(): { center: Vector3; innerRadius: number; outerRadius: number } | null {
    if (this.sphereFalloffMetadata) {
      return {
        center: new Vector3(
          this.sphereFalloffMetadata.center.x,
          this.sphereFalloffMetadata.center.y,
          this.sphereFalloffMetadata.center.z
        ),
        innerRadius: this.sphereFalloffMetadata.innerRadius,
        outerRadius: this.sphereFalloffMetadata.outerRadius,
      };
    }

    const sphereNode = this.children?.find(
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

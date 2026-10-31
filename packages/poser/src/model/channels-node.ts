import { Vector3 } from 'atp-geometry';
import { PoserNode } from '../core/poser-node.js';
import { TargetGeomNode } from './targetgeom-node.js';
import { JointNode, JointChannelType } from './joint-node.js';
import { GroupsNode } from './groups-node.js';

type AxisChar = 'x' | 'y' | 'z';

export interface CreateDefaultChannelsOptions {
  isBody?: boolean;
  origin?: Vector3;
  endPoint?: Vector3;
  parentActorFull?: string;
  rotateOrder?: string;
}

export class ChannelsNode extends PoserNode {
  public groupsNode: GroupsNode | null = null;

  constructor(parent: PoserNode | null = null) {
    super(parent, 'channels');
    this.hasChildrenBlock = true;
  }

  /**
   * Determines the 3 rotation axes [twist, joint1, joint2] from an explicit rotateOrder string
   * (e.g. 'zyx', 'yxz') or from the dominant axis of (endPoint - origin).
   */
  static resolveAxes(
    origin: Vector3 = new Vector3(0, 0, 0),
    endPoint: Vector3 = new Vector3(0, 1, 0),
    rotateOrder?: string | null
  ): [AxisChar, AxisChar, AxisChar] {
    if (rotateOrder && /^[xyz]{3}$/i.test(rotateOrder.trim())) {
      const lower = rotateOrder.trim().toLowerCase();
      const a0 = lower[0] as AxisChar;
      const a1 = lower[1] as AxisChar;
      const a2 = lower[2] as AxisChar;
      if (a0 !== a1 && a1 !== a2 && a0 !== a2) {
        return [a0, a1, a2];
      }
    }

    const dx = Math.abs(endPoint.x - origin.x);
    const dy = Math.abs(endPoint.y - origin.y);
    const dz = Math.abs(endPoint.z - origin.z);

    if (dx > dy && dx > dz) {
      return ['x', 'y', 'z'];
    }
    if (dz > dx && dz > dy) {
      return ['z', 'x', 'y'];
    }
    return ['y', 'z', 'x'];
  }

  createDefaultChannels(options?: CreateDefaultChannelsOptions): void {
    // Infer defaults from parent ActorNode if available
    const parentAny = this.parent as unknown as {
      actorName?: string;
      fileNumber?: number;
      getOrigin?: () => Vector3;
      getEndPoint?: () => Vector3;
      getParent?: () => string | null;
      getRotateOrder?: () => string | null;
    } | null;

    const actorName = parentAny?.actorName ?? 'bone';
    const fileNumber = parentAny?.fileNumber ?? 1;
    const isBody = options?.isBody ?? actorName === 'BODY';
    const origin =
      options?.origin ??
      (typeof parentAny?.getOrigin === 'function' ? parentAny.getOrigin() : new Vector3(0, 0, 0));
    const endPoint =
      options?.endPoint ??
      (typeof parentAny?.getEndPoint === 'function'
        ? parentAny.getEndPoint()
        : new Vector3(0, 1, 0));
    const rawParent =
      options?.parentActorFull ??
      (typeof parentAny?.getParent === 'function' ? parentAny.getParent() : null) ??
      `BODY:${fileNumber}`;
    const parentActorFull =
      rawParent === 'UNIVERSE' || rawParent.startsWith('NONE')
        ? `BODY:${fileNumber}`
        : rawParent.includes(':')
        ? rawParent
        : `${rawParent}:${fileNumber}`;
    const rotateOrder =
      options?.rotateOrder ??
      (typeof parentAny?.getRotateOrder === 'function' ? parentAny.getRotateOrder() : null) ??
      undefined;

    // Preserve any existing morphs, master dials, or child-deformer channels
    const preservedMorphs = this.children.filter((c) => c instanceof TargetGeomNode);
    const preservedMasterDials = this.children.filter((c) => c.name.startsWith('valueParm '));
    const preservedChildDeformers = this.children.filter((c) => {
      const parts = c.name.trim().split(/\s+/);
      if (parts.length < 2) return false;
      const [chType, chName] = parts;
      if (chType.startsWith('twist') && !chName.startsWith('twist')) return true;
      if (chType.startsWith('joint') && !chName.startsWith('joint')) return true;
      if (chType.startsWith('smoothScale')) {
        const parentBase = parentActorFull.split(':')[0];
        if (!chName.startsWith(`${parentBase}_smoo`)) return true;
      }
      return false;
    });

    const groups = this.getOrCreateGroups();
    this.children = [groups];

    const [axis1, axis2, axis3] = isBody
      ? (['y', 'z', 'x'] as [AxisChar, AxisChar, AxisChar])
      : ChannelsNode.resolveAxes(origin, endPoint, rotateOrder);

    // Populate standard Poser groups (Transform and Other)
    for (const p of [
      'scale',
      'xScale',
      'yScale',
      'zScale',
      `${axis1}rot`,
      `${axis2}rot`,
      `${axis3}rot`,
      'xtran',
      'ytran',
      'ztran',
    ]) {
      this.addParamToGroup('Transform', p);
    }
    for (const p of ['zOffset', 'yOffset', 'xOffset']) {
      this.addParamToGroup('Other', p);
    }

    // Re-add any preserved child deformer channels first (matching Poser order)
    for (const cd of preservedChildDeformers) {
      this.children.push(cd);
    }

    // Re-add any preserved morphs and master dials
    for (const m of preservedMorphs) {
      this.children.push(m);
    }
    for (const d of preservedMasterDials) {
      this.children.push(d);
    }

    // 1. Pre-rotation Joint Origin OffsetA channels (+origin)
    this.children.push(
      new JointNode(this, 'zOffsetA', 'zOffset', {
        displayName: 'zOffset',
        initValue: origin.z,
        hidden: 1,
        forceLimits: 0,
        min: -100000,
        max: 100000,
        trackingScale: 0.004,
        staticKey: 1,
        keyValue: origin.z,
        staticValue: origin.z,
      })
    );
    this.children.push(
      new JointNode(this, 'yOffsetA', 'yOffset', {
        displayName: 'yOffset',
        initValue: origin.y,
        hidden: 1,
        forceLimits: 0,
        min: -100000,
        max: 100000,
        trackingScale: 0.004,
        staticKey: 1,
        keyValue: origin.y,
        staticValue: origin.y,
      })
    );
    this.children.push(
      new JointNode(this, 'xOffsetA', 'xOffset', {
        displayName: 'xOffset',
        initValue: origin.x,
        hidden: 1,
        forceLimits: 0,
        min: -100000,
        max: 100000,
        trackingScale: 0.004,
        staticKey: 1,
        keyValue: origin.x,
        staticValue: origin.x,
      })
    );

    // 2. Scale channels
    const scaleMin = isBody ? 0.1 : 0.001;
    const scaleMainType: JointChannelType = isBody ? 'propagatingScale' : 'scale';
    const scaleXType: JointChannelType = isBody ? 'propagatingScaleX' : 'scaleX';
    const scaleYType: JointChannelType = isBody ? 'propagatingScaleY' : 'scaleY';
    const scaleZType: JointChannelType = isBody ? 'propagatingScaleZ' : 'scaleZ';

    this.children.push(
      new JointNode(this, scaleMainType, 'scale', {
        displayName: 'Scale',
        initValue: 1,
        hidden: 0,
        forceLimits: 0,
        min: scaleMin,
        max: 100000,
        trackingScale: 0.004,
        staticKey: 0,
        keyValue: 1,
      })
    );
    this.children.push(
      new JointNode(this, scaleXType, 'xScale', {
        displayName: 'xScale',
        initValue: 1,
        hidden: 0,
        forceLimits: 0,
        min: scaleMin,
        max: 100000,
        trackingScale: 0.004,
        staticKey: 0,
        keyValue: 1,
      })
    );
    this.children.push(
      new JointNode(this, scaleYType, 'yScale', {
        displayName: 'yScale',
        initValue: 1,
        hidden: 0,
        forceLimits: 0,
        min: scaleMin,
        max: 100000,
        trackingScale: 0.004,
        staticKey: 0,
        keyValue: 1,
      })
    );
    this.children.push(
      new JointNode(this, scaleZType, 'zScale', {
        displayName: 'zScale',
        initValue: 1,
        hidden: 0,
        forceLimits: 0,
        min: scaleMin,
        max: 100000,
        trackingScale: 0.004,
        staticKey: 0,
        keyValue: 1,
      })
    );

    // 3. Self Joint Deformation channels for non-BODY bones
    if (!isBody) {
      const parentBase = parentActorFull.split(':')[0];
      const A1 = axis1.toUpperCase() as 'X' | 'Y' | 'Z';
      const A2 = axis2.toUpperCase() as 'X' | 'Y' | 'Z';
      const A3 = axis3.toUpperCase() as 'X' | 'Y' | 'Z';

      this.children.push(
        this.buildDeformerChannel(
          `joint${A2}` as JointChannelType,
          `joint${axis2}`,
          `joint${axis2}`,
          parentActorFull,
          origin,
          endPoint,
          false
        )
      );
      this.children.push(
        this.buildDeformerChannel(
          `joint${A3}` as JointChannelType,
          `joint${axis3}`,
          `joint${axis3}`,
          parentActorFull,
          origin,
          endPoint,
          false
        )
      );
      this.children.push(
        this.buildDeformerChannel(
          `twist${A1}` as JointChannelType,
          `twist${axis1}`,
          `twist${axis1}`,
          parentActorFull,
          origin,
          endPoint,
          true
        )
      );
      this.children.push(
        this.buildDeformerChannel(
          `smoothScale${A1}` as JointChannelType,
          `${parentBase}_smoo${A1}`,
          `${parentBase}_smoo${A1}`,
          parentActorFull,
          origin,
          endPoint,
          false
        )
      );
    }

    // 4. Rotation channels (ordered according to twist/joint axes)
    const rotAxes: AxisChar[] = [axis1, axis2, axis3];
    for (const ax of rotAxes) {
      const AX = ax.toUpperCase() as 'X' | 'Y' | 'Z';
      const rotType = `rotate${AX}` as JointChannelType;
      const rotName = `${ax}rot`;
      const dispName = isBody
        ? ax === 'y'
          ? 'yRotate'
          : ax === 'z'
          ? 'zRotate'
          : 'xRotate'
        : rotName;
      this.children.push(
        new JointNode(this, rotType, rotName, {
          displayName: dispName,
          initValue: 0,
          hidden: 0,
          forceLimits: 0,
          min: -100000,
          max: 100000,
          trackingScale: 1,
          staticKey: 0,
          keyValue: 0,
        })
      );
    }

    // 5. Post-rotation Joint Origin OffsetB channels (-origin)
    this.children.push(
      new JointNode(this, 'xOffsetB', 'xTranB', {
        displayName: 'xTranB',
        initValue: -origin.x,
        hidden: 1,
        forceLimits: 0,
        min: -100000,
        max: 100000,
        trackingScale: 0.004,
        staticKey: 1,
        keyValue: -origin.x,
        staticValue: -origin.x,
      })
    );
    this.children.push(
      new JointNode(this, 'yOffsetB', 'yTranB', {
        displayName: 'yTranB',
        initValue: -origin.y,
        hidden: 1,
        forceLimits: 0,
        min: -100000,
        max: 100000,
        trackingScale: 0.004,
        staticKey: 1,
        keyValue: -origin.y,
        staticValue: -origin.y,
      })
    );
    this.children.push(
      new JointNode(this, 'zOffsetB', 'zTranB', {
        displayName: 'zTranB',
        initValue: -origin.z,
        hidden: 1,
        forceLimits: 0,
        min: -100000,
        max: 100000,
        trackingScale: 0.004,
        staticKey: 1,
        keyValue: -origin.z,
        staticValue: -origin.z,
      })
    );

    // 6. Translation channels
    const tranHidden = isBody ? 0 : 1;
    this.children.push(
      new JointNode(this, 'translateX', 'xtran', {
        displayName: isBody ? 'xTran' : 'xtran',
        initValue: 0,
        hidden: tranHidden,
        forceLimits: 0,
        min: -100000,
        max: 100000,
        trackingScale: 0.001,
        trackingScaleMult: 1.0,
        staticKey: 0,
        keyValue: 0,
      })
    );
    this.children.push(
      new JointNode(this, 'translateY', 'ytran', {
        displayName: isBody ? 'yTran' : 'ytran',
        initValue: 0,
        hidden: tranHidden,
        forceLimits: 0,
        min: -100000,
        max: 100000,
        trackingScale: 0.001,
        trackingScaleMult: 1.0,
        staticKey: 0,
        keyValue: 0,
      })
    );
    this.children.push(
      new JointNode(this, 'translateZ', 'ztran', {
        displayName: isBody ? 'zTran' : 'ztran',
        initValue: 0,
        hidden: tranHidden,
        forceLimits: 0,
        min: -100000,
        max: 100000,
        trackingScale: 0.001,
        trackingScaleMult: 1.0,
        staticKey: 0,
        keyValue: 0,
      })
    );
  }

  /**
   * Inserts parent-side joint deformation channels (<child>_twist*, <child>_joint*, <child>_smoo*)
   * when a child bone is attached to this bone.
   */
  createChannelsForChild(
    childBoneName: string,
    childOrigin: Vector3,
    childEndPoint: Vector3,
    fileNumber: number = 1,
    childRotateOrder?: string | null
  ): void {
    const childBase = childBoneName.split(':')[0];
    const childFull = childBoneName.includes(':')
      ? childBoneName
      : `${childBoneName}:${fileNumber}`;

    // Avoid duplicating if already added for this child
    const existingPrefix = `${childBase}_twist`;
    if (this.children.some((c) => c.name.includes(` ${existingPrefix}`))) {
      return;
    }

    const [axis1, axis2, axis3] = ChannelsNode.resolveAxes(
      childOrigin,
      childEndPoint,
      childRotateOrder
    );
    const A1 = axis1.toUpperCase() as 'X' | 'Y' | 'Z';
    const A2 = axis2.toUpperCase() as 'X' | 'Y' | 'Z';
    const A3 = axis3.toUpperCase() as 'X' | 'Y' | 'Z';

    const deformers: JointNode[] = [
      this.buildDeformerChannel(
        `twist${A1}` as JointChannelType,
        `${childBase}_twist${axis1}`,
        `${childBase}_twist${axis1}`,
        childFull,
        childOrigin,
        childEndPoint,
        true
      ),
      this.buildDeformerChannel(
        `joint${A2}` as JointChannelType,
        `${childBase}_joint${axis2}`,
        `${childBase}_joint${axis2}`,
        childFull,
        childOrigin,
        childEndPoint,
        false
      ),
      this.buildDeformerChannel(
        `joint${A3}` as JointChannelType,
        `${childBase}_joint${axis3}`,
        `${childBase}_joint${axis3}`,
        childFull,
        childOrigin,
        childEndPoint,
        false
      ),
      this.buildDeformerChannel(
        `smoothScale${A1}` as JointChannelType,
        `${childBase}_smoo${A1}`,
        `${childBase}_smoo${A1}`,
        childFull,
        childOrigin,
        childEndPoint,
        false
      ),
    ];

    // Insert right after groups block (or at start of channels before zOffsetA)
    const zOffsetIdx = this.children.findIndex((c) => c.name.startsWith('zOffsetA '));
    if (zOffsetIdx !== -1) {
      this.children.splice(zOffsetIdx, 0, ...deformers);
    } else {
      this.children.push(...deformers);
    }
  }

  private buildDeformerChannel(
    channelType: JointChannelType,
    channelName: string,
    displayName: string,
    otherActorFull: string,
    origin: Vector3,
    endPoint: Vector3,
    isTwist: boolean
  ): JointNode {
    const jn = new JointNode(this, channelType, channelName, {
      displayName,
      initValue: 0,
      hidden: 1,
      forceLimits: 0,
      min: -100000,
      max: 100000,
      trackingScale: 1,
      staticKey: 0,
      keyValue: 0,
    });

    const addProp = (text: string) => {
      const p = new PoserNode(jn, text);
      p.hasChildrenBlock = false;
      jn.children.push(p);
    };

    addProp('algorithm 0');
    addProp(`otherActor ${otherActorFull}`);
    addProp('matrixActor NULL');
    addProp(`center ${origin.x.toFixed(6)} ${origin.y.toFixed(6)} ${origin.z.toFixed(6)}`);

    if (isTwist) {
      addProp(`startPt ${origin.x.toFixed(6)} ${origin.y.toFixed(6)} ${origin.z.toFixed(6)}`);
      addProp(`endPt ${endPoint.x.toFixed(6)} ${endPoint.y.toFixed(6)} ${endPoint.z.toFixed(6)}`);
      addProp('flipped');
      addProp('calcWeights');
    } else if (channelType.startsWith('joint')) {
      addProp('doBulge 0');
      addProp('posBulgeLeft 0');
      addProp('posBulgeRight 0');
      addProp('negBulgeLeft 0');
      addProp('negBulgeRight 0');
      addProp('jointMult 1');
      addProp('calcWeights');
    } else {
      // smoothScale
      addProp(`startPt ${origin.x.toFixed(6)} ${origin.y.toFixed(6)} ${origin.z.toFixed(6)}`);
      addProp(`endPt ${endPoint.x.toFixed(6)} ${endPoint.y.toFixed(6)} ${endPoint.z.toFixed(6)}`);
      addProp('calcWeights');
    }

    return jn;
  }

  /**
   * Synchronizes *OffsetA, *OffsetB, and deformer center/startPt/endPt when an actor's origin or endPoint changes.
   */
  syncOriginAndEndPoint(origin: Vector3, endPoint: Vector3): void {
    const updateOffsetChannel = (prefix: string, val: number) => {
      const ch = this.children.find((c) => c.name.startsWith(prefix));
      if (!ch) return;
      const initNode = ch.children.find((c) => c.name.startsWith('initValue '));
      if (initNode) initNode.name = `initValue ${val}`;
      const staticValNode = ch.children.find((c) => c.name.startsWith('staticValue '));
      if (staticValNode) staticValNode.name = `staticValue ${val}`;
      const keysNode = ch.children.find((c) => c.name === 'keys');
      if (keysNode) {
        const kNode = keysNode.children.find((c) => c.name.startsWith('k 0 '));
        if (kNode) kNode.name = `k 0 ${val}`;
      }
    };

    updateOffsetChannel('zOffsetA ', origin.z);
    updateOffsetChannel('yOffsetA ', origin.y);
    updateOffsetChannel('xOffsetA ', origin.x);

    updateOffsetChannel('xOffsetB ', -origin.x);
    updateOffsetChannel('yOffsetB ', -origin.y);
    updateOffsetChannel('zOffsetB ', -origin.z);

    // Update self deformer channels (jointx/y/z, twistx/y/z, <parent>_smoo*)
    for (const ch of this.children) {
      const parts = ch.name.trim().split(/\s+/);
      if (parts.length < 2) continue;
      const [chType, chName] = parts;
      const isSelfDeformer =
        (chType.startsWith('joint') && chName.startsWith('joint')) ||
        (chType.startsWith('twist') && chName.startsWith('twist')) ||
        chType.startsWith('smoothScale');
      if (!isSelfDeformer) continue;

      const centerNode = ch.children.find((c) => c.name.startsWith('center '));
      if (centerNode) {
        centerNode.name = `center ${origin.x.toFixed(6)} ${origin.y.toFixed(6)} ${origin.z.toFixed(6)}`;
      }
      const startNode = ch.children.find((c) => c.name.startsWith('startPt '));
      if (startNode) {
        startNode.name = `startPt ${origin.x.toFixed(6)} ${origin.y.toFixed(6)} ${origin.z.toFixed(6)}`;
      }
      const endNode = ch.children.find((c) => c.name.startsWith('endPt '));
      if (endNode) {
        endNode.name = `endPt ${endPoint.x.toFixed(6)} ${endPoint.y.toFixed(6)} ${endPoint.z.toFixed(6)}`;
      }
    }
  }

  /**
   * Reorders the rotateX, rotateY, rotateZ channels in place to match a 3-letter rotation order (e.g. 'zyx', 'xyz').
   */
  setRotationOrder(order: string): void {
    const clean = order.trim().toLowerCase();
    if (!/^[xyz]{3}$/.test(clean)) return;

    const rotIndices: number[] = [];
    const rotMap = new Map<string, PoserNode>();

    for (let i = 0; i < this.children.length; i++) {
      const ch = this.children[i];
      if (ch.name.startsWith('rotateX ')) {
        rotIndices.push(i);
        rotMap.set('x', ch);
      } else if (ch.name.startsWith('rotateY ')) {
        rotIndices.push(i);
        rotMap.set('y', ch);
      } else if (ch.name.startsWith('rotateZ ')) {
        rotIndices.push(i);
        rotMap.set('z', ch);
      }
    }

    if (rotIndices.length === 3 && rotMap.size === 3) {
      for (let j = 0; j < 3; j++) {
        const axis = clean[j];
        const node = rotMap.get(axis);
        if (node) {
          this.children[rotIndices[j]] = node;
        }
      }
    }
  }

  /**
   * Returns the current rotation order derived from the sequence of rotateX/Y/Z channels (e.g. 'zyx'),
   * or null if rotation channels are not present.
   */
  getRotationOrder(): string | null {
    const axes: string[] = [];
    for (const ch of this.children) {
      if (ch.name.startsWith('rotateX ')) axes.push('x');
      else if (ch.name.startsWith('rotateY ')) axes.push('y');
      else if (ch.name.startsWith('rotateZ ')) axes.push('z');
    }
    return axes.length === 3 ? axes.join('') : null;
  }

  addMorph(morphName: string): TargetGeomNode {
    const existing = this.children.find(
      (c) => c instanceof TargetGeomNode && c.name === `targetGeom ${morphName}`
    );
    if (existing) {
      return existing as TargetGeomNode;
    }
    const morph = new TargetGeomNode(this, morphName);
    if (this.groupsNode) {
      this.addParamToGroup('Morph', morphName);
    }

    // Insert morph before zOffsetA if default channels exist, otherwise push
    const zOffsetIdx = this.children.findIndex((c) => c.name.startsWith('zOffsetA '));
    if (zOffsetIdx !== -1) {
      this.children.splice(zOffsetIdx, 0, morph);
    } else {
      this.children.push(morph);
    }
    return morph;
  }

  getMorphs(): TargetGeomNode[] {
    return this.children.filter((c) => c instanceof TargetGeomNode) as TargetGeomNode[];
  }

  getOrCreateGroups(): GroupsNode {
    if (!this.groupsNode) {
      const existingIdx = this.children.findIndex(
        (c) => c instanceof GroupsNode || c.name.startsWith('groups')
      );
      if (existingIdx !== -1) {
        const existing = this.children[existingIdx];
        if (existing instanceof GroupsNode) {
          this.groupsNode = existing;
        } else {
          const upgraded = new GroupsNode(this, 'groups');
          upgraded.children = existing.children;
          upgraded.syncFromChildren();
          this.children[existingIdx] = upgraded;
          this.groupsNode = upgraded;
        }
      } else {
        this.groupsNode = new GroupsNode(this, 'groups');
        this.children.unshift(this.groupsNode);
      }
    }
    return this.groupsNode;
  }

  addGroup(groupName: string): GroupsNode | null {
    const groups = this.getOrCreateGroups();
    return groups.group(groupName, true);
  }

  addParamToGroup(groupName: string, paramName: string): PoserNode | null {
    const grp = this.addGroup(groupName);
    return grp ? grp.parameter(paramName, true) : null;
  }

  /**
   * Adds an ERC master control dial (valueParm) with tracking scale and static keyframes.
   */
  addMasterDial(
    dialId: string,
    displayName: string,
    min: number = -100,
    max: number = 100,
    trackingScale: number = 0.02
  ): PoserNode {
    const existing = this.children.find((c) => c.name === `valueParm ${dialId}`);
    if (existing) {
      return existing;
    }

    if (this.groupsNode) {
      this.addParamToGroup('Other', dialId);
    }

    const dialNode = new PoserNode(this, `valueParm ${dialId}`);
    dialNode.hasChildrenBlock = true;

    const addProp = (text: string) => {
      const p = new PoserNode(dialNode, text);
      p.hasChildrenBlock = false;
      dialNode.children.push(p);
      return p;
    };

    addProp(`name ${displayName}`);
    addProp('initValue 0');
    addProp('hidden 0');
    addProp('forceLimits 0');
    addProp(`min ${min}`);
    addProp(`max ${max}`);
    addProp(`trackingScale ${trackingScale}`);

    const keysNode = new PoserNode(dialNode, 'keys');
    keysNode.hasChildrenBlock = true;

    const staticNode = new PoserNode(keysNode, 'static 0');
    staticNode.hasChildrenBlock = false;
    keysNode.children.push(staticNode);

    const kNode = new PoserNode(keysNode, 'k 0 0');
    kNode.hasChildrenBlock = false;
    keysNode.children.push(kNode);

    dialNode.children.push(keysNode);

    addProp('interpStyleLocked 0');

    // Insert before zOffsetA if default channels exist, otherwise push
    const zOffsetIdx = this.children.findIndex((c) => c.name.startsWith('zOffsetA '));
    if (zOffsetIdx !== -1) {
      this.children.splice(zOffsetIdx, 0, dialNode);
    } else {
      this.children.push(dialNode);
    }
    return dialNode;
  }

  /**
   * Binds a joint rotation channel (e.g. Bend/xrot) to a master dial via valueOpDeltaAdd.
   */
  addSlaveLink(
    channelName: 'xrot' | 'yrot' | 'zrot',
    masterActor: string,
    masterDialName: string,
    deltaScale: number
  ): this {
    let channel = this.children.find(
      (c) =>
        c.name === `rotateX ${channelName}` ||
        c.name === `rotateY ${channelName}` ||
        c.name === `rotateZ ${channelName}` ||
        c.name.endsWith(` ${channelName}`)
    );

    if (!channel) {
      const channelType =
        channelName === 'xrot'
          ? 'rotateX'
          : channelName === 'yrot'
          ? 'rotateY'
          : 'rotateZ';
      channel = new JointNode(this, channelType, channelName, 0, -180, 180);
      this.children.push(channel);
    }

    const actorStr =
      masterActor.includes(':') || masterActor === '_SELF_' || masterActor === 'Figure'
        ? masterActor
        : `${masterActor}:1`;

    const opNode = new PoserNode(channel, 'valueOpDeltaAdd');
    opNode.hasChildrenBlock = false;

    const figChild = new PoserNode(opNode, 'Figure');
    figChild.hasChildrenBlock = false;

    const actorChild = new PoserNode(opNode, actorStr);
    actorChild.hasChildrenBlock = false;

    const dialChild = new PoserNode(opNode, masterDialName);
    dialChild.hasChildrenBlock = false;

    opNode.children.push(figChild, actorChild, dialChild);
    channel.children.push(opNode);

    const deltaNode = new PoserNode(channel, `deltaAddDelta ${deltaScale.toFixed(6)}`);
    deltaNode.hasChildrenBlock = false;
    channel.children.push(deltaNode);

    return this;
  }

  getMasterDials(): PoserNode[] {
    return this.children.filter((c) => c.name.startsWith('valueParm '));
  }

  getMasterDial(dialId: string): PoserNode | undefined {
    return this.children.find((c) => c.name === `valueParm ${dialId}`);
  }
}



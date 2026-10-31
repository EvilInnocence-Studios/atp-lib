import { PoserNode } from '../core/poser-node.js';

export type JointChannelType =
  | 'scale'
  | 'scaleX'
  | 'scaleY'
  | 'scaleZ'
  | 'propagatingScale'
  | 'propagatingScaleX'
  | 'propagatingScaleY'
  | 'propagatingScaleZ'
  | 'rotateX'
  | 'rotateY'
  | 'rotateZ'
  | 'translateX'
  | 'translateY'
  | 'translateZ'
  | 'xOffsetA'
  | 'yOffsetA'
  | 'zOffsetA'
  | 'xOffsetB'
  | 'yOffsetB'
  | 'zOffsetB'
  | 'jointX'
  | 'jointY'
  | 'jointZ'
  | 'twistX'
  | 'twistY'
  | 'twistZ'
  | 'smoothScaleX'
  | 'smoothScaleY'
  | 'smoothScaleZ'
  | 'taperX'
  | 'taperY'
  | 'taperZ'
  | 'valueParm';

export interface JointNodeOptions {
  displayName?: string;
  initValue?: number;
  hidden?: boolean | number;
  forceLimits?: boolean | number;
  min?: number;
  max?: number;
  trackingScale?: number;
  staticKey?: boolean | number;
  keyValue?: number;
  staticValue?: number;
  trackingScaleMult?: number;
}

export class JointNode extends PoserNode {
  public keysNode: PoserNode;

  constructor(
    parent: PoserNode | null = null,
    public channelType: JointChannelType = 'rotateX',
    public channelName: string = 'xrot',
    initValueOrOptions: number | JointNodeOptions = 0,
    min: number = -360,
    max: number = 360,
    options: JointNodeOptions = {}
  ) {
    super(parent, `${channelType} ${channelName}`);
    this.hasChildrenBlock = true;

    const opts: JointNodeOptions =
      typeof initValueOrOptions === 'object' && initValueOrOptions !== null
        ? initValueOrOptions
        : options;
    const initValue =
      typeof initValueOrOptions === 'number'
        ? initValueOrOptions
        : opts.initValue ?? 0;
    const resolvedMin = opts.min ?? min;
    const resolvedMax = opts.max ?? max;

    const displayName = opts.displayName ?? channelName;
    const hidden =
      opts.hidden !== undefined
        ? typeof opts.hidden === 'boolean'
          ? opts.hidden
            ? 1
            : 0
          : opts.hidden
        : 0;
    const forceLimits =
      opts.forceLimits !== undefined
        ? typeof opts.forceLimits === 'boolean'
          ? opts.forceLimits
            ? 1
            : 0
          : opts.forceLimits
        : 0;
    const trackingScale = opts.trackingScale ?? 1;
    const staticKey =
      opts.staticKey !== undefined
        ? typeof opts.staticKey === 'boolean'
          ? opts.staticKey
            ? 1
            : 0
          : opts.staticKey
        : 0;

    this.addPropertyNode(`name ${displayName}`);
    this.addPropertyNode(`initValue ${initValue}`);
    this.addPropertyNode(`hidden ${hidden}`);
    this.addPropertyNode(`forceLimits ${forceLimits}`);
    this.addPropertyNode(`min ${resolvedMin}`);
    this.addPropertyNode(`max ${resolvedMax}`);
    this.addPropertyNode(`trackingScale ${trackingScale}`);

    this.keysNode = new PoserNode(this, 'keys');
    this.keysNode.hasChildrenBlock = true;

    const staticNode = new PoserNode(this.keysNode, `static  ${staticKey}`);
    staticNode.hasChildrenBlock = false;
    this.keysNode.children.push(staticNode);

    const kVal = opts.keyValue !== undefined ? opts.keyValue : staticKey === 1 ? 0 : initValue;
    const kNode = new PoserNode(this.keysNode, `k  0  ${kVal}`);
    kNode.hasChildrenBlock = false;
    this.keysNode.children.push(kNode);

    this.children.push(this.keysNode);

    this.addPropertyNode('interpStyleLocked 0');

    if (opts.staticValue !== undefined) {
      this.addPropertyNode(`staticValue ${opts.staticValue}`);
    }
    if (opts.trackingScaleMult !== undefined) {
      this.addPropertyNode(`trackingScaleMult ${opts.trackingScaleMult.toFixed(6)}`);
    }
  }

  setDisplayName(displayName: string): this {
    this.setOrAddProperty('name', `name ${displayName}`);
    return this;
  }

  setInitValue(val: number): this {
    this.setOrAddProperty('initValue', `initValue ${val}`);
    const staticNode = this.keysNode.children.find((c) => c.name.trim().startsWith('static'));
    const isStatic = staticNode?.name.trim().endsWith('1') ?? false;
    const kNode = this.keysNode.children.find((c) => c.name.trim().startsWith('k '));
    if (kNode && !isStatic) {
      kNode.name = `k  0  ${val}`;
    }
    const staticValNode = this.children.find((c) => c.name.trim().startsWith('staticValue'));
    if (staticValNode) {
      staticValNode.name = `staticValue ${val}`;
    }
    return this;
  }

  setHidden(hidden: boolean | number): this {
    const h = typeof hidden === 'boolean' ? (hidden ? 1 : 0) : hidden;
    this.setOrAddProperty('hidden', `hidden ${h}`);
    return this;
  }

  setLimits(min: number, max: number, forceLimits?: boolean | number): this {
    this.setOrAddProperty('min', `min ${min}`);
    this.setOrAddProperty('max', `max ${max}`);
    if (forceLimits !== undefined) {
      const f = typeof forceLimits === 'boolean' ? (forceLimits ? 1 : 0) : forceLimits;
      this.setOrAddProperty('forceLimits', `forceLimits ${f}`);
    }
    return this;
  }

  setTrackingScale(scale: number): this {
    this.setOrAddProperty('trackingScale', `trackingScale ${scale}`);
    return this;
  }

  /**
   * Adds an ERC slave link (valueOpDeltaAdd) after interpStyleLocked.
   */
  addERC(
    masterActor: string,
    masterDialName: string,
    deltaScale: number,
    figureName: string = 'Figure'
  ): this {
    const actorStr =
      masterActor.includes(':') ||
      masterActor === 'BODY' ||
      masterActor === '_SELF_' ||
      masterActor === 'Figure'
        ? masterActor
        : `${masterActor}:1`;

    const opNode = new PoserNode(this, 'valueOpDeltaAdd');
    opNode.hasChildrenBlock = false;

    const figChild = new PoserNode(opNode, figureName);
    figChild.hasChildrenBlock = false;

    const actorChild = new PoserNode(opNode, actorStr);
    actorChild.hasChildrenBlock = false;

    const dialChild = new PoserNode(opNode, masterDialName);
    dialChild.hasChildrenBlock = false;

    opNode.children.push(figChild, actorChild, dialChild);
    this.children.push(opNode);

    const deltaNode = new PoserNode(this, `deltaAddDelta ${deltaScale.toFixed(6)}`);
    deltaNode.hasChildrenBlock = false;
    this.children.push(deltaNode);

    return this;
  }

  public addPropertyNode(text: string): PoserNode {
    const node = new PoserNode(this, text);
    node.hasChildrenBlock = false;
    this.children.push(node);
    return node;
  }

  private setOrAddProperty(prefix: string, line: string): void {
    const existing = this.children.find(
      (c) => c.name === prefix || c.name.startsWith(prefix + ' ')
    );
    if (existing) {
      existing.name = line;
    } else {
      this.addPropertyNode(line);
    }
  }
}

import { PoserNode } from '../core/poser-node.js';
import { TargetGeomNode } from './targetgeom-node.js';
import { JointNode } from './joint-node.js';
import { GroupsNode } from './groups-node.js';

export class ChannelsNode extends PoserNode {
  public groupsNode: GroupsNode | null = null;

  constructor(parent: PoserNode | null = null) {
    super(parent, 'channels');
    this.hasChildrenBlock = true;
  }

  createDefaultChannels(): void {
    // Standard Poser Scale channels
    this.children.push(new JointNode(this, 'scale', 'scale', 1, 0.001, 100));
    this.children.push(new JointNode(this, 'scale', 'xScale', 1, 0.001, 100));
    this.children.push(new JointNode(this, 'scale', 'yScale', 1, 0.001, 100));
    this.children.push(new JointNode(this, 'scale', 'zScale', 1, 0.001, 100));

    // Standard Poser Rotation channels (order: zrot, xrot, yrot)
    this.children.push(new JointNode(this, 'rotateZ', 'zrot', 0, -180, 180));
    this.children.push(new JointNode(this, 'rotateX', 'xrot', 0, -180, 180));
    this.children.push(new JointNode(this, 'rotateY', 'yrot', 0, -180, 180));

    // Standard Poser Translation channels
    this.children.push(new JointNode(this, 'translateX', 'xtran', 0, -100, 100));
    this.children.push(new JointNode(this, 'translateY', 'ytran', 0, -100, 100));
    this.children.push(new JointNode(this, 'translateZ', 'ztran', 0, -100, 100));
  }

  addMorph(morphName: string): TargetGeomNode {
    const existing = this.children.find(
      (c) => c instanceof TargetGeomNode && c.name === `targetGeom ${morphName}`
    );
    if (existing) {
      return existing as TargetGeomNode;
    }
    const morph = new TargetGeomNode(this, morphName);
    this.children.push(morph);
    return morph;
  }

  getMorphs(): TargetGeomNode[] {
    return this.children.filter((c) => c instanceof TargetGeomNode) as TargetGeomNode[];
  }

  getOrCreateGroups(): GroupsNode {
    if (!this.groupsNode) {
      const existing = this.children.find(
        (c) => c instanceof GroupsNode || c.name.startsWith('groups')
      );
      if (existing instanceof GroupsNode) {
        this.groupsNode = existing;
      } else {
        this.groupsNode = new GroupsNode(this, 'groups');
        this.children.push(this.groupsNode);
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

    this.children.push(dialNode);
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

    const selfChild = new PoserNode(opNode, '_SELF_');
    selfChild.hasChildrenBlock = false;

    const actorChild = new PoserNode(opNode, actorStr);
    actorChild.hasChildrenBlock = false;

    const dialChild = new PoserNode(opNode, masterDialName);
    dialChild.hasChildrenBlock = false;

    opNode.children.push(selfChild, actorChild, dialChild);
    channel.children.push(opNode);

    const deltaNode = new PoserNode(channel, `deltaAddDelta ${deltaScale.toFixed(4)}`);
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


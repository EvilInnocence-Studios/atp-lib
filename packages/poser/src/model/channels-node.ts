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
}


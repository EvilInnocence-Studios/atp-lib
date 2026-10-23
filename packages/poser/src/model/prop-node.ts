import { PoserNode } from '../core/poser-node.js';
import { GeomCustomNode } from './geomcustom-node.js';
import { ChannelsNode } from './channels-node.js';

export class PropNode extends PoserNode {
  public geomCustom: GeomCustomNode;
  public channels: ChannelsNode;

  constructor(
    parent: PoserNode | null = null,
    public propName: string = 'Prop'
  ) {
    super(parent, `prop ${propName}`);
    this.hasChildrenBlock = true;

    this.geomCustom = new GeomCustomNode(this);
    this.children.push(this.geomCustom);

    this.channels = new ChannelsNode(this);
    this.children.push(this.channels);
  }

  setObjPath(objRelativePath: string): this {
    this.geomCustom.setObjPath(objRelativePath);
    return this;
  }
}

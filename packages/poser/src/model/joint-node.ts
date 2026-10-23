import { PoserNode } from '../core/poser-node.js';

export class JointNode extends PoserNode {
  constructor(
    parent: PoserNode | null = null,
    channelType: 'rotateX' | 'rotateY' | 'rotateZ' | 'translateX' | 'translateY' | 'translateZ' | 'scale' = 'rotateX',
    channelName: string = 'xrot',
    initValue: number = 0,
    min: number = -360,
    max: number = 360
  ) {
    super(parent, `${channelType} ${channelName}`);
    this.hasChildrenBlock = true;

    this.addPropertyNode(`name ${channelName}`);
    this.addPropertyNode(`initValue ${initValue}`);
    this.addPropertyNode('hidden 0');
    this.addPropertyNode('forceLimits 1');
    this.addPropertyNode(`min ${min}`);
    this.addPropertyNode(`max ${max}`);
    this.addPropertyNode('trackingScale 1');
    this.addPropertyNode('keys');
  }

  private addPropertyNode(text: string): void {
    const node = new PoserNode(this, text);
    node.hasChildrenBlock = false;
    this.children.push(node);
  }
}

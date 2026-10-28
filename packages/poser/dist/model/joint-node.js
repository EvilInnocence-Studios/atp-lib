import { PoserNode } from '../core/poser-node.js';
export class JointNode extends PoserNode {
    constructor(parent = null, channelType = 'rotateX', channelName = 'xrot', initValue = 0, min = -360, max = 360) {
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
    addPropertyNode(text) {
        const node = new PoserNode(this, text);
        node.hasChildrenBlock = false;
        this.children.push(node);
    }
}
//# sourceMappingURL=joint-node.js.map
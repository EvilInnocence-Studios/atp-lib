import { PoserNode } from '../core/poser-node.js';
import { GeomCustomNode } from './geomcustom-node.js';
import { ChannelsNode } from './channels-node.js';
export class PropNode extends PoserNode {
    propName;
    geomCustom;
    channels;
    constructor(parent = null, propName = 'Prop') {
        super(parent, `prop ${propName}`);
        this.propName = propName;
        this.hasChildrenBlock = true;
        this.geomCustom = new GeomCustomNode(this);
        this.children.push(this.geomCustom);
        this.channels = new ChannelsNode(this);
        this.children.push(this.channels);
    }
    setObjPath(objRelativePath) {
        this.geomCustom.setObjPath(objRelativePath);
        return this;
    }
}
//# sourceMappingURL=prop-node.js.map
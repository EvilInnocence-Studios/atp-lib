import { PoserNode } from '../core/poser-node.js';
export class GeomCustomNode extends PoserNode {
    constructor(parent = null, objRelativePath = '') {
        super(parent, 'geomCustom');
        this.hasChildrenBlock = true;
        if (objRelativePath) {
            this.setObjPath(objRelativePath);
        }
    }
    setObjPath(objRelativePath) {
        // Look for existing objFileGeom
        const existing = this.children.find((c) => c.name.startsWith('objFileGeom'));
        const line = `objFileGeom 0 0 ${objRelativePath}`;
        if (existing) {
            existing.name = line;
        }
        else {
            const node = new PoserNode(this, line);
            node.hasChildrenBlock = false;
            this.children.push(node);
        }
    }
    getObjPath() {
        const existing = this.children.find((c) => c.name.startsWith('objFileGeom'));
        if (existing) {
            const parts = existing.name.split(/\s+/);
            return parts.slice(3).join(' ');
        }
        return '';
    }
}
//# sourceMappingURL=geomcustom-node.js.map
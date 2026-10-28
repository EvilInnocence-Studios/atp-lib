import { PoserNode } from '../core/poser-node.js';
import { Vector3 } from 'atp-geometry';
import { VectorNode } from './vector-node.js';
import { GeomCustomNode } from './geomcustom-node.js';
import { ChannelsNode } from './channels-node.js';
import { WeightMapNode } from './weightmap-node.js';
export class ActorNode extends PoserNode {
    actorName;
    fileNumber;
    storageOffsetNode;
    geomCustom;
    channels;
    originNode;
    endPointNode;
    orientationNode;
    constructor(parent = null, actorName = 'bone', fileNumber = 1) {
        super(parent, `actor ${actorName}:${fileNumber}`);
        this.actorName = actorName;
        this.fileNumber = fileNumber;
        this.hasChildrenBlock = true;
        // storageOffset
        this.storageOffsetNode = new PoserNode(this, 'storageOffset 0 0 0');
        this.storageOffsetNode.hasChildrenBlock = false;
        this.children.push(this.storageOffsetNode);
        // geomCustom
        this.geomCustom = new GeomCustomNode(this);
        this.children.push(this.geomCustom);
        // channels
        this.channels = new ChannelsNode(this);
        this.children.push(this.channels);
        // default endPoint, origin, orientation
        this.endPointNode = new VectorNode(this, 'endPoint', new Vector3(0, 1, 0));
        this.children.push(this.endPointNode);
        this.originNode = new VectorNode(this, 'origin', new Vector3(0, 0, 0));
        this.children.push(this.originNode);
        this.orientationNode = new VectorNode(this, 'orientation', new Vector3(0, 0, 0));
        this.children.push(this.orientationNode);
    }
    setOrigin(v) {
        this.originNode.setVector('origin', v);
        return this;
    }
    getOrigin() {
        return this.originNode.getVector();
    }
    setEndPoint(v) {
        this.endPointNode.setVector('endPoint', v);
        return this;
    }
    getEndPoint() {
        return this.endPointNode.getVector();
    }
    setOrientation(v) {
        this.orientationNode.setVector('orientation', v);
        return this;
    }
    getOrientation() {
        return this.orientationNode.getVector();
    }
    setObjPath(objRelativePath) {
        this.geomCustom.setObjPath(objRelativePath);
        return this;
    }
    createDefaultChannels() {
        this.channels.createDefaultChannels();
        return this;
    }
    addWeightMap(mapId, numVerts) {
        const existing = this.getWeightMap(mapId);
        if (existing) {
            if (numVerts !== undefined)
                existing.setNumVerts(numVerts);
            return existing;
        }
        const wmNode = new WeightMapNode(this, mapId);
        if (numVerts !== undefined)
            wmNode.setNumVerts(numVerts);
        this.children.push(wmNode);
        return wmNode;
    }
    getWeightMap(mapId) {
        const cleanId = WeightMapNode.normalizeMapId(mapId);
        return this.getWeightMaps().find((wm) => wm.mapId === cleanId);
    }
    getWeightMaps() {
        return this.children.filter((c) => c instanceof WeightMapNode);
    }
    setRotateOrder(order = 'zyx') {
        const text = `rotateOrder ${order}`;
        const existing = this.children.find((c) => c.name.startsWith('rotateOrder'));
        if (existing) {
            existing.name = text;
        }
        else {
            const node = new PoserNode(this, text);
            node.hasChildrenBlock = false;
            this.children.push(node);
        }
        return this;
    }
    getRotateOrder() {
        const node = this.children.find((c) => c.name.startsWith('rotateOrder'));
        if (!node)
            return null;
        return node.name.split(/\s+/)[1] ?? null;
    }
    setGeomHandler(handlerType = 13, actorName) {
        const target = actorName ?? this.actorName;
        const text = `geomHandlerGeom ${handlerType} ${target}`;
        const existing = this.children.find((c) => c.name.startsWith('geomHandlerGeom'));
        if (existing) {
            existing.name = text;
        }
        else {
            const node = new PoserNode(this, text);
            node.hasChildrenBlock = false;
            this.children.push(node);
        }
        return this;
    }
    getGeomHandler() {
        const node = this.children.find((c) => c.name.startsWith('geomHandlerGeom'));
        if (!node)
            return null;
        const parts = node.name.split(/\s+/);
        return {
            handlerType: parseInt(parts[1], 10),
            actorName: parts[2] ?? this.actorName,
        };
    }
    setHasGeom(hasGeom) {
        const val = typeof hasGeom === 'boolean' ? (hasGeom ? 1 : 0) : hasGeom;
        const text = `hasGeom ${val}`;
        const existing = this.children.find((c) => c.name.startsWith('hasGeom'));
        if (existing) {
            existing.name = text;
        }
        else {
            const node = new PoserNode(this, text);
            node.hasChildrenBlock = false;
            this.children.push(node);
        }
        return this;
    }
    getHasGeom() {
        const node = this.children.find((c) => c.name.startsWith('hasGeom'));
        if (!node)
            return null;
        return parseInt(node.name.split(/\s+/)[1], 10);
    }
    setParent(parentActorName) {
        const target = parentActorName.includes(':') || parentActorName === 'UNIVERSE'
            ? parentActorName
            : `${parentActorName}:1`;
        const text = `parent ${target}`;
        const existing = this.children.find((c) => c.name.startsWith('parent'));
        if (existing) {
            existing.name = text;
        }
        else {
            const node = new PoserNode(this, text);
            node.hasChildrenBlock = false;
            this.children.push(node);
        }
        return this;
    }
    getParent() {
        const node = this.children.find((c) => c.name.startsWith('parent'));
        if (!node)
            return null;
        return node.name.split(/\s+/)[1] ?? null;
    }
    setSphereFalloff(center, innerRadius, outerRadius) {
        let sphereNode = this.children.find((c) => c.name === 'sphere' || c.name.startsWith('sphere '));
        if (!sphereNode) {
            sphereNode = new PoserNode(this, 'sphere');
            sphereNode.hasChildrenBlock = true;
            this.children.push(sphereNode);
        }
        const centerText = `center ${center.x.toFixed(6)} ${center.y.toFixed(6)} ${center.z.toFixed(6)}`;
        const innerText = `innerRad ${innerRadius.toFixed(6)}`;
        const outerText = `outerRad ${outerRadius.toFixed(6)}`;
        let centerChild = sphereNode.children.find((c) => c.name.startsWith('center'));
        if (centerChild) {
            centerChild.name = centerText;
        }
        else {
            centerChild = new PoserNode(sphereNode, centerText);
            centerChild.hasChildrenBlock = false;
            sphereNode.children.push(centerChild);
        }
        let innerChild = sphereNode.children.find((c) => c.name.startsWith('innerRad'));
        if (innerChild) {
            innerChild.name = innerText;
        }
        else {
            innerChild = new PoserNode(sphereNode, innerText);
            innerChild.hasChildrenBlock = false;
            sphereNode.children.push(innerChild);
        }
        let outerChild = sphereNode.children.find((c) => c.name.startsWith('outerRad'));
        if (outerChild) {
            outerChild.name = outerText;
        }
        else {
            outerChild = new PoserNode(sphereNode, outerText);
            outerChild.hasChildrenBlock = false;
            sphereNode.children.push(outerChild);
        }
        return this;
    }
    getSphereFalloff() {
        const sphereNode = this.children.find((c) => c.name === 'sphere' || c.name.startsWith('sphere '));
        if (!sphereNode)
            return null;
        const centerChild = sphereNode.children.find((c) => c.name.startsWith('center'));
        const innerChild = sphereNode.children.find((c) => c.name.startsWith('innerRad'));
        const outerChild = sphereNode.children.find((c) => c.name.startsWith('outerRad'));
        if (!centerChild || !innerChild || !outerChild)
            return null;
        const cParts = centerChild.name.split(/\s+/);
        const center = new Vector3(parseFloat(cParts[1]), parseFloat(cParts[2]), parseFloat(cParts[3]));
        const innerRadius = parseFloat(innerChild.name.split(/\s+/)[1]);
        const outerRadius = parseFloat(outerChild.name.split(/\s+/)[1]);
        return { center, innerRadius, outerRadius };
    }
}
//# sourceMappingURL=actor-node.js.map
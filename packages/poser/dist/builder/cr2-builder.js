import { RootNode } from '../model/root-node.js';
import { Vector3 } from 'atp-geometry';
import { PoserWriter } from '../core/poser-writer.js';
export class Cr2Builder {
    root;
    figure;
    constructor(figureName = 'Figure') {
        this.root = new RootNode();
        this.figure = this.root.createFigure(figureName);
    }
    setVersion(version) {
        this.root.setVersion(version);
        return this;
    }
    setGeometryPath(relativeRuntimePath) {
        this.root.setGeometryPath(relativeRuntimePath);
        return this;
    }
    addBone(options) {
        const actor = this.root.addActor(options.name);
        if (options.origin) {
            const orig = Array.isArray(options.origin)
                ? Vector3.fromArray(options.origin)
                : options.origin;
            actor.setOrigin(orig);
        }
        if (options.endPoint) {
            const end = Array.isArray(options.endPoint)
                ? Vector3.fromArray(options.endPoint)
                : options.endPoint;
            actor.setEndPoint(end);
        }
        if (options.orientation) {
            const orient = Array.isArray(options.orientation)
                ? Vector3.fromArray(options.orientation)
                : options.orientation;
            actor.setOrientation(orient);
        }
        if (options.rotateOrder) {
            actor.setRotateOrder(options.rotateOrder);
        }
        if (options.hasGeom !== undefined) {
            actor.setHasGeom(options.hasGeom);
        }
        if (options.geomHandler !== undefined) {
            actor.setGeomHandler(options.geomHandler);
        }
        if (options.sphereFalloff) {
            const center = Array.isArray(options.sphereFalloff.center)
                ? Vector3.fromArray(options.sphereFalloff.center)
                : options.sphereFalloff.center;
            actor.setSphereFalloff(center, options.sphereFalloff.innerRadius, options.sphereFalloff.outerRadius);
        }
        if (options.createDefaultChannels !== false) {
            actor.createDefaultChannels();
        }
        if (options.parentName) {
            this.figure.addChildNode(options.name, options.parentName);
            this.figure.addWeldNode(options.name, options.parentName);
            actor.setParent(options.parentName);
        }
        return actor;
    }
    addMorphDelta(actorName, morphName, deltas) {
        const actor = this.root.getActor(actorName);
        if (!actor) {
            throw new Error(`Actor '${actorName}' not found in CR2 document`);
        }
        const morph = actor.channels.addMorph(morphName);
        morph.setDeltas(deltas);
        return this;
    }
    addMaterial(materialName, diffuseColor) {
        const mat = this.root.addMaterial(materialName);
        if (diffuseColor) {
            mat.setDiffuseColor(diffuseColor[0], diffuseColor[1], diffuseColor[2]);
        }
        return mat;
    }
    addWeightMap(actorName, mapId, weights, numVerts) {
        const actor = this.root.getActor(actorName);
        if (!actor) {
            throw new Error(`Actor '${actorName}' not found in CR2 document`);
        }
        const wm = actor.addWeightMap(mapId, numVerts);
        if (weights) {
            if (Array.isArray(weights)) {
                for (const [idx, w] of weights) {
                    wm.setWeight(idx, w);
                }
            }
            else {
                for (const [idx, w] of weights.entries()) {
                    wm.setWeight(idx, w);
                }
            }
        }
        wm.syncToNodes();
        return this;
    }
    addDialGroup(actorName, groupName, paramNames) {
        const actor = this.root.getActor(actorName);
        if (!actor) {
            throw new Error(`Actor '${actorName}' not found in CR2 document`);
        }
        const grp = actor.channels.addGroup(groupName);
        if (grp && paramNames) {
            for (const p of paramNames) {
                grp.parameter(p, true);
            }
        }
        return this;
    }
    addMasterDial(actorName, dialId, displayName, min = -100, max = 100, trackingScale = 0.02) {
        const actor = this.root.getActor(actorName);
        if (!actor) {
            throw new Error(`Actor '${actorName}' not found in CR2 document`);
        }
        return actor.channels.addMasterDial(dialId, displayName, min, max, trackingScale);
    }
    addSlaveLink(actorName, channelName, masterActor, masterDialName, deltaScale) {
        const actor = this.root.getActor(actorName);
        if (!actor) {
            throw new Error(`Actor '${actorName}' not found in CR2 document`);
        }
        actor.channels.addSlaveLink(channelName, masterActor, masterDialName, deltaScale);
        return this;
    }
    toString() {
        return PoserWriter.writeToString(this.root);
    }
    async exportToDisk(outputPath) {
        await PoserWriter.exportToFile(this.root, outputPath);
    }
}
//# sourceMappingURL=cr2-builder.js.map
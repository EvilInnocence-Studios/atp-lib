import { RootNode } from '../model/root-node.js';
import { ActorNode } from '../model/actor-node.js';
import { FigureNode } from '../model/figure-node.js';
import { MaterialNode } from '../model/material-node.js';
import { Vector3 } from '@atp/geometry';
import { PoserWriter } from '../core/poser-writer.js';

export interface AddBoneOptions {
  name: string;
  parentName?: string;
  origin?: Vector3 | [number, number, number];
  endPoint?: Vector3 | [number, number, number];
  orientation?: Vector3 | [number, number, number];
  createDefaultChannels?: boolean;
}

export class Cr2Builder {
  public root: RootNode;
  public figure: FigureNode;

  constructor(figureName: string = 'Figure') {
    this.root = new RootNode();
    this.figure = this.root.createFigure(figureName);
  }

  setVersion(version: string): this {
    this.root.setVersion(version);
    return this;
  }

  setGeometryPath(relativeRuntimePath: string): this {
    this.root.setGeometryPath(relativeRuntimePath);
    return this;
  }

  addBone(options: AddBoneOptions): ActorNode {
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

    if (options.createDefaultChannels !== false) {
      actor.createDefaultChannels();
    }

    if (options.parentName) {
      this.figure.addChildNode(options.name, options.parentName);
      this.figure.addWeldNode(options.name, options.parentName);
    }

    return actor;
  }

  addMorphDelta(
    actorName: string,
    morphName: string,
    deltas: Map<number, Vector3>
  ): this {
    const actor = this.root.getActor(actorName);
    if (!actor) {
      throw new Error(`Actor '${actorName}' not found in CR2 document`);
    }
    const morph = actor.channels.addMorph(morphName);
    morph.setDeltas(deltas);
    return this;
  }

  addMaterial(materialName: string, diffuseColor?: [number, number, number]): MaterialNode {
    const mat = this.root.addMaterial(materialName);
    if (diffuseColor) {
      mat.setDiffuseColor(diffuseColor[0], diffuseColor[1], diffuseColor[2]);
    }
    return mat;
  }

  addWeightMap(
    actorName: string,
    mapId: string,
    weights?: Map<number, number> | [number, number][],
    numVerts?: number
  ): this {
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
      } else {
        for (const [idx, w] of weights.entries()) {
          wm.setWeight(idx, w);
        }
      }
    }
    wm.syncToNodes();
    return this;
  }

  addDialGroup(actorName: string, groupName: string, paramNames?: string[]): this {
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

  toString(): string {
    return PoserWriter.writeToString(this.root);
  }

  async exportToDisk(outputPath: string): Promise<void> {
    await PoserWriter.exportToFile(this.root, outputPath);
  }
}


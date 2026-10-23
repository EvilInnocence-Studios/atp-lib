import { PoserNode } from '../core/poser-node.js';
import { FigureNode } from './figure-node.js';
import { ActorNode } from './actor-node.js';
import { PropNode } from './prop-node.js';
import { MaterialNode } from './material-node.js';

export class RootNode extends PoserNode {
  public versionNode: PoserNode;
  public figureNode: FigureNode | null = null;
  public fileNumber: number = 1;
  private geometryPath: string = '';

  constructor() {
    super(null, '');
    this.hasChildrenBlock = true;

    // Header version block
    this.versionNode = new PoserNode(this, 'version');
    this.versionNode.hasChildrenBlock = true;
    const numNode = new PoserNode(this.versionNode, 'number 4.01');
    numNode.hasChildrenBlock = false;
    this.versionNode.children.push(numNode);
    this.children.push(this.versionNode);
  }

  setVersion(versionString: string): this {
    const numNode = this.versionNode.children.find((c) => c.name.startsWith('number'));
    if (numNode) {
      numNode.name = `number ${versionString}`;
    }
    return this;
  }

  setGeometryPath(relativeRuntimePath: string): this {
    this.geometryPath = relativeRuntimePath;
    // Update all existing actors
    for (const actor of this.getActors()) {
      actor.setObjPath(relativeRuntimePath);
    }
    return this;
  }

  getGeometryPath(): string {
    return this.geometryPath;
  }

  addActor(actorName: string): ActorNode {
    const actor = new ActorNode(this, actorName, this.fileNumber);
    if (this.geometryPath) {
      actor.setObjPath(this.geometryPath);
    }

    // Insert actor before figure block if figure exists
    if (this.figureNode) {
      const figIdx = this.children.indexOf(this.figureNode);
      if (figIdx !== -1) {
        this.children.splice(figIdx, 0, actor);
        return actor;
      }
    }

    this.children.push(actor);
    return actor;
  }

  getActor(actorName: string): ActorNode | undefined {
    return this.getActors().find(
      (a) => a.actorName === actorName || a.name === `actor ${actorName}:${this.fileNumber}`
    );
  }

  getActors(): ActorNode[] {
    return this.children.filter((c) => c instanceof ActorNode) as ActorNode[];
  }

  createFigure(figureName: string = 'Figure'): FigureNode {
    if (this.figureNode) {
      return this.figureNode;
    }
    this.figureNode = new FigureNode(this, figureName, this.fileNumber);
    this.children.push(this.figureNode);
    return this.figureNode;
  }

  addProp(propName: string): PropNode {
    const prop = new PropNode(this, propName);
    if (this.geometryPath) {
      prop.setObjPath(this.geometryPath);
    }
    this.children.push(prop);
    return prop;
  }

  addMaterial(materialName: string): MaterialNode {
    const mat = new MaterialNode(this, materialName);
    this.children.push(mat);
    return mat;
  }
}

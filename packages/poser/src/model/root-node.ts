import { PoserNode } from '../core/poser-node.js';
import { FigureNode } from './figure-node.js';
import { ActorNode } from './actor-node.js';
import { PropNode } from './prop-node.js';
import { MaterialNode } from './material-node.js';

const DEFAULT_GEOMETRY_PATH = ':Runtime:Geometries:default.obj';

export class RootNode extends PoserNode {
  public versionNode: PoserNode;
  public pass1ResNode: PoserNode;
  public pass2ResNode: PoserNode;
  public figureNode: FigureNode | null = null;
  public footerNode: PoserNode;
  public fileNumber: number = 1;

  private geometryPath: string = '';
  private pass1Stubs: Map<string, PoserNode> = new Map();
  private pass2Actors: ActorNode[] = [];
  private props: PropNode[] = [];

  constructor() {
    super(null, '');
    this.hasChildrenBlock = true;

    // 1. Header version block
    this.versionNode = new PoserNode(this, 'version');
    this.versionNode.hasChildrenBlock = true;
    const numNode = new PoserNode(this.versionNode, 'number 4.01');
    numNode.hasChildrenBlock = false;
    this.versionNode.children.push(numNode);

    // 2. Two-pass figureResFile nodes (quoted)
    this.pass1ResNode = new PoserNode(this, `figureResFile "${DEFAULT_GEOMETRY_PATH}"`);
    this.pass1ResNode.hasChildrenBlock = false;

    this.pass2ResNode = new PoserNode(this, `figureResFile "${DEFAULT_GEOMETRY_PATH}"`);
    this.pass2ResNode.hasChildrenBlock = false;

    // 3. Footer setGeomHandlerOffset node
    this.footerNode = new PoserNode(this, 'setGeomHandlerOffset 0 0 0');
    this.footerNode.hasChildrenBlock = false;

    this.rebuildChildrenOrder();
  }

  setVersion(versionString: string): this {
    const numNode = this.versionNode.children.find((c) => c.name.startsWith('number'));
    if (numNode) {
      numNode.name = `number ${versionString}`;
    }
    return this;
  }

  setGeometryPath(relativeRuntimePath: string): this {
    const cleanPath =
      relativeRuntimePath.startsWith('"') && relativeRuntimePath.endsWith('"')
        ? relativeRuntimePath.slice(1, -1)
        : relativeRuntimePath;
    this.geometryPath = cleanPath;

    const quoted = `"${cleanPath || DEFAULT_GEOMETRY_PATH}"`;
    this.pass1ResNode.name = `figureResFile ${quoted}`;
    this.pass2ResNode.name = `figureResFile ${quoted}`;

    for (const actor of this.pass2Actors) {
      actor.setObjPath(cleanPath);
    }
    for (const prop of this.props) {
      prop.setObjPath(cleanPath);
    }
    return this;
  }

  getGeometryPath(): string {
    return this.geometryPath;
  }

  private ensureBodyActor(): ActorNode {
    const existingBody = this.getActor('BODY');
    if (existingBody) {
      return existingBody;
    }
    return this.internalCreateActor('BODY');
  }

  private internalCreateActor(actorName: string): ActorNode {
    const existing = this.getActor(actorName);
    if (existing) {
      return existing;
    }

    // Create Pass 1 stub (plain PoserNode so getActors() only returns Pass 2 ActorNodes)
    const stub = new PoserNode(this, `actor ${actorName}:${this.fileNumber}`);
    stub.hasChildrenBlock = true;
    this.pass1Stubs.set(actorName, stub);

    // Create Pass 2 full ActorNode
    const actor = new ActorNode(this, actorName, this.fileNumber);
    if (this.geometryPath) {
      actor.setObjPath(this.geometryPath);
    }
    this.pass2Actors.push(actor);

    this.syncActorStub(actor);
    this.rebuildChildrenOrder();
    return actor;
  }

  /**
   * Synchronizes the Pass 1 geometry stub for an ActorNode whenever its hasGeom or geomHandler changes.
   */
  syncActorStub(actor: ActorNode): void {
    const stub = this.pass1Stubs.get(actor.actorName);
    if (!stub) return;

    const isBody = actor.actorName === 'BODY';
    const hasGeom = actor.getHasGeom();
    if (isBody || hasGeom === 0) {
      stub.children = [];
      return;
    }

    const handler = actor.getGeomHandler() ?? {
      handlerType: 13,
      actorName: actor.actorName,
    };

    const offsetNode = new PoserNode(stub, 'storageOffset 0 0 0');
    offsetNode.hasChildrenBlock = false;

    const geomNode = new PoserNode(
      stub,
      `geomHandlerGeom ${handler.handlerType} ${handler.actorName}`
    );
    geomNode.hasChildrenBlock = false;

    stub.children = [offsetNode, geomNode];
  }

  addActor(actorName: string): ActorNode {
    if (actorName !== 'BODY') {
      this.ensureBodyActor();
    }
    const actor = this.internalCreateActor(actorName);

    // Ensure figure block exists and register default hierarchy link to BODY if non-BODY
    const fig = this.createFigure(this.figureNode?.figureName ?? 'Figure');
    if (actorName !== 'BODY') {
      const hasLink = fig
        .getChildrenLinks()
        .some((l) => l.child === `${actorName}:${this.fileNumber}`);
      if (!hasLink) {
        fig.addChildNode(actorName, 'BODY');
      }
    }

    return actor;
  }

  /**
   * Connects a child bone to a parent bone across the CR2 document:
   * - Updates child's `parent` property
   * - Replaces any default `addChild <child> / BODY:1` in `figure` with `<parent>:<id>`
   * - Adds `weld <child> / <parent>:<id>` in `figure` (if parent is not BODY)
   * - Rebuilds child's self joint deformer `otherActor` references and injects `<child>_*` deformers into parent
   */
  linkBoneHierarchy(childName: string, parentName: string): void {
    const childActor = this.getActor(childName);
    if (!childActor || childName === 'BODY') return;

    const cleanParentBase = parentName.split(':')[0];
    const parentFull =
      cleanParentBase === 'UNIVERSE'
        ? 'UNIVERSE'
        : `${cleanParentBase}:${this.fileNumber}`;

    childActor.setParent(parentFull);
    childActor.createDefaultChannels();

    const fig = this.createFigure(this.figureNode?.figureName ?? 'Figure');

    // Remove any existing addChild link for this child before adding the new parent link
    const childFull = `${childName.split(':')[0]}:${this.fileNumber}`;
    for (let i = 0; i < fig.children.length; i++) {
      if (fig.children[i].name.trim() === `addChild ${childFull}`) {
        fig.children.splice(i, 2);
        break;
      }
    }
    fig.addChildNode(childFull, parentFull);

    if (cleanParentBase !== 'BODY' && cleanParentBase !== 'UNIVERSE') {
      fig.addWeldNode(childFull, parentFull);
      const parentActor = this.getActor(cleanParentBase);
      if (parentActor) {
        parentActor.channels.createChannelsForChild(
          childName,
          childActor.getOrigin(),
          childActor.getEndPoint(),
          this.fileNumber,
          childActor.getRotateOrder()
        );
      }
    }
  }

  getActor(actorName: string): ActorNode | undefined {
    const clean = actorName.split(':')[0];
    return this.pass2Actors.find(
      (a) =>
        a.actorName === actorName ||
        a.actorName === clean ||
        a.name === `actor ${clean}:${this.fileNumber}`
    );
  }

  getActors(): ActorNode[] {
    return [...this.pass2Actors];
  }

  createFigure(figureName: string = 'Figure'): FigureNode {
    if (this.figureNode) {
      return this.figureNode;
    }
    this.ensureBodyActor();
    this.figureNode = new FigureNode(this, figureName, this.fileNumber);
    this.rebuildChildrenOrder();
    return this.figureNode;
  }

  addProp(propName: string): PropNode {
    const prop = new PropNode(this, propName);
    if (this.geometryPath) {
      prop.setObjPath(this.geometryPath);
    }
    this.props.push(prop);
    this.rebuildChildrenOrder();
    return prop;
  }

  addMaterial(materialName: string): MaterialNode {
    const fig = this.createFigure(this.figureNode?.figureName ?? 'Figure');
    return fig.addMaterial(materialName);
  }

  private rebuildChildrenOrder(): void {
    const ordered: PoserNode[] = [this.versionNode];

    if (this.pass2Actors.length > 0 || this.figureNode) {
      ordered.push(this.pass1ResNode);
      for (const actor of this.pass2Actors) {
        const stub = this.pass1Stubs.get(actor.actorName);
        if (stub) {
          ordered.push(stub);
        }
      }
      ordered.push(this.pass2ResNode);
      for (const actor of this.pass2Actors) {
        ordered.push(actor);
      }
    }

    for (const prop of this.props) {
      ordered.push(prop);
    }

    if (this.figureNode) {
      ordered.push(this.figureNode);
    }

    ordered.push(this.footerNode);
    this.children = ordered;
  }
}


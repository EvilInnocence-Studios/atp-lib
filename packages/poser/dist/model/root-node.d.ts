import { PoserNode } from '../core/poser-node.js';
import { FigureNode } from './figure-node.js';
import { ActorNode } from './actor-node.js';
import { PropNode } from './prop-node.js';
import { MaterialNode } from './material-node.js';
export declare class RootNode extends PoserNode {
    versionNode: PoserNode;
    figureNode: FigureNode | null;
    fileNumber: number;
    private geometryPath;
    constructor();
    setVersion(versionString: string): this;
    setGeometryPath(relativeRuntimePath: string): this;
    getGeometryPath(): string;
    addActor(actorName: string): ActorNode;
    getActor(actorName: string): ActorNode | undefined;
    getActors(): ActorNode[];
    createFigure(figureName?: string): FigureNode;
    addProp(propName: string): PropNode;
    addMaterial(materialName: string): MaterialNode;
}
//# sourceMappingURL=root-node.d.ts.map
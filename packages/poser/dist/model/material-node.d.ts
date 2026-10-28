import { PoserNode } from '../core/poser-node.js';
export declare class MaterialNode extends PoserNode {
    materialName: string;
    constructor(parent?: PoserNode | null, materialName?: string);
    setTextureMap(texturePath: string): this;
    setColors(kd?: [number, number, number], ka?: [number, number, number], ks?: [number, number, number]): this;
    setDiffuseColor(r: number, g: number, b: number, a?: number): this;
    setTransparencyMap(texturePath: string, tMin?: number, tMax?: number, tExpo?: number): this;
    setBumpMap(texturePath: string, bumpStrength?: number): this;
    setSpecularMap(texturePath: string): this;
    setNsExponent(nsExponent?: number): this;
    getTextureMap(): string | null;
    getTransparencyMap(): string | null;
    getBumpMap(): string | null;
    getSpecularMap(): string | null;
    private extractMapPath;
    getDiffuseColor(): [number, number, number, number] | null;
    private setOrAddProperty;
    private addPropertyNode;
}
//# sourceMappingURL=material-node.d.ts.map
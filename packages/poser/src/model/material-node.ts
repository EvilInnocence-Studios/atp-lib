import { PoserNode } from '../core/poser-node.js';

export class MaterialNode extends PoserNode {
  constructor(
    parent: PoserNode | null = null,
    public materialName: string = 'Preview'
  ) {
    super(parent, `material ${materialName}`);
    this.hasChildrenBlock = true;

    this.addPropertyNode('KdColor 1 1 1 1');
    this.addPropertyNode('KaColor 0 0 0 1');
    this.addPropertyNode('KsColor 0 0 0 1');
    this.addPropertyNode('TextureColor 1 1 1 1');
    this.addPropertyNode('NsExponent 50');
    this.addPropertyNode('tMin 0');
    this.addPropertyNode('tMax 0');
    this.addPropertyNode('tExpo 0.6');
    this.addPropertyNode('bumpStrength 1');
    this.addPropertyNode('ksIgnoreTexture 0');
    this.addPropertyNode('reflectBgColor 1 1 1 1');
    this.addPropertyNode('reflectThruLights 1');
    this.addPropertyNode('reflectStrength 1');
  }

  setTextureMap(texturePath: string): this {
    const existing = this.children.find((c) => c.name.startsWith('textureMap'));
    const line = `textureMap ${texturePath} 0 0`;
    if (existing) {
      existing.name = line;
    } else {
      this.addPropertyNode(line);
    }
    return this;
  }

  setDiffuseColor(r: number, g: number, b: number, a: number = 1): this {
    const line = `KdColor ${r.toFixed(4)} ${g.toFixed(4)} ${b.toFixed(4)} ${a.toFixed(4)}`;
    const existing = this.children.find((c) => c.name.startsWith('KdColor'));
    if (existing) {
      existing.name = line;
    } else {
      this.addPropertyNode(line);
    }
    return this;
  }

  getTextureMap(): string | null {
    const node = this.children.find((c) => c.name.startsWith('textureMap'));
    if (node) {
      const parts = node.name.split(/\s+/);
      return parts[1] ?? null;
    }
    return null;
  }

  getDiffuseColor(): [number, number, number, number] | null {
    const node = this.children.find((c) => c.name.startsWith('KdColor'));
    if (node) {
      const parts = node.name.split(/\s+/);
      if (parts.length >= 5) {
        return [
          parseFloat(parts[1]),
          parseFloat(parts[2]),
          parseFloat(parts[3]),
          parseFloat(parts[4]),
        ];
      }
    }
    return null;
  }


  private addPropertyNode(text: string): void {
    const node = new PoserNode(this, text);
    node.hasChildrenBlock = false;
    this.children.push(node);
  }
}

import { PoserNode } from '../core/poser-node.js';

export class MaterialNode extends PoserNode {
  private specularMapPath: string | null = null;

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
    this.addPropertyNode('reflectThruLights 1');
    this.addPropertyNode('reflectThruKd 0');
    this.addPropertyNode('textureMap NO_MAP');
    this.addPropertyNode('bumpMap NO_MAP');
    this.addPropertyNode('reflectionMap NO_MAP');
    this.addPropertyNode('transparencyMap NO_MAP');
    this.addPropertyNode('ReflectionColor 1 1 1 1');
    this.addPropertyNode('reflectionStrength 1');
  }

  setTextureMap(texturePath: string): this {
    this.setMapProperty('textureMap', texturePath);
    return this;
  }

  setColors(
    kd?: [number, number, number],
    ka?: [number, number, number],
    ks?: [number, number, number]
  ): this {
    if (kd) {
      const line = `KdColor ${kd[0].toFixed(6)} ${kd[1].toFixed(6)} ${kd[2].toFixed(6)} 1`;
      this.setOrAddProperty('KdColor', line);
    }
    if (ka) {
      const line = `KaColor ${ka[0].toFixed(6)} ${ka[1].toFixed(6)} ${ka[2].toFixed(6)} 1`;
      this.setOrAddProperty('KaColor', line);
    }
    if (ks) {
      const line = `KsColor ${ks[0].toFixed(6)} ${ks[1].toFixed(6)} ${ks[2].toFixed(6)} 1`;
      this.setOrAddProperty('KsColor', line);
    }
    return this;
  }

  setDiffuseColor(r: number, g: number, b: number, a: number = 1): this {
    const line = `KdColor ${r.toFixed(4)} ${g.toFixed(4)} ${b.toFixed(4)} ${a.toFixed(4)}`;
    this.setOrAddProperty('KdColor', line);
    return this;
  }

  setTransparencyMap(
    texturePath: string,
    tMin: number = 1,
    tMax: number = 0,
    tExpo: number = 0.6
  ): this {
    this.setOrAddProperty('tMin', `tMin ${tMin}`);
    this.setOrAddProperty('tMax', `tMax ${tMax}`);
    this.setOrAddProperty('tExpo', `tExpo ${tExpo}`);
    this.setMapProperty('transparencyMap', texturePath);
    return this;
  }

  setBumpMap(texturePath: string, bumpStrength: number = 1): this {
    this.setOrAddProperty('bumpStrength', `bumpStrength ${bumpStrength}`);
    this.setMapProperty('bumpMap', texturePath);
    return this;
  }

  setSpecularMap(texturePath: string): this {
    const clean =
      texturePath.startsWith('"') && texturePath.endsWith('"')
        ? texturePath.slice(1, -1)
        : texturePath;
    this.specularMapPath = clean;

    const formatted = `"${clean}"`;
    let shaderTree = this.children.find((c) => c.name === 'shaderTree');
    if (!shaderTree) {
      shaderTree = new PoserNode(this, 'shaderTree');
      shaderTree.hasChildrenBlock = true;
      this.children.push(shaderTree);
    }

    let specNode = shaderTree.children.find(
      (c) => c.name === 'node "image_map" "Specular_Map"'
    );
    if (!specNode) {
      specNode = new PoserNode(shaderTree, 'node "image_map" "Specular_Map"');
      specNode.hasChildrenBlock = true;
      const updatePreview = shaderTree.children.find((c) => c.name === 'updatePreview 0');
      if (!updatePreview) {
        const up = new PoserNode(shaderTree, 'updatePreview 0');
        up.hasChildrenBlock = false;
        shaderTree.children.push(specNode, up);
      } else {
        shaderTree.children.unshift(specNode);
      }
    }

    specNode.children = [];
    const nameProp = new PoserNode(specNode, 'name "Specular_Map"');
    nameProp.hasChildrenBlock = false;
    const posProp = new PoserNode(specNode, 'pos 200 20');
    posProp.hasChildrenBlock = false;
    const fileInput = new PoserNode(specNode, 'nodeInput "Image_Source"');
    fileInput.hasChildrenBlock = true;
    const nameIn = new PoserNode(fileInput, 'name "Image_Source"');
    nameIn.hasChildrenBlock = false;
    const valIn = new PoserNode(fileInput, `value 0 0 0`);
    valIn.hasChildrenBlock = false;
    const fileProp = new PoserNode(fileInput, `file ${formatted}`);
    fileProp.hasChildrenBlock = false;
    fileInput.children.push(nameIn, valIn, fileProp);
    specNode.children.push(nameProp, posProp, fileInput);

    return this;
  }

  setNsExponent(nsExponent: number = 45): this {
    this.setOrAddProperty('NsExponent', `NsExponent ${nsExponent}`);
    return this;
  }

  getTextureMap(): string | null {
    return this.extractMapPath('textureMap');
  }

  getTransparencyMap(): string | null {
    return this.extractMapPath('transparencyMap');
  }

  getBumpMap(): string | null {
    return this.extractMapPath('bumpMap');
  }

  getSpecularMap(): string | null {
    if (this.specularMapPath) {
      return this.specularMapPath;
    }
    const shaderTree = this.children?.find((c) => c.name === 'shaderTree');
    if (shaderTree) {
      const specNode = shaderTree.children.find(
        (c) => c.name === 'node "image_map" "Specular_Map"'
      );
      const imgSource = specNode?.children.find(
        (c) => c.name === 'nodeInput "Image_Source"'
      );
      const fileProp = imgSource?.children.find((c) => c.name.startsWith('file '));
      if (fileProp) {
        const rest = fileProp.name.slice('file'.length).trim();
        if (rest.startsWith('"') && rest.endsWith('"')) {
          return rest.slice(1, -1);
        }
        return rest;
      }
    }
    return this.extractMapPath('specularMap');
  }

  private setMapProperty(prefix: string, texturePath: string): void {
    if (!texturePath || texturePath === 'NO_MAP') {
      const node = this.setOrAddProperty(prefix, `${prefix} NO_MAP`);
      node.children = [];
      return;
    }
    const formatted = texturePath.startsWith('"') ? texturePath : `"${texturePath}"`;
    const node = this.setOrAddProperty(prefix, `${prefix} ${formatted}`);
    node.hasChildrenBlock = false;
    const flagsNode = new PoserNode(node, '0 0');
    flagsNode.hasChildrenBlock = false;
    node.children = [flagsNode];
  }

  private extractMapPath(prefix: string): string | null {
    const node = this.children?.find((c) => c.name.startsWith(prefix));
    if (!node) return null;
    const rest = node.name.slice(prefix.length).trim();
    if (!rest || rest === 'NO_MAP') return null;
    if (rest.startsWith('"')) {
      const closingIdx = rest.indexOf('"', 1);
      return closingIdx !== -1 ? rest.slice(1, closingIdx) : null;
    }
    return rest.split(/\s+/)[0];
  }

  getDiffuseColor(): [number, number, number, number] | null {
    const node = this.children?.find((c) => c.name.toLowerCase().startsWith('kdcolor'));
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

  private setOrAddProperty(prefix: string, line: string): PoserNode {
    const lower = prefix.toLowerCase();
    const existing = this.children.find((c) => {
      const cLower = c.name.toLowerCase();
      return cLower === lower || cLower.startsWith(lower + ' ');
    });
    if (existing) {
      existing.name = line;
      return existing;
    }
    return this.addPropertyNode(line);
  }

  public addPropertyNode(text: string): PoserNode {
    const node = new PoserNode(this, text);
    node.hasChildrenBlock = false;
    this.children.push(node);
    return node;
  }
}


import { PoserNode } from '../core/poser-node.js';
export class MaterialNode extends PoserNode {
    materialName;
    constructor(parent = null, materialName = 'Preview') {
        super(parent, `material ${materialName}`);
        this.materialName = materialName;
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
    setTextureMap(texturePath) {
        const formatted = texturePath.startsWith('"') ? texturePath : `"${texturePath}"`;
        const line = `textureMap ${formatted} 0 0`;
        this.setOrAddProperty('textureMap', line);
        return this;
    }
    setColors(kd, ka, ks) {
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
    setDiffuseColor(r, g, b, a = 1) {
        const line = `KdColor ${r.toFixed(4)} ${g.toFixed(4)} ${b.toFixed(4)} ${a.toFixed(4)}`;
        this.setOrAddProperty('KdColor', line);
        return this;
    }
    setTransparencyMap(texturePath, tMin = 1, tMax = 0, tExpo = 0.6) {
        this.setOrAddProperty('tMin', `tMin ${tMin}`);
        this.setOrAddProperty('tMax', `tMax ${tMax}`);
        this.setOrAddProperty('tExpo', `tExpo ${tExpo}`);
        const formatted = texturePath.startsWith('"') ? texturePath : `"${texturePath}"`;
        this.setOrAddProperty('transparencyMap', `transparencyMap ${formatted} 0 0`);
        return this;
    }
    setBumpMap(texturePath, bumpStrength = 1) {
        this.setOrAddProperty('bumpStrength', `bumpStrength ${bumpStrength}`);
        const formatted = texturePath.startsWith('"') ? texturePath : `"${texturePath}"`;
        this.setOrAddProperty('bumpMap', `bumpMap ${formatted} 0 0`);
        return this;
    }
    setSpecularMap(texturePath) {
        const formatted = texturePath.startsWith('"') ? texturePath : `"${texturePath}"`;
        this.setOrAddProperty('specularMap', `specularMap ${formatted} 0 0`);
        return this;
    }
    setNsExponent(nsExponent = 45) {
        this.setOrAddProperty('nsExponent', `nsExponent ${nsExponent}`);
        return this;
    }
    getTextureMap() {
        return this.extractMapPath('textureMap');
    }
    getTransparencyMap() {
        return this.extractMapPath('transparencyMap');
    }
    getBumpMap() {
        return this.extractMapPath('bumpMap');
    }
    getSpecularMap() {
        return this.extractMapPath('specularMap');
    }
    extractMapPath(prefix) {
        const node = this.children.find((c) => c.name.startsWith(prefix));
        if (!node)
            return null;
        const rest = node.name.slice(prefix.length).trim();
        if (!rest)
            return null;
        if (rest.startsWith('"')) {
            const closingIdx = rest.indexOf('"', 1);
            return closingIdx !== -1 ? rest.slice(1, closingIdx) : null;
        }
        return rest.split(/\s+/)[0];
    }
    getDiffuseColor() {
        const node = this.children.find((c) => c.name.toLowerCase().startsWith('kdcolor'));
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
    setOrAddProperty(prefix, line) {
        const lower = prefix.toLowerCase();
        const existing = this.children.find((c) => {
            const cLower = c.name.toLowerCase();
            return cLower === lower || cLower.startsWith(lower + ' ');
        });
        if (existing) {
            existing.name = line;
        }
        else {
            this.addPropertyNode(line);
        }
    }
    addPropertyNode(text) {
        const node = new PoserNode(this, text);
        node.hasChildrenBlock = false;
        this.children.push(node);
    }
}
//# sourceMappingURL=material-node.js.map
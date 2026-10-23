import { PoserNode } from '../core/poser-node.js';

export interface WeightEntry {
  vertexIndex: number;
  weight: number;
}

/**
 * Models a Poser vertex weight map node (Poser 9 / 2012+ weight-mapped figures).
 * Corresponds to ATC::Poser::Nodes::WeightMapNode.
 *
 * Poser syntax:
 * weightMap <mapId>
 * {
 *   numbVerts <count>
 *   v <vertexIndex> <weight>
 *   ...
 * }
 */
export class WeightMapNode extends PoserNode {
  public mapId: string = '';
  public numVerts: number = 0;
  private weightMap: Map<number, number> = new Map();

  constructor(parent: PoserNode | null = null, mapId: string = '') {
    const cleanId = WeightMapNode.normalizeMapId(mapId);
    super(parent, cleanId ? `weightMap ${cleanId}` : 'weightMap');
    this.mapId = cleanId;
    this.hasChildrenBlock = true;
  }

  /**
   * Normalizes bulge and joint weight map identifiers.
   * e.g. bulge_RightArm_zrot -> bulge_rArm_zrot
   */
  static normalizeMapId(id: string): string {
    let clean = id.trim().replace(/^weightMap\s+/i, '');
    if (clean.toLowerCase().startsWith('bulge')) {
      clean = clean
        .replace(/right\s*/i, 'r')
        .replace(/left\s*/i, 'l');
    }
    return clean;
  }

  setMapId(id: string): this {
    this.mapId = WeightMapNode.normalizeMapId(id);
    this.name = `weightMap ${this.mapId}`;
    return this;
  }

  setNumVerts(count: number): this {
    this.numVerts = count;
    return this;
  }

  setWeight(vertexIndex: number, weight: number): this {
    if (weight > 0) {
      this.weightMap.set(vertexIndex, weight);
    } else {
      this.weightMap.delete(vertexIndex);
    }
    return this;
  }

  getWeight(vertexIndex: number): number {
    return this.weightMap.get(vertexIndex) ?? 0.0;
  }

  getWeights(): Map<number, number> {
    return this.weightMap;
  }

  getNonZeroWeights(): WeightEntry[] {
    const entries: WeightEntry[] = [];
    for (const [vertexIndex, weight] of this.weightMap.entries()) {
      entries.push({ vertexIndex, weight });
    }
    return entries.sort((a, b) => a.vertexIndex - b.vertexIndex);
  }

  clearWeights(): this {
    this.weightMap.clear();
    return this;
  }

  /**
   * Serialize internal weights to AST child nodes for export.
   */
  syncToNodes(): this {
    this.children = [];
    this.hasChildrenBlock = true;

    // Header numbVerts
    this.addProperty(`numbVerts ${this.numVerts}`);

    // Sparse vertex weights
    const sorted = this.getNonZeroWeights();
    for (const entry of sorted) {
      this.addProperty(`v ${entry.vertexIndex} ${entry.weight.toFixed(6)}`);
    }

    return this;
  }

  /**
   * Parse weights from child AST nodes after loading from file.
   */
  syncFromNodes(): this {
    this.weightMap.clear();

    for (const child of this.children) {
      const line = child.name.trim();
      const parts = line.split(/\s+/);
      if (parts[0] === 'numbVerts' && parts.length >= 2) {
        this.numVerts = parseInt(parts[1], 10) || 0;
      } else if (parts[0] === 'v' && parts.length >= 3) {
        const idx = parseInt(parts[1], 10);
        const w = parseFloat(parts[2]);
        if (!isNaN(idx) && !isNaN(w)) {
          this.weightMap.set(idx, w);
        }
      }
    }

    return this;
  }
}

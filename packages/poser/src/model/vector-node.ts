import { PoserNode } from '../core/poser-node.js';
import { Vector3 } from '@atp/geometry';

export class VectorNode extends PoserNode {
  constructor(
    parent: PoserNode | null = null,
    directive: 'origin' | 'endPoint' | 'orientation' = 'origin',
    vector: Vector3 = new Vector3(0, 0, 0)
  ) {
    super(parent, `${directive} ${vector.x.toFixed(6)} ${vector.y.toFixed(6)} ${vector.z.toFixed(6)}`);
    this.hasChildrenBlock = false;
  }

  setVector(directive: string, vector: Vector3): void {
    this.name = `${directive} ${vector.x.toFixed(6)} ${vector.y.toFixed(6)} ${vector.z.toFixed(6)}`;
  }

  getVector(): Vector3 {
    const parts = this.name.split(/\s+/);
    if (parts.length >= 4) {
      return new Vector3(
        parseFloat(parts[1]),
        parseFloat(parts[2]),
        parseFloat(parts[3])
      );
    }
    return new Vector3(0, 0, 0);
  }
}

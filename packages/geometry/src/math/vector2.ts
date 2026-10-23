export class Vector2 {
  constructor(public u: number = 0, public v: number = 0) {}

  get x(): number {
    return this.u;
  }
  set x(val: number) {
    this.u = val;
  }

  get y(): number {
    return this.v;
  }
  set y(val: number) {
    this.v = val;
  }

  set(u: number, v: number): this {
    this.u = u;
    this.v = v;
    return this;
  }

  clone(): Vector2 {
    return new Vector2(this.u, this.v);
  }

  copyFrom(other: Vector2): this {
    this.u = other.u;
    this.v = other.v;
    return this;
  }

  add(other: Vector2): Vector2 {
    return new Vector2(this.u + other.u, this.v + other.v);
  }

  scale(factor: number): Vector2 {
    return new Vector2(this.u * factor, this.v * factor);
  }

  equals(other: Vector2, epsilon: number = 1e-6): boolean {
    return Math.abs(this.u - other.u) <= epsilon && Math.abs(this.v - other.v) <= epsilon;
  }

  toArray(): [number, number] {
    return [this.u, this.v];
  }
}

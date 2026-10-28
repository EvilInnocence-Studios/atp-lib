export class Vector2 {
    u;
    v;
    constructor(u = 0, v = 0) {
        this.u = u;
        this.v = v;
    }
    get x() {
        return this.u;
    }
    set x(val) {
        this.u = val;
    }
    get y() {
        return this.v;
    }
    set y(val) {
        this.v = val;
    }
    set(u, v) {
        this.u = u;
        this.v = v;
        return this;
    }
    clone() {
        return new Vector2(this.u, this.v);
    }
    copyFrom(other) {
        this.u = other.u;
        this.v = other.v;
        return this;
    }
    add(other) {
        return new Vector2(this.u + other.u, this.v + other.v);
    }
    scale(factor) {
        return new Vector2(this.u * factor, this.v * factor);
    }
    equals(other, epsilon = 1e-6) {
        return Math.abs(this.u - other.u) <= epsilon && Math.abs(this.v - other.v) <= epsilon;
    }
    toArray() {
        return [this.u, this.v];
    }
}
//# sourceMappingURL=vector2.js.map
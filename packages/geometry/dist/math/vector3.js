export class Vector3 {
    x;
    y;
    z;
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    set(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    }
    clone() {
        return new Vector3(this.x, this.y, this.z);
    }
    copyFrom(other) {
        this.x = other.x;
        this.y = other.y;
        this.z = other.z;
        return this;
    }
    add(other) {
        return new Vector3(this.x + other.x, this.y + other.y, this.z + other.z);
    }
    addInPlace(other) {
        this.x += other.x;
        this.y += other.y;
        this.z += other.z;
        return this;
    }
    subtract(other) {
        return new Vector3(this.x - other.x, this.y - other.y, this.z - other.z);
    }
    subtractInPlace(other) {
        this.x -= other.x;
        this.y -= other.y;
        this.z -= other.z;
        return this;
    }
    multiplyScalar(scalar) {
        return new Vector3(this.x * scalar, this.y * scalar, this.z * scalar);
    }
    scale(scalar) {
        return this.multiplyScalar(scalar);
    }
    multiplyScalarInPlace(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        this.z *= scalar;
        return this;
    }
    divideScalar(scalar) {
        return this.multiplyScalar(1.0 / scalar);
    }
    dot(other) {
        return this.x * other.x + this.y * other.y + this.z * other.z;
    }
    cross(other) {
        return new Vector3(this.y * other.z - this.z * other.y, this.z * other.x - this.x * other.z, this.x * other.y - this.y * other.x);
    }
    lengthSq() {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    }
    length() {
        return Math.sqrt(this.lengthSq());
    }
    distanceToSq(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const dz = this.z - other.z;
        return dx * dx + dy * dy + dz * dz;
    }
    distanceTo(other) {
        return Math.sqrt(this.distanceToSq(other));
    }
    normalize() {
        const len = this.length();
        if (len === 0)
            return new Vector3(0, 0, 0);
        return this.divideScalar(len);
    }
    normalizeInPlace() {
        const len = this.length();
        if (len > 0) {
            this.multiplyScalarInPlace(1.0 / len);
        }
        return this;
    }
    equals(other, epsilon = 1e-6) {
        return (Math.abs(this.x - other.x) <= epsilon &&
            Math.abs(this.y - other.y) <= epsilon &&
            Math.abs(this.z - other.z) <= epsilon);
    }
    toArray() {
        return [this.x, this.y, this.z];
    }
    static fromArray(arr) {
        return new Vector3(arr[0] ?? 0, arr[1] ?? 0, arr[2] ?? 0);
    }
}
//# sourceMappingURL=vector3.js.map
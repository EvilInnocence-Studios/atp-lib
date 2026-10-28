export declare class Vector3 {
    x: number;
    y: number;
    z: number;
    constructor(x?: number, y?: number, z?: number);
    set(x: number, y: number, z: number): this;
    clone(): Vector3;
    copyFrom(other: Vector3): this;
    add(other: Vector3): Vector3;
    addInPlace(other: Vector3): this;
    subtract(other: Vector3): Vector3;
    subtractInPlace(other: Vector3): this;
    multiplyScalar(scalar: number): Vector3;
    scale(scalar: number): Vector3;
    multiplyScalarInPlace(scalar: number): this;
    divideScalar(scalar: number): Vector3;
    dot(other: Vector3): number;
    cross(other: Vector3): Vector3;
    lengthSq(): number;
    length(): number;
    distanceToSq(other: Vector3): number;
    distanceTo(other: Vector3): number;
    normalize(): Vector3;
    normalizeInPlace(): this;
    equals(other: Vector3, epsilon?: number): boolean;
    toArray(): [number, number, number];
    static fromArray(arr: [number, number, number] | number[]): Vector3;
}
//# sourceMappingURL=vector3.d.ts.map
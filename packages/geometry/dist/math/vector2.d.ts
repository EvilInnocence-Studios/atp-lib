export declare class Vector2 {
    u: number;
    v: number;
    constructor(u?: number, v?: number);
    get x(): number;
    set x(val: number);
    get y(): number;
    set y(val: number);
    set(u: number, v: number): this;
    clone(): Vector2;
    copyFrom(other: Vector2): this;
    add(other: Vector2): Vector2;
    scale(factor: number): Vector2;
    equals(other: Vector2, epsilon?: number): boolean;
    toArray(): [number, number];
}
//# sourceMappingURL=vector2.d.ts.map
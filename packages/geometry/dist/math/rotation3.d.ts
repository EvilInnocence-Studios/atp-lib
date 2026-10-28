export declare class Rotation3 {
    xrot: number;
    yrot: number;
    zrot: number;
    /**
     * Euler angles in degrees
     */
    constructor(xrot?: number, yrot?: number, zrot?: number);
    set(xrot: number, yrot: number, zrot: number): this;
    clone(): Rotation3;
    copyFrom(other: Rotation3): this;
    toArray(): [number, number, number];
}
//# sourceMappingURL=rotation3.d.ts.map
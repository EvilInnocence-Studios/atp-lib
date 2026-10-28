export class Rotation3 {
    xrot;
    yrot;
    zrot;
    /**
     * Euler angles in degrees
     */
    constructor(xrot = 0, yrot = 0, zrot = 0) {
        this.xrot = xrot;
        this.yrot = yrot;
        this.zrot = zrot;
    }
    set(xrot, yrot, zrot) {
        this.xrot = xrot;
        this.yrot = yrot;
        this.zrot = zrot;
        return this;
    }
    clone() {
        return new Rotation3(this.xrot, this.yrot, this.zrot);
    }
    copyFrom(other) {
        this.xrot = other.xrot;
        this.yrot = other.yrot;
        this.zrot = other.zrot;
        return this;
    }
    toArray() {
        return [this.xrot, this.yrot, this.zrot];
    }
}
//# sourceMappingURL=rotation3.js.map
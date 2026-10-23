export class Rotation3 {
  /**
   * Euler angles in degrees
   */
  constructor(
    public xrot: number = 0,
    public yrot: number = 0,
    public zrot: number = 0
  ) {}

  set(xrot: number, yrot: number, zrot: number): this {
    this.xrot = xrot;
    this.yrot = yrot;
    this.zrot = zrot;
    return this;
  }

  clone(): Rotation3 {
    return new Rotation3(this.xrot, this.yrot, this.zrot);
  }

  copyFrom(other: Rotation3): this {
    this.xrot = other.xrot;
    this.yrot = other.yrot;
    this.zrot = other.zrot;
    return this;
  }

  toArray(): [number, number, number] {
    return [this.xrot, this.yrot, this.zrot];
  }
}

import { describe, it, expect } from 'vitest';
import { Vector3, Vector2, Rotation3 } from '../src/index.js';

describe('Math Primitives Coverage', () => {
  describe('Vector3', () => {
    it('should test constructor defaults and set', () => {
      const v = new Vector3();
      expect(v.x).toBe(0);
      expect(v.y).toBe(0);
      expect(v.z).toBe(0);

      v.set(10, 20, 30);
      expect(v.x).toBe(10);
      expect(v.y).toBe(20);
      expect(v.z).toBe(30);
    });

    it('should clone and copyFrom', () => {
      const a = new Vector3(1, 2, 3);
      const b = a.clone();
      expect(b).not.toBe(a);
      expect(b.equals(a)).toBe(true);

      const c = new Vector3();
      c.copyFrom(a);
      expect(c.equals(a)).toBe(true);
    });

    it('should perform add, addInPlace, subtract, subtractInPlace', () => {
      const a = new Vector3(1, 2, 3);
      const b = new Vector3(4, 5, 6);

      const sum = a.add(b);
      expect(sum.toArray()).toEqual([5, 7, 9]);

      a.addInPlace(b);
      expect(a.toArray()).toEqual([5, 7, 9]);

      const diff = a.subtract(b);
      expect(diff.toArray()).toEqual([1, 2, 3]);

      a.subtractInPlace(b);
      expect(a.toArray()).toEqual([1, 2, 3]);
    });

    it('should perform multiplyScalar, scale, multiplyScalarInPlace, divideScalar', () => {
      const a = new Vector3(2, 4, 6);
      expect(a.multiplyScalar(2).toArray()).toEqual([4, 8, 12]);
      expect(a.scale(0.5).toArray()).toEqual([1, 2, 3]);

      a.multiplyScalarInPlace(3);
      expect(a.toArray()).toEqual([6, 12, 18]);

      const div = a.divideScalar(3);
      expect(div.toArray()).toEqual([2, 4, 6]);
    });

    it('should compute dot, cross, length, and distance', () => {
      const a = new Vector3(1, 0, 0);
      const b = new Vector3(0, 1, 0);

      expect(a.dot(b)).toBe(0);
      expect(a.cross(b).toArray()).toEqual([0, 0, 1]);

      const c = new Vector3(3, 4, 0);
      expect(c.lengthSq()).toBe(25);
      expect(c.length()).toBe(5);

      const d = new Vector3(0, 0, 0);
      expect(c.distanceToSq(d)).toBe(25);
      expect(c.distanceTo(d)).toBe(5);
    });

    it('should normalize and normalizeInPlace handling zero length', () => {
      const a = new Vector3(0, 5, 0);
      const norm = a.normalize();
      expect(norm.toArray()).toEqual([0, 1, 0]);

      a.normalizeInPlace();
      expect(a.toArray()).toEqual([0, 1, 0]);

      const zero = new Vector3(0, 0, 0);
      expect(zero.normalize().toArray()).toEqual([0, 0, 0]);
      zero.normalizeInPlace();
      expect(zero.toArray()).toEqual([0, 0, 0]);
    });

    it('should test equals across components and epsilon', () => {
      const a = new Vector3(1, 2, 3);
      expect(a.equals(new Vector3(1, 2, 3))).toBe(true);
      expect(a.equals(new Vector3(1.0000001, 2, 3))).toBe(true);
      expect(a.equals(new Vector3(2, 2, 3))).toBe(false);
      expect(a.equals(new Vector3(1, 3, 3))).toBe(false);
      expect(a.equals(new Vector3(1, 2, 4))).toBe(false);
    });

    it('should test toArray and fromArray', () => {
      const v = Vector3.fromArray([1, 2, 3]);
      expect(v.toArray()).toEqual([1, 2, 3]);

      const fallback = Vector3.fromArray([]);
      expect(fallback.toArray()).toEqual([0, 0, 0]);
    });
  });

  describe('Vector2', () => {
    it('should test constructor, x/y aliases, and set', () => {
      const uv = new Vector2();
      expect(uv.u).toBe(0);
      expect(uv.v).toBe(0);
      expect(uv.x).toBe(0);
      expect(uv.y).toBe(0);

      uv.x = 0.5;
      uv.y = 0.75;
      expect(uv.u).toBe(0.5);
      expect(uv.v).toBe(0.75);

      uv.set(0.1, 0.2);
      expect(uv.u).toBe(0.1);
      expect(uv.v).toBe(0.2);
    });

    it('should clone, copyFrom, add, scale, equals, and toArray', () => {
      const a = new Vector2(0.2, 0.4);
      const b = a.clone();
      expect(b).not.toBe(a);
      expect(b.equals(a)).toBe(true);

      const c = new Vector2();
      c.copyFrom(a);
      expect(c.equals(a)).toBe(true);

      const sum = a.add(new Vector2(0.3, 0.1));
      expect(sum.u).toBeCloseTo(0.5);
      expect(sum.v).toBeCloseTo(0.5);

      const scaled = a.scale(2);
      expect(scaled.u).toBeCloseTo(0.4);
      expect(scaled.v).toBeCloseTo(0.8);

      expect(a.equals(new Vector2(0.9, 0.4))).toBe(false);
      expect(a.equals(new Vector2(0.2, 0.9))).toBe(false);
      expect(a.toArray()).toEqual([0.2, 0.4]);
    });
  });

  describe('Rotation3', () => {
    it('should test constructor defaults, set, clone, copyFrom, toArray', () => {
      const r = new Rotation3();
      expect(r.xrot).toBe(0);
      expect(r.yrot).toBe(0);
      expect(r.zrot).toBe(0);

      r.set(45, 90, 180);
      expect(r.xrot).toBe(45);
      expect(r.yrot).toBe(90);
      expect(r.zrot).toBe(180);

      const cloned = r.clone();
      expect(cloned).not.toBe(r);
      expect(cloned.toArray()).toEqual([45, 90, 180]);

      const target = new Rotation3();
      target.copyFrom(r);
      expect(target.toArray()).toEqual([45, 90, 180]);
    });
  });
});

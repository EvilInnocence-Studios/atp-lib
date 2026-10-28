import { Vector3 } from 'atp-geometry';
export interface SpatialWeight {
    point: Vector3;
    weight: number;
}
/**
 * Spatial weight map containing 3D points and weights with nearest-neighbor interpolation.
 * Corresponds to ATC::Poser::WeightMap.
 */
export declare class WeightMap {
    private weights;
    numInfluencePoints: number;
    maxDistance: number;
    minDistance: number;
    constructor(weights?: SpatialWeight[]);
    get size(): number;
    addWeight(point: Vector3, weight: number): void;
    reset(weights: SpatialWeight[]): void;
    clear(): void;
    /**
     * Calculate interpolated weight for a given 3D position using
     * Inverse Distance Weighting (IDW) over the closest influence points.
     */
    getWeight(queryPoint: Vector3): number;
}
//# sourceMappingURL=weightmap.d.ts.map
/**
 * Spatial weight map containing 3D points and weights with nearest-neighbor interpolation.
 * Corresponds to ATC::Poser::WeightMap.
 */
export class WeightMap {
    weights = [];
    numInfluencePoints = 20;
    maxDistance = 1000.0;
    minDistance = 0.0001;
    constructor(weights = []) {
        this.weights = weights;
    }
    get size() {
        return this.weights.length;
    }
    addWeight(point, weight) {
        this.weights.push({ point: point.clone(), weight });
    }
    reset(weights) {
        this.weights = weights;
    }
    clear() {
        this.weights = [];
    }
    /**
     * Calculate interpolated weight for a given 3D position using
     * Inverse Distance Weighting (IDW) over the closest influence points.
     */
    getWeight(queryPoint) {
        if (this.weights.length === 0)
            return 0.0;
        // Calculate distances to all points
        const distances = [];
        for (const w of this.weights) {
            const dist = queryPoint.distanceTo(w.point);
            if (dist < this.minDistance) {
                // Direct hit
                return w.weight;
            }
            if (dist <= this.maxDistance) {
                distances.push({ weight: w.weight, dist });
            }
        }
        if (distances.length === 0) {
            // Find single closest point
            let closestDist = Infinity;
            let closestWeight = 0;
            for (const w of this.weights) {
                const d = queryPoint.distanceTo(w.point);
                if (d < closestDist) {
                    closestDist = d;
                    closestWeight = w.weight;
                }
            }
            return closestWeight;
        }
        // Sort by distance and take top K influence points
        distances.sort((a, b) => a.dist - b.dist);
        const k = Math.min(this.numInfluencePoints, distances.length);
        let weightSum = 0;
        let invDistSum = 0;
        for (let i = 0; i < k; i++) {
            const invDist = 1.0 / (distances[i].dist * distances[i].dist);
            weightSum += distances[i].weight * invDist;
            invDistSum += invDist;
        }
        return invDistSum > 0 ? weightSum / invDistSum : 0;
    }
}
//# sourceMappingURL=weightmap.js.map
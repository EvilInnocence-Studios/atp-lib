import { Vector3, Vector2 } from '../math/index.js';
export interface FaceVertex {
    /**
     * 0-based vertex index in the mesh
     */
    vIndex: number;
    /**
     * Optional 0-based texture (UV) index in the mesh
     */
    tIndex?: number;
    /**
     * Optional 0-based normal index in the mesh
     */
    nIndex?: number;
}
export interface MeshFace {
    /**
     * Vertices forming the face (3 for triangle, 4 for quad, or n for polygon)
     */
    vertices: FaceVertex[];
    /**
     * Named geometry group (e.g., 'hairRoot', 'head', 'Cube')
     */
    group: string;
    /**
     * Material name (e.g., 'HairStrands', 'DefaultMaterial')
     */
    material: string;
}
export declare class WavefrontMesh {
    vertices: Vector3[];
    uvs: Vector2[];
    normals: Vector3[];
    faces: MeshFace[];
    constructor();
    addVertex(x: number, y: number, z: number): number;
    addVertex(v: Vector3): number;
    addUV(u: number, v: number): number;
    addUV(uv: Vector2): number;
    addNormal(x: number, y: number, z: number): number;
    addNormal(n: Vector3): number;
    addFace(vertices: FaceVertex[], group?: string, material?: string): number;
    getGroups(): string[];
    getMaterials(): string[];
    getFacesByGroup(groupName: string): MeshFace[];
    /**
     * Get all unique vertices belonging to a specific group, along with their global mesh indices.
     */
    getGroupVertices(groupName: string): {
        globalIndex: number;
        vertex: Vector3;
    }[];
    /**
     * Get the 0-based local index of a vertex within a specific group.
     * Returns -1 if the vertex is not in the group.
     */
    getGroupVertexIndex(groupName: string, globalIndex: number): number;
    /**
     * Map a local group vertex index back to the global mesh vertex index.
     * Returns -1 if the group has no such local vertex.
     */
    getTrueVertexIndex(groupName: string, localGroupIndex: number): number;
    /**
     * Generate normals for all faces in the mesh.
     * @param mode 'smooth' computes per-vertex averaged normals; 'faceted' computes per-face normals.
     */
    calculateNormals(mode?: 'smooth' | 'faceted'): void;
    /**
     * Clone this mesh into a new deep copy.
     */
    clone(): WavefrontMesh;
    clear(): void;
}
//# sourceMappingURL=wavefront-mesh.d.ts.map
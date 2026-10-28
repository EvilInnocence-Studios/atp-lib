import { Vector3, Vector2 } from '../math/index.js';
export class WavefrontMesh {
    vertices = [];
    uvs = [];
    normals = [];
    faces = [];
    constructor() { }
    addVertex(arg1, y, z) {
        if (typeof arg1 === 'number') {
            this.vertices.push(new Vector3(arg1, y ?? 0, z ?? 0));
        }
        else {
            this.vertices.push(arg1.clone());
        }
        return this.vertices.length - 1;
    }
    addUV(arg1, v) {
        if (typeof arg1 === 'number') {
            this.uvs.push(new Vector2(arg1, v ?? 0));
        }
        else {
            this.uvs.push(arg1.clone());
        }
        return this.uvs.length - 1;
    }
    addNormal(arg1, y, z) {
        if (typeof arg1 === 'number') {
            this.normals.push(new Vector3(arg1, y ?? 0, z ?? 0));
        }
        else {
            this.normals.push(arg1.clone());
        }
        return this.normals.length - 1;
    }
    addFace(vertices, group = 'default', material = 'default') {
        this.faces.push({
            vertices,
            group,
            material,
        });
        return this.faces.length - 1;
    }
    getGroups() {
        const groups = new Set();
        for (const f of this.faces) {
            groups.add(f.group);
        }
        return Array.from(groups);
    }
    getMaterials() {
        const materials = new Set();
        for (const f of this.faces) {
            materials.add(f.material);
        }
        return Array.from(materials);
    }
    getFacesByGroup(groupName) {
        return this.faces.filter((f) => f.group === groupName);
    }
    /**
     * Get all unique vertices belonging to a specific group, along with their global mesh indices.
     */
    getGroupVertices(groupName) {
        const groupFaces = this.getFacesByGroup(groupName);
        const seenIndices = new Set();
        const result = [];
        for (const face of groupFaces) {
            for (const fv of face.vertices) {
                if (!seenIndices.has(fv.vIndex) && fv.vIndex >= 0 && fv.vIndex < this.vertices.length) {
                    seenIndices.add(fv.vIndex);
                    result.push({
                        globalIndex: fv.vIndex,
                        vertex: this.vertices[fv.vIndex],
                    });
                }
            }
        }
        return result;
    }
    /**
     * Get the 0-based local index of a vertex within a specific group.
     * Returns -1 if the vertex is not in the group.
     */
    getGroupVertexIndex(groupName, globalIndex) {
        const groupVerts = this.getGroupVertices(groupName);
        return groupVerts.findIndex((gv) => gv.globalIndex === globalIndex);
    }
    /**
     * Map a local group vertex index back to the global mesh vertex index.
     * Returns -1 if the group has no such local vertex.
     */
    getTrueVertexIndex(groupName, localGroupIndex) {
        const groupVerts = this.getGroupVertices(groupName);
        if (localGroupIndex >= 0 && localGroupIndex < groupVerts.length) {
            return groupVerts[localGroupIndex].globalIndex;
        }
        return -1;
    }
    /**
     * Generate normals for all faces in the mesh.
     * @param mode 'smooth' computes per-vertex averaged normals; 'faceted' computes per-face normals.
     */
    calculateNormals(mode = 'smooth') {
        if (this.vertices.length === 0 || this.faces.length === 0)
            return;
        if (mode === 'faceted') {
            this.normals = [];
            for (const face of this.faces) {
                if (face.vertices.length < 3)
                    continue;
                const p0 = this.vertices[face.vertices[0].vIndex];
                const p1 = this.vertices[face.vertices[1].vIndex];
                const p2 = this.vertices[face.vertices[2].vIndex];
                if (!p0 || !p1 || !p2)
                    continue;
                const edge1 = p1.subtract(p0);
                const edge2 = p2.subtract(p0);
                const normal = edge1.cross(edge2).normalize();
                const normalIdx = this.addNormal(normal);
                for (const fv of face.vertices) {
                    fv.nIndex = normalIdx;
                }
            }
        }
        else {
            // Smooth normals: accumulate face normals on each vertex
            const vertexNormals = this.vertices.map(() => new Vector3(0, 0, 0));
            for (const face of this.faces) {
                if (face.vertices.length < 3)
                    continue;
                const p0 = this.vertices[face.vertices[0].vIndex];
                const p1 = this.vertices[face.vertices[1].vIndex];
                const p2 = this.vertices[face.vertices[2].vIndex];
                if (!p0 || !p1 || !p2)
                    continue;
                const edge1 = p1.subtract(p0);
                const edge2 = p2.subtract(p0);
                const faceNormal = edge1.cross(edge2); // area-weighted normal
                for (const fv of face.vertices) {
                    if (fv.vIndex < vertexNormals.length) {
                        vertexNormals[fv.vIndex] = vertexNormals[fv.vIndex].add(faceNormal);
                    }
                }
            }
            this.normals = vertexNormals.map((n) => {
                const len = n.length();
                return len > 1e-6 ? n.scale(1 / len) : new Vector3(0, 1, 0);
            });
            for (const face of this.faces) {
                for (const fv of face.vertices) {
                    fv.nIndex = fv.vIndex;
                }
            }
        }
    }
    /**
     * Clone this mesh into a new deep copy.
     */
    clone() {
        const copy = new WavefrontMesh();
        copy.vertices = this.vertices.map((v) => v.clone());
        copy.uvs = this.uvs.map((uv) => uv.clone());
        copy.normals = this.normals.map((n) => n.clone());
        copy.faces = this.faces.map((f) => ({
            group: f.group,
            material: f.material,
            vertices: f.vertices.map((fv) => ({ ...fv })),
        }));
        return copy;
    }
    clear() {
        this.vertices = [];
        this.uvs = [];
        this.normals = [];
        this.faces = [];
    }
}
//# sourceMappingURL=wavefront-mesh.js.map
import * as path from 'node:path';
export class PoserPathResolver {
    /**
     * Check if a path contains a Poser Runtime folder.
     */
    static inRuntime(filePath) {
        const normalized = filePath.replace(/\\/g, '/');
        return /[:\/]Runtime[:\/]/i.test(normalized) || normalized.startsWith(':Runtime:');
    }
    /**
     * Extract the root path leading up to (and including) the Runtime folder.
     */
    static getRuntimeRoot(filePath) {
        const normalized = filePath.replace(/\\/g, '/');
        const idx = normalized.toLowerCase().indexOf('/runtime');
        if (idx !== -1) {
            return normalized.substring(0, idx + 8); // includes '/runtime'
        }
        return '';
    }
    /**
     * Convert an absolute path to a Poser colon-separated relative path
     * e.g. 'C:/Poser/Runtime/Geometries/Hair/MyHair.obj' -> ':Runtime:Geometries:Hair:MyHair.obj'
     */
    static toPoserRelativePath(fullPath) {
        const normalized = fullPath.replace(/\\/g, '/');
        const idx = normalized.toLowerCase().indexOf('/runtime');
        if (idx !== -1) {
            const sub = normalized.substring(idx + 1); // 'Runtime/...'
            return ':' + sub.replace(/\//g, ':');
        }
        return normalized;
    }
    /**
     * Convert a Poser colon-separated relative path to an absolute path on disk
     * e.g. ':Runtime:Geometries:Hair:MyHair.obj' + 'C:/Poser' -> 'C:/Poser/Runtime/Geometries/Hair/MyHair.obj'
     */
    static toDiskPath(poserRelativePath, runtimeRoot) {
        let clean = poserRelativePath;
        if (clean.startsWith(':')) {
            clean = clean.substring(1);
        }
        const parts = clean.split(':');
        return path.join(runtimeRoot, ...parts);
    }
}
//# sourceMappingURL=path-resolver.js.map
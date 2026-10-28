export declare class PoserPathResolver {
    /**
     * Check if a path contains a Poser Runtime folder.
     */
    static inRuntime(filePath: string): boolean;
    /**
     * Extract the root path leading up to (and including) the Runtime folder.
     */
    static getRuntimeRoot(filePath: string): string;
    /**
     * Convert an absolute path to a Poser colon-separated relative path
     * e.g. 'C:/Poser/Runtime/Geometries/Hair/MyHair.obj' -> ':Runtime:Geometries:Hair:MyHair.obj'
     */
    static toPoserRelativePath(fullPath: string): string;
    /**
     * Convert a Poser colon-separated relative path to an absolute path on disk
     * e.g. ':Runtime:Geometries:Hair:MyHair.obj' + 'C:/Poser' -> 'C:/Poser/Runtime/Geometries/Hair/MyHair.obj'
     */
    static toDiskPath(poserRelativePath: string, runtimeRoot: string): string;
}
//# sourceMappingURL=path-resolver.d.ts.map
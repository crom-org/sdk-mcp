import type { ProjectConfig } from "../types";
export declare const PROJECT_CONFIG_FILENAMES: string[];
export declare class ProjectConfigLoader {
    private cache;
    private watchers;
    findProjectRoot(startPath: string): string | null;
    findConfigPath(projectRoot: string): string | null;
    load(projectRoot: string): ProjectConfig;
    private parseConfig;
    getRulesText(config: ProjectConfig): string;
    watch(projectRoot: string, onChange: (config: ProjectConfig) => void): () => void;
    unwatch(projectRoot: string): void;
}
export declare const projectLoader: ProjectConfigLoader;
//# sourceMappingURL=ProjectConfigLoader.d.ts.map
import type { ProjectConfig, LoadProjectResult, MCPClientInfo } from "../types";
export declare class ProjectManager {
    private activeProject;
    private unwatch?;
    setProject(projectRoot: string): LoadProjectResult;
    clearProject(): void;
    getActiveProject(): ProjectConfig | null;
    getRulesText(): string;
    autoConnectMCPs(): Promise<void>;
    connectMCP(mcpId: string): Promise<void>;
    disconnectMCP(mcpId: string): Promise<void>;
    runHarness(harnessId: string, cwd?: string): import("../types").HarnessExecution;
    runHarnessWithRetries(harnessId: string, cwd?: string): Promise<import("../types").HarnessExecution>;
    getHarnessStatus(harnessId: string): import("../types").HarnessExecution[];
    getMCPStatus(mcpId?: string): MCPClientInfo[];
}
export declare const projectManager: ProjectManager;
//# sourceMappingURL=ProjectManager.d.ts.map
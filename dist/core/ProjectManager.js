"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectManager = exports.ProjectManager = void 0;
const ProjectConfigLoader_1 = require("../config/ProjectConfigLoader");
const MCPConnectionManager_1 = require("../mcp/MCPConnectionManager");
const HarnessRunner_1 = require("../harness/HarnessRunner");
class ProjectManager {
    activeProject = null;
    unwatch;
    setProject(projectRoot) {
        const config = ProjectConfigLoader_1.projectLoader.load(projectRoot);
        this.activeProject = config;
        // Register MCPs from project config
        const connected = [];
        for (const mcp of config.mcps) {
            if (mcp.enabled) {
                MCPConnectionManager_1.mcpManager.register(mcp);
                if (mcp.autoConnect) {
                    connected.push(mcp);
                }
            }
        }
        // Set up watcher for config changes
        this.unwatch?.();
        this.unwatch = ProjectConfigLoader_1.projectLoader.watch(projectRoot, (updated) => {
            this.activeProject = updated;
        });
        return {
            project: config,
            rules: ProjectConfigLoader_1.projectLoader.getRulesText(config),
            connectedMCPs: MCPConnectionManager_1.mcpManager.getAllStatus(),
            warnings: [],
        };
    }
    clearProject() {
        this.unwatch?.();
        this.unwatch = undefined;
        this.activeProject = null;
    }
    getActiveProject() {
        return this.activeProject;
    }
    getRulesText() {
        if (!this.activeProject) {
            return "Nenhum projeto ativo. Use setProject para carregar um projeto.";
        }
        return ProjectConfigLoader_1.projectLoader.getRulesText(this.activeProject);
    }
    async autoConnectMCPs() {
        if (!this.activeProject)
            return;
        for (const mcp of this.activeProject.mcps) {
            if (mcp.enabled && mcp.autoConnect) {
                try {
                    await MCPConnectionManager_1.mcpManager.connect(mcp.id);
                }
                catch {
                    // Continue even if one fails
                }
            }
        }
    }
    async connectMCP(mcpId) {
        const mcp = this.activeProject?.mcps.find((m) => m.id === mcpId);
        if (!mcp) {
            throw new Error(`MCP ${mcpId} não encontrado no projeto ativo`);
        }
        await MCPConnectionManager_1.mcpManager.connect(mcp.id);
    }
    async disconnectMCP(mcpId) {
        await MCPConnectionManager_1.mcpManager.disconnect(mcpId);
    }
    runHarness(harnessId, cwd) {
        if (!this.activeProject) {
            throw new Error("Nenhum projeto ativo");
        }
        const harness = this.activeProject.harnesses.find((h) => h.id === harnessId);
        if (!harness) {
            throw new Error(`Harness ${harnessId} não encontrado`);
        }
        if (!harness.enabled) {
            throw new Error(`Harness ${harnessId} está desabilitado`);
        }
        return HarnessRunner_1.harnessRunner.run(harness, cwd || this.activeProject.rootPath);
    }
    runHarnessWithRetries(harnessId, cwd) {
        if (!this.activeProject) {
            throw new Error("Nenhum projeto ativo");
        }
        const harness = this.activeProject.harnesses.find((h) => h.id === harnessId);
        if (!harness) {
            throw new Error(`Harness ${harnessId} não encontrado`);
        }
        return HarnessRunner_1.harnessRunner.runWithRetries(harness, cwd || this.activeProject.rootPath);
    }
    getHarnessStatus(harnessId) {
        return HarnessRunner_1.harnessRunner.getAllExecutions().filter((e) => e.harnessId === harnessId);
    }
    getMCPStatus(mcpId) {
        if (mcpId) {
            const s = MCPConnectionManager_1.mcpManager.getStatus(mcpId);
            return s ? [s] : [];
        }
        return MCPConnectionManager_1.mcpManager.getAllStatus();
    }
}
exports.ProjectManager = ProjectManager;
exports.projectManager = new ProjectManager();
//# sourceMappingURL=ProjectManager.js.map
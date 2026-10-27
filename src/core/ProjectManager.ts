import * as fs from "fs";
import * as path from "path";
import type {
  ProjectConfig,
  LoadProjectResult,
  MCPConnectionConfig,
  MCPClientInfo,
} from "../types";
import { projectLoader } from "../config/ProjectConfigLoader";
import { mcpManager } from "../mcp/MCPConnectionManager";
import { harnessRunner } from "../harness/HarnessRunner";

export class ProjectManager {
  private activeProject: ProjectConfig | null = null;
  private unwatch?: () => void;

  setProject(projectRoot: string): LoadProjectResult {
    const config = projectLoader.load(projectRoot);
    this.activeProject = config;

    // Register MCPs from project config
    const connected: MCPConnectionConfig[] = [];
    for (const mcp of config.mcps) {
      if (mcp.enabled) {
        mcpManager.register(mcp);
        if (mcp.autoConnect) {
          connected.push(mcp);
        }
      }
    }

    // Set up watcher for config changes
    this.unwatch?.();
    this.unwatch = projectLoader.watch(projectRoot, (updated) => {
      this.activeProject = updated;
    });

    return {
      project: config,
      rules: projectLoader.getRulesText(config),
      connectedMCPs: mcpManager.getAllStatus(),
      warnings: [],
    };
  }

  clearProject(): void {
    this.unwatch?.();
    this.unwatch = undefined;
    this.activeProject = null;
  }

  getActiveProject(): ProjectConfig | null {
    return this.activeProject;
  }

  getRulesText(): string {
    if (!this.activeProject) {
      return "Nenhum projeto ativo. Use setProject para carregar um projeto.";
    }
    return projectLoader.getRulesText(this.activeProject);
  }

  async autoConnectMCPs(): Promise<void> {
    if (!this.activeProject) return;

    for (const mcp of this.activeProject.mcps) {
      if (mcp.enabled && mcp.autoConnect) {
        try {
          await mcpManager.connect(mcp.id);
        } catch {
          // Continue even if one fails
        }
      }
    }
  }

  async connectMCP(mcpId: string): Promise<void> {
    const mcp = this.activeProject?.mcps.find((m) => m.id === mcpId);
    if (!mcp) {
      throw new Error(`MCP ${mcpId} não encontrado no projeto ativo`);
    }
    await mcpManager.connect(mcp.id);
  }

  async disconnectMCP(mcpId: string): Promise<void> {
    await mcpManager.disconnect(mcpId);
  }

  runHarness(harnessId: string, cwd?: string) {
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
    return harnessRunner.run(harness, cwd || this.activeProject.rootPath);
  }

  runHarnessWithRetries(harnessId: string, cwd?: string) {
    if (!this.activeProject) {
      throw new Error("Nenhum projeto ativo");
    }
    const harness = this.activeProject.harnesses.find((h) => h.id === harnessId);
    if (!harness) {
      throw new Error(`Harness ${harnessId} não encontrado`);
    }
    return harnessRunner.runWithRetries(harness, cwd || this.activeProject.rootPath);
  }

  getHarnessStatus(harnessId: string) {
    return harnessRunner.getAllExecutions().filter((e) => e.harnessId === harnessId);
  }

  getMCPStatus(mcpId?: string): MCPClientInfo[] {
    if (mcpId) {
      const s = mcpManager.getStatus(mcpId);
      return s ? [s] : [];
    }
    return mcpManager.getAllStatus();
  }
}

export const projectManager = new ProjectManager();

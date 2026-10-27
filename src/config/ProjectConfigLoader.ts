import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import type {
  ProjectConfig,
  MCPConnectionConfig,
  ProjectRule,
} from "../types";

export const PROJECT_CONFIG_FILENAMES = [
  ".crom-mcp.yml",
  ".crom-mcp.yaml",
  ".crom-mcp.json",
  "crom-mcp.yml",
  "crom-mcp.yaml",
  "crom-mcp.json",
];

export class ProjectConfigLoader {
  private cache = new Map<string, { config: ProjectConfig; mtime: number }>();
  private watchers = new Map<string, fs.FSWatcher>();

  findProjectRoot(startPath: string): string | null {
    let current = path.resolve(startPath);
    const root = path.parse(current).root;

    while (current !== root) {
      for (const filename of PROJECT_CONFIG_FILENAMES) {
        const fullPath = path.join(current, filename);
        if (fs.existsSync(fullPath)) {
          return current;
        }
      }
      current = path.dirname(current);
    }

    // Check root too
    for (const filename of PROJECT_CONFIG_FILENAMES) {
      if (fs.existsSync(path.join(root, filename))) {
        return root;
      }
    }

    return null;
  }

  findConfigPath(projectRoot: string): string | null {
    for (const filename of PROJECT_CONFIG_FILENAMES) {
      const fullPath = path.join(projectRoot, filename);
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }
    return null;
  }

  load(projectRoot: string): ProjectConfig {
    const configPath = this.findConfigPath(projectRoot);
    if (!configPath) {
      throw new Error(`Nenhum arquivo de configuração crom-mcp encontrado em ${projectRoot}`);
    }

    const stat = fs.statSync(configPath);
    const cached = this.cache.get(projectRoot);

    if (cached && cached.mtime === stat.mtimeMs) {
      return cached.config;
    }

    const raw = fs.readFileSync(configPath, "utf-8");
    const config = this.parseConfig(raw, configPath, projectRoot);

    this.cache.set(projectRoot, { config, mtime: stat.mtimeMs });
    return config;
  }

  private parseConfig(
    raw: string,
    configPath: string,
    projectRoot: string
  ): ProjectConfig {
    let parsed: any;
    const ext = path.extname(configPath).toLowerCase();

    try {
      if (ext === ".json") {
        parsed = JSON.parse(raw);
      } else {
        parsed = yaml.load(raw) as any;
      }
    } catch (err) {
      throw new Error(
        `Falha ao analisar configuração ${configPath}: ${(err as Error).message}`
      );
    }

    const now = new Date().toISOString();

    const rules: ProjectRule[] = (parsed.rules || []).map(
      (r: any, idx: number): ProjectRule => ({
        id: r.id || `rule-${idx}`,
        type: r.type || "instruction",
        title: r.title || "Regra sem título",
        content: r.content || "",
        priority: r.priority ?? 0,
        enabled: r.enabled !== false,
        appliesTo: r.appliesTo || [],
      })
    );

    const mcps: MCPConnectionConfig[] = (parsed.mcps || []).map(
      (m: any, idx: number): MCPConnectionConfig => ({
        id: m.id || `mcp-${idx}`,
        name: m.name || `MCP ${idx}`,
        type: m.type || "stdio",
        command: m.command,
        args: m.args,
        url: m.url,
        env: m.env,
        enabled: m.enabled !== false,
        autoConnect: m.autoConnect !== false,
      })
    );

    return {
      name: parsed.name || path.basename(projectRoot),
      rootPath: projectRoot,
      description: parsed.description,
      rules,
      mcps,
      harnesses: (parsed.harnesses || []).map((h: any, idx: number) => ({
        id: h.id || `harness-${idx}`,
        name: h.name || `Harness ${idx}`,
        type: h.type || "script",
        command: h.command,
        args: h.args,
        scriptPath: h.scriptPath,
        url: h.url,
        mcpId: h.mcpId,
        env: h.env,
        timeoutMs: h.timeoutMs ?? 30000,
        retryCount: h.retryCount ?? 0,
        enabled: h.enabled !== false,
      })),
      scripts: (parsed.scripts || []).map((s: any, idx: number) => ({
        id: s.id || `script-${idx}`,
        name: s.name || `Script ${idx}`,
        path: s.path,
        interpreter: s.interpreter,
        args: s.args,
        env: s.env,
        timeoutMs: s.timeoutMs ?? 30000,
        enabled: s.enabled !== false,
      })),
      agents: (parsed.agents || []).map((a: any, idx: number) => ({
        id: a.id || `agent-${idx}`,
        name: a.name || `Agent ${idx}`,
        type: a.type || "local",
        mcpId: a.mcpId,
        systemPrompt: a.systemPrompt,
        tools: a.tools,
        config: a.config,
        enabled: a.enabled !== false,
      })),
      createdAt: parsed.createdAt || now,
      updatedAt: now,
    };
  }

  getRulesText(config: ProjectConfig): string {
    const enabledRules = config.rules.filter((r) => r.enabled);
    enabledRules.sort((a, b) => b.priority - a.priority);

    let text = `# Regras do Projeto: ${config.name}\n`;
    text += `Caminho: ${config.rootPath}\n`;
    text += `Descrição: ${config.description || "Não informada"}\n\n`;
    text += "## Regras (carregadas antes de usar este MCP)\n\n";

    for (const rule of enabledRules) {
      text += `### ${rule.title}\n`;
      text += `Tipo: ${rule.type} | Prioridade: ${rule.priority}\n`;
      text += `${rule.content}\n\n`;
    }

    return text;
  }

  watch(projectRoot: string, onChange: (config: ProjectConfig) => void): () => void {
    const configPath = this.findConfigPath(projectRoot);
    if (!configPath) {
      return () => {};
    }

    const watcher = fs.watch(configPath, (eventType) => {
      if (eventType === "change") {
        try {
          const config = this.load(projectRoot);
          onChange(config);
        } catch (err) {
          // Ignore parse errors during watch
        }
      }
    });

    this.watchers.set(projectRoot, watcher);

    return () => {
      watcher.close();
      this.watchers.delete(projectRoot);
    };
  }

  unwatch(projectRoot: string): void {
    const watcher = this.watchers.get(projectRoot);
    if (watcher) {
      watcher.close();
      this.watchers.delete(projectRoot);
    }
  }
}

export const projectLoader = new ProjectConfigLoader();

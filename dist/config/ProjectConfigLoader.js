"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectLoader = exports.ProjectConfigLoader = exports.PROJECT_CONFIG_FILENAMES = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const yaml = __importStar(require("js-yaml"));
exports.PROJECT_CONFIG_FILENAMES = [
    ".crom-mcp.yml",
    ".crom-mcp.yaml",
    ".crom-mcp.json",
    "crom-mcp.yml",
    "crom-mcp.yaml",
    "crom-mcp.json",
];
class ProjectConfigLoader {
    cache = new Map();
    watchers = new Map();
    findProjectRoot(startPath) {
        let current = path.resolve(startPath);
        const root = path.parse(current).root;
        while (current !== root) {
            for (const filename of exports.PROJECT_CONFIG_FILENAMES) {
                const fullPath = path.join(current, filename);
                if (fs.existsSync(fullPath)) {
                    return current;
                }
            }
            current = path.dirname(current);
        }
        // Check root too
        for (const filename of exports.PROJECT_CONFIG_FILENAMES) {
            if (fs.existsSync(path.join(root, filename))) {
                return root;
            }
        }
        return null;
    }
    findConfigPath(projectRoot) {
        for (const filename of exports.PROJECT_CONFIG_FILENAMES) {
            const fullPath = path.join(projectRoot, filename);
            if (fs.existsSync(fullPath)) {
                return fullPath;
            }
        }
        return null;
    }
    load(projectRoot) {
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
    parseConfig(raw, configPath, projectRoot) {
        let parsed;
        const ext = path.extname(configPath).toLowerCase();
        try {
            if (ext === ".json") {
                parsed = JSON.parse(raw);
            }
            else {
                parsed = yaml.load(raw);
            }
        }
        catch (err) {
            throw new Error(`Falha ao analisar configuração ${configPath}: ${err.message}`);
        }
        const now = new Date().toISOString();
        const rules = (parsed.rules || []).map((r, idx) => ({
            id: r.id || `rule-${idx}`,
            type: r.type || "instruction",
            title: r.title || "Regra sem título",
            content: r.content || "",
            priority: r.priority ?? 0,
            enabled: r.enabled !== false,
            appliesTo: r.appliesTo || [],
        }));
        const mcps = (parsed.mcps || []).map((m, idx) => ({
            id: m.id || `mcp-${idx}`,
            name: m.name || `MCP ${idx}`,
            type: m.type || "stdio",
            command: m.command,
            args: m.args,
            url: m.url,
            env: m.env,
            enabled: m.enabled !== false,
            autoConnect: m.autoConnect !== false,
        }));
        return {
            name: parsed.name || path.basename(projectRoot),
            rootPath: projectRoot,
            description: parsed.description,
            rules,
            mcps,
            harnesses: (parsed.harnesses || []).map((h, idx) => ({
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
            scripts: (parsed.scripts || []).map((s, idx) => ({
                id: s.id || `script-${idx}`,
                name: s.name || `Script ${idx}`,
                path: s.path,
                interpreter: s.interpreter,
                args: s.args,
                env: s.env,
                timeoutMs: s.timeoutMs ?? 30000,
                enabled: s.enabled !== false,
            })),
            agents: (parsed.agents || []).map((a, idx) => ({
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
    getRulesText(config) {
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
    watch(projectRoot, onChange) {
        const configPath = this.findConfigPath(projectRoot);
        if (!configPath) {
            return () => { };
        }
        const watcher = fs.watch(configPath, (eventType) => {
            if (eventType === "change") {
                try {
                    const config = this.load(projectRoot);
                    onChange(config);
                }
                catch (err) {
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
    unwatch(projectRoot) {
        const watcher = this.watchers.get(projectRoot);
        if (watcher) {
            watcher.close();
            this.watchers.delete(projectRoot);
        }
    }
}
exports.ProjectConfigLoader = ProjectConfigLoader;
exports.projectLoader = new ProjectConfigLoader();
//# sourceMappingURL=ProjectConfigLoader.js.map
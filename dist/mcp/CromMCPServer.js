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
exports.buildServer = buildServer;
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const zod_1 = require("zod");
const ProjectManager_1 = require("../core/ProjectManager");
const MCPConnectionManager_1 = require("../mcp/MCPConnectionManager");
const HarnessRunner_1 = require("../harness/HarnessRunner");
function buildServer() {
    const server = new index_js_1.Server({
        name: "crom-mcp-sdk",
        version: "1.0.0",
    }, {
        capabilities: {
            tools: {},
            resources: {},
        },
    });
    // ====== Tools ======
    server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => ({
        tools: [
            {
                name: "crom_load_project",
                description: "Carrega um projeto crom-mcp a partir de uma pasta. Define regras, MCPs, harnesses e agentes.",
                inputSchema: {
                    type: "object",
                    properties: {
                        projectPath: {
                            type: "string",
                            description: "Caminho absoluto para a pasta do projeto contendo .crom-mcp.yml/json",
                        },
                    },
                    required: ["projectPath"],
                },
            },
            {
                name: "crom_get_rules",
                description: "Retorna as regras do projeto ativo, carregadas antes de usar qualquer MCP.",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "crom_list_projects",
                description: "Lista projetos crom-mcp encontrados em uma pasta (busca recursiva limitada).",
                inputSchema: {
                    type: "object",
                    properties: {
                        searchPath: {
                            type: "string",
                            description: "Caminho para iniciar a busca (padrão: diretório atual)",
                        },
                        maxDepth: {
                            type: "number",
                            description: "Profundidade máxima da busca",
                            default: 3,
                        },
                    },
                },
            },
            {
                name: "crom_connect_mcp",
                description: "Conecta a um MCP registrado no projeto ativo.",
                inputSchema: {
                    type: "object",
                    properties: {
                        mcpId: {
                            type: "string",
                            description: "ID do MCP a conectar",
                        },
                    },
                    required: ["mcpId"],
                },
            },
            {
                name: "crom_disconnect_mcp",
                description: "Desconecta um MCP.",
                inputSchema: {
                    type: "object",
                    properties: {
                        mcpId: {
                            type: "string",
                            description: "ID do MCP a desconectar",
                        },
                    },
                    required: ["mcpId"],
                },
            },
            {
                name: "crom_list_mcps",
                description: "Lista todos os MCPs registrados e seus status.",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "crom_call_mcp_tool",
                description: "Chama uma ferramenta em um MCP conectado.",
                inputSchema: {
                    type: "object",
                    properties: {
                        mcpId: {
                            type: "string",
                            description: "ID do MCP conectado",
                        },
                        toolName: {
                            type: "string",
                            description: "Nome da ferramenta",
                        },
                        arguments: {
                            type: "object",
                            description: "Argumentos da ferramenta",
                            default: {},
                        },
                    },
                    required: ["mcpId", "toolName"],
                },
            },
            {
                name: "crom_list_mcp_tools",
                description: "Lista as ferramentas disponíveis em um MCP conectado.",
                inputSchema: {
                    type: "object",
                    properties: {
                        mcpId: {
                            type: "string",
                            description: "ID do MCP conectado",
                        },
                    },
                    required: ["mcpId"],
                },
            },
            {
                name: "crom_run_harness",
                description: "Executa um harness configurado no projeto ativo.",
                inputSchema: {
                    type: "object",
                    properties: {
                        harnessId: {
                            type: "string",
                            description: "ID do harness",
                        },
                        cwd: {
                            type: "string",
                            description: "Diretório de trabalho (padrão: raiz do projeto)",
                        },
                    },
                    required: ["harnessId"],
                },
            },
            {
                name: "crom_run_harness_retries",
                description: "Executa um harness com retentativas conforme configurado.",
                inputSchema: {
                    type: "object",
                    properties: {
                        harnessId: {
                            type: "string",
                            description: "ID do harness",
                        },
                        cwd: {
                            type: "string",
                            description: "Diretório de trabalho",
                        },
                    },
                    required: ["harnessId"],
                },
            },
            {
                name: "crom_list_harnesses",
                description: "Lista harnesses do projeto ativo e suas execuções recentes.",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "crom_list_executions",
                description: "Lista execuções de harnesses.",
                inputSchema: {
                    type: "object",
                    properties: {
                        harnessId: {
                            type: "string",
                            description: "Filtrar por ID do harness",
                        },
                    },
                },
            },
            {
                name: "crom_cancel_execution",
                description: "Cancela uma execução de harness em andamento.",
                inputSchema: {
                    type: "object",
                    properties: {
                        executionId: {
                            type: "string",
                            description: "ID da execução",
                        },
                    },
                    required: ["executionId"],
                },
            },
            {
                name: "crom_create_project_config",
                description: "Cria um arquivo de configuração crom-mcp (ex: .crom-mcp.yml) em uma pasta.",
                inputSchema: {
                    type: "object",
                    properties: {
                        projectPath: {
                            type: "string",
                            description: "Caminho da pasta onde criar a configuração",
                        },
                        projectName: {
                            type: "string",
                            description: "Nome do projeto",
                        },
                    },
                    required: ["projectPath"],
                },
            },
        ],
    }));
    server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;
        switch (name) {
            case "crom_load_project": {
                const parsed = zod_1.z
                    .object({ projectPath: zod_1.z.string() })
                    .safeParse(args);
                if (!parsed.success) {
                    throw new Error("Argumentos inválidos para crom_load_project");
                }
                const result = ProjectManager_1.projectManager.setProject(parsed.data.projectPath);
                await ProjectManager_1.projectManager.autoConnectMCPs();
                return {
                    content: [
                        {
                            type: "text",
                            text: `Projeto carregado: ${result.project.name}\n\n${result.rules}\n\nMCPs auto-conectados: ${result.connectedMCPs.filter((m) => m.status === "connected").length}/${result.connectedMCPs.length}`,
                        },
                    ],
                };
            }
            case "crom_get_rules": {
                return {
                    content: [{ type: "text", text: ProjectManager_1.projectManager.getRulesText() }],
                };
            }
            case "crom_list_projects": {
                const parsed = zod_1.z
                    .object({
                    searchPath: zod_1.z.string().optional(),
                    maxDepth: zod_1.z.number().optional().default(3),
                })
                    .safeParse(args);
                if (!parsed.success) {
                    throw new Error("Argumentos inválidos para crom_list_projects");
                }
                const projects = findProjects(parsed.data.searchPath ?? process.cwd(), parsed.data.maxDepth);
                return {
                    content: [
                        {
                            type: "text",
                            text: projects.length === 0
                                ? "Nenhum projeto crom-mcp encontrado."
                                : `Projetos encontrados:\n${projects.map((p) => `- ${p.name}: ${p.rootPath}`).join("\n")}`,
                        },
                    ],
                };
            }
            case "crom_connect_mcp": {
                const parsed = zod_1.z.object({ mcpId: zod_1.z.string() }).safeParse(args);
                if (!parsed.success)
                    throw new Error("Argumentos inválidos");
                await ProjectManager_1.projectManager.connectMCP(parsed.data.mcpId);
                return {
                    content: [{ type: "text", text: `MCP ${parsed.data.mcpId} conectado.` }],
                };
            }
            case "crom_disconnect_mcp": {
                const parsed = zod_1.z.object({ mcpId: zod_1.z.string() }).safeParse(args);
                if (!parsed.success)
                    throw new Error("Argumentos inválidos");
                await ProjectManager_1.projectManager.disconnectMCP(parsed.data.mcpId);
                return {
                    content: [{ type: "text", text: `MCP ${parsed.data.mcpId} desconectado.` }],
                };
            }
            case "crom_list_mcps": {
                const mcps = ProjectManager_1.projectManager.getMCPStatus();
                return {
                    content: [
                        {
                            type: "text",
                            text: mcps.length === 0
                                ? "Nenhum MCP registrado."
                                : `MCPs:\n${mcps.map((m) => `- ${m.name} (${m.id}): ${m.status}${m.lastError ? ` — erro: ${m.lastError}` : ""}`).join("\n")}`,
                        },
                    ],
                };
            }
            case "crom_call_mcp_tool": {
                const parsed = zod_1.z
                    .object({
                    mcpId: zod_1.z.string(),
                    toolName: zod_1.z.string(),
                    arguments: zod_1.z.record(zod_1.z.any()).default({}),
                })
                    .safeParse(args);
                if (!parsed.success)
                    throw new Error("Argumentos inválidos");
                const result = await MCPConnectionManager_1.mcpManager.callTool(parsed.data.mcpId, parsed.data.toolName, parsed.data.arguments);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case "crom_list_mcp_tools": {
                const parsed = zod_1.z.object({ mcpId: zod_1.z.string() }).safeParse(args);
                if (!parsed.success)
                    throw new Error("Argumentos inválidos");
                const result = await MCPConnectionManager_1.mcpManager.listTools(parsed.data.mcpId);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(result.tools, null, 2),
                        },
                    ],
                };
            }
            case "crom_run_harness": {
                const parsed = zod_1.z
                    .object({ harnessId: zod_1.z.string(), cwd: zod_1.z.string().optional() })
                    .safeParse(args);
                if (!parsed.success)
                    throw new Error("Argumentos inválidos");
                const exec = ProjectManager_1.projectManager.runHarness(parsed.data.harnessId, parsed.data.cwd);
                return {
                    content: [
                        {
                            type: "text",
                            text: `Harness ${parsed.data.harnessId} executado (${exec.id}):\n${exec.output || ""}\n${exec.error ? "ERRO: " + exec.error : ""}\nCódigo: ${exec.exitCode}`,
                        },
                    ],
                };
            }
            case "crom_run_harness_retries": {
                const parsed = zod_1.z
                    .object({ harnessId: zod_1.z.string(), cwd: zod_1.z.string().optional() })
                    .safeParse(args);
                if (!parsed.success)
                    throw new Error("Argumentos inválidos");
                const exec = await ProjectManager_1.projectManager.runHarnessWithRetries(parsed.data.harnessId, parsed.data.cwd);
                return {
                    content: [
                        {
                            type: "text",
                            text: `Harness ${parsed.data.harnessId} concluído (${exec.id}):\n${exec.output || ""}\n${exec.error ? "ERRO: " + exec.error : ""}\nCódigo: ${exec.exitCode}\nStatus: ${exec.status}`,
                        },
                    ],
                };
            }
            case "crom_list_harnesses": {
                const project = ProjectManager_1.projectManager.getActiveProject();
                if (!project) {
                    return { content: [{ type: "text", text: "Nenhum projeto ativo." }] };
                }
                return {
                    content: [
                        {
                            type: "text",
                            text: `Harnesses do projeto ${project.name}:\n${project.harnesses.map((h) => `- ${h.name} (${h.id}): ${h.type} — ${h.enabled ? "ativo" : "desabilitado"}`).join("\n")}`,
                        },
                    ],
                };
            }
            case "crom_list_executions": {
                const parsed = zod_1.z.object({ harnessId: zod_1.z.string().optional() }).safeParse(args);
                if (!parsed.success)
                    throw new Error("Argumentos inválidos");
                const executions = parsed.data.harnessId
                    ? ProjectManager_1.projectManager.getHarnessStatus(parsed.data.harnessId)
                    : HarnessRunner_1.harnessRunner.getAllExecutions();
                return {
                    content: [
                        {
                            type: "text",
                            text: executions.length === 0
                                ? "Nenhuma execução encontrada."
                                : `Execuções:\n${executions.map((e) => `- ${e.id} [${e.harnessId}]: ${e.status} (${new Date(e.startedAt ?? 0).toLocaleString()})${e.error ? ` — ${e.error}` : ""}`).join("\n")}`,
                        },
                    ],
                };
            }
            case "crom_cancel_execution": {
                const parsed = zod_1.z.object({ executionId: zod_1.z.string() }).safeParse(args);
                if (!parsed.success)
                    throw new Error("Argumentos inválidos");
                const ok = HarnessRunner_1.harnessRunner.cancel(parsed.data.executionId);
                return {
                    content: [{ type: "text", text: ok ? "Execução cancelada." : "Execução não encontrada ou não está em andamento." }],
                };
            }
            case "crom_create_project_config": {
                const parsed = zod_1.z
                    .object({ projectPath: zod_1.z.string(), projectName: zod_1.z.string().optional() })
                    .safeParse(args);
                if (!parsed.success)
                    throw new Error("Argumentos inválidos");
                const name = parsed.data.projectName || "meu-projeto";
                const configPath = createDefaultConfig(parsed.data.projectPath, name);
                return {
                    content: [
                        {
                            type: "text",
                            text: `Configuração criada em ${configPath}\nEdite o arquivo para adicionar MCPs, harnesses, scripts, agentes e regras.`,
                        },
                    ],
                };
            }
            default:
                throw new Error(`Ferramenta desconhecida: ${name}`);
        }
    });
    // ====== Resources ======
    server.setRequestHandler(types_js_1.ListResourcesRequestSchema, async () => ({
        resources: [
            {
                uri: "crom://project/rules",
                name: "Regras do Projeto Ativo",
                mimeType: "text/plain",
                description: "Regras carregadas antes de usar o MCP",
            },
            {
                uri: "crom://project/status",
                name: "Status do Projeto",
                mimeType: "application/json",
                description: "Status dos MCPs, harnesses e execuções",
            },
        ],
    }));
    server.setRequestHandler(types_js_1.ReadResourceRequestSchema, async (request) => {
        const uri = request.params.uri;
        if (uri === "crom://project/rules") {
            return {
                contents: [
                    {
                        uri,
                        mimeType: "text/plain",
                        text: ProjectManager_1.projectManager.getRulesText(),
                    },
                ],
            };
        }
        if (uri === "crom://project/status") {
            const project = ProjectManager_1.projectManager.getActiveProject();
            return {
                contents: [
                    {
                        uri,
                        mimeType: "application/json",
                        text: JSON.stringify({
                            project: project ? { name: project.name, rootPath: project.rootPath } : null,
                            mcps: MCPConnectionManager_1.mcpManager.getAllStatus(),
                            executions: HarnessRunner_1.harnessRunner.getAllExecutions().slice(0, 20),
                        }, null, 2),
                    },
                ],
            };
        }
        throw new Error(`Recurso não encontrado: ${uri}`);
    });
    return server;
}
function findProjects(searchPath, maxDepth) {
    const results = [];
    const visited = new Set();
    function walk(dir, depth) {
        if (depth > maxDepth || visited.has(dir))
            return;
        visited.add(dir);
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            const hasConfig = entries.some((e) => e.isFile() &&
                [".crom-mcp.yml", ".crom-mcp.yaml", ".crom-mcp.json", "crom-mcp.yml", "crom-mcp.yaml", "crom-mcp.json"].includes(e.name));
            if (hasConfig) {
                results.push({ name: path.basename(dir) || dir, rootPath: dir });
            }
            for (const entry of entries) {
                if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
                    walk(path.join(dir, entry.name), depth + 1);
                }
            }
        }
        catch {
            // ignore permission errors
        }
    }
    walk(searchPath, 0);
    return results;
}
function createDefaultConfig(projectPath, projectName) {
    const fs = require("fs");
    const configPath = path.join(projectPath, ".crom-mcp.yml");
    const content = `# Configuração crom-mcp para ${projectName}
name: ${projectName}
description: Projeto gerado pelo crom-mcp-sdk
rootPath: ./

# Regras que são relembradas antes de usar qualquer MCP deste projeto
rules:
  - id: rule-1
    type: instruction
    title: Contexto do projeto
    content: Sempre verifique as regras do projeto antes de executar ações.
    priority: 10
    enabled: true

# MCPs que este projeto pode conectar
mcps:
  - id: mcp-local
    name: MCP Local
    type: stdio
    command: npx
    args: ["@modelcontextprotocol/some-server"]
    enabled: true
    autoConnect: false

# Harnesses que podem ser executados
harnesses:
  - id: harness-build
    name: Build do Projeto
    type: command
    command: npm
    args: ["run", "build"]
    timeoutMs: 120000
    retryCount: 1
    enabled: true

# Scripts disponíveis
scripts:
  - id: script-dev
    name: Script de Dev
    path: ./scripts/dev.js
    interpreter: node
    enabled: true

# Agentes vinculados
agents:
  - id: agent-coder
    name: Agent Coder
    type: local
    systemPrompt: Você é um assistente de código.
    enabled: true
`;
    fs.writeFileSync(configPath, content, "utf-8");
    return configPath;
}
//# sourceMappingURL=CromMCPServer.js.map
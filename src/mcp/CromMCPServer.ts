import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs";
import * as path from "path";
import { z } from "zod";
import { projectManager } from "../core/ProjectManager";
import { mcpManager } from "../mcp/MCPConnectionManager";
import { harnessRunner } from "../harness/HarnessRunner";
import type { ProjectConfig } from "../types";

function buildServer(): Server {
  const server = new Server(
    {
      name: "crom-mcp-sdk",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    }
  );

  // ====== Tools ======

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
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

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "crom_load_project": {
        const parsed = z
          .object({ projectPath: z.string() })
          .safeParse(args);
        if (!parsed.success) {
          throw new Error("Argumentos inválidos para crom_load_project");
        }
        const result = projectManager.setProject(parsed.data.projectPath);
        await projectManager.autoConnectMCPs();
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
          content: [{ type: "text", text: projectManager.getRulesText() }],
        };
      }

      case "crom_list_projects": {
        const parsed = z
          .object({
            searchPath: z.string().optional(),
            maxDepth: z.number().optional().default(3),
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
        const parsed = z.object({ mcpId: z.string() }).safeParse(args);
        if (!parsed.success) throw new Error("Argumentos inválidos");
        await projectManager.connectMCP(parsed.data.mcpId);
        return {
          content: [{ type: "text", text: `MCP ${parsed.data.mcpId} conectado.` }],
        };
      }

      case "crom_disconnect_mcp": {
        const parsed = z.object({ mcpId: z.string() }).safeParse(args);
        if (!parsed.success) throw new Error("Argumentos inválidos");
        await projectManager.disconnectMCP(parsed.data.mcpId);
        return {
          content: [{ type: "text", text: `MCP ${parsed.data.mcpId} desconectado.` }],
        };
      }

      case "crom_list_mcps": {
        const mcps = projectManager.getMCPStatus();
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
        const parsed = z
          .object({
            mcpId: z.string(),
            toolName: z.string(),
            arguments: z.record(z.any()).default({}),
          })
          .safeParse(args);
        if (!parsed.success) throw new Error("Argumentos inválidos");
        const result = await mcpManager.callTool(
          parsed.data.mcpId,
          parsed.data.toolName,
          parsed.data.arguments
        );
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
        const parsed = z.object({ mcpId: z.string() }).safeParse(args);
        if (!parsed.success) throw new Error("Argumentos inválidos");
        const result = await mcpManager.listTools(parsed.data.mcpId);
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
        const parsed = z
          .object({ harnessId: z.string(), cwd: z.string().optional() })
          .safeParse(args);
        if (!parsed.success) throw new Error("Argumentos inválidos");
        const exec = projectManager.runHarness(parsed.data.harnessId, parsed.data.cwd);
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
        const parsed = z
          .object({ harnessId: z.string(), cwd: z.string().optional() })
          .safeParse(args);
        if (!parsed.success) throw new Error("Argumentos inválidos");
        const exec = await projectManager.runHarnessWithRetries(
          parsed.data.harnessId,
          parsed.data.cwd
        );
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
        const project = projectManager.getActiveProject();
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
        const parsed = z.object({ harnessId: z.string().optional() }).safeParse(args);
        if (!parsed.success) throw new Error("Argumentos inválidos");
        const executions = parsed.data.harnessId
          ? projectManager.getHarnessStatus(parsed.data.harnessId)
          : harnessRunner.getAllExecutions();
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
        const parsed = z.object({ executionId: z.string() }).safeParse(args);
        if (!parsed.success) throw new Error("Argumentos inválidos");
        const ok = harnessRunner.cancel(parsed.data.executionId);
        return {
          content: [{ type: "text", text: ok ? "Execução cancelada." : "Execução não encontrada ou não está em andamento." }],
        };
      }

      case "crom_create_project_config": {
        const parsed = z
          .object({ projectPath: z.string(), projectName: z.string().optional() })
          .safeParse(args);
        if (!parsed.success) throw new Error("Argumentos inválidos");
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

  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
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

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    if (uri === "crom://project/rules") {
      return {
        contents: [
          {
            uri,
            mimeType: "text/plain",
            text: projectManager.getRulesText(),
          },
        ],
      };
    }
    if (uri === "crom://project/status") {
      const project = projectManager.getActiveProject();
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(
              {
                project: project ? { name: project.name, rootPath: project.rootPath } : null,
                mcps: mcpManager.getAllStatus(),
                executions: harnessRunner.getAllExecutions().slice(0, 20),
              },
              null,
              2
            ),
          },
        ],
      };
    }
    throw new Error(`Recurso não encontrado: ${uri}`);
  });

  return server;
}

function findProjects(searchPath: string, maxDepth: number): Array<{ name: string; rootPath: string }> {
  const results: Array<{ name: string; rootPath: string }> = [];
  const visited = new Set<string>();

  function walk(dir: string, depth: number) {
    if (depth > maxDepth || visited.has(dir)) return;
    visited.add(dir);

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      const hasConfig = entries.some((e) =>
        e.isFile() &&
        [".crom-mcp.yml", ".crom-mcp.yaml", ".crom-mcp.json", "crom-mcp.yml", "crom-mcp.yaml", "crom-mcp.json"].includes(e.name)
      );

      if (hasConfig) {
        results.push({ name: path.basename(dir) || dir, rootPath: dir });
      }

      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
          walk(path.join(dir, entry.name), depth + 1);
        }
      }
    } catch {
      // ignore permission errors
    }
  }

  walk(searchPath, 0);
  return results;
}

function createDefaultConfig(projectPath: string, projectName: string): string {
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

export { buildServer };

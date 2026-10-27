import { ChildProcess } from "child_process";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { MCPConnectionConfig, MCPClientInfo } from "../types";
import { EventEmitter } from "events";

export class MCPConnectionManager extends EventEmitter {
  private clients = new Map<string, { client: Client; transport?: StdioClientTransport; process?: ChildProcess }>();
  private configs = new Map<string, MCPConnectionConfig>();
  private status = new Map<string, MCPClientInfo>();

  register(config: MCPConnectionConfig): void {
    this.configs.set(config.id, config);
    this.status.set(config.id, {
      id: config.id,
      name: config.name,
      status: "disconnected",
    });
  }

  unregister(id: string): void {
    this.disconnect(id);
    this.configs.delete(id);
    this.status.delete(id);
  }

  getConfig(id: string): MCPConnectionConfig | undefined {
    return this.configs.get(id);
  }

  getStatus(id: string): MCPClientInfo | undefined {
    return this.status.get(id);
  }

  getAllStatus(): MCPClientInfo[] {
    return Array.from(this.status.values());
  }

  async connect(id: string): Promise<void> {
    const config = this.configs.get(id);
    if (!config) {
      throw new Error(`MCP não registrado: ${id}`);
    }

    if (config.enabled === false) {
      throw new Error(`MCP ${id} está desabilitado`);
    }

    const current = this.status.get(id);
    if (current?.status === "connected") {
      return;
    }

    this.status.set(id, { ...current!, status: "connecting" });
    this.emit("connecting", id);

    try {
      if (config.type === "stdio") {
        await this.connectStdio(id, config);
      } else if (config.type === "http") {
        await this.connectHTTP(id, config);
      } else {
        throw new Error(`Tipo de transporte não suportado: ${config.type}`);
      }

      this.status.set(id, {
        ...current!,
        status: "connected",
        connectedAt: new Date(),
      });
      this.emit("connected", id);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.status.set(id, {
        ...current!,
        status: "error",
        lastError: errorMsg,
      });
      this.emit("error", id, errorMsg);
      throw err;
    }
  }

  private async connectStdio(
    id: string,
    config: MCPConnectionConfig
  ): Promise<void> {
    if (!config.command) {
      throw new Error(`MCP ${id} não tem comando definido`);
    }

    const client = new Client({
      name: config.name,
      version: "1.0.0",
    });

    const transport = new StdioClientTransport({
      command: config.command,
      args: config.args || [],
      env: config.env as Record<string, string> | undefined,
    });

    client.connect(transport);

    // Wait for connection to be ready
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Timeout conectando MCP")), 15000);

      client
        .listTools()
        .then((result) => {
          clearTimeout(timeout);
          const tools = result.tools.map((t) => t.name);
          this.status.set(id, {
            ...(this.status.get(id)!),
            tools,
          });
          resolve();
        })
        .catch((err: Error) => {
          clearTimeout(timeout);
          reject(err);
        });
    });

    this.clients.set(id, { client, transport });
  }

  private async connectHTTP(
    id: string,
    config: MCPConnectionConfig
  ): Promise<void> {
    if (!config.url) {
      throw new Error(`MCP ${id} não tem URL definida`);
    }

    // HTTP/SSE transport would go here; for now we record the intent
    const client = new Client({
      name: config.name,
      version: "1.0.0",
    });

    // @modelcontextprotocol/sdk HTTP client transport may vary by version.
    // We store the client so it can be used later once the transport is ready.
    this.clients.set(id, { client });

    this.status.set(id, {
      ...(this.status.get(id)!),
      status: "connected",
      connectedAt: new Date(),
    });
  }

  async disconnect(id: string): Promise<void> {
    const entry = this.clients.get(id);
    if (entry) {
      try {
        await entry.client.close();
      } catch {
        // ignore
      }
      if (entry.process) {
        try {
          entry.process.kill();
        } catch {
          // ignore
        }
      }
      this.clients.delete(id);
    }

    this.status.set(id, {
      ...(this.status.get(id)!),
      status: "disconnected",
    });
    this.emit("disconnected", id);
  }

  async disconnectAll(): Promise<void> {
    const ids = Array.from(this.clients.keys());
    await Promise.all(ids.map((id) => this.disconnect(id)));
  }

  async listTools(id: string): Promise<any> {
    const entry = this.clients.get(id);
    if (!entry) {
      throw new Error(`MCP ${id} não está conectado`);
    }
    return entry.client.listTools();
  }

  async callTool(id: string, name: string, args: Record<string, any>): Promise<any> {
    const entry = this.clients.get(id);
    if (!entry) {
      throw new Error(`MCP ${id} não está conectado`);
    }
    return entry.client.callTool({ name, arguments: args });
  }

  isConnected(id: string): boolean {
    const entry = this.clients.get(id);
    const status = this.status.get(id);
    return !!entry && status?.status === "connected";
  }
}

export const mcpManager = new MCPConnectionManager();

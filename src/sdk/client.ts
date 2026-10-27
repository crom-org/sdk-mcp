import { ChildProcess, spawn } from "child_process";
import * as readline from "readline";
import type {
  JSONRPCRequest,
  JSONRPCResponse,
  MCPTool,
  ToolCallResult,
} from "./types";
import { MCP_METHODS, jsonRpcRequest } from "./protocol";

export type MCPClientOptions = {
  name: string;
  version: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
};

export class MCPClient {
  private process: ChildProcess;
  private rl?: readline.Interface;
  private pending = new Map<string, { resolve: (v: any) => void; reject: (e: Error) => void }>();
  private idCounter = 0;
  private connected = false;
  private tools: MCPTool[] = [];

  constructor(options: MCPClientOptions) {
    this.process = spawn(options.command, options.args || [], {
      env: { ...process.env, ...options.env },
      stdio: ["pipe", "pipe", "pipe"],
    });

    this.rl = readline.createInterface({ input: this.process.stdout!, terminal: false });
    this.rl.on("line", (line: string) => {
      try {
        const msg = JSON.parse(line) as JSONRPCResponse & { method?: string; params?: any };

        if (msg.method) {
          // Notification from server
          return;
        }

        const id = msg.id?.toString();
        if (id && this.pending.has(id)) {
          const { resolve, reject } = this.pending.get(id)!;
          this.pending.delete(id);
          if (msg.error) {
            reject(new Error(msg.error.message || "MCP error"));
          } else {
            resolve(msg.result);
          }
        }
      } catch {
        // ignore malformed lines
      }
    });

    this.process.stderr!.on("data", () => {
      // ignore stderr
    });

    this.process.on("exit", () => {
      this.connected = false;
      for (const { reject } of this.pending.values()) {
        reject(new Error("MCP process exited"));
      }
      this.pending.clear();
    });
  }

  private nextId(): string {
    return (++this.idCounter).toString();
  }

  private sendRequest(request: JSONRPCRequest): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = this.nextId();
      this.pending.set(id, { resolve, reject });
      const line = JSON.stringify({ ...request, id });
      this.process.stdin!.write(line + "\n");
    });
  }

  async initialize(): Promise<{ capabilities: any; serverInfo: any }> {
    const result = await this.sendRequest({
      jsonrpc: "2.0",
      method: MCP_METHODS.INITIALIZE,
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "sdk-mcp-client", version: "1.0.0" },
      },
    });

    // Send initialized notification
    this.process.stdin!.write(
      JSON.stringify({ jsonrpc: "2.0", method: MCP_METHODS.INITIALIZED }) + "\n"
    );

    this.connected = true;
    this.tools = result.capabilities?.tools ? [] : [];
    return { capabilities: result.capabilities, serverInfo: result.serverInfo };
  }

  async listTools(): Promise<MCPTool[]> {
    const result = await this.sendRequest({
      jsonrpc: "2.0",
      method: MCP_METHODS.TOOLS_LIST,
    });
    this.tools = result.tools || [];
    return this.tools;
  }

  async callTool(name: string, arguments_: Record<string, any>): Promise<ToolCallResult> {
    return this.sendRequest({
      jsonrpc: "2.0",
      method: MCP_METHODS.TOOLS_CALL,
      params: { name, arguments: arguments_ },
    });
  }

  async close(): Promise<void> {
    try {
      this.process.stdin!.end();
    } catch {
      // ignore
    }
    try {
      this.process.kill();
    } catch {
      // ignore
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}

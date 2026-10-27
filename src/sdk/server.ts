import type {
  JSONRPCRequest,
  JSONRPCResponse,
  JSONRPCNotification,
  MCPTool,
  MCPResource,
  MCPPrompt,
  MCPServerCapabilities,
  MCPServerInfo,
  ToolCallRequest,
  ToolCallResult,
  InitializeResult,
  ListToolsResult,
  ListResourcesResult,
  ReadResourceResult,
  ListPromptsResult,
  GetPromptResult,
  LoggingMessage,
} from "./types";
import { MCP_METHODS, PROTOCOL_VERSION, jsonRpcResult, jsonRpcError, jsonRpcNotification, ERROR_CODES } from "./protocol";

export type ToolHandler = (args: Record<string, any>) => Promise<ToolCallResult> | ToolCallResult;
export type ResourceHandler = (uri: string) => Promise<ReadResourceResult> | ReadResourceResult;
export type PromptHandler = (args?: Record<string, any>) => Promise<GetPromptResult> | GetPromptResult;

export type MCPServerOptions = {
  name: string;
  version: string;
  title?: string;
  instructions?: string;
  capabilities?: MCPServerCapabilities;
};

export class MCPServer {
  private options: MCPServerOptions;
  private tools = new Map<string, { handler: ToolHandler; schema: MCPTool }>();
  private resources = new Map<string, { handler: ResourceHandler; schema: MCPResource }>();
  private prompts = new Map<string, { handler: PromptHandler; schema: MCPPrompt }>();
  private initialized = false;

  constructor(options: MCPServerOptions) {
    this.options = {
      name: options.name,
      version: options.version,
      title: options.title,
      instructions: options.instructions,
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
        ...options.capabilities,
      },
    };
  }

  getInfo(): MCPServerInfo {
    return {
      name: this.options.name,
      version: this.options.version,
      ...(this.options.title ? { title: this.options.title } : {}),
      ...(this.options.instructions ? { instructions: this.options.instructions } : {}),
    };
  }

  getCapabilities(): MCPServerCapabilities {
    return this.options.capabilities!;
  }

  registerTool(name: string, schema: MCPTool, handler: ToolHandler): void {
    this.tools.set(name, { handler, schema });
    this.options.capabilities!.tools = { listChanged: true };
  }

  registerResource(uri: string, schema: MCPResource, handler: ResourceHandler): void {
    this.resources.set(uri, { handler, schema });
    this.options.capabilities!.resources = { subscribe: true, listChanged: true };
  }

  registerPrompt(name: string, schema: MCPPrompt, handler: PromptHandler): void {
    this.prompts.set(name, { handler, schema });
    this.options.capabilities!.prompts = { listChanged: true };
  }

  private handleRequest(request: JSONRPCRequest): JSONRPCResponse | JSONRPCNotification {
    const { id, method, params } = request;

    try {
      switch (method) {
        case MCP_METHODS.INITIALIZE: {
          const result: InitializeResult = {
            protocolVersion: PROTOCOL_VERSION,
            capabilities: this.getCapabilities(),
            serverInfo: this.getInfo(),
            ...(this.options.instructions ? { instructions: this.options.instructions } : {}),
          };
          this.initialized = true;
          return jsonRpcResult(id, result);
        }

        case MCP_METHODS.INITIALIZED: {
          this.initialized = true;
          return { jsonrpc: "2.0", method: "ack" } as any;
        }

        case MCP_METHODS.PING: {
          return jsonRpcResult(id, {});
        }

        case MCP_METHODS.TOOLS_LIST: {
          const result: ListToolsResult = {
            tools: Array.from(this.tools.values()).map((t) => t.schema),
          };
          return jsonRpcResult(id, result);
        }

        case MCP_METHODS.TOOLS_CALL: {
          const toolCall = params as ToolCallRequest;
          const entry = this.tools.get(toolCall.name);
          if (!entry) {
            return jsonRpcError(id, ERROR_CODES.TOOL_NOT_FOUND, `Tool not found: ${toolCall.name}`);
          }
          const result = entry.handler(toolCall.arguments ?? {});
          return jsonRpcResult(id, result);
        }

        case MCP_METHODS.RESOURCES_LIST: {
          const result: ListResourcesResult = {
            resources: Array.from(this.resources.values()).map((r) => r.schema),
          };
          return jsonRpcResult(id, result);
        }

        case MCP_METHODS.RESOURCES_READ: {
          const uri = (params as any)?.uri as string;
          const entry = this.resources.get(uri);
          if (!entry) {
            return jsonRpcError(id, ERROR_CODES.RESOURCE_NOT_FOUND, `Resource not found: ${uri}`);
          }
          const result = entry.handler(uri);
          return jsonRpcResult(id, result);
        }

        case MCP_METHODS.PROMPTS_LIST: {
          const result: ListPromptsResult = {
            prompts: Array.from(this.prompts.values()).map((p) => p.schema),
          };
          return jsonRpcResult(id, result);
        }

        case MCP_METHODS.PROMPTS_GET: {
          const name = (params as any)?.name as string;
          const entry = this.prompts.get(name);
          if (!entry) {
            return jsonRpcError(id, ERROR_CODES.PROMPT_NOT_FOUND, `Prompt not found: ${name}`);
          }
          const result = entry.handler(params?.arguments);
          return jsonRpcResult(id, result);
        }

        default: {
          return jsonRpcError(id, ERROR_CODES.METHOD_NOT_FOUND, `Method not found: ${method}`);
        }
      }
    } catch (err: any) {
      return jsonRpcError(id, ERROR_CODES.INTERNAL_ERROR, err?.message || String(err));
    }
  }

  async processLine(line: string): Promise<string | null> {
    if (!line.trim()) {
      return null;
    }

    let request: JSONRPCRequest;
    try {
      request = JSON.parse(line) as JSONRPCRequest;
    } catch {
      return JSON.stringify(jsonRpcError("0", ERROR_CODES.PARSE_ERROR, "Parse error"));
    }

    const response = this.handleRequest(request);

    if ("method" in response && response.method === "ack") {
      return null;
    }

    return JSON.stringify(response as JSONRPCResponse);
  }

  sendNotification(notification: JSONRPCNotification): string {
    return JSON.stringify(notification);
  }

  sendLog(level: LoggingMessage["level"], message: string, data?: any): string {
    const notif: LoggingMessage = { level, message, ...(data ? { data } : {}) };
    return this.sendNotification(jsonRpcNotification(MCP_METHODS.LOGGING_MESSAGE, notif));
  }

  sendProgress(token: string | number, progress: number, total?: number, message?: string): string {
    return this.sendNotification(
      jsonRpcNotification(MCP_METHODS.PROGRESS, { progressToken: token, progress, ...(total ? { total } : {}), ...(message ? { message } : {}) })
    );
  }
}

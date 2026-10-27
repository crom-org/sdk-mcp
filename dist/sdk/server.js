"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPServer = void 0;
const protocol_1 = require("./protocol");
class MCPServer {
    options;
    tools = new Map();
    resources = new Map();
    prompts = new Map();
    initialized = false;
    constructor(options) {
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
    getInfo() {
        return {
            name: this.options.name,
            version: this.options.version,
            ...(this.options.title ? { title: this.options.title } : {}),
            ...(this.options.instructions ? { instructions: this.options.instructions } : {}),
        };
    }
    getCapabilities() {
        return this.options.capabilities;
    }
    registerTool(name, schema, handler) {
        this.tools.set(name, { handler, schema });
        this.options.capabilities.tools = { listChanged: true };
    }
    registerResource(uri, schema, handler) {
        this.resources.set(uri, { handler, schema });
        this.options.capabilities.resources = { subscribe: true, listChanged: true };
    }
    registerPrompt(name, schema, handler) {
        this.prompts.set(name, { handler, schema });
        this.options.capabilities.prompts = { listChanged: true };
    }
    handleRequest(request) {
        const { id, method, params } = request;
        try {
            switch (method) {
                case protocol_1.MCP_METHODS.INITIALIZE: {
                    const result = {
                        protocolVersion: protocol_1.PROTOCOL_VERSION,
                        capabilities: this.getCapabilities(),
                        serverInfo: this.getInfo(),
                        ...(this.options.instructions ? { instructions: this.options.instructions } : {}),
                    };
                    this.initialized = true;
                    return (0, protocol_1.jsonRpcResult)(id, result);
                }
                case protocol_1.MCP_METHODS.INITIALIZED: {
                    this.initialized = true;
                    return { jsonrpc: "2.0", method: "ack" };
                }
                case protocol_1.MCP_METHODS.PING: {
                    return (0, protocol_1.jsonRpcResult)(id, {});
                }
                case protocol_1.MCP_METHODS.TOOLS_LIST: {
                    const result = {
                        tools: Array.from(this.tools.values()).map((t) => t.schema),
                    };
                    return (0, protocol_1.jsonRpcResult)(id, result);
                }
                case protocol_1.MCP_METHODS.TOOLS_CALL: {
                    const toolCall = params;
                    const entry = this.tools.get(toolCall.name);
                    if (!entry) {
                        return (0, protocol_1.jsonRpcError)(id, protocol_1.ERROR_CODES.TOOL_NOT_FOUND, `Tool not found: ${toolCall.name}`);
                    }
                    const result = entry.handler(toolCall.arguments ?? {});
                    return (0, protocol_1.jsonRpcResult)(id, result);
                }
                case protocol_1.MCP_METHODS.RESOURCES_LIST: {
                    const result = {
                        resources: Array.from(this.resources.values()).map((r) => r.schema),
                    };
                    return (0, protocol_1.jsonRpcResult)(id, result);
                }
                case protocol_1.MCP_METHODS.RESOURCES_READ: {
                    const uri = params?.uri;
                    const entry = this.resources.get(uri);
                    if (!entry) {
                        return (0, protocol_1.jsonRpcError)(id, protocol_1.ERROR_CODES.RESOURCE_NOT_FOUND, `Resource not found: ${uri}`);
                    }
                    const result = entry.handler(uri);
                    return (0, protocol_1.jsonRpcResult)(id, result);
                }
                case protocol_1.MCP_METHODS.PROMPTS_LIST: {
                    const result = {
                        prompts: Array.from(this.prompts.values()).map((p) => p.schema),
                    };
                    return (0, protocol_1.jsonRpcResult)(id, result);
                }
                case protocol_1.MCP_METHODS.PROMPTS_GET: {
                    const name = params?.name;
                    const entry = this.prompts.get(name);
                    if (!entry) {
                        return (0, protocol_1.jsonRpcError)(id, protocol_1.ERROR_CODES.PROMPT_NOT_FOUND, `Prompt not found: ${name}`);
                    }
                    const result = entry.handler(params?.arguments);
                    return (0, protocol_1.jsonRpcResult)(id, result);
                }
                default: {
                    return (0, protocol_1.jsonRpcError)(id, protocol_1.ERROR_CODES.METHOD_NOT_FOUND, `Method not found: ${method}`);
                }
            }
        }
        catch (err) {
            return (0, protocol_1.jsonRpcError)(id, protocol_1.ERROR_CODES.INTERNAL_ERROR, err?.message || String(err));
        }
    }
    async processLine(line) {
        if (!line.trim()) {
            return null;
        }
        let request;
        try {
            request = JSON.parse(line);
        }
        catch {
            return JSON.stringify((0, protocol_1.jsonRpcError)("0", protocol_1.ERROR_CODES.PARSE_ERROR, "Parse error"));
        }
        const response = this.handleRequest(request);
        if ("method" in response && response.method === "ack") {
            return null;
        }
        return JSON.stringify(response);
    }
    sendNotification(notification) {
        return JSON.stringify(notification);
    }
    sendLog(level, message, data) {
        const notif = { level, message, ...(data ? { data } : {}) };
        return this.sendNotification((0, protocol_1.jsonRpcNotification)(protocol_1.MCP_METHODS.LOGGING_MESSAGE, notif));
    }
    sendProgress(token, progress, total, message) {
        return this.sendNotification((0, protocol_1.jsonRpcNotification)(protocol_1.MCP_METHODS.PROGRESS, { progressToken: token, progress, ...(total ? { total } : {}), ...(message ? { message } : {}) }));
    }
}
exports.MCPServer = MCPServer;
//# sourceMappingURL=server.js.map
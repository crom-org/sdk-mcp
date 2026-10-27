"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mcpManager = exports.MCPConnectionManager = void 0;
const index_js_1 = require("@modelcontextprotocol/sdk/client/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/client/stdio.js");
const events_1 = require("events");
class MCPConnectionManager extends events_1.EventEmitter {
    clients = new Map();
    configs = new Map();
    status = new Map();
    register(config) {
        this.configs.set(config.id, config);
        this.status.set(config.id, {
            id: config.id,
            name: config.name,
            status: "disconnected",
        });
    }
    unregister(id) {
        this.disconnect(id);
        this.configs.delete(id);
        this.status.delete(id);
    }
    getConfig(id) {
        return this.configs.get(id);
    }
    getStatus(id) {
        return this.status.get(id);
    }
    getAllStatus() {
        return Array.from(this.status.values());
    }
    async connect(id) {
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
        this.status.set(id, { ...current, status: "connecting" });
        this.emit("connecting", id);
        try {
            if (config.type === "stdio") {
                await this.connectStdio(id, config);
            }
            else if (config.type === "http") {
                await this.connectHTTP(id, config);
            }
            else {
                throw new Error(`Tipo de transporte não suportado: ${config.type}`);
            }
            this.status.set(id, {
                ...current,
                status: "connected",
                connectedAt: new Date(),
            });
            this.emit("connected", id);
        }
        catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            this.status.set(id, {
                ...current,
                status: "error",
                lastError: errorMsg,
            });
            this.emit("error", id, errorMsg);
            throw err;
        }
    }
    async connectStdio(id, config) {
        if (!config.command) {
            throw new Error(`MCP ${id} não tem comando definido`);
        }
        const client = new index_js_1.Client({
            name: config.name,
            version: "1.0.0",
        });
        const transport = new stdio_js_1.StdioClientTransport({
            command: config.command,
            args: config.args || [],
            env: config.env,
        });
        client.connect(transport);
        // Wait for connection to be ready
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error("Timeout conectando MCP")), 15000);
            client
                .listTools()
                .then((result) => {
                clearTimeout(timeout);
                const tools = result.tools.map((t) => t.name);
                this.status.set(id, {
                    ...(this.status.get(id)),
                    tools,
                });
                resolve();
            })
                .catch((err) => {
                clearTimeout(timeout);
                reject(err);
            });
        });
        this.clients.set(id, { client, transport });
    }
    async connectHTTP(id, config) {
        if (!config.url) {
            throw new Error(`MCP ${id} não tem URL definida`);
        }
        // HTTP/SSE transport would go here; for now we record the intent
        const client = new index_js_1.Client({
            name: config.name,
            version: "1.0.0",
        });
        // @modelcontextprotocol/sdk HTTP client transport may vary by version.
        // We store the client so it can be used later once the transport is ready.
        this.clients.set(id, { client });
        this.status.set(id, {
            ...(this.status.get(id)),
            status: "connected",
            connectedAt: new Date(),
        });
    }
    async disconnect(id) {
        const entry = this.clients.get(id);
        if (entry) {
            try {
                await entry.client.close();
            }
            catch {
                // ignore
            }
            if (entry.process) {
                try {
                    entry.process.kill();
                }
                catch {
                    // ignore
                }
            }
            this.clients.delete(id);
        }
        this.status.set(id, {
            ...(this.status.get(id)),
            status: "disconnected",
        });
        this.emit("disconnected", id);
    }
    async disconnectAll() {
        const ids = Array.from(this.clients.keys());
        await Promise.all(ids.map((id) => this.disconnect(id)));
    }
    async listTools(id) {
        const entry = this.clients.get(id);
        if (!entry) {
            throw new Error(`MCP ${id} não está conectado`);
        }
        return entry.client.listTools();
    }
    async callTool(id, name, args) {
        const entry = this.clients.get(id);
        if (!entry) {
            throw new Error(`MCP ${id} não está conectado`);
        }
        return entry.client.callTool({ name, arguments: args });
    }
    isConnected(id) {
        const entry = this.clients.get(id);
        const status = this.status.get(id);
        return !!entry && status?.status === "connected";
    }
}
exports.MCPConnectionManager = MCPConnectionManager;
exports.mcpManager = new MCPConnectionManager();
//# sourceMappingURL=MCPConnectionManager.js.map
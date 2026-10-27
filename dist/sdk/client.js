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
exports.MCPClient = void 0;
const child_process_1 = require("child_process");
const readline = __importStar(require("readline"));
const protocol_1 = require("./protocol");
class MCPClient {
    process;
    rl;
    pending = new Map();
    idCounter = 0;
    connected = false;
    tools = [];
    constructor(options) {
        this.process = (0, child_process_1.spawn)(options.command, options.args || [], {
            env: { ...process.env, ...options.env },
            stdio: ["pipe", "pipe", "pipe"],
        });
        this.rl = readline.createInterface({ input: this.process.stdout, terminal: false });
        this.rl.on("line", (line) => {
            try {
                const msg = JSON.parse(line);
                if (msg.method) {
                    // Notification from server
                    return;
                }
                const id = msg.id?.toString();
                if (id && this.pending.has(id)) {
                    const { resolve, reject } = this.pending.get(id);
                    this.pending.delete(id);
                    if (msg.error) {
                        reject(new Error(msg.error.message || "MCP error"));
                    }
                    else {
                        resolve(msg.result);
                    }
                }
            }
            catch {
                // ignore malformed lines
            }
        });
        this.process.stderr.on("data", () => {
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
    nextId() {
        return (++this.idCounter).toString();
    }
    sendRequest(request) {
        return new Promise((resolve, reject) => {
            const id = this.nextId();
            this.pending.set(id, { resolve, reject });
            const line = JSON.stringify({ ...request, id });
            this.process.stdin.write(line + "\n");
        });
    }
    async initialize() {
        const result = await this.sendRequest({
            jsonrpc: "2.0",
            method: protocol_1.MCP_METHODS.INITIALIZE,
            params: {
                protocolVersion: "2024-11-05",
                capabilities: {},
                clientInfo: { name: "sdk-mcp-client", version: "1.0.0" },
            },
        });
        // Send initialized notification
        this.process.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: protocol_1.MCP_METHODS.INITIALIZED }) + "\n");
        this.connected = true;
        this.tools = result.capabilities?.tools ? [] : [];
        return { capabilities: result.capabilities, serverInfo: result.serverInfo };
    }
    async listTools() {
        const result = await this.sendRequest({
            jsonrpc: "2.0",
            method: protocol_1.MCP_METHODS.TOOLS_LIST,
        });
        this.tools = result.tools || [];
        return this.tools;
    }
    async callTool(name, arguments_) {
        return this.sendRequest({
            jsonrpc: "2.0",
            method: protocol_1.MCP_METHODS.TOOLS_CALL,
            params: { name, arguments: arguments_ },
        });
    }
    async close() {
        try {
            this.process.stdin.end();
        }
        catch {
            // ignore
        }
        try {
            this.process.kill();
        }
        catch {
            // ignore
        }
    }
    isConnected() {
        return this.connected;
    }
}
exports.MCPClient = MCPClient;
//# sourceMappingURL=client.js.map
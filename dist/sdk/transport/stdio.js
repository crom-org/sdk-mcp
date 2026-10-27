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
exports.StdioTransport = void 0;
exports.createStdioServer = createStdioServer;
const readline = __importStar(require("readline"));
const server_1 = require("../server");
class StdioTransport {
    server;
    rl;
    constructor(server) {
        this.server = server;
    }
    start() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: false,
        });
        this.rl.on("line", async (line) => {
            const response = await this.server.processLine(line);
            if (response) {
                process.stdout.write(response + "\n");
            }
        });
        this.rl.on("close", () => {
            process.exit(0);
        });
    }
    send(response) {
        process.stdout.write(response + "\n");
    }
    stop() {
        this.rl?.close();
    }
}
exports.StdioTransport = StdioTransport;
function createStdioServer(options) {
    const server = new server_1.MCPServer(options);
    const transport = new StdioTransport(server);
    return { server, transport };
}
//# sourceMappingURL=stdio.js.map
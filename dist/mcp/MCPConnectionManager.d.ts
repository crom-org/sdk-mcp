import type { MCPConnectionConfig, MCPClientInfo } from "../types";
import { EventEmitter } from "events";
export declare class MCPConnectionManager extends EventEmitter {
    private clients;
    private configs;
    private status;
    register(config: MCPConnectionConfig): void;
    unregister(id: string): void;
    getConfig(id: string): MCPConnectionConfig | undefined;
    getStatus(id: string): MCPClientInfo | undefined;
    getAllStatus(): MCPClientInfo[];
    connect(id: string): Promise<void>;
    private connectStdio;
    private connectHTTP;
    disconnect(id: string): Promise<void>;
    disconnectAll(): Promise<void>;
    listTools(id: string): Promise<any>;
    callTool(id: string, name: string, args: Record<string, any>): Promise<any>;
    isConnected(id: string): boolean;
}
export declare const mcpManager: MCPConnectionManager;
//# sourceMappingURL=MCPConnectionManager.d.ts.map
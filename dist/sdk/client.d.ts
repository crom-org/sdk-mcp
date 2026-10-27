import type { MCPTool, ToolCallResult } from "./types";
export type MCPClientOptions = {
    name: string;
    version: string;
    command: string;
    args?: string[];
    env?: Record<string, string>;
};
export declare class MCPClient {
    private process;
    private rl?;
    private pending;
    private idCounter;
    private connected;
    private tools;
    constructor(options: MCPClientOptions);
    private nextId;
    private sendRequest;
    initialize(): Promise<{
        capabilities: any;
        serverInfo: any;
    }>;
    listTools(): Promise<MCPTool[]>;
    callTool(name: string, arguments_: Record<string, any>): Promise<ToolCallResult>;
    close(): Promise<void>;
    isConnected(): boolean;
}
//# sourceMappingURL=client.d.ts.map
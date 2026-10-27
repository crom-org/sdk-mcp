import type { JSONRPCNotification, MCPTool, MCPResource, MCPPrompt, MCPServerCapabilities, MCPServerInfo, ToolCallResult, ReadResourceResult, GetPromptResult, LoggingMessage } from "./types";
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
export declare class MCPServer {
    private options;
    private tools;
    private resources;
    private prompts;
    private initialized;
    constructor(options: MCPServerOptions);
    getInfo(): MCPServerInfo;
    getCapabilities(): MCPServerCapabilities;
    registerTool(name: string, schema: MCPTool, handler: ToolHandler): void;
    registerResource(uri: string, schema: MCPResource, handler: ResourceHandler): void;
    registerPrompt(name: string, schema: MCPPrompt, handler: PromptHandler): void;
    private handleRequest;
    processLine(line: string): Promise<string | null>;
    sendNotification(notification: JSONRPCNotification): string;
    sendLog(level: LoggingMessage["level"], message: string, data?: any): string;
    sendProgress(token: string | number, progress: number, total?: number, message?: string): string;
}
//# sourceMappingURL=server.d.ts.map
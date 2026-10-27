import { MCPServer } from "../server";
export declare class StdioTransport {
    private server;
    private rl?;
    constructor(server: MCPServer);
    start(): void;
    send(response: string): void;
    stop(): void;
}
export declare function createStdioServer(options: {
    name: string;
    version: string;
    title?: string;
    instructions?: string;
}): {
    server: MCPServer;
    transport: StdioTransport;
};
//# sourceMappingURL=stdio.d.ts.map
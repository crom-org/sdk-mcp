export type ProjectRule = {
    id: string;
    type: "system" | "instruction" | "constraint" | "context" | "example";
    title: string;
    content: string;
    priority: number;
    enabled: boolean;
    appliesTo: string[];
};
export type ProjectConfig = {
    name: string;
    rootPath: string;
    description?: string;
    rules: ProjectRule[];
    mcps: MCPConnectionConfig[];
    harnesses: HarnessConfig[];
    scripts: ScriptConfig[];
    agents: AgentConfig[];
    createdAt: string;
    updatedAt: string;
};
export type MCPConnectionConfig = {
    id: string;
    name: string;
    type: "stdio" | "http" | "sse";
    command?: string;
    args?: string[];
    url?: string;
    env?: Record<string, string>;
    enabled: boolean;
    autoConnect: boolean;
};
export type HarnessConfig = {
    id: string;
    name: string;
    type: "script" | "command" | "http" | "mcp";
    command?: string;
    args?: string[];
    scriptPath?: string;
    url?: string;
    mcpId?: string;
    env?: Record<string, string>;
    timeoutMs: number;
    retryCount: number;
    enabled: boolean;
};
export type ScriptConfig = {
    id: string;
    name: string;
    path: string;
    interpreter?: string;
    args?: string[];
    env?: Record<string, string>;
    timeoutMs: number;
    enabled: boolean;
};
export type AgentConfig = {
    id: string;
    name: string;
    type: "mcp" | "local" | "remote";
    mcpId?: string;
    systemPrompt?: string;
    tools?: string[];
    config?: Record<string, any>;
    enabled: boolean;
};
export type MCPClientInfo = {
    id: string;
    name: string;
    status: "disconnected" | "connecting" | "connected" | "error";
    connectedAt?: Date;
    lastError?: string;
    tools?: string[];
    capabilities?: any;
};
export type HarnessExecution = {
    id: string;
    harnessId: string;
    status: "pending" | "running" | "completed" | "failed" | "cancelled";
    startedAt?: Date;
    finishedAt?: Date;
    output?: string;
    error?: string;
    exitCode?: number;
};
export type LoadProjectResult = {
    project: ProjectConfig;
    rules: string;
    connectedMCPs: MCPClientInfo[];
    warnings: string[];
};
//# sourceMappingURL=index.d.ts.map
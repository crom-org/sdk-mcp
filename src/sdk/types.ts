export type JSONRPCId = string | number;

export type JSONRPCRequest = {
  jsonrpc: "2.0";
  id?: JSONRPCId;
  method: string;
  params?: Record<string, any>;
};

export type JSONRPCResponse = {
  jsonrpc: "2.0";
  id: JSONRPCId;
  result?: any;
  error?: { code: number; message: string; data?: any };
};

export type JSONRPCNotification = {
  jsonrpc: "2.0";
  method: string;
  params?: Record<string, any>;
};

export type MCPTool = {
  name: string;
  title?: string;
  description?: string;
  inputSchema: Record<string, any>;
  outputSchema?: Record<string, any>;
  annotations?: any;
};

export type MCPResource = {
  uri: string;
  name?: string;
  description?: string;
  mimeType?: string;
  annotations?: any;
};

export type MCPPromptArgument = {
  name: string;
  description?: string;
  required?: boolean;
};

export type MCPPrompt = {
  name: string;
  description?: string;
  arguments?: MCPPromptArgument[];
};

export type MCPServerCapabilities = {
  tools?: { listChanged?: boolean };
  resources?: { subscribe?: boolean; listChanged?: boolean };
  prompts?: { listChanged?: boolean };
  logging?: {};
  roots?: { listChanged?: boolean };
  sampling?: {};
  completions?: {};
  elapsedTime?: boolean;
};

export type MCPServerInfo = {
  name: string;
  version: string;
  title?: string;
  instructions?: string;
};

export type InitializeRequestParams = {
  protocolVersion: string;
  capabilities: MCPServerCapabilities;
  clientInfo?: MCPServerInfo;
};

export type InitializeResult = {
  protocolVersion: string;
  capabilities: MCPServerCapabilities;
  serverInfo: MCPServerInfo;
  instructions?: string;
};

export type ToolCallRequest = {
  name: string;
  arguments: Record<string, any>;
};

export type ToolCallResult = {
  content: Array<{
    type: "text" | "image" | "resource";
    text?: string;
    data?: string;
    mimeType?: string;
    resource?: { uri: string; mimeType?: string };
  }>;
  isError?: boolean;
  structuredContent?: any;
};

export type ListToolsResult = {
  tools: MCPTool[];
};

export type ListResourcesResult = {
  resources: MCPResource[];
};

export type ReadResourceResult = {
  contents: Array<{
    uri: string;
    mimeType?: string;
    text?: string;
    blob?: string;
  }>;
};

export type ListPromptsResult = {
  prompts: MCPPrompt[];
};

export type GetPromptResult = {
  description?: string;
  messages: Array<{
    role: "user" | "assistant";
    content: {
      type: "text";
      text: string;
    };
  }>;
};

export type LoggingMessage = {
  level: "debug" | "info" | "warning" | "error";
  message: string;
  data?: any;
};

export type ProgressToken = string | number;

export type ProgressNotification = {
  progressToken: ProgressToken;
  progress: number;
  total?: number;
  message?: string;
};

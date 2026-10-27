import type { JSONRPCId } from "./types";
export declare const MCP_METHODS: {
    readonly INITIALIZE: "initialize";
    readonly INITIALIZED: "initialized";
    readonly PING: "ping";
    readonly TOOLS_LIST: "tools/list";
    readonly TOOLS_CALL: "tools/call";
    readonly RESOURCES_LIST: "resources/list";
    readonly RESOURCES_READ: "resources/read";
    readonly RESOURCES_SUBSCRIBE: "resources/subscribe";
    readonly RESOURCES_UNSUBSCRIBE: "resources/unsubscribe";
    readonly PROMPTS_LIST: "prompts/list";
    readonly PROMPTS_GET: "prompts/get";
    readonly LOGGING_SET_LEVEL: "logging/setLevel";
    readonly ROOTS_LIST: "roots/list";
    readonly COMPLETIONS_COMPLETE: "completions/complete";
    readonly LOGGING_MESSAGE: "notifications/message";
    readonly PROGRESS: "notifications/progress";
    readonly RESOURCES_LIST_CHANGED: "notifications/resources/listChanged";
    readonly TOOLS_LIST_CHANGED: "notifications/tools/listChanged";
    readonly PROMPTS_LIST_CHANGED: "notifications/prompts/listChanged";
};
export declare const PROTOCOL_VERSION = "2024-11-05";
export declare function jsonRpcRequest(id: JSONRPCId, method: string, params?: any): any;
export declare function jsonRpcResult(id: JSONRPCId | undefined, result: any): any;
export declare function jsonRpcError(id: JSONRPCId | undefined, code: number, message: string, data?: any): any;
export declare function jsonRpcNotification(method: string, params?: any): any;
export declare const ERROR_CODES: {
    readonly PARSE_ERROR: -32700;
    readonly INVALID_REQUEST: -32600;
    readonly METHOD_NOT_FOUND: -32601;
    readonly INVALID_PARAMS: -32602;
    readonly INTERNAL_ERROR: -32603;
    readonly TOOL_NOT_FOUND: -32001;
    readonly RESOURCE_NOT_FOUND: -32002;
    readonly PROMPT_NOT_FOUND: -32003;
};
//# sourceMappingURL=protocol.d.ts.map
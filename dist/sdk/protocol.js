"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERROR_CODES = exports.PROTOCOL_VERSION = exports.MCP_METHODS = void 0;
exports.jsonRpcRequest = jsonRpcRequest;
exports.jsonRpcResult = jsonRpcResult;
exports.jsonRpcError = jsonRpcError;
exports.jsonRpcNotification = jsonRpcNotification;
exports.MCP_METHODS = {
    // Lifecycle
    INITIALIZE: "initialize",
    INITIALIZED: "initialized",
    PING: "ping",
    // Tools
    TOOLS_LIST: "tools/list",
    TOOLS_CALL: "tools/call",
    // Resources
    RESOURCES_LIST: "resources/list",
    RESOURCES_READ: "resources/read",
    RESOURCES_SUBSCRIBE: "resources/subscribe",
    RESOURCES_UNSUBSCRIBE: "resources/unsubscribe",
    // Prompts
    PROMPTS_LIST: "prompts/list",
    PROMPTS_GET: "prompts/get",
    // Logging
    LOGGING_SET_LEVEL: "logging/setLevel",
    // Roots
    ROOTS_LIST: "roots/list",
    // Completions
    COMPLETIONS_COMPLETE: "completions/complete",
    // Notifications from server to client
    LOGGING_MESSAGE: "notifications/message",
    PROGRESS: "notifications/progress",
    RESOURCES_LIST_CHANGED: "notifications/resources/listChanged",
    TOOLS_LIST_CHANGED: "notifications/tools/listChanged",
    PROMPTS_LIST_CHANGED: "notifications/prompts/listChanged",
};
exports.PROTOCOL_VERSION = "2024-11-05";
function jsonRpcRequest(id, method, params) {
    return { jsonrpc: "2.0", id, method, ...(params ? { params } : {}) };
}
function jsonRpcResult(id, result) {
    return { jsonrpc: "2.0", id, result };
}
function jsonRpcError(id, code, message, data) {
    return { jsonrpc: "2.0", id, error: { code, message, ...(data ? { data } : {}) } };
}
function jsonRpcNotification(method, params) {
    return { jsonrpc: "2.0", method, ...(params ? { params } : {}) };
}
exports.ERROR_CODES = {
    PARSE_ERROR: -32700,
    INVALID_REQUEST: -32600,
    METHOD_NOT_FOUND: -32601,
    INVALID_PARAMS: -32602,
    INTERNAL_ERROR: -32603,
    TOOL_NOT_FOUND: -32001,
    RESOURCE_NOT_FOUND: -32002,
    PROMPT_NOT_FOUND: -32003,
};
//# sourceMappingURL=protocol.js.map
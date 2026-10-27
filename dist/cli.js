"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CromMCPServer_1 = require("./mcp/CromMCPServer");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
async function main() {
    const server = (0, CromMCPServer_1.buildServer)();
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    // eslint-disable-next-line no-console
    console.error("crom-mcp-sdk rodando em stdio");
}
main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error("Falha ao iniciar crom-mcp-sdk:", err);
    process.exit(1);
});
//# sourceMappingURL=cli.js.map
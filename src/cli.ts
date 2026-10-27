import { buildServer } from "./mcp/CromMCPServer";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

async function main() {
  const server = buildServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // eslint-disable-next-line no-console
  console.error("crom-mcp-sdk rodando em stdio");
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Falha ao iniciar crom-mcp-sdk:", err);
  process.exit(1);
});

# 09 — Conectando Clientes MCP (Claude Code, Cursor, Continue)

Um cliente MCP é qualquer aplicativo que consome servidores MCP. O `sdk-mcp` expõe servidores via stdio, então qualquer cliente que suporte MCP stdio pode se conectar.

## Claude Code

No arquivo de configuração do Claude Code (geralmente `~/.claude/settings.json` ou `.mcp.json` no projeto):

```json
{
  "mcpServers": {
    "sdk-mcp-controller": {
      "command": "node",
      "args": ["/caminho/para/sdk-mcp/dist/bin.js", "server"]
    },
    "meu-mcp-node": {
      "command": "node",
      "args": ["/caminho/para/meu-mcp/dist/index.js"]
    }
  }
}
```

## Cursor

No Cursor, vá em Settings → Features → MCP e adicione:

```json
{
  "mcpServers": {
    "sdk-mcp-controller": {
      "command": "node",
      "args": ["/caminho/para/sdk-mcp/dist/bin.js", "server"]
    }
  }
}
```

## Continue

No arquivo `~/.continue/config.json`:

```json
{
  "mcpServers": {
    "sdk-mcp-controller": {
      "command": "node",
      "args": ["/caminho/para/sdk-mcp/dist/bin.js", "server"]
    }
  }
}
```

## Qualquer cliente MCP

O padrão é o mesmo: adicione um servidor MCP com `command` e `args` apontando para o executável do seu MCP (stdio).

## Testar a conexão manualmente

Você pode testar se um MCP responde corretamente enviando mensagens JSON-RPC pelo terminal:

```bash
# Iniciar o MCP
node dist/bin.js server &

# Enviar initialize (em outro terminal, ou via echo)
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | node dist/bin.js server
```

## Usar o cliente MCP do sdk-mcp (para conectar a outros MCPs)

Se você quer que o seu MCP chame outros MCPs, use `MCPClient`:

```typescript
import { MCPClient } from "sdk-mcp";

const client = new MCPClient({
  name: "cliente-do-meu-mcp",
  version: "1.0.0",
  command: "npx",
  args: ["@modelcontextprotocol/server-filesystem", "./criacoes"],
});

await client.initialize();
const tools = await client.listTools();
console.log("Ferramentas disponíveis:", tools.map(t => t.name));

const resultado = await client.callTool("read_file", { path: "./criacoes/arquivo.txt" });
console.log("Conteúdo:", resultado);

await client.close();
```

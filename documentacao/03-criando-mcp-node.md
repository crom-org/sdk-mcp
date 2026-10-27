# 03 — Criando um MCP em Node.js / TypeScript

O `sdk-mcp` é escrito em TypeScript. Esta é a forma mais rápida de construir um MCP se você já usa Node.

## Instalar o SDK

No seu projeto MCP:

```bash
npm init -y
npm install /caminho/para/sdk-mcp   # ou npm install sdk-mcp (quando publicado)
```

Ou, se estiver dentro do repositório do `sdk-mcp`, importe direto do `src/`.

## Exemplo completo (TypeScript)

```typescript
// src/index.ts
import { MCPServer, StdioTransport } from "sdk-mcp";

const server = new MCPServer({
  name: "meu-mcp-node",
  version: "1.0.0",
  instructions: "MCP exemplo em Node construído com sdk-mcp",
});

// --- Ferramenta: somar ---
server.registerTool(
  "somar",
  "Soma dois números",
  {
    type: "object",
    properties: {
      a: { type: "number", description: "Primeiro número" },
      b: { type: "number", description: "Segundo número" },
    },
    required: ["a", "b"],
  },
  async ({ a, b }: { a: number; b: number }) => ({
    content: [{ type: "text", text: `Resultado: ${a + b}` }],
  })
);

// --- Ferramenta: ler arquivo ---
import * as fs from "fs";

server.registerTool(
  "ler-arquivo",
  "Lê o conteúdo de um arquivo",
  {
    type: "object",
    properties: {
      caminho: { type: "string", description: "Caminho do arquivo" },
    },
    required: ["caminho"],
  },
  async ({ caminho }: { caminho: string }) => {
    try {
      const texto = fs.readFileSync(caminho, "utf-8");
      return { content: [{ type: "text", text: texto }] };
    } catch (err: any) {
      return {
        content: [{ type: "text", text: `Erro: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// --- Recurso: status ---
server.registerResource(
  "meu-mcp://status",
  "Status do servidor",
  "application/json",
  async () => ({
    contents: [
      {
        uri: "meu-mcp://status",
        mimeType: "application/json",
        text: JSON.stringify({ online: true, lingua: "node", versao: "1.0.0" }),
      },
    ],
  })
);

const transport = new StdioTransport(server);
transport.start();
```

## Compilar e rodar

```bash
# tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true
  }
}

npm run build   # tsc
node dist/index.js   # escuta stdio
```

## Usar como binário de um cliente MCP

No seu cliente (ex: Claude Code), aponte o comando:

```json
{
  "mcpServers": {
    "meu-mcp-node": {
      "command": "node",
      "args": ["/caminho/para/meu-mcp-node/dist/index.js"]
    }
  }
}
```

## Usando o SDK diretamente deste repositório

Se você está desenvolvendo dentro do `sdk-mcp`:

```typescript
import { MCPServer, StdioTransport } from "./src/sdk/server";
// ou do ponto de entrada
import { MCPServer, StdioTransport } from "./src/index";
```

## Dicas

- Sempre chame `transport.start()` no final.
- Toda resposta deve terminar com `\n`.
- Use `isError: true` em `tools/call` quando quiser sinalizar falha ao cliente.
- Você pode registrar quantas tools, resources e prompts quiser.

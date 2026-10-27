# 11 — Exemplos Práticos

## Exemplo 1: MCP "Olá, Mundo" em Node

```typescript
import { MCPServer, StdioTransport } from "sdk-mcp";

const server = new MCPServer({
  name: "ola-mundo",
  version: "1.0.0",
});

server.registerTool(
  "ola",
  "Diz olá para alguém",
  {
    type: "object",
    properties: { nome: { type: "string" } },
    required: ["nome"],
  },
  async ({ nome }: { nome: string }) => ({
    content: [{ type: "text", text: `Olá, ${nome}!` }],
  })
);

new StdioTransport(server).start();
```

Rodar:

```bash
npm run build
node dist/index.js
```

Testar via terminal:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"ola","arguments":{"nome":"Mundo"}}}' | node dist/index.js
```

## Exemplo 2: MCP de Sistema de Arquivos (ler/escrever)

```typescript
import { MCPServer, StdioTransport } from "sdk-mcp";
import * as fs from "fs";

const server = new MCPServer({
  name: "filesystem-mcp",
  version: "1.0.0",
});

server.registerTool(
  "ler-arquivo",
  "Lê um arquivo de texto",
  {
    type: "object",
    properties: { caminho: { type: "string" } },
    required: ["caminho"],
  },
  async ({ caminho }: { caminho: string }) => {
    try {
      const texto = fs.readFileSync(caminho, "utf-8");
      return { content: [{ type: "text", text: texto }] };
    } catch (err: any) {
      return { content: [{ type: "text", text: `Erro: ${err.message}` }], isError: true };
    }
  }
);

server.registerTool(
  "escrever-arquivo",
  "Escreve texto em um arquivo",
  {
    type: "object",
    properties: {
      caminho: { type: "string" },
      conteudo: { type: "string" },
    },
    required: ["caminho", "conteudo"],
  },
  async ({ caminho, conteudo }: { caminho: string; conteudo: string }) => {
    try {
      fs.writeFileSync(caminho, conteudo, "utf-8");
      return { content: [{ type: "text", text: "Arquivo escrito com sucesso" }] };
    } catch (err: any) {
      return { content: [{ type: "text", text: `Erro: ${err.message}` }], isError: true };
    }
  }
);

new StdioTransport(server).start();
```

## Exemplo 3: MCP que executa comandos (harness)

```typescript
import { MCPServer, StdioTransport } from "sdk-mcp";
import { execSync } from "child_process";

const server = new MCPServer({
  name: "comando-mcp",
  version: "1.0.0",
});

server.registerTool(
  "executar-comando",
  "Executa um comando no shell",
  {
    type: "object",
    properties: {
      comando: { type: "string", description: "Comando a executar" },
    },
    required: ["comando"],
  },
  async ({ comando }: { comando: string }) => {
    try {
      const output = execSync(comando, { encoding: "utf-8", timeout: 30000 });
      return { content: [{ type: "text", text: output }] };
    } catch (err: any) {
      return {
        content: [{ type: "text", text: `Erro: ${err.message}` }],
        isError: true,
      };
    }
  }
);

new StdioTransport(server).start();
```

## Exemplo 4: Usar o servidor exemplo do sdk-mcp ("MCP de MCPs")

O `sdk-mcp` inclui um servidor completo que conecta e controla outros MCPs, scripts, projetos, agentes e harnesses.

```bash
npm start
```

Ferramentas expostas:

| Tool | Descrição |
|------|-----------|
| `crom_load_project` | Carrega um projeto e aplica suas regras |
| `crom_get_rules` | Retorna regras do projeto ativo |
| `crom_connect_mcp` | Conecta a um MCP registrado |
| `crom_call_mcp_tool` | Chama uma tool em um MCP conectado |
| `crom_run_harness` | Executa um harness do projeto |
| `crom_list_mcps` | Lista status dos MCPs |
| `crom_list_executions` | Lista execuções de harnesses |

Recursos:

| URI | Descrição |
|-----|-----------|
| `crom://project/rules` | Regras do projeto ativo |
| `crom://project/status` | Status de MCPs e execuções |

Exemplo de uso (via cliente MCP):

1. Carregar projeto:
```json
{"name":"crom_load_project","arguments":{"projectPath":"./meu-projeto"}}
```

2. Ler regras:
```json
{"name":"crom_get_rules","arguments":{}}
```

3. Conectar a um MCP:
```json
{"name":"crom_connect_mcp","arguments":{"mcpId":"mcp-filesystem"}}
```

4. Chamar tool:
```json
{"name":"crom_call_mcp_tool","arguments":{"mcpId":"mcp-filesystem","toolName":"read_file","arguments":{"path":"./arquivo.txt"}}}
```

5. Executar harness:
```json
{"name":"crom_run_harness","arguments":{"harnessId":"harness-build"}}
```

## Exemplo 5: Incorporar projeto existente (vídeo)

Veja [`08-incorporando-projetos-existentes.md`](./08-incorporando-projetos-existentes.md) para o exemplo completo de editor de vídeo com pasta de criações, ffmpeg e `.crom-mcp.yml`.

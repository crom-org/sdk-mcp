# sdk-mcp

SDK para **construir qualquer tipo de servidor MCP (Model Context Protocol) em qualquer linguagem**, de qualquer forma que precisar.

O protocolo MCP é simplesmente **JSON-RPC 2.0 sobre stdio** (ou HTTP/SSE). Qualquer linguagem que leia stdin, escreva stdout e parseie JSON pode ser um MCP.

O `sdk-mcp` fornece:
- **Core em TypeScript/Node**: classes `MCPServer`, `StdioTransport`, `MCPClient`
- **Templates prontos**: Python, Go, PHP e Rust (zero dependências externas quando possível)
- **CLI de scaffolding**: `sdk-mcp init <linguagem> <pasta> <nome>` gera um MCP funcional instantâneo
- **Servidor exemplo**: um MCP completo que conecta e controla outros MCPs, scripts, projetos, agentes e harnesses, com configuração por pasta de projeto (`.crom-mcp.yml`)

## Documentação completa

Toda a documentação detalhada está na pasta [`documentacao/`](./documentacao/):

| Arquivo | Conteúdo |
|---------|----------|
| `01-introducao.md` | O que é o sdk-mcp e filosofia |
| `02-conceitos-basicos.md` | O que é MCP, JSON-RPC, stdio, servidor vs cliente |
| `03-criando-mcp-node.md` | Criar MCP em Node.js / TypeScript |
| `04-criando-mcp-python.md` | Criar MCP em Python (stdlib) |
| `05-criando-mcp-go.md` | Criar MCP em Go |
| `06-criando-mcp-php.md` | Criar MCP em PHP |
| `07-criando-mcp-rust.md` | Criar MCP em Rust |
| `08-incorporando-projetos-existentes.md` | Adaptar projetos já prontos para MCP |
| `09-cliente-mcp-conectando.md` | Conectar clientes (Claude Code, Cursor, Continue, etc.) |
| `10-regras-config-projeto.md` | `.crom-mcp.yml`, regras e configuração por pasta |
| `11-exemplos-praticos.md` | Exemplos prontos para copiar e usar |
| `12-reference-cli.md` | Referência completa do CLI `sdk-mcp` |

## Instalação

```bash
npm install
npm run build
```

## Criar um MCP em outra linguagem (CLI)

```bash
# Listar linguagens disponíveis
node dist/bin.js langs

# Criar um MCP em Python
node dist/bin.js init python ./meu-mcp-meu meu-mcp

# Criar um MCP em Go
node dist/bin.js init go ./meu-mcp-go meu-mcp-go

# Criar um MCP em PHP
node dist/bin.js init php ./meu-mcp-php meu-mcp-php

# Criar um MCP em Rust
node dist/bin.js init rust ./meu-mcp-rust meu-mcp-rust
```

## Usar o SDK em TypeScript/Node

```typescript
import { MCPServer, StdioTransport } from "sdk-mcp";

const server = new MCPServer({
  name: "meu-mcp",
  version: "1.0.0",
  instructions: "Exemplo de MCP construído com sdk-mcp",
});

server.registerTool(
  "ola",
  "Diz olá para alguém",
  {
    type: "object",
    properties: { nome: { type: "string" } },
    required: ["nome"],
  },
  async ({ nome }) => ({
    content: [{ type: "text", text: `Olá, ${nome}!` }],
  })
);

const transport = new StdioTransport(server);
transport.start();
```

## Conectar a outros MCPs (cliente)

```typescript
import { MCPClient } from "sdk-mcp";

const client = new MCPClient({
  name: "cliente-exemplo",
  version: "1.0.0",
  command: "python",
  args: ["./outro-mcp/mcp_server.py"],
});

await client.initialize();
const tools = await client.listTools();
const result = await client.callTool("ola", { nome: "mundo" });
await client.close();
```

## Servidor exemplo (controlador de MCPs)

O pacote inclui um servidor MCP completo que atua como "MCP de MCPs":

```bash
npm start
```

Ele expõe ferramentas como `crom_load_project`, `crom_get_rules`, `crom_connect_mcp`, `crom_call_mcp_tool`, `crom_run_harness`, etc.

Recursos:
- `crom://project/rules`
- `crom://project/status`

## Desenvolvimento

```bash
npm run build      # compila TypeScript
npm start          # inicia o servidor exemplo MCP stdio
node dist/bin.js langs   # lista linguagens suportadas
node dist/bin.js init <lang> <pasta> <nome>  # scaffolding
```

## Linguagens suportadas para scaffolding

| Linguagem | Dependências | Comando de execução |
|-----------|--------------|---------------------|
| Python | stdlib (zero deps) | `python mcp_server.py` |
| Go | stdlib | `go run main.go` |
| PHP | stdlib | `php mcp_server.php` |
| Rust | `serde`, `serde_json` | `cargo run` |

## Licença

MIT — veja [`LICENSE`](./LICENSE).

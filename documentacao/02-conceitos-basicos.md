# 02 — Conceitos Básicos

## O que é um MCP

MCP (Model Context Protocol) é um protocolo aberto que permite que assistentes de IA (Claude Code, Cursor, Continue, etc.) se conectem a ferramentas, dados e serviços externos.

Um **servidor MCP** expõe:
- **Tools (ferramentas)**: funções que o assistente pode chamar (ex: `somar`, `executar-script`, `ler-arquivo`)
- **Resources (recursos)**: dados que o assistente pode ler (ex: `meu-projeto://status`, `file:///etc/hosts`)
- **Prompts**: modelos de conversa reutilizáveis

## Como o protocolo funciona

O MCP usa **JSON-RPC 2.0**. O servidor e o cliente trocam mensagens linha por linha pelo **stdio** (stdin ↔ stdout).

Exemplo de fluxo (`initialize`):

```
Cliente → Servidor: {"jsonrpc":"2.0","id":1,"method":"initialize","params":{...}}
Servidor → Cliente: {"jsonrpc":"2.0","id":1,"result":{"protocolVersion":"2024-11-05","capabilities":{...},"serverInfo":{...}}}
```

Depois o servidor envia a notificação `initialized` e já pode responder a `tools/list`, `tools/call`, etc.

## Servidor vs Cliente

- **Servidor MCP**: expõe ferramentas/recursos. É o que você constrói com o `sdk-mcp`.
- **Cliente MCP**: consome servidores. Exemplos: Claude Code, Cursor, Continue, qualquer app que implemente o protocolo.

## O que o sdk-mcp fornece

| Componente | O que faz |
|------------|-----------|
| `MCPServer` | Registra tools, resources, prompts e despacha requisições JSON-RPC |
| `StdioTransport` | Escuta stdin e escreve stdout (transporte stdio) |
| `MCPClient` | Conecta a outros servidores MCP (chama tools remotas) |
| CLI `sdk-mcp` | Scaffolding de novos MCPs em várias linguagens |

## Exemplo mínimo de mensagens

**`tools/list`**
```json
{"jsonrpc":"2.0","id":2,"method":"tools/list"}
```

Resposta:
```json
{"jsonrpc":"2.0","id":2,"result":{"tools":[{"name":"somar","description":"Soma dois números","inputSchema":{"type":"object","properties":{"a":{"type":"number"},"b":{"type":"number"}},"required":["a","b"]}}]}}
```

**`tools/call`**
```json
{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"somar","arguments":{"a":2,"b":3}}}
```

Resposta:
```json
{"jsonrpc":"2.0","id":3,"result":{"content":[{"type":"text","text":"Resultado: 5"}]}}
```

## Pré-requisitos para qualquer linguagem

Para criar um MCP em qualquer linguagem, você só precisa:

1. Ler linhas de `stdin`
2. Fazer `JSON.parse` / equivalente
3. Processar o método (`initialize`, `tools/list`, `tools/call`, etc.)
4. Escrever a resposta em `stdout` com `\n` no final
5. Fazer flush do stdout após cada linha

Não é necessário instalar bibliotecas oficiais de MCP — embora existam, você pode implementar com stdlib.

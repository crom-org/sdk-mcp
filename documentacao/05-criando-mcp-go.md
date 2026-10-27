# 05 — Criando um MCP em Go

O template Go do `sdk-mcp` usa apenas a stdlib (zero dependências externas).

## Gerar com o CLI

```bash
node dist/bin.js init go ./meu-mcp-go meu-mcp-go
```

Isso cria:

```
meu-mcp-go/
├── go.mod
├── main.go
└── README.md
```

## Adicionar uma ferramenta

Edite `main.go`. No `main`, após criar o servidor:

```go
server := NewMCPServer("meu-mcp-go", "1.0.0", "")

// Exemplo: registrar tool (você precisará estender o handle para chamar handlers reais)
// O template já implementa o despacho de initialize, ping, tools/list, tools/call (exemplo fixo)
```

O template Go atual despacha `tools/call` com um retorno fixo. Para fazer algo real, estenda a struct `MCPServer` com mapas de handlers e modifique `handle` para invocá-los.

Exemplo de como adicionar um handler de tool:

```go
type ToolHandler func(args map[string]interface{}) (interface{}, error)

type MCPServer struct {
    Name         string
    Version      string
    Instructions string
    Tools        map[string]ToolHandler
    ...
}

func (s *MCPServer) RegisterTool(name string, handler ToolHandler) {
    s.Tools[name] = handler
}
```

E no `case "tools/call"`:

```go
case "tools/call":
    name := req.Params["name"].(string)
    handler, ok := s.Tools[name]
    if !ok {
        return error(-32001, "Tool not found")
    }
    result, err := handler(req.Params["arguments"].(map[string]interface{}))
    if err != nil {
        return error(-32603, err.Error())
    }
    return JSONRPCResponse{JSONRPC: "2.0", ID: req.ID, Result: result}
```

## Rodar

```bash
go mod tidy
go run main.go
```

## Conectar a um cliente

```json
{
  "mcpServers": {
    "meu-mcp-go": {
      "command": "go",
      "args": ["run", "/caminho/para/meu-mcp-go/main.go"]
    }
  }
}
```

Ou compile um binário:

```bash
go build -o meu-mcp-go
# então:
# "command": "/caminho/para/meu-mcp-go"
```

# 04 — Criando um MCP em Python

O template Python do `sdk-mcp` usa apenas a stdlib (zero dependências externas).

## Gerar com o CLI

```bash
node dist/bin.js init python ./meu-mcp-python meu-mcp-python
```

Isso cria:

```
meu-mcp-python/
├── mcp_server.py
├── requirements.txt   # vazio (stdlib apenas)
└── README.md
```

## Estrutura do `mcp_server.py`

O arquivo gerado já contém:

```python
import json
import sys
from typing import Any, Callable, Dict, Optional

class MCPServer:
    def __init__(self, name, version, instructions=None):
        ...

    def register_tool(self, name, description, input_schema, handler):
        ...

    def register_resource(self, uri, name, mime_type, handler):
        ...

    def register_prompt(self, name, description, handler):
        ...

    def handle(self, req):   # despacha JSON-RPC
        ...

def run_stdio(server):   # loop stdin → stdout
    ...
```

## Adicionar uma ferramenta

Edite o final de `mcp_server.py`:

```python
server = MCPServer(name="meu-mcp-python", version="1.0.0")

def somar_handler(args):
    a = args.get("a", 0)
    b = args.get("b", 0)
    return {"content": [{"type": "text", "text": f"Resultado: {a + b}"}]}

server.register_tool(
    "somar",
    "Soma dois números",
    {
        "type": "object",
        "properties": {
            "a": {"type": "number"},
            "b": {"type": "number"},
        },
        "required": ["a", "b"],
    },
    somar_handler,
)

run_stdio(server)
```

## Rodar

```bash
python mcp_server.py
```

## Conectar a um cliente

```json
{
  "mcpServers": {
    "meu-mcp-python": {
      "command": "python",
      "args": ["/caminho/para/meu-mcp-python/mcp_server.py"]
    }
  }
}
```

## Dicas Python

- Não use `print()` para debug — use `sys.stderr.write()` se precisar, pois `stdout` é reservado ao protocolo.
- Toda resposta deve terminar com `\n` e fazer `sys.stdout.flush()`.
- O template já faz isso em `run_stdio`.

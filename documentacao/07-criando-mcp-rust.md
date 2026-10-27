# 07 — Criando um MCP em Rust

O template Rust do `sdk-mcp` usa `serde` e `serde_json`.

## Gerar com o CLI

```bash
node dist/bin.js init rust ./meu-mcp-rust meu-mcp-rust
```

Isso cria:

```
meu-mcp-rust/
├── Cargo.toml
├── src/
│   └── main.rs
└── README.md
```

## Adicionar uma ferramenta

Edite `src/main.rs`. O template implementa o loop stdio e o despacho básico de `initialize` e `ping`.

Para adicionar tools reais, estenda a struct `MCPServer`:

```rust
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use std::io::{self, BufRead, Write};

type ToolHandler = Box<dyn Fn(Value) -> Value>;

struct MCPServer {
    name: String,
    version: String,
    instructions: Option<String>,
    initialized: bool,
    tools: HashMap<String, ToolHandler>,
}

impl MCPServer {
    fn new(name: &str, version: &str, instructions: Option<&str>) -> Self {
        Self {
            name: name.to_string(),
            version: version.to_string(),
            instructions: instructions.map(|s| s.to_string()),
            initialized: false,
            tools: HashMap::new(),
        }
    }

    fn register_tool(&mut self, name: &str, handler: ToolHandler) {
        self.tools.insert(name.to_string(), handler);
    }
    // ...
}
```

No `case "tools/call"`, chame o handler registrado.

## Rodar

```bash
cargo build
cargo run
```

## Conectar a um cliente

```json
{
  "mcpServers": {
    "meu-mcp-rust": {
      "command": "/caminho/para/meu-mcp-rust/target/debug/meu-mcp-rust"
    }
  }
}
```

## Dicas Rust

- Não use `println!` para debug — use `eprintln!` se precisar, pois `stdout` é reservado ao protocolo.
- Faça `stdout().flush().unwrap()` após cada linha.
